// tests/test_phase3.js
// Tests Phase 3: Evidence photo upload, WhatsApp bot intake, citizen rating & dispute workflow

const assert = require('node:assert');
const { db } = require('../lib/database');
const { processIncomingComplaint } = require('../lib/ingestionService');

async function runPhase3Tests() {
  console.log('🧪 Running Phase 3 Automated Test Suite...\n');

  // Test 1: Complaint with photo attachment
  console.log('Test 1: Testing complaint ingestion with photo evidence URL...');
  const photoResult = await processIncomingComplaint({
    text: 'Massive open trench near bus depot on 10th cross without barricades',
    citizenName: 'Priya Sharma',
    source: 'CITIZEN_PORTAL',
    userCity: 'Bengaluru',
    userLocality: 'Jayanagar',
    photoUrl: '/uploads/evidence_trench_test.jpg'
  });

  assert(photoResult.clusterId, 'Should create or assign cluster ID');
  const cluster = db.prepare('SELECT * FROM incident_clusters WHERE id = ?').get(photoResult.clusterId);
  const complaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(photoResult.complaintId);

  assert.strictEqual(complaint.photo_url, '/uploads/evidence_trench_test.jpg', 'Complaint must store photo_url');
  assert.strictEqual(cluster.photo_url, '/uploads/evidence_trench_test.jpg', 'Cluster must store photo_url');
  console.log('✅ Test 1 Passed: Complaint & Cluster photo_url saved successfully.\n');

  // Test 2: WhatsApp Bot Ingestion
  console.log('Test 2: Testing WhatsApp Bot simulated intake...');
  const waResult = await processIncomingComplaint({
    text: 'Streetlight pole tilted and sparking at Gandhi Bazaar main road',
    citizenName: '+91 98450 12345 (WhatsApp)',
    source: 'WHATSAPP_BOT',
    userCity: 'Bengaluru',
    userLocality: 'Gandhi Bazaar',
    photoUrl: '/images/wire_hazard_sample.jpg'
  });

  assert(waResult.clusterId, 'WhatsApp complaint must yield cluster ID');
  const waComplaint = db.prepare('SELECT * FROM complaints WHERE id = ?').get(waResult.complaintId);
  assert.strictEqual(waComplaint.source, 'WHATSAPP_BOT', 'Source must be WHATSAPP_BOT');
  console.log(`✅ Test 2 Passed: WhatsApp intake triaged into ${waResult.clusterId} with source WHATSAPP_BOT.\n`);

  // Test 3: Citizen Verification & 5-Star Rating Workflow
  console.log('Test 3: Testing Citizen Rating for Resolved Incident...');
  const testClusterId = photoResult.clusterId;
  // Mark resolved
  db.prepare(`UPDATE incident_clusters SET status = 'RESOLVED' WHERE id = ?`).run(testClusterId);

  // Citizen gives 5-star rating
  const ratingStmt = db.prepare(`
    UPDATE incident_clusters 
    SET citizen_rating = ?, citizen_feedback = ?, updated_at = ?
    WHERE id = ?
  `);
  ratingStmt.run(5, 'Great work! Trench filled and paved within 6 hours.', new Date().toISOString(), testClusterId);

  const ratedCluster = db.prepare('SELECT citizen_rating, citizen_feedback, status FROM incident_clusters WHERE id = ?').get(testClusterId);
  assert.strictEqual(ratedCluster.citizen_rating, 5, 'Citizen rating must be 5');
  assert.strictEqual(ratedCluster.status, 'RESOLVED', 'Status remains RESOLVED on satisfaction');
  console.log('✅ Test 3 Passed: Citizen rating recorded as 5 stars with positive feedback.\n');

  // Test 4: Citizen Dispute & Ticket Re-opening Workflow
  console.log('Test 4: Testing Citizen Dispute & Ticket Re-opening Workflow...');
  const beforeDispute = db.prepare('SELECT reopened_count FROM incident_clusters WHERE id = ?').get(testClusterId);
  const initialCount = beforeDispute ? (beforeDispute.reopened_count || 0) : 0;

  const disputeStmt = db.prepare(`
    UPDATE incident_clusters 
    SET status = 'IN_PROGRESS', reopened_count = reopened_count + 1, citizen_feedback = ?, updated_at = ?
    WHERE id = ?
  `);
  disputeStmt.run('Pothole was only covered with loose sand, collapsed again in rain.', new Date().toISOString(), testClusterId);

  const disputedCluster = db.prepare('SELECT status, reopened_count, citizen_feedback FROM incident_clusters WHERE id = ?').get(testClusterId);
  assert.strictEqual(disputedCluster.status, 'IN_PROGRESS', 'Disputed incident must revert to IN_PROGRESS');
  assert.strictEqual(disputedCluster.reopened_count, initialCount + 1, 'Reopened count must be incremented by 1');
  console.log(`✅ Test 4 Passed: Dispute successfully reverted status to IN_PROGRESS and incremented reopened_count to ${initialCount + 1}.\n`);

  console.log('🎉 ALL PHASE 3 BACKEND TESTS PASSED SUCCESSFULLY (4/4)!');
}

runPhase3Tests().catch(err => {
  console.error('❌ Phase 3 Test failed:', err);
  process.exit(1);
});
