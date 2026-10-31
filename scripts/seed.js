// scripts/seed.js
// Seeds the database with realistic municipal complaint batches

const path = require('node:path');
const fs = require('node:fs');
const { initDatabase } = require('../lib/database');
const { processBatchComplaints } = require('../lib/ingestionService');

async function runSeed() {
  console.log('--- Initializing Database Schema ---');
  initDatabase();

  const seedFile = path.resolve(__dirname, '../data/seed_complaints.json');
  if (!fs.existsSync(seedFile)) {
    console.error('Seed file not found at:', seedFile);
    process.exit(1);
  }

  const rawData = fs.readFileSync(seedFile, 'utf8');
  const complaints = JSON.parse(rawData);

  console.log(`--- Ingesting & Triaging ${complaints.length} Civic Complaints ---`);
  const results = await processBatchComplaints(complaints);

  console.log(`Successfully processed ${results.length} complaints.`);
  console.log('Seeding complete! Start the dashboard with: npm start');
}

runSeed().catch(err => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
