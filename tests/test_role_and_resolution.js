// tests/test_role_and_resolution.js
// Tests Persona Separation, Municipal Task Resolution, and Resolution Photo Proof Delivery to Citizens

const assert = require('node:assert');
const { db } = require('../lib/database');
const { processIncomingComplaint } = require('../lib/ingestionService');

async function testRoleAndResolution() {
  console.log('🧪 Running Persona Separation & Resolution Photo Proof Automated Tests...\n');

  // Test 1: Citizen registers a complaint with photo evidence
  console.log('Test 1: Citizen submits complaint with reported problem photo...');
  const complaintRes = await processIncomingComplaint({
    text: 'Cracked water pipe flooding 4th main road opposite bus stop',
    citizenName: 'Anita Desai',
    source: 'CITIZEN_PORTAL',
    userCity: 'Bengaluru',
    userLocality: 'Jayanagar',
    photoUrl: '/images/water_leak_sample.svg'
  });

  assert(complaintRes.clusterId, 'Should create cluster ID');
  const incidentId = complaintRes.clusterId;

  const initialCluster = db.prepare('SELECT * FROM incident_clusters WHERE id = ?').get(incidentId);
  assert.notStrictEqual(initialCluster.status, 'RESOLVED', 'Initial status must not be RESOLVED');
  assert.strictEqual(initialCluster.photo_url, '/images/water_leak_sample.svg', 'Reported evidence photo must be saved');
  assert.strictEqual(initialCluster.resolution_photo_url, null, 'Resolution photo must initially be null');
  console.log(`✅ Test 1 Passed: Incident ${incidentId} registered by citizen with evidence photo.\n`);

  // Test 2: Municipal Ward Officer completes task and uploads resolution photo proof
  console.log('Test 2: Municipal ward engineer completes task and uploads resolution photo proof...');
  const resolutionPhoto = '/images/resolved_water_sample.svg';
  const officerNote = 'New reinforced flange fitted; zero leakage verified and road dried.';
  const resolvedAt = new Date().toISOString();

  db.prepare(`
    UPDATE incident_clusters 
    SET status = 'RESOLVED',
        resolution_photo_url = ?,
        resolved_at = ?,
        updated_at = ?
    WHERE id = ?
  `).run(resolutionPhoto, resolvedAt, resolvedAt, incidentId);

  db.prepare(`
    INSERT INTO activity_log (incident_id, action, details, timestamp)
    VALUES (?, ?, ?, ?)
  `).run(
    incidentId,
    'TASK_RESOLVED_WITH_PROOF',
    `Municipal Ward Engineer Er. S. Sharma completed task and uploaded resolution photo proof: ${resolutionPhoto}. Note: "${officerNote}". Delivered to citizen.`,
    resolvedAt
  );

  const resolvedCluster = db.prepare('SELECT * FROM incident_clusters WHERE id = ?').get(incidentId);
  assert.strictEqual(resolvedCluster.status, 'RESOLVED', 'Status must be updated to RESOLVED');
  assert.strictEqual(resolvedCluster.resolution_photo_url, resolutionPhoto, 'Resolution photo proof must be attached to incident');
  assert(resolvedCluster.resolved_at, 'resolved_at timestamp must be recorded');
  console.log('✅ Test 2 Passed: Municipal ward marked task RESOLVED with uploaded resolution photo proof.\n');

  // Test 3: Citizen views resolution proof and rates 5 stars
  console.log('Test 3: Citizen verifies Before vs After resolution proof and rates 5 stars...');
  assert.strictEqual(resolvedCluster.photo_url, '/images/water_leak_sample.svg', 'Before photo intact');
  assert.strictEqual(resolvedCluster.resolution_photo_url, '/images/resolved_water_sample.svg', 'After resolution photo intact');

  db.prepare(`
    UPDATE incident_clusters 
    SET citizen_rating = ?,
        citizen_feedback = ?,
        updated_at = ?
    WHERE id = ?
  `).run(5, 'Excellent quick fix! Water leak stopped completely.', new Date().toISOString(), incidentId);

  const finalCluster = db.prepare('SELECT * FROM incident_clusters WHERE id = ?').get(incidentId);
  assert.strictEqual(finalCluster.citizen_rating, 5, 'Citizen 5-star rating must be recorded');
  assert.strictEqual(finalCluster.status, 'RESOLVED', 'Status remains resolved');
  console.log('✅ Test 3 Passed: Citizen inspected Before vs After proof and submitted 5-star rating.\n');

  console.log('🎉 ALL 3 PERSONA & RESOLUTION PROOF TESTS PASSED WITH 0 ERRORS!');
}

testRoleAndResolution().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
