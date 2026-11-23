
const BASE_URL = process.env.TEST_API_URL || 'http://localhost:5000/api';

class CrmClient {
  constructor() {
    this.cookie = null;
  }

  async request(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    const headers = {
      'Content-Type': 'application/json',
      ...(options.headers || {})
    };

    if (this.cookie) {
      headers['Cookie'] = this.cookie;
    }

    const res = await fetch(url, {
      ...options,
      headers
    });

    // Capture set-cookie
    const setCookie = res.headers.get('set-cookie');
    if (setCookie) {
      this.cookie = setCookie.split(';')[0];
    }

    let data = null;
    const text = await res.text();
    try {
      data = JSON.parse(text);
    } catch {
      data = text;
    }

    return {
      status: res.status,
      headers: res.headers,
      data
    };
  }

  async login(email, password) {
    return await this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
  }

  async logout() {
    const res = await this.request('/auth/logout', { method: 'POST' });
    this.cookie = null;
    return res;
  }
}

async function runTests() {
  console.log('====================================================');
  console.log('       ACXIOM CRM - SYSTEM VERIFICATION SUITE       ');
  console.log('====================================================\n');

  let passed = 0;
  let failed = 0;

  function assert(condition, testName, details = '') {
    if (condition) {
      console.log(`  [PASS] ${testName}`);
      passed++;
    } else {
      console.error(`  [FAIL] ${testName} - ${details}`);
      failed++;
    }
  }

  try {
    // ----------------------------------------------------
    // TEST 1: Unauthenticated access blocked
    // ----------------------------------------------------
    console.log('--- Step 1: Unauthenticated Access Control ---');
    const unauthClient = new CrmClient();
    const unauthRes = await unauthClient.request('/customers');
    assert(
      unauthRes.status === 401 && unauthRes.data.success === false,
      'Unauthenticated request to /api/customers is blocked with 401',
      `Got status ${unauthRes.status}`
    );

    const unauthDash = await unauthClient.request('/dashboard');
    assert(
      unauthDash.status === 401,
      'Unauthenticated request to /api/dashboard is blocked with 401',
      `Got status ${unauthDash.status}`
    );

    // ----------------------------------------------------
    // TEST 2: Login as Admin & Validation Checks
    // ----------------------------------------------------
    console.log('\n--- Step 2: Authentication & Input Validation ---');
    const adminClient = new CrmClient();
    const adminLoginRes = await adminClient.login('admin@acxiomcrm.com', 'Admin@12345');
    assert(
      adminLoginRes.status === 200 && adminLoginRes.data.user?.role === 'Admin',
      'Admin login successful with JWT cookie set',
      `Status ${adminLoginRes.status}`
    );

    // Test Invalid Customer: Email format
    const badEmailCust = await adminClient.request('/customers', {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'Invalid Co',
        email: 'invalid-email-address',
        phone: '1234567890'
      })
    });
    assert(
      badEmailCust.status === 400 &&
      badEmailCust.data.message === 'Enter a valid email address.',
      'Invalid email rejected with message: "Enter a valid email address."',
      `Got status ${badEmailCust.status}, message: "${badEmailCust.data?.message}"`
    );

    // Test Invalid Customer: Phone format
    const badPhoneCust = await adminClient.request('/customers', {
      method: 'POST',
      body: JSON.stringify({
        customerName: 'Invalid Co',
        email: 'valid@example.com',
        phone: '12345' // not 10 digits
      })
    });
    assert(
      badPhoneCust.status === 400 &&
      badPhoneCust.data.message === 'Enter a valid phone number.',
      'Invalid phone rejected with message: "Enter a valid phone number."',
      `Got status ${badPhoneCust.status}, message: "${badPhoneCust.data?.message}"`
    );

    // ----------------------------------------------------
    // TEST 3: Opportunity Validation Rules
    // ----------------------------------------------------
    console.log('\n--- Step 3: Opportunity Validation Rules ---');
    // Amount > 0 check
    const badAmountOpp = await adminClient.request('/opportunities', {
      method: 'POST',
      body: JSON.stringify({
        opportunityName: 'Zero Amount Deal',
        customerId: 1,
        amount: 0,
        probability: 50,
        expectedCloseDate: '2027-01-01'
      })
    });
    assert(
      badAmountOpp.status === 400 &&
      badAmountOpp.data.message === 'Opportunity Amount must be greater than 0.',
      'Negative/Zero amount rejected with: "Opportunity Amount must be greater than 0."',
      `Message: "${badAmountOpp.data?.message}"`
    );

    // Probability 0-100 check
    const badProbOpp = await adminClient.request('/opportunities', {
      method: 'POST',
      body: JSON.stringify({
        opportunityName: 'High Prob Deal',
        customerId: 1,
        amount: 1000,
        probability: 150,
        expectedCloseDate: '2027-01-01'
      })
    });
    assert(
      badProbOpp.status === 400 &&
      badProbOpp.data.message === 'Probability must be between 0 and 100.',
      'Probability > 100 rejected with: "Probability must be between 0 and 100."',
      `Message: "${badProbOpp.data?.message}"`
    );

    // Expected close date cannot be in the past
    const pastDateOpp = await adminClient.request('/opportunities', {
      method: 'POST',
      body: JSON.stringify({
        opportunityName: 'Past Date Deal',
        customerId: 1,
        amount: 5000,
        probability: 50,
        expectedCloseDate: '2020-01-01',
        status: 'Active'
      })
    });
    assert(
      pastDateOpp.status === 400 &&
      pastDateOpp.data.message === 'Expected Close Date cannot be in the past.',
      'Past close date rejected with: "Expected Close Date cannot be in the past."',
      `Message: "${pastDateOpp.data?.message}"`
    );

    // ----------------------------------------------------
    // TEST 4: Follow-Up Validation Rules
    // ----------------------------------------------------
    console.log('\n--- Step 4: Follow-Up Validation Rules ---');
    const pastFollowUp = await adminClient.request('/followups', {
      method: 'POST',
      body: JSON.stringify({
        customerId: 1,
        followUpDate: '2020-01-01',
        followUpType: 'Call'
      })
    });
    assert(
      pastFollowUp.status === 400 &&
      pastFollowUp.data.message === 'Follow-up date cannot be earlier than today.',
      'Past follow-up date rejected with: "Follow-up date cannot be earlier than today."',
      `Message: "${pastFollowUp.data?.message}"`
    );

    // ----------------------------------------------------
    // TEST 5: Role-Based Authorization & Scoping
    // ----------------------------------------------------
    console.log('\n--- Step 5: Role-Based Authorization Scopes ---');
    // A) SalesExecutive
    const salesClient = new CrmClient();
    await salesClient.login('sales@acxiomcrm.com', 'Sales@12345');

    const salesUsers = await salesClient.request('/users');
    assert(
      salesUsers.status === 403,
      'SalesExecutive blocked from /api/users with 403 Forbidden',
      `Status ${salesUsers.status}`
    );

    const salesAudit = await salesClient.request('/audit');
    assert(
      salesAudit.status === 403,
      'SalesExecutive blocked from /api/audit with 403 Forbidden',
      `Status ${salesAudit.status}`
    );

    const salesCust = await salesClient.request('/customers');
    assert(
      salesCust.status === 200 && Array.isArray(salesCust.data.data),
      'SalesExecutive can access /api/customers',
      `Status ${salesCust.status}`
    );

    // B) Manager
    const managerClient = new CrmClient();
    await managerClient.login('manager@acxiomcrm.com', 'Manager@12345');

    const mgrUsers = await managerClient.request('/users');
    assert(
      mgrUsers.status === 403,
      'Manager blocked from /api/users with 403 Forbidden',
      `Status ${mgrUsers.status}`
    );

    const mgrAudit = await managerClient.request('/audit');
    assert(
      mgrAudit.status === 403,
      'Manager blocked from /api/audit with 403 Forbidden',
      `Status ${mgrAudit.status}`
    );

    const mgrCust = await managerClient.request('/customers');
    assert(
      mgrCust.status === 200 && mgrCust.data.total >= salesCust.data.total,
      `Manager sees full customer organization data (${mgrCust.data.total} >= ${salesCust.data.total})`
    );

    // C) Admin Access
    const adminUsers = await adminClient.request('/users');
    assert(
      adminUsers.status === 200 && adminUsers.data.data.length >= 3,
      'Admin has access to /api/users (returns all registered users)'
    );

    const adminAudit = await adminClient.request('/audit');
    assert(
      adminAudit.status === 200 && adminAudit.data.data.length > 0,
      'Admin has access to /api/audit (returns audit entries)'
    );

    // ----------------------------------------------------
    // TEST 6: Audit Entries Verification
    // ----------------------------------------------------
    console.log('\n--- Step 6: Audit Entries Verification ---');
    const actionsFound = adminAudit.data.data.map(a => a.action);
    assert(
      actionsFound.includes('LOGIN_SUCCESS'),
      'Audit log contains LOGIN_SUCCESS entries',
      `Actions present: ${[...new Set(actionsFound)].join(', ')}`
    );

    // ----------------------------------------------------
    // TEST 7: Customer JSON Response Format
    // ----------------------------------------------------
    console.log('\n--- Step 7: Customers API JSON Structure ---');
    const custRes = await adminClient.request('/customers?limit=1');
    const firstCust = custRes.data?.data?.[0];
    assert(
      custRes.status === 200 &&
      firstCust &&
      firstCust.customerCode &&
      firstCust.customerName &&
      firstCust.email &&
      firstCust.phone &&
      firstCust.status,
      '/api/customers returns well-formed DTO JSON with required fields',
      JSON.stringify(firstCust)
    );

    // ----------------------------------------------------
    // TEST 8: Dashboard Cards and Charts Data
    // ----------------------------------------------------
    console.log('\n--- Step 8: Dashboard Cards and Charts ---');
    const dashRes = await adminClient.request('/dashboard');
    const dashData = dashRes.data?.data;
    assert(
      dashRes.status === 200 &&
      dashData?.cards?.totalCustomers !== undefined &&
      dashData?.cards?.openOpportunities !== undefined &&
      dashData?.cards?.wonOpportunities !== undefined &&
      dashData?.cards?.lostOpportunities !== undefined &&
      dashData?.cards?.totalPipelineValue !== undefined,
      'Dashboard returns all required summary metric cards'
    );

    assert(
      dashData?.charts?.stageDistribution?.labels?.length === 5 &&
      dashData?.charts?.wonVsLost?.labels?.length === 2,
      'Dashboard returns structured datasets for Chart.js bar and doughnut charts'
    );

    console.log('\n====================================================');
    console.log(`TEST SUMMARY: ${passed} PASSED, ${failed} FAILED`);
    console.log('====================================================\n');

    process.exit(failed > 0 ? 1 : 0);
  } catch (err) {
    console.error('Test run failed with error:', err);
    process.exit(1);
  }
}

runTests();
