const express = require('express');
const router = express.Router();
const QuotationTemplate = require('../models/QuotationTemplate');
const { protect, adminOnly } = require('../middleware/auth');

router.get('/templates', protect, async (req, res) => {
  try {
    const templates = await QuotationTemplate.find({ isActive: true }).populate('createdBy', 'name');
    res.json(templates);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/templates', protect, adminOnly, async (req, res) => {
  try {
    const template = await QuotationTemplate.create({ ...req.body, createdBy: req.user._id });
    res.status(201).json(template);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/templates/:id', protect, adminOnly, async (req, res) => {
  try {
    const template = await QuotationTemplate.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(template);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/templates/:id', protect, adminOnly, async (req, res) => {
  try {
    await QuotationTemplate.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Template deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
