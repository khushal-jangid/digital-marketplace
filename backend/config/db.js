import mongoose from 'mongoose';
import dns from 'dns';

// Bypass local ISP SRV lookup blocks by using Google DNS
if (dns && dns.setServers) {
  try {
    dns.setServers(['8.8.8.8', '8.8.4.4']);
  } catch (err) {
    // Ignore DNS error
  }
}

const connectDB = async () => {
  const mongoUri = process.env.MONGO_URI;

  if (!mongoUri) {
    console.error('FATAL: MONGO_URI environment variable is missing.');
    console.error('Set MONGO_URI in backend/.env to your real MongoDB Atlas (or local) connection string.');
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });
    console.log(`MongoDB Connected: ${conn.connection.host}`);
    return conn;
  } catch (error) {
    // No silent fallback to a fake/in-memory database. If the real database
    // is unreachable, the server should not start — this makes connection
    // problems (wrong password, IP not whitelisted, wrong URI, etc.) obvious
    // immediately instead of hiding behind fake data.
    console.error(`FATAL: Could not connect to MongoDB: ${error.message}`);
    console.error('Common causes: MONGO_URI is wrong, the DB user/password is wrong, or your current IP is not whitelisted in MongoDB Atlas → Network Access.');
    process.exit(1);
  }
};

export default connectDB;
