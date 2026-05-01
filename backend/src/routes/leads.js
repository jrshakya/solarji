const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const { protect } = require('../middleware/auth');

router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== 'admin') filter.assignedTo = req.user._id;
    if (req.query.stage) filter.stage = req.query.stage;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;

    const leads = await Lead.find(filter)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .sort({ updatedAt: -1 });
    res.json(leads);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/stages', protect, (req, res) => {
  res.json(Lead.STAGES);
});

router.get('/:id', protect, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email')
      .populate('stageHistory.assignedTo', 'name email')
      .populate('stageHistory.movedBy', 'name email')
      .populate('notes.addedBy', 'name email');
    if (!lead) return res.status(404).json({ message: 'Lead not found' });
    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/', protect, async (req, res) => {
  try {
    const { name, phone, email, address, city, requirements, systemSize, source, assignedTo } = req.body;
    const lead = await Lead.create({
      name, phone, email, address, city, requirements, systemSize, source,
      assignedTo: assignedTo || req.user._id,
      createdBy: req.user._id,
      stageHistory: [{
        stage: 'Lead',
        assignedTo: assignedTo || req.user._id,
        movedBy: req.user._id,
        note: 'Lead created',
      }],
    });
    await lead.populate('assignedTo', 'name email');
    await lead.populate('createdBy', 'name email');
    res.status(201).json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/stage', protect, async (req, res) => {
  try {
    const { stage, assignedTo, note } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    lead.stage = stage;
    if (assignedTo) lead.assignedTo = assignedTo;

    lead.stageHistory.push({
      stage,
      assignedTo: assignedTo || lead.assignedTo,
      movedBy: req.user._id,
      note: note || `Moved to ${stage}`,
    });

    await lead.save();
    await lead.populate('assignedTo', 'name email');
    await lead.populate('createdBy', 'name email');
    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id/assign', protect, async (req, res) => {
  try {
    const { assignedTo, note } = req.body;
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    lead.assignedTo = assignedTo;
    lead.stageHistory.push({
      stage: lead.stage,
      assignedTo,
      movedBy: req.user._id,
      note: note || 'Lead reassigned',
    });

    await lead.save();
    await lead.populate('assignedTo', 'name email');
    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/notes', protect, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    lead.notes.push({ text: req.body.text, addedBy: req.user._id });
    await lead.save();
    await lead.populate('notes.addedBy', 'name email');
    res.json(lead.notes);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/:id', protect, async (req, res) => {
  try {
    const lead = await Lead.findByIdAndUpdate(req.params.id, req.body, { new: true })
      .populate('assignedTo', 'name email')
      .populate('createdBy', 'name email');
    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/:id', protect, async (req, res) => {
  try {
    if (req.user.role !== 'admin') return res.status(403).json({ message: 'Admin only' });
    await Lead.findByIdAndDelete(req.params.id);
    res.json({ message: 'Lead deleted' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
