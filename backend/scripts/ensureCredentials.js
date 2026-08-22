import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dns from 'dns';
import bcrypt from 'bcryptjs';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

try {
  if (dns && dns.setServers) {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  }
} catch (_) {}

async function run() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });

  const adminPass = await bcrypt.hash('admin@2006', 10);
  const userPass = await bcrypt.hash('user@2006', 10);
  const choyalPass = await bcrypt.hash('choyal@123', 10);
  const testBuyerPass = await bcrypt.hash('password123', 10);

  await User.updateOne({ email: 'admin@marketplace.com' }, { $set: { password: adminPass } });
  await User.updateOne({ email: 'user@marketplace.com' }, { $set: { password: userPass } });
  await User.updateOne({ email: 'khushaljangra721@gmail.com' }, { $set: { password: adminPass, role: 'admin' } });
  await User.updateOne({ email: 'choyal034@gmail.com' }, { $set: { password: choyalPass } });
  await User.updateOne({ email: 'testbuyer@marketplace.com' }, { $set: { password: testBuyerPass } });

  console.log('✅ Passwords confirmed for database accounts');
  await mongoose.disconnect();
  process.exit(0);
}

run();
