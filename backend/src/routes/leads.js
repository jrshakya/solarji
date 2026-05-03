const express = require('express');
const router = express.Router();
const Lead = require('../models/Lead');
const User = require('../models/User');
const { protect } = require('../middleware/auth');

// Calculate points earned based on days elapsed since stage was entered
// Same day = +5, each extra day -1, can go negative
function calcPoints(stageSinceDate) {
  const now = new Date();
  const since = new Date(stageSinceDate);
  const daysElapsed = Math.floor((now - since) / (1000 * 60 * 60 * 24));
  return 5 - daysElapsed;
}

router.get('/', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.user.role !== 'admin') filter.assignedTo = req.user._id;
    if (req.query.stage) filter.stage = req.query.stage;
    if (req.query.assignedTo) filter.assignedTo = req.query.assignedTo;

    const leads = await Lead.find(filter)
      .populate('assignedTo', 'name email points')
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

// Leaderboard — sorted by points desc
router.get('/leaderboard', protect, async (req, res) => {
  try {
    const users = await User.find({ isActive: true }).select('name email role points').sort({ points: -1 });
    res.json(users);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/:id', protect, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id)
      .populate('assignedTo', 'name email points')
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
        date: new Date(),
      }],
    });
    await lead.populate('assignedTo', 'name email points');
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

    // Only award points when actually changing stage (not same stage)
    const isStageChange = lead.stage !== stage;

    if (isStageChange) {
      // Find when current stage was entered (last stageHistory entry)
      const lastEntry = lead.stageHistory.length > 0
        ? lead.stageHistory[lead.stageHistory.length - 1]
        : null;
      const stageSince = lastEntry?.date || lead.createdAt;

      // Award points to whoever is assigned at the current stage
      const recipientId = (lead.assignedTo || '').toString();
      if (recipientId) {
        const earned = calcPoints(stageSince);
        await User.findByIdAndUpdate(recipientId, { $inc: { points: earned } });
      }
    }

    lead.stage = stage;
    if (assignedTo) lead.assignedTo = assignedTo;

    lead.stageHistory.push({
      stage,
      assignedTo: assignedTo || lead.assignedTo,
      movedBy: req.user._id,
      note: note || `Moved to ${stage}`,
      date: new Date(),
    });

    await lead.save();
    await lead.populate('assignedTo', 'name email points');
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
      date: new Date(),
    });

    await lead.save();
    await lead.populate('assignedTo', 'name email points');
    res.json(lead);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/:id/notes', protect, async (req, res) => {
  try {
    const lead = await Lead.findById(req.params.id);
    if (!lead) return res.status(404).json({ message: 'Lead not found' });

    lead.notes.push({ text: req.body.text, addedBy: req.user._id, date: new Date() });
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
      .populate('assignedTo', 'name email points')
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
