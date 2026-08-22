import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dns from 'dns';
import User from '../models/User.js';
import Order from '../models/Order.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

try {
  if (dns && dns.setServers) {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  }
} catch (_) {}

async function cleanUsers() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });
  console.log('Connected to MongoDB Atlas:', mongoose.connection.host);

  // 1. Delete all users where role is NOT 'admin'
  const delUsersResult = await User.deleteMany({ role: { $ne: 'admin' } });
  console.log(`✅ Successfully deleted ${delUsersResult.deletedCount} non-admin user(s).`);

  // 2. Fetch remaining admin users
  const admins = await User.find({ role: 'admin' });
  console.log('\n=== REMAINING ADMIN USERS IN DATABASE ===');
  admins.forEach((admin, idx) => {
    console.log(`${idx + 1}. [ADMIN] ${admin.name} - ${admin.email} (ID: ${admin._id})`);
  });

  await mongoose.disconnect();
  process.exit(0);
}

cleanUsers().catch((err) => {
  console.error('Error cleaning users:', err);
  process.exit(1);
});
