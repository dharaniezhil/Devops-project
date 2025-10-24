// backend/src/controllers/reportsController.js
const mongoose = require('mongoose');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const Complaint = require('../models/Complaint');
const Feedback = require('../models/Feedback');

// Map satisfaction labels to numeric score for aggregation
const satisfactionScoreExpr = {
  $switch: {
    branches: [
      { case: { $eq: ['$feedback.satisfaction', 'Very satisfied'] }, then: 5 },
      { case: { $eq: ['$feedback.satisfaction', 'Satisfied'] }, then: 4 },
      { case: { $eq: ['$feedback.satisfaction', 'Neutral'] }, then: 3 },
      { case: { $eq: ['$feedback.satisfaction', 'Unsatisfied'] }, then: 2 },
      { case: { $eq: ['$feedback.satisfaction', 'Very unsatisfied'] }, then: 1 },
    ],
    default: 0,
  }
};

function parseDateRange(query) {
  const { from, to } = query || {};
  const range = {};
  if (from) {
    const d = new Date(from);
    if (!isNaN(d.getTime())) range.$gte = d;
  }
  if (to) {
    const d = new Date(to);
    if (!isNaN(d.getTime())) range.$lte = d;
  }
  return Object.keys(range).length ? range : null;
}

async function buildReportData(query) {
  const createdAtRange = parseDateRange(query);
  const complaintMatch = createdAtRange ? { createdAt: createdAtRange } : {};

  // Aggregate complaint metrics and average response time
  const complaintAgg = await Complaint.aggregate([
    { $match: complaintMatch },
    {
      $facet: {
        metrics: [
          {
            $group: {
              _id: null,
              total: { $sum: 1 },
              resolved: { $sum: { $cond: [{ $eq: ['$status', 'Resolved'] }, 1, 0] } },
            }
          },
          {
            $project: {
              _id: 0,
              total: 1,
              resolved: 1,
              resolutionRate: {
                $cond: [
                  { $gt: ['$total', 0] },
                  { $multiply: [{ $divide: ['$resolved', '$total'] }, 100] },
                  0,
                ]
              },
            }
          }
        ],
        response: [
          {
            $project: {
              createdAt: 1,
              statusHistory: 1,
            }
          },
          {
            $addFields: {
              nonPendingHistory: {
                $filter: {
                  input: '$statusHistory',
                  as: 'h',
                  cond: { $ne: ['$$h.status', 'Pending'] },
                }
              }
            }
          },
          { $addFields: { firstResponse: { $arrayElemAt: ['$nonPendingHistory', 0] } } },
          {
            $project: {
              responseMs: {
                $cond: [
                  { $ifNull: ['$firstResponse.updatedAt', false] },
                  { $subtract: ['$firstResponse.updatedAt', '$createdAt'] },
                  null,
                ]
              }
            }
          },
          { $match: { responseMs: { $ne: null } } },
          { $group: { _id: null, avgResponseMs: { $avg: '$responseMs' } } },
          { $project: { _id: 0, avgResponseDays: { $divide: ['$avgResponseMs', 86400000] } } }
        ],
        list: [
          {
            $project: {
              title: 1,
              status: 1,
              category: 1,
              priority: 1,
              createdAt: 1,
              statusHistory: 1,
              user: 1
            }
          },
          { $addFields: { resolvedHist: { $filter: { input: '$statusHistory', as: 'h', cond: { $eq: ['$$h.status', 'Resolved'] } } } } },
          { $addFields: { resolvedAt: { $let: { vars: { last: { $arrayElemAt: ['$resolvedHist.updatedAt', -1] } }, in: '$$last' } } } },
          { $addFields: { firstResponse: { $arrayElemAt: [{ $filter: { input: '$statusHistory', as: 'h', cond: { $ne: ['$$h.status', 'Pending'] } } }, 0] } } },
          {
            $addFields: {
              responseTimeDays: {
                $cond: [
                  { $ifNull: ['$firstResponse.updatedAt', false] },
                  { $divide: [{ $subtract: ['$firstResponse.updatedAt', '$createdAt'] }, 86400000] },
                  null,
                ]
              }
            }
          },
          { $project: { statusHistory: 0 } },
          { $sort: { createdAt: -1 } },
          { $limit: 1000 }
        ]
      }
    }
  ]);

  const complaintData = complaintAgg[0] || { metrics: [], response: [], list: [] };
  const metrics = complaintData.metrics[0] || { total: 0, resolved: 0, resolutionRate: 0 };
  const resp = complaintData.response[0] || { avgResponseDays: 0 };

  // Aggregate feedbacks for average user satisfaction
  const fbMatch = { isVisible: true };
  const fbDateRange = parseDateRange(query);
  if (fbDateRange) fbMatch.createdAt = fbDateRange;

  const feedbackAgg = await Feedback.aggregate([
    { $match: fbMatch },
    {
      $group: {
        _id: null,
        totalFeedbacks: { $sum: 1 },
        avgSatisfaction: { $avg: satisfactionScoreExpr }, // 0-5 scale
      }
    },
    { $project: { _id: 0, totalFeedbacks: 1, avgSatisfaction: 1 } }
  ]);

  const fb = feedbackAgg[0] || { totalFeedbacks: 0, avgSatisfaction: 0 };

  const result = {
    totalComplaints: metrics.total || 0,
    resolutionRate: Number((metrics.resolutionRate || 0).toFixed(2)),
    averageResponseTimeDays: Number((resp.avgResponseDays || 0).toFixed(2)),
    averageUserSatisfaction: Number((fb.avgSatisfaction || 0).toFixed(2)), // out of 5
    totalFeedbacks: fb.totalFeedbacks || 0,
  };

  return { metrics: result, complaints: complaintData.list, generatedAt: new Date() };
}

