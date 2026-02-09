/**
 * Migration script: Drop old indexes + delete old data (no userId)
 *
 * Run once after deploying auth changes:
 *   node scripts/migrate-auth.js
 *
 * What it does:
 *   1. Drops old conflicting indexes on expenses and monthlysummaries
 *   2. Deletes all documents without a userId field (old test data)
 */

const mongoose = require('mongoose');
require('dotenv').config();

async function migrate() {
  await mongoose.connect(process.env.MONGODB_URI);
  console.log('Connected to MongoDB\n');

  const db = mongoose.connection.db;
  const collections = await db.listCollections().toArray();
  const collectionNames = collections.map(c => c.name);

  // --- Step 1: Drop old indexes ---
  console.log('=== Step 1: Dropping old indexes ===\n');

  if (collectionNames.includes('expenses')) {
    const expenseIndexes = await db.collection('expenses').indexes();
    for (const idx of expenseIndexes) {
      // Drop old indexes that don't include userId (skip _id index)
      if (idx.name === '_id_') continue;
      const keys = Object.keys(idx.key);
      if (!keys.includes('userId')) {
        console.log(`  Dropping expenses index: ${idx.name} (${JSON.stringify(idx.key)})`);
        await db.collection('expenses').dropIndex(idx.name);
      }
    }
  }

  if (collectionNames.includes('monthlysummaries')) {
    const summaryIndexes = await db.collection('monthlysummaries').indexes();
    for (const idx of summaryIndexes) {
      if (idx.name === '_id_') continue;
      const keys = Object.keys(idx.key);
      if (!keys.includes('userId')) {
        console.log(`  Dropping monthlysummaries index: ${idx.name} (${JSON.stringify(idx.key)})`);
        await db.collection('monthlysummaries').dropIndex(idx.name);
      }
    }
  }

  console.log('\n=== Step 2: Deleting old data without userId ===\n');

  // --- Step 2: Delete documents without userId ---
  for (const name of ['settings', 'expenses', 'monthlysummaries']) {
    if (collectionNames.includes(name)) {
      const result = await db.collection(name).deleteMany({ userId: { $exists: false } });
      console.log(`  ${name}: deleted ${result.deletedCount} document(s)`);
    }
  }

  console.log('\nMigration complete!');
  await mongoose.disconnect();
}

migrate().catch((err) => {
  console.error('Migration failed:', err.message);
  process.exit(1);
});
