// lib/ingestionService.js
// Orchestrates ingestion, City & Locality resolution, Gemma 4 triage, and SLA initialization

const { db } = require('./database');
const { resolveLocation } = require('./locationService');
const { triageComplaint, PUBLIC_DISPLAY_NAME } = require('./triageEngine');
const { findDuplicateCluster } = require('./clusteringService');
const { calculateSlaDeadline } = require('./slaService');

let incidentCounter = 100;
let complaintCounter = 1000;

try {
  const lastInc = db.prepare(`SELECT id FROM incident_clusters ORDER BY ROWID DESC LIMIT 1`).get();
  if (lastInc && lastInc.id) {
    const num = parseInt(lastInc.id.replace(/\D/g, ''), 10);
    if (!isNaN(num)) incidentCounter = num;
  }
  const lastCmp = db.prepare(`SELECT id FROM complaints ORDER BY ROWID DESC LIMIT 1`).get();
  if (lastCmp && lastCmp.id) {
    const num = parseInt(lastCmp.id.replace(/\D/g, ''), 10);
    if (!isNaN(num)) complaintCounter = num;
  }
} catch (e) {}

/**
 * Process a single incoming raw complaint
 */
async function processIncomingComplaint({ text, source = 'PORTAL', citizenName = 'Resident', userCity = null, userLocality = null, userWard = null, userCoords = null, status = 'NEW', photoUrl = null }) {
  if (!text || !text.trim()) {
    throw new Error('Complaint text cannot be empty');
  }

  complaintCounter++;
  const complaintId = `CMP-${complaintCounter}`;
  const now = new Date().toISOString();

  // 1. Resolve City, Locality, Ward & Coordinates
  const loc = await resolveLocation(text, userCity, userLocality, userWard, userCoords);

  // 2. Run AI Triage Engine (Gemma 4 in background)
  const triage = await triageComplaint(text);

  // 3. Duplicate Detection Check
  const duplicateCluster = findDuplicateCluster(text, triage.department, loc.city, loc.locality, loc.ward, loc.latitude, loc.longitude);

  let clusterId;
  let isDuplicate = false;

  if (duplicateCluster) {
    clusterId = duplicateCluster.id;
    isDuplicate = true;

    let newPriority = duplicateCluster.priority;
    let newScore = duplicateCluster.priority_score;
    let newReason = duplicateCluster.urgency_reason;
    let newDeadline = duplicateCluster.sla_deadline;

    if (triage.priority_score > duplicateCluster.priority_score) {
      newPriority = triage.priority;
      newScore = triage.priority_score;
      newReason = `${triage.urgency_reason} (Escalated via additional citizen report)`;
      newDeadline = calculateSlaDeadline(duplicateCluster.created_at, newPriority);
    }

    const updateCluster = db.prepare(`
      UPDATE incident_clusters
      SET complaint_count = complaint_count + 1,
          priority = ?,
          priority_score = ?,
          urgency_reason = ?,
          sla_deadline = ?,
          updated_at = ?
      WHERE id = ?
    `);
    updateCluster.run(newPriority, newScore, newReason, newDeadline, now, clusterId);

    // If duplicate has photo and existing cluster didn't have one, update cluster photo
    if (photoUrl && !duplicateCluster.photo_url) {
      try {
        db.prepare(`UPDATE incident_clusters SET photo_url = ? WHERE id = ?`).run(photoUrl, clusterId);
      } catch (e) {}
    }

    const logStmt = db.prepare(`
      INSERT INTO activity_log (incident_id, action, details, timestamp)
      VALUES (?, ?, ?, ?)
    `);
    logStmt.run(
      clusterId,
      'DUPLICATE_MERGED',
      `Citizen report ${complaintId} by ${citizenName} merged into ${clusterId} (Total reports: ${duplicateCluster.complaint_count + 1})`,
      now
    );
  } else {
    incidentCounter++;
    clusterId = `INC-${incidentCounter}`;

    const slaDeadline = calculateSlaDeadline(now, triage.priority);

    const insertCluster = db.prepare(`
      INSERT INTO incident_clusters (
        id, headline, department, priority, priority_score, urgency_reason,
        city, locality, ward, latitude, longitude, location_display, status,
        assigned_officer, assigned_officer_phone, complaint_count, sla_deadline,
        sla_status, is_escalated, escalation_level, photo_url, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'Unassigned', '', 1, ?, 'ON_TRACK', 0, 0, ?, ?, ?)
    `);

    insertCluster.run(
      clusterId,
      triage.headline,
      triage.department,
      triage.priority,
      triage.priority_score,
      triage.urgency_reason,
      loc.city,
      loc.locality,
      loc.ward,
      loc.latitude,
      loc.longitude,
      loc.locationDisplay,
      status || 'NEW',
      slaDeadline,
      photoUrl || null,
      now,
      now
    );

    const logStmt = db.prepare(`
      INSERT INTO activity_log (incident_id, action, details, timestamp)
      VALUES (?, ?, ?, ?)
    `);
    logStmt.run(
      clusterId,
      'AUTO_TRIAGED',
      `Ingested via ${source} reported by ${citizenName}. Classified to ${triage.department} with [${triage.priority}] priority in ${loc.city} (${loc.locality}). SLA deadline set for ${new Date(slaDeadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}.`,
      now
    );
  }

  const insertComplaint = db.prepare(`
    INSERT INTO complaints (id, raw_text, citizen_name, source, city, locality, extracted_location, ward, cluster_id, photo_url, submitted_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  insertComplaint.run(complaintId, text.trim(), citizenName, source, loc.city, loc.locality, loc.landmark, loc.ward, clusterId, photoUrl || null, now);

  return {
    complaintId,
    clusterId,
    isDuplicate,
    department: triage.department,
    priority: triage.priority,
    city: loc.city,
    locality: loc.locality,
    location: loc.locationDisplay,
    photoUrl: photoUrl || null
  };
}

/**
 * Ingest a batch of complaints
 */
async function processBatchComplaints(items) {
  const results = [];
  for (const item of items) {
    const text = typeof item === 'string' ? item : item.text || item.complaint || item.description;
    const city = item.city || null;
    const locality = item.locality || null;
    const ward = item.ward || null;
    const source = item.source || 'CSV_BATCH';
    const citizenName = item.citizen_name || 'Resident';
    const status = item.status || 'NEW';
    const photoUrl = item.photo_url || item.photoUrl || null;

    if (text && text.trim()) {
      const res = await processIncomingComplaint({
        text,
        source,
        citizenName,
        userCity: city,
        userLocality: locality,
        userWard: ward,
        status,
        photoUrl
      });
      results.push(res);
    }
  }
  return results;
}

module.exports = {
  processIncomingComplaint,
  processBatchComplaints
};