exports.getMetrics = async (req, res) => {
  try {
    const data = await buildReportData(req.query);
    return res.json({ success: true, ...data });
  } catch (e) {
    console.error('reports.getMetrics error', e);
    return res.status(500).json({ success: false, message: 'Failed to compute metrics' });
  }
};

exports.regenerate = async (req, res) => {
  try {
    const data = await buildReportData(req.query);
    return res.json({ success: true, regenerated: true, ...data });
  } catch (e) {
    console.error('reports.regenerate error', e);
    return res.status(500).json({ success: false, message: 'Failed to regenerate report' });
  }
};

exports.exportCSV = async (req, res) => {
  try {
    const { metrics, complaints, generatedAt } = await buildReportData(req.query);

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', 'attachment; filename="report.csv"');

    // Metrics header section
    const lines = [];
    lines.push('Report Generated,' + generatedAt.toISOString());
    lines.push('Total Complaints,' + metrics.totalComplaints);
    lines.push('Resolution Rate (%),' + metrics.resolutionRate);
    lines.push('Average Response Time (days),' + metrics.averageResponseTimeDays);
    lines.push('Average User Satisfaction (out of 5),' + metrics.averageUserSatisfaction);
    lines.push('Total Feedbacks,' + metrics.totalFeedbacks);
    lines.push('');

    // Complaint rows
    lines.push('Title,Status,Category,Priority,Created At,Resolved At,Response Time (days)');
    for (const c of complaints) {
      const row = [
        (c.title || '').replace(/"/g, '""'),
        c.status || '',
        c.category || '',
        c.priority || '',
        c.createdAt ? new Date(c.createdAt).toISOString() : '',
        c.resolvedAt ? new Date(c.resolvedAt).toISOString() : '',
        c.responseTimeDays != null ? Number(c.responseTimeDays).toFixed(2) : ''
      ].map(v => `"${String(v).replace(/\n/g, ' ')}"`).join(',');
      lines.push(row);
    }

    res.send(lines.join('\n'));
  } catch (e) {
    console.error('reports.exportCSV error', e);
    return res.status(500).json({ success: false, message: 'Failed to export CSV' });
  }
};

exports.exportExcel = async (req, res) => {
  try {
    const { metrics, complaints, generatedAt } = await buildReportData(req.query);

    const wb = new ExcelJS.Workbook();
    const ws1 = wb.addWorksheet('Metrics');
    const ws2 = wb.addWorksheet('Complaints');

    ws1.addRows([
      ['Report Generated', generatedAt.toISOString()],
      ['Total Complaints', metrics.totalComplaints],
      ['Resolution Rate (%)', metrics.resolutionRate],
      ['Average Response Time (days)', metrics.averageResponseTimeDays],
      ['Avg User Satisfaction (out of 5)', metrics.averageUserSatisfaction],
      ['Total Feedbacks', metrics.totalFeedbacks],
    ]);

    // Required complaint fields: complaint ID, user ID, title, status, created date
    ws2.addRow(['Complaint ID', 'User ID', 'Title', 'Status', 'Created At']);
    for (const c of complaints) {
      ws2.addRow([
        c._id ? String(c._id) : '',
        c.user ? String(c.user) : '',
        c.title || '',
        c.status || '',
        c.createdAt ? new Date(c.createdAt) : ''
      ]);
    }

    // Optional: make header bold
    ws2.getRow(1).font = { bold: true };

    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', 'attachment; filename="report.xlsx"');
    await wb.xlsx.write(res);
    res.end();
  } catch (e) {
    console.error('reports.exportExcel error', e);
    return res.status(500).json({ success: false, message: 'Failed to export Excel' });
  }
};

exports.exportPDF = async (req, res) => {
  try {
    const { metrics, complaints, generatedAt } = await buildReportData(req.query);

    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader('Content-Disposition', 'attachment; filename="report.pdf"');

    const doc = new PDFDocument({ size: 'A4', margin: 40 });
    doc.pipe(res);

    doc.fontSize(18).text('FixItFast - Reports', { align: 'center' });
    doc.moveDown(0.5);
    doc.fontSize(10).text(`Generated: ${generatedAt.toISOString()}`, { align: 'center' });

    doc.moveDown(1);
    doc.fontSize(12).text('Metrics');
    doc.moveDown(0.5);
    const m = metrics;
    const metricsLines = [
      `Total Complaints: ${m.totalComplaints}`,
      `Resolution Rate: ${m.resolutionRate}%`,
      `Average Response Time: ${m.averageResponseTimeDays} days`,
      `Average User Satisfaction: ${m.averageUserSatisfaction}/5`,
      `Total Feedbacks: ${m.totalFeedbacks}`,
    ];
    metricsLines.forEach((line) => doc.text(line));

    doc.moveDown(1);
    doc.fontSize(12).text('Recent Complaints (up to 1000)');
    doc.moveDown(0.5);

    const header = ['Title', 'Status', 'Category', 'Priority', 'Created', 'Resolved', 'Resp (days)'];
    doc.fontSize(9).text(header.join(' | '));
    doc.moveDown(0.2);
    doc.text('-'.repeat(120));

    const maxRows = 100; // keep PDF size in check
    complaints.slice(0, maxRows).forEach((c) => {
      const row = [
        (c.title || '').slice(0, 40),
        c.status || '',
        c.category || '',
        c.priority || '',
        c.createdAt ? new Date(c.createdAt).toISOString().slice(0, 10) : '',
        c.resolvedAt ? new Date(c.resolvedAt).toISOString().slice(0, 10) : '',
        c.responseTimeDays != null ? Number(c.responseTimeDays).toFixed(2) : ''
      ];
      doc.text(row.join(' | '));
    });

    doc.end();
  } catch (e) {
    console.error('reports.exportPDF error', e);
    return res.status(500).json({ success: false, message: 'Failed to export PDF' });
  }
};
