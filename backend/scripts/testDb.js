import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import mongoose from 'mongoose';
import dns from 'dns';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '..', '.env') });

try {
  if (dns && dns.setServers) {
    dns.setServers(['8.8.8.8', '8.8.4.4', '1.1.1.1']);
  }
} catch (_) {}

async function runDbTest() {
  console.log('\n========================================');
  console.log('🧪 MONGODB ATLAS CONNECTIVITY AUDIT');
  console.log('========================================\n');

  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    console.error('❌ FAILED: MONGO_URI is missing in backend/.env');
    process.exit(1);
  }

  const maskedUri = mongoUri.replace(/:([^:@]+)@/, ':****@');
  console.log(`📡 Connecting to: ${maskedUri}`);

  const startTime = Date.now();

  try {
    const conn = await mongoose.connect(mongoUri, {
      serverSelectionTimeoutMS: 8000,
    });

    const elapsed = Date.now() - startTime;
    console.log(`✅ SUCCESS: Connected to cluster host: ${conn.connection.host}`);
    console.log(`⏱️ Latency: ${elapsed}ms`);
    console.log(`🗄️ Database Name: ${conn.connection.name}`);

    const collections = await conn.connection.db.listCollections().toArray();
    console.log(`\n📦 Active Collections (${collections.length}):`);
    for (const c of collections) {
      const count = await conn.connection.db.collection(c.name).countDocuments().catch(() => 0);
      console.log(`   - ${c.name.padEnd(20)}: ${count} documents`);
    }

    console.log('\n========================================');
    console.log('🎉 DATABASE CONNECTION TEST PASSED (100% HEALTHY)');
    console.log('========================================\n');

    await mongoose.disconnect();
    process.exit(0);
  } catch (error) {
    console.error('\n❌ FAILED: Could not connect to MongoDB Atlas.');
    console.error(`Error: ${error.message}\n`);

    if (error.message.includes('querySrv') || error.message.includes('ECONNREFUSED')) {
      console.error('🔍 ROOT CAUSE: DNS SRV Lookup failure. Your ISP or router is blocking SRV records.');
      console.error('👉 FIX: Google DNS (8.8.8.8) is automatically configured in server.js to resolve this.');
    } else if (error.message.includes('bad auth') || error.message.includes('AuthenticationFailed') || error.code === 8000) {
      console.error('🔍 ROOT CAUSE: Bad credentials (wrong username or password).');
      console.error('👉 FIX: Go to MongoDB Atlas -> Database Access -> edit user password and update backend/.env.');
    } else if (error.name === 'MongoServerSelectionError' || error.message.includes('Server selection timed out')) {
      console.error('🔍 ROOT CAUSE: IP Whitelist Blocked.');
      console.error('👉 FIX: Go to MongoDB Atlas -> Network Access -> Add IP Address -> Select "Allow Access from Anywhere" (0.0.0.0/0).');
    }

    console.log('\n========================================\n');
    process.exit(1);
  }
}

runDbTest();
