import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dns from 'dns';
import User from '../models/User.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

try {
  if (dns && dns.setServers) {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  }
} catch (_) {}

async function removeUser2() {
  await mongoose.connect(process.env.MONGO_URI, { serverSelectionTimeoutMS: 8000 });

  const res = await User.deleteOne({ email: 'khushaljangra721@gmail.com' });
  console.log(`✅ Deleted user khushaljangra721@gmail.com (Deleted Count: ${res.deletedCount})`);

  const remaining = await User.find();
  console.log('\n=== REMAINING USERS IN DATABASE ===');
  remaining.forEach((u, i) => {
    console.log(`${i + 1}. [${u.role.toUpperCase()}] ${u.name} (${u.email}) - ID: ${u._id}`);
  });

  await mongoose.disconnect();
  process.exit(0);
}

removeUser2().catch((err) => {
  console.error('Error:', err);
  process.exit(1);
});
