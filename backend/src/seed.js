require('dotenv').config();
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const User = require('./models/User');
const StockItem = require('./models/StockItem');

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB');

  // Create admin user
  const existing = await User.findOne({ email: 'admin@solarji.com' });
  if (!existing) {
    await User.create({
      name: 'Admin',
      email: 'admin@solarji.com',
      password: 'admin123',
      role: 'admin',
      phone: '+91 98765 43210',
    });
    console.log('Admin user created: admin@solarji.com / admin123');
  } else {
    console.log('Admin user already exists');
  }

  // Create sample stock items
  const items = [
    { name: 'Solar Panel 400W Mono PERC', category: 'Solar Panel', unit: 'piece', purchasePrice: 9500, sellPrice: 12000, quantity: 50, minQuantity: 5 },
    { name: 'Solar Panel 550W Bifacial', category: 'Solar Panel', unit: 'piece', purchasePrice: 14000, sellPrice: 17000, quantity: 30, minQuantity: 5 },
    { name: 'Solis 5kW String Inverter', category: 'Inverter', unit: 'piece', purchasePrice: 28000, sellPrice: 35000, quantity: 15, minQuantity: 2 },
    { name: 'GI Mounting Structure per kW', category: 'Structure', unit: 'set', purchasePrice: 3500, sellPrice: 5000, quantity: 40, minQuantity: 5 },
    { name: '4mm Solar DC Wire', category: 'Wire', unit: 'meter', purchasePrice: 25, sellPrice: 40, quantity: 500, minQuantity: 50 },
    { name: '6mm Solar DC Wire', category: 'Wire', unit: 'meter', purchasePrice: 35, sellPrice: 55, quantity: 300, minQuantity: 50 },
    { name: 'ACDB Box 3 Phase', category: 'ACDB/DCDB', unit: 'piece', purchasePrice: 3500, sellPrice: 5500, quantity: 20, minQuantity: 3 },
    { name: 'MC4 Connector Pair', category: 'Accessories', unit: 'pair', purchasePrice: 80, sellPrice: 150, quantity: 200, minQuantity: 20 },
  ];

  for (const item of items) {
    const exists = await StockItem.findOne({ name: item.name });
    if (!exists) {
      await StockItem.create(item);
      console.log(`Stock item added: ${item.name}`);
    }
  }

  console.log('\nSeed complete!');
  process.exit(0);
}

seed().catch(err => { console.error(err); process.exit(1); });
