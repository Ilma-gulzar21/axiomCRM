const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models');
const { logAudit } = require('../services/auditService');

// Password validation regex: min 8 chars, 1 uppercase, 1 lowercase, 1 digit, 1 special char
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]).{8,}$/;

const generateToken = (user) => {
  return jwt.sign(
    {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    },
    process.env.JWT_SECRET || 'fallback_secret',
    { expiresIn: process.env.JWT_EXPIRES_IN || '24h' }
  );
};

const setTokenCookie = (res, token) => {
  const isProduction = process.env.NODE_ENV === 'production';
  res.cookie('token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  });
};

/**
 * Register a new user
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    if (!username || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required.'
      });
    }

    if (!PASSWORD_REGEX.test(password)) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 8 characters long and include an uppercase letter, a lowercase letter, a number, and a special character.'
      });
    }

    // Check duplicate username or email
    const existingUser = await User.findOne({
      where: {
        email: email.toLowerCase()
      }
    });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User with this email already exists.'
      });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    const newUser = await User.create({
      username: username.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role: role && ['Admin', 'Manager', 'SalesExecutive'].includes(role) ? role : 'SalesExecutive',
      isActive: true
    });

    await logAudit({
      userId: newUser.id,
      action: 'USER_REGISTER',
      entityName: 'User',
      recordId: newUser.id,
      newValue: { id: newUser.id, username: newUser.username, email: newUser.email, role: newUser.role },
      req
    });

    const token = generateToken(newUser);
    setTokenCookie(res, token);

    return res.status(201).json({
      success: true,
      message: 'Registration successful.',
      user: {
        id: newUser.id,
        username: newUser.username,
        email: newUser.email,
        role: newUser.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * User Login with 5-attempt lockout (15 minutes) and rate limiting
 */
const login = async (req, res, next) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email and password are required.'
      });
    }

    const user = await User.findOne({
      where: { email: email.toLowerCase().trim() }
    });

    if (!user) {
      await logAudit({
        userId: null,
        action: 'LOGIN_FAILED',
        entityName: 'User',
        oldValue: { attemptedEmail: email },
        req
      });
      return res.status(401).json({
        success: false,
        message: 'Invalid email or password.'
      });
    }

    // Check if account is active
    if (!user.isActive) {
      return res.status(403).json({
        success: false,
        message: 'Account is deactivated. Please contact an administrator.'
      });
    }

    // Check Lockout
    if (user.lockoutEnd) {
      const now = new Date();
      const lockoutTime = new Date(user.lockoutEnd);

      if (now < lockoutTime) {
        const remainingMinutes = Math.ceil((lockoutTime - now) / 60000);
        await logAudit({
          userId: user.id,
          action: 'LOGIN_ATTEMPT_WHILE_LOCKED',
          entityName: 'User',
          recordId: user.id,
          req
        });
        return res.status(403).json({
          success: false,
          message: `Account is locked due to multiple failed login attempts. Try again in ${remainingMinutes} minute(s).`
        });
      } else {
        // Lockout expired, reset counters
        user.failedLoginCount = 0;
        user.lockoutEnd = null;
        await user.save();
      }
    }

    // Verify Password
    const isMatch = await bcrypt.compare(password, user.passwordHash);

    if (!isMatch) {
      const newFailedCount = (user.failedLoginCount || 0) + 1;
      user.failedLoginCount = newFailedCount;

      if (newFailedCount >= 5) {
        // Lock account for 15 minutes
        user.lockoutEnd = new Date(Date.now() + 15 * 60 * 1000);
        await user.save();

        await logAudit({
          userId: user.id,
          action: 'ACCOUNT_LOCKOUT',
          entityName: 'User',
          recordId: user.id,
          newValue: { failedAttempts: newFailedCount, lockoutEnd: user.lockoutEnd },
          req
        });

        return res.status(403).json({
          success: false,
          message: 'Account is locked for 15 minutes due to 5 consecutive failed login attempts.'
        });
      } else {
        await user.save();

        await logAudit({
          userId: user.id,
          action: 'LOGIN_FAILED',
          entityName: 'User',
          recordId: user.id,
          newValue: { failedAttempts: newFailedCount },
          req
        });

        return res.status(401).json({
          success: false,
          message: `Invalid email or password. Attempt ${newFailedCount} of 5 before lockout.`
        });
      }
    }

    // Successful login: reset failedLoginCount and lockoutEnd
    user.failedLoginCount = 0;
    user.lockoutEnd = null;
    await user.save();

    await logAudit({
      userId: user.id,
      action: 'LOGIN_SUCCESS',
      entityName: 'User',
      recordId: user.id,
      req
    });

    const token = generateToken(user);
    setTokenCookie(res, token);

    return res.status(200).json({
      success: true,
      message: 'Login successful.',
      user: {
        id: user.id,
        username: user.username,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Logout
 */
const logout = async (req, res, next) => {
  try {
    if (req.user) {
      await logAudit({
        userId: req.user.id,
        action: 'LOGOUT',
        entityName: 'User',
        recordId: req.user.id,
        req
      });
    }

    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax'
    });

    return res.status(200).json({
      success: true,
      message: 'Logged out successfully.'
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Current User Profile (Me)
 */
const getMe = async (req, res) => {
  return res.status(200).json({
    success: true,
    user: req.user
  });
};

module.exports = {
  register,
  login,
  logout,
  getMe
};
