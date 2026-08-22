import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import mongoose from 'mongoose';

const MONGO_URI = 'mongodb+srv://khushaljangra013_db_user:KJIGJtITbR4L8Yvi@cluster0.ywucg6a.mongodb.net/digital_marketplace?retryWrites=true&w=majority&appName=Cluster0';

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas');

    const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
    
    // Delete all demo/test orders permanently
    const result = await Order.deleteMany({});
    console.log(`Successfully deleted ${result.deletedCount} demo/test orders.`);

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error deleting orders:', err.message);
  }
})();
