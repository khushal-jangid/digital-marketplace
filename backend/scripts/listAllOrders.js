import dns from 'dns';
dns.setServers(['8.8.8.8', '1.1.1.1']);
import mongoose from 'mongoose';

const MONGO_URI = 'mongodb+srv://khushaljangra013_db_user:KJIGJtITbR4L8Yvi@cluster0.ywucg6a.mongodb.net/digital_marketplace?retryWrites=true&w=majority&appName=Cluster0';

(async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log('Connected to MongoDB Atlas');

    const Order = mongoose.model('Order', new mongoose.Schema({}, { strict: false }));
    const orders = await Order.find({}).sort({ createdAt: -1 });

    console.log(`Found ${orders.length} total orders:`);
    orders.forEach((o, i) => {
      console.log(`[${i + 1}] ID: ${o._id} | Invoice: ${o.invoiceNumber || 'N/A'} | UTR: ${o.utrNumber || 'N/A'} | Email: ${o.userEmail || o.contactEmail} | Total: ${o.totalAmount} | Status: ${o.paymentStatus}`);
    });

    await mongoose.disconnect();
  } catch (err) {
    console.error('Error:', err.message);
  }
})();
