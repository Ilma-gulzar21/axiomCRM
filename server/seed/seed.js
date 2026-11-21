const bcrypt = require('bcryptjs');
const { sequelize, User, Customer, Opportunity, FollowUp, AuditLog } = require('../models');

const seedDatabase = async () => {
  try {
    console.log('--- Syncing Database Schema ---');
    await sequelize.sync({ alter: true });

    const existingCount = await User.count();
    if (existingCount > 0) {
      console.log('Database already contains users. Skipping initial seed.');
      return;
    }

    console.log('--- Seeding Roles and Users ---');
    const salt = await bcrypt.genSalt(10);

    const adminHash = await bcrypt.hash('Admin@12345', salt);
    const managerHash = await bcrypt.hash('Manager@12345', salt);
    const salesHash = await bcrypt.hash('Sales@12345', salt);

    const admin = await User.create({
      username: 'admin',
      email: 'admin@acxiomcrm.com',
      passwordHash: adminHash,
      role: 'Admin',
      isActive: true
    });

    const manager = await User.create({
      username: 'manager',
      email: 'manager@acxiomcrm.com',
      passwordHash: managerHash,
      role: 'Manager',
      isActive: true
    });

    const sales = await User.create({
      username: 'sales',
      email: 'sales@acxiomcrm.com',
      passwordHash: salesHash,
      role: 'SalesExecutive',
      isActive: true
    });

    console.log('Created Users: Admin, Manager, SalesExecutive.');

    console.log('--- Seeding Customers (10 records) ---');
    const customerData = [
      {
        customerCode: 'CUST-1001',
        customerName: 'Acme Corporation',
        email: 'contact@acmecorp.com',
        phone: '9876543210',
        companyName: 'Acme Corp',
        address: '100 Industrial Parkway',
        city: 'Metropolis',
        state: 'NY',
        status: 'Active',
        createdBy: sales.id
      },
      {
        customerCode: 'CUST-1002',
        customerName: 'Globex Industries',
        email: 'sales@globex.org',
        phone: '9876543211',
        companyName: 'Globex Global',
        address: '500 Technology Drive',
        city: 'Silicon Valley',
        state: 'CA',
        status: 'Active',
        createdBy: sales.id
      },
      {
        customerCode: 'CUST-1003',
        customerName: 'Initech Solutions',
        email: 'peter@initech.com',
        phone: '9876543212',
        companyName: 'Initech LLC',
        address: '4120 Freemont Blvd',
        city: 'Austin',
        state: 'TX',
        status: 'Active',
        createdBy: sales.id
      },
      {
        customerCode: 'CUST-1004',
        customerName: 'Umbrella Health Corp',
        email: 'info@umbrellacorp.net',
        phone: '9876543213',
        companyName: 'Umbrella Health',
        address: '77 Medical Center Way',
        city: 'Raccoon City',
        state: 'OH',
        status: 'Active',
        createdBy: manager.id
      },
      {
        customerCode: 'CUST-1005',
        customerName: 'Stark Enterprises',
        email: 'procurement@starkcorp.com',
        phone: '9876543214',
        companyName: 'Stark Industries',
        address: '10880 Malibu Point',
        city: 'Malibu',
        state: 'CA',
        status: 'Active',
        createdBy: manager.id
      },
      {
        customerCode: 'CUST-1006',
        customerName: 'Wayne Enterprises',
        email: 'bruce@waynecorp.com',
        phone: '9876543215',
        companyName: 'Wayne Tech',
        address: '1007 Mountain Drive',
        city: 'Gotham',
        state: 'NJ',
        status: 'Active',
        createdBy: sales.id
      },
      {
        customerCode: 'CUST-1007',
        customerName: 'Cyberdyne Systems',
        email: 'support@cyberdyne.io',
        phone: '9876543216',
        companyName: 'Cyberdyne AI',
        address: '18144 El Camino Real',
        city: 'Sunnyvale',
        state: 'CA',
        status: 'Active',
        createdBy: sales.id
      },
      {
        customerCode: 'CUST-1008',
        customerName: 'Oscorp BioTech',
        email: 'norman@oscorp.org',
        phone: '9876543217',
        companyName: 'Oscorp',
        address: '450 Lexington Ave',
        city: 'New York',
        state: 'NY',
        status: 'Active',
        createdBy: manager.id
      },
      {
        customerCode: 'CUST-1009',
        customerName: 'Massive Dynamic',
        email: 'nina@massivedynamic.com',
        phone: '9876543218',
        companyName: 'Massive Dynamic Labs',
        address: '650 Main Street',
        city: 'Boston',
        state: 'MA',
        status: 'Active',
        createdBy: sales.id
      },
      {
        customerCode: 'CUST-1010',
        customerName: 'Hooli Media',
        email: 'gavin@hooli.xyz',
        phone: '9876543219',
        companyName: 'Hooli Inc',
        address: '3200 Innovation Way',
        city: 'Palo Alto',
        state: 'CA',
        status: 'Active',
        createdBy: sales.id
      }
    ];

    const customers = await Customer.bulkCreate(customerData);
    console.log(`Created ${customers.length} sample customers.`);

    console.log('--- Seeding Opportunities (10 records) ---');
    const futureDate = (daysAhead) => {
      const d = new Date();
      d.setDate(d.getDate() + daysAhead);
      return d.toISOString().split('T')[0];
    };

    const opportunityData = [
      {
        opportunityName: 'Enterprise Cloud Migration',
        customerId: customers[0].id,
        amount: 45000.00,
        stage: 'Qualification',
        probability: 20,
        expectedCloseDate: futureDate(45),
        status: 'Active',
        assignedTo: sales.id,
        createdBy: sales.id
      },
      {
        opportunityName: 'Global ERP Integration',
        customerId: customers[1].id,
        amount: 120000.00,
        stage: 'Proposal',
        probability: 50,
        expectedCloseDate: futureDate(30),
        status: 'Active',
        assignedTo: sales.id,
        createdBy: sales.id
      },
      {
        opportunityName: 'IT Infrastructure Revamp',
        customerId: customers[2].id,
        amount: 32000.00,
        stage: 'Negotiation',
        probability: 80,
        expectedCloseDate: futureDate(15),
        status: 'Active',
        assignedTo: sales.id,
        createdBy: sales.id
      },
      {
        opportunityName: 'Hospital Data Security Suite',
        customerId: customers[3].id,
        amount: 85000.00,
        stage: 'Won',
        probability: 100,
        expectedCloseDate: futureDate(5),
        status: 'Closed',
        assignedTo: manager.id,
        createdBy: manager.id
      },
      {
        opportunityName: 'Clean Energy Monitoring System',
        customerId: customers[4].id,
        amount: 250000.00,
        stage: 'Proposal',
        probability: 60,
        expectedCloseDate: futureDate(60),
        status: 'Active',
        assignedTo: manager.id,
        createdBy: manager.id
      },
      {
        opportunityName: 'Security Ops Command Center',
        customerId: customers[5].id,
        amount: 180000.00,
        stage: 'Won',
        probability: 100,
        expectedCloseDate: futureDate(10),
        status: 'Closed',
        assignedTo: sales.id,
        createdBy: sales.id
      },
      {
        opportunityName: 'Neural Network Farm Hardware',
        customerId: customers[6].id,
        amount: 95000.00,
        stage: 'Lost',
        probability: 0,
        expectedCloseDate: futureDate(2),
        status: 'Closed',
        assignedTo: sales.id,
        createdBy: sales.id
      },
      {
        opportunityName: 'Genetic Sequencing Storage Pipeline',
        customerId: customers[7].id,
        amount: 60000.00,
        stage: 'Qualification',
        probability: 25,
        expectedCloseDate: futureDate(40),
        status: 'Active',
        assignedTo: manager.id,
        createdBy: manager.id
      },
      {
        opportunityName: 'Quantum Telemetry Platform',
        customerId: customers[8].id,
        amount: 140000.00,
        stage: 'Negotiation',
        probability: 75,
        expectedCloseDate: futureDate(20),
        status: 'Active',
        assignedTo: sales.id,
        createdBy: sales.id
      },
      {
        opportunityName: 'Nucleus Video Compression API',
        customerId: customers[9].id,
        amount: 70000.00,
        stage: 'Proposal',
        probability: 50,
        expectedCloseDate: futureDate(25),
        status: 'Active',
        assignedTo: sales.id,
        createdBy: sales.id
      }
    ];

    const opportunities = await Opportunity.bulkCreate(opportunityData);
    console.log(`Created ${opportunities.length} sample opportunities.`);

    console.log('--- Seeding Follow-Ups (10 records) ---');
    const followUpData = [
      {
        customerId: customers[0].id,
        followUpDate: futureDate(2),
        followUpType: 'Call',
        remarks: 'Discuss initial scoping and cloud architecture requirements.',
        status: 'Planned',
        assignedTo: sales.id,
        createdBy: sales.id
      },
      {
        customerId: customers[1].id,
        followUpDate: futureDate(4),
        followUpType: 'Meeting',
        remarks: 'Executive presentation of the ERP proposal with Globex VP.',
        status: 'Planned',
        assignedTo: sales.id,
        createdBy: sales.id
      },
      {
        customerId: customers[2].id,
        followUpDate: futureDate(1),
        followUpType: 'Call',
        remarks: 'Finalize SLA terms and payment schedule.',
        status: 'Planned',
        assignedTo: sales.id,
        createdBy: sales.id
      },
      {
        customerId: customers[3].id,
        followUpDate: futureDate(7),
        followUpType: 'Meeting',
        remarks: 'Contract signed. Kick-off implementation meeting.',
        status: 'Completed',
        assignedTo: manager.id,
        createdBy: manager.id
      },
      {
        customerId: customers[4].id,
        followUpDate: futureDate(3),
        followUpType: 'Demo',
        remarks: 'Live demonstration of telemetry monitoring sensors.',
        status: 'Planned',
        assignedTo: manager.id,
        createdBy: manager.id
      },
      {
        customerId: customers[5].id,
        followUpDate: futureDate(5),
        followUpType: 'Email',
        remarks: 'Delivered onboarding package and security clearance tokens.',
        status: 'Completed',
        assignedTo: sales.id,
        createdBy: sales.id
      },
      {
        customerId: customers[6].id,
        followUpDate: futureDate(6),
        followUpType: 'Email',
        remarks: 'Send post-mortem follow-up thanking for review time.',
        status: 'Completed',
        assignedTo: sales.id,
        createdBy: sales.id
      },
      {
        customerId: customers[7].id,
        followUpDate: futureDate(8),
        followUpType: 'Call',
        remarks: 'Review compliance certification checklist with Norman.',
        status: 'Planned',
        assignedTo: manager.id,
        createdBy: manager.id
      },
      {
        customerId: customers[8].id,
        followUpDate: futureDate(10),
        followUpType: 'Meeting',
        remarks: 'Draft review of custom licensing contract.',
        status: 'Planned',
        assignedTo: sales.id,
        createdBy: sales.id
      },
      {
        customerId: customers[9].id,
        followUpDate: futureDate(12),
        followUpType: 'Demo',
        remarks: 'Benchmark test comparing compression performance.',
        status: 'Planned',
        assignedTo: sales.id,
        createdBy: sales.id
      }
    ];

    const followUps = await FollowUp.bulkCreate(followUpData);
    console.log(`Created ${followUps.length} sample follow-ups.`);

    console.log('--- Initial Seed Completed Successfully ---');
  } catch (error) {
    console.error('Error during seeding:', error);
    throw error;
  }
};

// Execute if run directly from CLI
if (require.main === module) {
  seedDatabase()
    .then(() => {
      console.log('Seed script finished.');
      process.exit(0);
    })
    .catch((err) => {
      console.error('Seed script failed:', err);
      process.exit(1);
    });
}

module.exports = seedDatabase;
