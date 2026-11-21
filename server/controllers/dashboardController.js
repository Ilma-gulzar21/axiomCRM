const { Op } = require('sequelize');
const { Customer, Opportunity, FollowUp } = require('../models');
const { getScopeFilter } = require('../middleware/authorize');

const getDashboardMetrics = async (req, res, next) => {
  try {
    const customerScope = getScopeFilter(req.user, 'customer');
    const opportunityScope = getScopeFilter(req.user, 'opportunity');
    const followUpScope = getScopeFilter(req.user, 'followup');

    // 1. Total Customers (Active)
    const totalCustomers = await Customer.count({
      where: {
        ...customerScope,
        status: 'Active'
      }
    });

    // 2. Opportunities counts and pipeline value
    const openStages = ['Qualification', 'Proposal', 'Negotiation'];

    const openOpportunities = await Opportunity.count({
      where: {
        ...opportunityScope,
        stage: { [Op.in]: openStages },
        status: 'Active'
      }
    });

    const wonOpportunities = await Opportunity.count({
      where: {
        ...opportunityScope,
        stage: 'Won'
      }
    });

    const lostOpportunities = await Opportunity.count({
      where: {
        ...opportunityScope,
        stage: 'Lost'
      }
    });

    // Total Pipeline Value (Sum of amounts of open active opportunities)
    const pipelineSum = await Opportunity.sum('amount', {
      where: {
        ...opportunityScope,
        stage: { [Op.in]: openStages },
        status: 'Active'
      }
    });
    const totalPipelineValue = pipelineSum ? parseFloat(pipelineSum) : 0;

    // 3. Stage breakdown for bar chart
    const allStages = ['Qualification', 'Proposal', 'Negotiation', 'Won', 'Lost'];
    const stageCounts = {};
    for (const stage of allStages) {
      stageCounts[stage] = await Opportunity.count({
        where: {
          ...opportunityScope,
          stage
        }
      });
    }

    // 4. Pending Follow-Ups
    const pendingFollowUps = await FollowUp.count({
      where: {
        ...followUpScope,
        status: 'Planned'
      }
    });

    return res.status(200).json({
      success: true,
      data: {
        cards: {
          totalCustomers,
          openOpportunities,
          wonOpportunities,
          lostOpportunities,
          totalPipelineValue,
          pendingFollowUps
        },
        charts: {
          stageDistribution: {
            labels: allStages,
            data: allStages.map(s => stageCounts[s])
          },
          wonVsLost: {
            labels: ['Won', 'Lost'],
            data: [wonOpportunities, lostOpportunities]
          }
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getDashboardMetrics
};
