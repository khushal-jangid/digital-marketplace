import mongoose from 'mongoose';
import dns from 'dns';
dns.setServers(['8.8.8.8', '8.8.4.4']);

const MONGO_URI = 'mongodb+srv://khushaljangra013_db_user:KJIGJtITbR4L8Yvi@cluster0.ywucg6a.mongodb.net/digital_marketplace?retryWrites=true&w=majority&appName=Cluster0';

(async () => {
  await mongoose.connect(MONGO_URI);
  const result = await mongoose.connection.db.collection('coupons').deleteMany({
    code: { $regex: '^FLASH', $options: 'i' }
  });
  console.log('Deleted lingering FLASH coupons from DB:', result.deletedCount);
  await mongoose.disconnect();
  process.exit(0);
})();
