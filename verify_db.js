const mongoose = require('mongoose');

const uri = 'mongodb://localhost:27017/warehouse-system?retryWrites=true&w=majority';

async function verifyDB() {
  try {
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB successfully.');
    
    const collections = await mongoose.connection.db.listCollections().toArray();
    console.log(`Found ${collections.length} collections.`);
    
    for (const coll of collections) {
      const count = await mongoose.connection.db.collection(coll.name).countDocuments();
      console.log(`- Collection [${coll.name}]: ${count} document(s)`);
    }
  } catch (error) {
    console.error('❌ Connection error:', error);
  } finally {
    await mongoose.disconnect();
    console.log('Connection closed.');
  }
}

verifyDB();
