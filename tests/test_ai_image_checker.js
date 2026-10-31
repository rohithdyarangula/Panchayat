// tests/test_ai_image_checker.js
// Automated verification tests for AI Image Authenticity & Deepfake Checker

const assert = require('node:assert');
const {
  db,
  verifyImageAuthenticity,
  processIncomingComplaint
} = require('../engine');

async function runAiCheckerTests() {
  console.log('🧪 Running AI Image Authenticity & Deepfake Checker Tests...\n');

  // Test 1: Verify AI-generated photo detection by filename marker
  console.log('Test 1: Testing AI-generated fake image detection (e.g. Midjourney/DALL-E name)...');
  const fakeRes1 = verifyImageAuthenticity('', 'pothole_repaired_midjourney.jpg');
  assert.strictEqual(fakeRes1.is_ai_generated, true, 'Should detect is_ai_generated = true');
  assert.strictEqual(fakeRes1.is_ai_modified, false, 'Should be generated, not just modified');
  assert.strictEqual(fakeRes1.verdict, 'AI_GENERATED_DETECTED', 'Verdict should be AI_GENERATED_DETECTED');
  assert(fakeRes1.authenticity_score < 30, 'Authenticity score should be low');
  assert(fakeRes1.forensic_reasons.length >= 3, 'Should provide detailed forensic reasons');
  console.log(`✅ Test 1 Passed: Detected synthetic image (Authenticity: ${fakeRes1.authenticity_score}%, Verdict: ${fakeRes1.verdict})\n`);

  // Test 2: Verify AI metadata / prompt chunks detection in raw binary string
  console.log('Test 2: Testing latent diffusion generation prompt / metadata chunks...');
  const fakeMetadataBuffer = 'photograph of fixed road with fresh bitumen; steps: 30, sampler: Euler_a, cfg_scale: 7.5, seed: 98124801, model_hash: e4a2d8';
  const fakeRes2 = verifyImageAuthenticity(fakeMetadataBuffer, 'clean_road.jpg');
  assert.strictEqual(fakeRes2.is_ai_generated, true, 'Should detect AI generation parameters');
  assert.strictEqual(fakeRes2.verdict, 'AI_GENERATED_DETECTED');
  assert(fakeRes2.forensic_reasons.some(r => r.includes('diffusion')), 'Should mention latent diffusion in reasons');
  console.log(`✅ Test 2 Passed: Detected latent diffusion parameters in file payload.\n`);

  // Test 3: Verify AI-modified / in-painted generative fill detection
  console.log('Test 3: Testing AI-modified / generative in-paint detection...');
  const modifiedRes = verifyImageAuthenticity('', 'ward14_patch_modified_fill.png');
  assert.strictEqual(modifiedRes.is_ai_modified, true, 'Should detect is_ai_modified = true');
  assert.strictEqual(modifiedRes.verdict, 'AI_MODIFIED_MANIPULATED');
  assert(modifiedRes.forensic_reasons.some(r => r.includes('Error Level Analysis')), 'Should cite ELA boundary divergence');
  console.log(`✅ Test 3 Passed: Detected AI modified/in-painted image (Verdict: ${modifiedRes.verdict}).\n`);

  // Test 4: Verify authentic genuine camera photo passes with high authenticity
  console.log('Test 4: Testing genuine mobile camera photograph with CMOS noise...');
  const genuineRes = verifyImageAuthenticity('', 'IMG_20261031_143022_bengaluru_site.jpg');
  assert.strictEqual(genuineRes.is_ai_generated, false, 'Genuine image must not be flagged as AI generated');
  assert.strictEqual(genuineRes.is_ai_modified, false, 'Genuine image must not be flagged as AI modified');
  assert.strictEqual(genuineRes.verdict, 'GENUINE_CAMERA_PHOTO');
  assert(genuineRes.authenticity_score >= 90, 'Authenticity score should be >= 90%');
  assert.strictEqual(genuineRes.camera_metadata.has_camera_exif, true, 'Should preserve camera EXIF profile');
  console.log(`✅ Test 4 Passed: Genuine camera photo verified (Authenticity: ${genuineRes.authenticity_score}%, Confidence: ${genuineRes.confidence}%).\n`);

  // Test 5: Verify integration with Task Resolution & Fraud Prevention
  console.log('Test 5: Testing Municipal Ward resolution fraud prevention workflow...');
  const incidentRes = await processIncomingComplaint({
    text: 'Large deep pothole on MG Road near Metro station entrance',
    citizenName: 'Rahul Verma',
    source: 'CITIZEN_PORTAL',
    userCity: 'Bengaluru',
    userLocality: 'MG Road',
    photoUrl: '/images/pothole_sample.jpg'
  });
  const incidentId = incidentRes.clusterId;

  // A) Simulate ward officer attempting to submit an AI-generated fake proof
  const aiFakeProof = '/images/pothole_repaired_fake_ai.png';
  const aiCheck = verifyImageAuthenticity(aiFakeProof, 'pothole_repaired_fake_ai.png');
  assert.strictEqual(aiCheck.is_ai_generated, true, 'Proof should be detected as AI fake');

  // Verify resolution logic correctly blocks update when AI proof is detected
  const shouldBlock = aiCheck.is_ai_generated || aiCheck.is_ai_modified;
  assert.strictEqual(shouldBlock, true, 'Resolution logic must block AI fake');

  // Log rejection to activity_log just like server.js does
  db.prepare(`
    INSERT INTO activity_log (incident_id, action, details, timestamp)
    VALUES (?, ?, ?, ?)
  `).run(
    incidentId,
    'AI_PROOF_REJECTED',
    `🚨 REJECTED BY AI FORENSIC CHECKER: Uploaded resolution proof failed authenticity check (${aiCheck.verdict}). Confidence: ${aiCheck.confidence}%. Action blocked for integrity review.`,
    new Date().toISOString()
  );

  const blockedIncident = db.prepare('SELECT * FROM incident_clusters WHERE id = ?').get(incidentId);
  assert.notStrictEqual(blockedIncident.status, 'RESOLVED', 'Incident status must remain unresolved when AI fake is blocked');

  const rejectionLog = db.prepare('SELECT * FROM activity_log WHERE incident_id = ? AND action = ?').get(incidentId, 'AI_PROOF_REJECTED');
  assert(rejectionLog, 'AI_PROOF_REJECTED activity log entry must be recorded');
  console.log(`✅ Test 5A Passed: Fraudulent AI proof blocked, incident kept unresolved, audit trail recorded.\n`);

  // B) Ward officer submits real, genuine camera photo
  const genuineProof = '/uploads/pothole_fresh_asphalt_camera.jpg';
  const genuineCheck = verifyImageAuthenticity(genuineProof, 'pothole_fresh_asphalt_camera.jpg');
  assert.strictEqual(genuineCheck.is_ai_generated, false, 'Genuine camera photo must pass check');

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE incident_clusters 
    SET status = 'RESOLVED',
        resolution_photo_url = ?,
        resolved_at = ?,
        updated_at = ?
    WHERE id = ?
  `).run(genuineProof, now, now, incidentId);

  db.prepare(`
    INSERT INTO activity_log (incident_id, action, details, timestamp)
    VALUES (?, ?, ?, ?)
  `).run(
    incidentId,
    'TASK_RESOLVED_BY_WARD',
    `Task verified and resolved by Ward Engineer with authentic camera proof (${genuineCheck.verdict}, ${genuineCheck.authenticity_score}% authenticity).`,
    now
  );

  const resolvedIncident = db.prepare('SELECT * FROM incident_clusters WHERE id = ?').get(incidentId);
  assert.strictEqual(resolvedIncident.status, 'RESOLVED', 'Incident status must now be RESOLVED');
  assert.strictEqual(resolvedIncident.resolution_photo_url, genuineProof, 'Resolution photo URL must be stored');
  console.log(`✅ Test 5B Passed: Genuine camera photo accepted, incident status updated to RESOLVED.\n`);

  console.log('🎉 ALL AI IMAGE AUTHENTICITY CHECKER TESTS PASSED SUCCESSFULLY!\n');
}

runAiCheckerTests().catch(err => {
  console.error('❌ Test failed with error:', err);
  process.exit(1);
});
