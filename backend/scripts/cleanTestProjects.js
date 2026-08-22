import dotenv from 'dotenv';
import dns from 'dns';
import mongoose from 'mongoose';

dotenv.config({ path: 'C:/Users/choya/Downloads/digital-marketplace-fixed/digital-marketplace/backend/.env' });
if (dns && dns.setServers) dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);

(async () => {
  await mongoose.connect(process.env.MONGO_URI);
  const Project = mongoose.model('Project', new mongoose.Schema({}, { strict: false }));
  const res = await Project.deleteMany({ title: { $regex: 'Uber Clone|Modern SaaS Starter Kit', $options: 'i' } });
  console.log('Deleted test projects:', res.deletedCount);
  const count = await Project.countDocuments();
  console.log('Active clean catalog count:', count);
  await mongoose.disconnect();
  process.exit(0);
})();
