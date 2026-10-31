// tests/test_triage.js
// Verification Test Suite for PANCHAYAT: Multi-City, SLA Escalation & Officer Directory

const assert = require('node:assert');
const path = require('node:path');
const fs = require('node:fs');

process.env.DB_PATH = path.resolve(__dirname, 'test_panchayat_phase2.sqlite');
if (fs.existsSync(process.env.DB_PATH)) {
  fs.unlinkSync(process.env.DB_PATH);
}

const { db, initDatabase } = require('../lib/database');
const { localCivicHeuristic } = require('../lib/triageEngine');
const { extractCityFromText, extractLocalityFromText } = require('../lib/locationService');
const { processIncomingComplaint } = require('../lib/ingestionService');
const { calculateSlaDeadline, evaluateIncidentSla, fastTrackEscalate, SLA_POLICY_HOURS } = require('../lib/slaService');
const { getOfficers } = require('../lib/officerService');

async function runTestSuite() {
  console.log('=== STARTING PANCHAYAT PHASE 2 VERIFICATION TEST SUITE ===\n');

  // Test 1: Department & Priority Classification
  console.log('[Test 1] Testing Triage Classification & Urgency...');
  const electricalTest = localCivicHeuristic('Live electric wire snapped from transformer pole and sparking on road near school');
  assert.strictEqual(electricalTest.department, 'ELECTRICAL');
  assert.strictEqual(electricalTest.priority, 'CRITICAL');
  assert.strictEqual(electricalTest.priority_score, 4);
  console.log('  ✓ Live wire correctly classified as [CRITICAL] ELECTRICAL');

  // Test 2: City & Locality Extraction
  console.log('\n[Test 2] Testing City & Locality Parsing...');
  const cityBlr = extractCityFromText('Pothole near Jayanagar in Bengaluru');
  assert.strictEqual(cityBlr, 'Bengaluru');
  const locJaya = extractLocalityFromText('Pothole near Jayanagar metro pillar', 'Bengaluru');
  assert.strictEqual(locJaya, 'Jayanagar');
  console.log('  ✓ City & Locality parsed accurately');

  // Test 3: SLA Deadline Calculation (12h Critical, 24h High, 48h Med, 72h Low)
  console.log('\n[Test 3] Testing SLA Policy Windows & Deadlines...');
  assert.strictEqual(SLA_POLICY_HOURS.CRITICAL, 12);
  assert.strictEqual(SLA_POLICY_HOURS.HIGH, 24);
  assert.strictEqual(SLA_POLICY_HOURS.MEDIUM, 48);

  const now = new Date('2026-10-30T10:00:00Z');
  const criticalDeadline = calculateSlaDeadline(now.toISOString(), 'CRITICAL');
  assert.strictEqual(criticalDeadline, '2026-10-30T22:00:00.000Z', 'Critical SLA must be exactly +12 hours');
  console.log('  ✓ SLA Policies verified: Critical (12h), High (24h), Medium (48h)');

  // Test 4: Dynamic SLA Evaluation (On Track, Approaching, Breached)
  console.log('\n[Test 4] Testing SLA Evaluation & Countdown Engine...');
  const mockIncident = {
    created_at: '2026-10-30T00:00:00Z',
    sla_deadline: '2026-10-30T12:00:00Z',
    priority: 'CRITICAL',
    status: 'NEW',
    is_escalated: 0,
    escalation_level: 0
  };

  // Case A: 4 hours after creation -> 8 hours left -> ON_TRACK
  const evalOnTrack = evaluateIncidentSla(mockIncident, new Date('2026-10-30T04:00:00Z'));
  assert.strictEqual(evalOnTrack.sla_status, 'ON_TRACK');
  assert.strictEqual(evalOnTrack.is_breached, false);
  console.log(`  ✓ On-track SLA verified: ${evalOnTrack.time_display}`);

  // Case B: 11 hours after creation -> 1 hour left -> APPROACHING
  const evalApproaching = evaluateIncidentSla(mockIncident, new Date('2026-10-30T11:00:00Z'));
  assert.strictEqual(evalApproaching.sla_status, 'APPROACHING');
  console.log(`  ✓ Approaching SLA verified: ${evalApproaching.time_display}`);

  // Case C: 14 hours after creation -> 2 hours overdue -> BREACHED & ESCALATED
  const evalBreached = evaluateIncidentSla(mockIncident, new Date('2026-10-30T14:00:00Z'));
  assert.strictEqual(evalBreached.sla_status, 'BREACHED');
  assert.strictEqual(evalBreached.is_breached, true);
  assert.strictEqual(evalBreached.is_escalated, 1);
  console.log(`  ✓ Breached SLA verified: ${evalBreached.time_display} [AUTO-ESCALATED]`);

  // Test 5: Ingestion with SLA Initialization
  console.log('\n[Test 5] Testing Ingestion Pipeline with SLA Tracking...');
  const res = await processIncomingComplaint({
    text: 'Live electric cable snapped from transformer pole near Metro Pillar 42 in Jayanagar, Bengaluru',
    userCity: 'Bengaluru',
    userLocality: 'Jayanagar',
    source: 'PORTAL'
  });
  
  const createdRecord = db.prepare(`SELECT * FROM incident_clusters WHERE id = ?`).get(res.clusterId);
  assert.ok(createdRecord.sla_deadline, 'SLA deadline must be set');
  assert.strictEqual(createdRecord.is_escalated, 0);
  console.log(`  ✓ Incident ${createdRecord.id} created with SLA deadline: ${createdRecord.sla_deadline}`);

  // Test 6: Fast-Track Escalation to Commissioner
  console.log('\n[Test 6] Testing Fast-Track Escalation to Municipal Commissioner...');
  const escalated = fastTrackEscalate(createdRecord.id, 'Public hazard near primary school');
  assert.strictEqual(escalated.is_escalated, 1);
  assert.strictEqual(escalated.escalation_level, 2);

  const auditLog = db.prepare(`SELECT * FROM activity_log WHERE incident_id = ? AND action = 'COMMISSIONER_ESCALATED'`).get(createdRecord.id);
  assert.ok(auditLog, 'Commissioner escalation must be logged in activity audit');
  console.log('  ✓ Fast-track Commissioner escalation and audit trail verified');

  // Test 7: Ward Officer Directory
  console.log('\n[Test 7] Testing Ward Officer Directory...');
  const blrOfficers = getOfficers('Bengaluru');
  assert.ok(blrOfficers.length >= 5, 'Must have at least 5 officers seeded for Bengaluru');
  const electricalOfficer = blrOfficers.find(o => o.department === 'ELECTRICAL');
  assert.ok(electricalOfficer, 'Must find electrical officer');
  assert.ok(electricalOfficer.phone.includes('+91'), 'Officer must have valid phone number');
  console.log(`  ✓ Officer Directory verified (${blrOfficers.length} officers in Bengaluru, e.g. ${electricalOfficer.name} - ${electricalOfficer.phone})`);

  // Cleanup
  if (fs.existsSync(process.env.DB_PATH)) {
    fs.unlinkSync(process.env.DB_PATH);
  }

  console.log('\n🎉 ALL 7 PHASE 2 TEST SUITES PASSED WITH ZERO ERRORS!\n');
}

runTestSuite().catch(err => {
  console.error('\n❌ Test failed:', err);
  process.exit(1);
});
