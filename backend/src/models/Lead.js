const mongoose = require('mongoose');

const STAGES = [
  'Lead', 'Calling', 'Visit', 'Filing',
  'Loan Filing', 'Loan Process', 'Installation',
  'Kesco Filing', 'Kesco Process', 'Meter Install', 'Commission'
];

const stageHistorySchema = new mongoose.Schema({
  stage: { type: String, enum: STAGES },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  movedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  note: { type: String },
  date: { type: Date, default: Date.now },
});

const leadSchema = new mongoose.Schema({
  name: { type: String, required: true, trim: true },
  phone: { type: String, required: true, trim: true },
  email: { type: String, trim: true },
  address: { type: String, trim: true },
  city: { type: String, trim: true },
  requirements: { type: String },
  systemSize: { type: String },
  source: { type: String, default: 'Manual' },

  stage: { type: String, enum: STAGES, default: 'Lead' },
  assignedTo: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  stageHistory: [stageHistorySchema],
  notes: [{
    text: { type: String },
    addedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
    date: { type: Date, default: Date.now },
  }],
}, { timestamps: true });

leadSchema.statics.STAGES = STAGES;

module.exports = mongoose.model('Lead', leadSchema);
