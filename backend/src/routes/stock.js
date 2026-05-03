const express = require('express');
const router = express.Router();
const StockItem = require('../models/StockItem');
const StockVoucher = require('../models/StockVoucher');
const { protect, adminOnly } = require('../middleware/auth');

// Stock Items
router.get('/items', protect, async (req, res) => {
  try {
    const items = await StockItem.find({ isActive: true }).sort({ name: 1 });
    res.json(items);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/items', protect, adminOnly, async (req, res) => {
  try {
    const item = await StockItem.create(req.body);
    res.status(201).json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.put('/items/:id', protect, adminOnly, async (req, res) => {
  try {
    const item = await StockItem.findByIdAndUpdate(req.params.id, req.body, { new: true });
    res.json(item);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/items/:id', protect, adminOnly, async (req, res) => {
  try {
    await StockItem.findByIdAndUpdate(req.params.id, { isActive: false });
    res.json({ message: 'Item deactivated' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Vouchers
router.get('/vouchers', protect, async (req, res) => {
  try {
    const filter = {};
    if (req.query.type) filter.type = req.query.type;
    const vouchers = await StockVoucher.find(filter)
      .populate('createdBy', 'name')
      .populate('items.item', 'name')
      .sort({ createdAt: -1 });
    res.json(vouchers);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.get('/vouchers/:id', protect, async (req, res) => {
  try {
    const voucher = await StockVoucher.findById(req.params.id)
      .populate('createdBy', 'name')
      .populate('items.item');
    if (!voucher) return res.status(404).json({ message: 'Voucher not found' });
    res.json(voucher);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.delete('/vouchers/:id', protect, adminOnly, async (req, res) => {
  try {
    const voucher = await StockVoucher.findById(req.params.id).populate('items.item');
    if (!voucher) return res.status(404).json({ message: 'Voucher not found' });

    // Reverse stock quantities
    for (const row of voucher.items) {
      const stockItem = await StockItem.findById(row.item);
      if (!stockItem) continue;
      if (voucher.type === 'ADD') {
        stockItem.quantity -= row.quantity; // undo purchase
      } else {
        stockItem.quantity += row.quantity; // undo sale
      }
      await stockItem.save();
    }

    await StockVoucher.findByIdAndDelete(req.params.id);
    res.json({ message: 'Voucher deleted and stock reversed' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

router.post('/vouchers', protect, async (req, res) => {
  try {
    const { type, items, party, note, date } = req.body;

    let totalAmount = 0;
    const processedItems = [];

    for (const row of items) {
      const stockItem = await StockItem.findById(row.item);
      if (!stockItem) return res.status(400).json({ message: `Item not found: ${row.item}` });

      const price = type === 'ADD' ? (row.price || stockItem.purchasePrice) : (row.price || stockItem.sellPrice);
      const total = price * row.quantity;
      totalAmount += total;

      processedItems.push({
        item: stockItem._id,
        itemName: stockItem.name,
        quantity: row.quantity,
        price,
        total,
      });

      if (type === 'ADD') {
        stockItem.quantity += row.quantity;
        if (row.price) stockItem.purchasePrice = row.price;
      } else {
        if (stockItem.quantity < row.quantity) {
          return res.status(400).json({ message: `Insufficient stock for ${stockItem.name}` });
        }
        stockItem.quantity -= row.quantity;
        if (row.price) stockItem.sellPrice = row.price;
      }
      await stockItem.save();
    }

    const voucher = await StockVoucher.create({
      type, items: processedItems, totalAmount, party, note,
      date: date ? new Date(date) : new Date(),
      createdBy: req.user._id,
    });

    await voucher.populate('createdBy', 'name');
    res.status(201).json(voucher);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;
