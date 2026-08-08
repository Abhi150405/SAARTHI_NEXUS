const express = require('express');
const router = express.Router();
// Assuming you have a mongoose model for Placements
// const Placement = require('../models/Placement'); // Example

// Note: Replace `db.collection('placements')` with your actual MongoDB collection/model reference
// For example, if using Mongoose: const collection = Placement;

/**
 * Helper to get the MongoDB collection (adjust to your DB setup)
 * We assume `req.app.locals.db.collection('placements')` or similar.
 * For this file, we'll assume `Placement` is an injected model or globally available.
 */

// We will simulate the `Placement` object for the sake of the router structure.
// In a real app, import it: const Placement = require('./models/Placement');
let Placement; 

// Middleware to inject model if needed, or just rely on imports.
// router.use((req, res, next) => { Placement = req.db.collection('placements'); next(); });

/**
 * 1. GET /api/placements/summary
 */
router.get('/summary', async (req, res) => {
  try {
    const result = await Placement.aggregate([
      {
        $group: {
          _id: null,
          total_placed: { $sum: "$gender_distribution.total" },
          highest_lpa: { $max: "$salary_lpa" },
          unique_companies: { $addToSet: "$company_name" }
        }
      },
      {
        $project: {
          _id: 0,
          total_placed: 1,
          highest_lpa: 1,
          total_companies: { $size: "$unique_companies" },
          // Mock placement rate for now, or calculate if eligible count is available
          placement_rate: { $literal: 94 } 
        }
      }
    ]);

    if (result.length === 0) {
      return res.json({ total_placed: 0, highest_lpa: 0, total_companies: 0, placement_rate: 0 });
    }
    res.json(result[0]);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * 2. GET /api/placements/by-year
 */
router.get('/by-year', async (req, res) => {
  try {
    const result = await Placement.aggregate([
      {
        $group: {
          _id: "$academic_year",
          total_placed: { $sum: "$gender_distribution.total" },
          highest_lpa: { $max: "$salary_lpa" },
          unique_companies: { $addToSet: "$company_name" },
          total_lpa_sum: { $sum: "$total_salary_lpa" }
        }
      },
      {
        $project: {
          _id: 0,
          year: "$_id",
          total_placed: 1,
          highest_lpa: 1,
          total_companies: { $size: "$unique_companies" },
          avg_lpa: {
            $cond: [
              { $eq: ["$total_placed", 0] }, 
              0, 
              { $divide: ["$total_lpa_sum", "$total_placed"] }
            ]
          }
        }
      },
      { $sort: { year: 1 } }
    ]);
    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * 3. GET /api/placements/package-distribution
 * Query: ?year=2024-25
 */
router.get('/package-distribution', async (req, res) => {
  try {
    const { year } = req.query;
    if (!year) return res.status(400).json({ error: 'year is required' });

    const result = await Placement.aggregate([
      { $match: { academic_year: year } },
      {
        $bucket: {
          groupBy: "$salary_lpa",
          boundaries: [0, 10, 20, 30, 40],
          default: 40, // For values >= 40
          output: {
            count: { $sum: "$gender_distribution.total" }
          }
        }
      }
    ]);

    // Format boundaries to string brackets
    const formatted = result.map(bucket => {
      let bracketLabel = '';
      if (bucket._id === 0) bracketLabel = '<10 LPA';
      else if (bucket._id === 10) bracketLabel = '10-20 LPA';
      else if (bucket._id === 20) bracketLabel = '20-30 LPA';
      else if (bucket._id === 30) bracketLabel = '30-40 LPA';
      else bracketLabel = '40+ LPA';

      return { bracket: bracketLabel, count: bucket.count };
    });

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * 4. GET /api/placements/top-recruiters
 * Query: ?year=2024-25&limit=8
 */
router.get('/top-recruiters', async (req, res) => {
  try {
    const { year } = req.query;
    const limit = parseInt(req.query.limit) || 8;
    if (!year) return res.status(400).json({ error: 'year is required' });

    const result = await Placement.aggregate([
      { $match: { academic_year: year } },
      {
        $group: {
          _id: "$company_name",
          total_hired: { $sum: "$gender_distribution.total" },
          avg_lpa: { $avg: "$salary_lpa" }
        }
      },
      { $sort: { total_hired: -1 } },
      { $limit: limit },
      {
        $project: {
          _id: 0,
          company: "$_id",
          total_hired: 1,
          avg_lpa: { $round: ["$avg_lpa", 1] }
        }
      }
    ]);

    if (result.length > 0) {
      const maxHires = result[0].total_hired;
      result.forEach(r => {
        r.bar_pct = (r.total_hired / maxHires) * 100;
      });
    }

    res.json(result);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * 5. GET /api/placements/visit-frequency
 */
router.get('/visit-frequency', async (req, res) => {
  try {
    const result = await Placement.aggregate([
      {
        $group: {
          _id: { company: "$company_name", year: "$academic_year" },
          hired: { $sum: "$gender_distribution.total" }
        }
      },
      {
        $group: {
          _id: "$_id.company",
          yearsData: {
            $push: { year: "$_id.year", hired: "$hired" }
          }
        }
      },
      { $sort: { "_id": 1 } }
    ]);

    const formatted = result.map(doc => {
      const yearsObj = {};
      doc.yearsData.forEach(yd => {
        yearsObj[yd.year] = yd.hired;
      });
      return {
        company: doc._id,
        years: yearsObj
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * 6. GET /api/placements/hall-of-offers
 * Query: ?year=2024-25&limit=20
 */
router.get('/hall-of-offers', async (req, res) => {
  try {
    const { year } = req.query;
    const limit = parseInt(req.query.limit) || 20;
    if (!year) return res.status(400).json({ error: 'year is required' });

    // Since the schema doesn't store individual student names,
    // we generate a list of "offers" based on the selections breakdown
    // If you have actual student offer docs, query those instead.
    // Here we'll return documents representing roles/branches hired.
    
    const result = await Placement.aggregate([
      { $match: { academic_year: year, "gender_distribution.total": { $gt: 0 } } },
      { $sort: { salary_lpa: -1 } },
      { $limit: limit }
    ]);

    const formatted = result.map(doc => {
      // Find branches with > 0 selections
      const branches = [];
      if (doc.selections) {
        for (const [branch, count] of Object.entries(doc.selections)) {
          if (count > 0) branches.push(branch);
        }
      }

      let visit_type = 'regular';
      if (doc.visit_date === 'PPO' || doc.criteria?.min_cgpa === 'PPO') {
        visit_type = 'PPO';
      }

      return {
        company: doc.company_name,
        role: doc.category, // frontend will derive actual role name
        salary_lpa: doc.salary_lpa,
        branches: branches,
        total_hired: doc.gender_distribution?.total || 0,
        visit_type: visit_type,
        category: doc.category
      };
    });

    res.json(formatted);
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

/**
 * 7. GET /api/placements/company-detail/:company_name
 */
router.get('/company-detail/:company_name', async (req, res) => {
  try {
    const company = req.params.company_name;

    const result = await Placement.aggregate([
      { $match: { company_name: company } },
      {
        $group: {
          _id: "$academic_year",
          hired: { $sum: "$gender_distribution.total" },
          avg_lpa: { $avg: "$salary_lpa" },
          ppo_count: {
            $sum: {
              $cond: [
                { $or: [ { $eq: ["$visit_date", "PPO"] }, { $eq: ["$criteria.min_cgpa", "PPO"] } ] },
                "$gender_distribution.total",
                0
              ]
            }
          },
          males: { $sum: "$gender_distribution.male" },
          females: { $sum: "$gender_distribution.female" },
          category: { $first: "$category" },
          selections: { $push: "$selections" }
        }
      },
      { $sort: { "_id": 1 } } // Sort by year
    ]);

    if (result.length === 0) {
      return res.status(404).json({ error: 'Company not found' });
    }

    let totalVisits = result.length;
    let firstVisit = result[0]._id;
    let lastVisit = result[result.length - 1]._id;
    
    let totalHires = 0;
    let sumLpa = 0;
    let totalPpo = 0;
    let totalMale = 0;
    let totalFemale = 0;
    let branchTotals = {};
    let category = result[result.length - 1].category; // latest category

    const yearlyData = result.map(r => {
      totalHires += r.hired;
      sumLpa += r.avg_lpa * r.hired; // weighted average
      totalPpo += r.ppo_count;
      totalMale += r.males;
      totalFemale += r.females;

      // Accumulate branches
      r.selections.forEach(sel => {
        if (sel) {
          for (const [branch, count] of Object.entries(sel)) {
            branchTotals[branch] = (branchTotals[branch] || 0) + count;
          }
        }
      });

      return {
        year: r._id,
        hired: r.hired,
        avg_lpa: Math.round(r.avg_lpa * 10) / 10
      };
    });

    const overallAvgLpa = totalHires > 0 ? (sumLpa / totalHires) : 0;

    res.json({
      company: company,
      sector: category, // frontend will derive
      total_visits: totalVisits,
      avg_lpa: Math.round(overallAvgLpa * 10) / 10,
      last_visit_year: lastVisit,
      first_visit_year: firstVisit,
      yearly_data: yearlyData,
      branch_breakdown: branchTotals,
      gender_total: { male: totalMale, female: totalFemale },
      ppo_count: totalPpo,
      category: category
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Internal Server Error' });
  }
});

module.exports = router;
