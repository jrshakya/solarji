const mongoose = require('mongoose');

const voucherItemSchema = new mongoose.Schema({
  item: { type: mongoose.Schema.Types.ObjectId, ref: 'StockItem', required: true },
  itemName: { type: String, required: true },
  quantity: { type: Number, required: true, min: 1 },
  price: { type: Number, required: true },
  total: { type: Number, required: true },
});

const stockVoucherSchema = new mongoose.Schema({
  voucherNumber: { type: String, unique: true },
  type: { type: String, enum: ['ADD', 'SELL'], required: true },
  date: { type: Date, default: Date.now },        // user-selectable transaction date
  items: [voucherItemSchema],
  totalAmount: { type: Number, required: true },
  party: { type: String, trim: true },
  note: { type: String },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
}, { timestamps: true });

stockVoucherSchema.pre('save', async function () {
  if (!this.voucherNumber) {
    const prefix = this.type === 'ADD' ? 'PV' : 'SV';
    const count = await this.constructor.countDocuments({ type: this.type });
    this.voucherNumber = `${prefix}-${String(count + 1).padStart(5, '0')}`;
  }
});

module.exports = mongoose.model('StockVoucher', stockVoucherSchema);
