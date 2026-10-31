// lib/slaService.js
// SLA Timers, Countdown & Escalation Engine for Panchayat

const { db } = require('./database');

// Municipal Standard SLA Response Windows (in hours)
const SLA_POLICY_HOURS = {
  CRITICAL: 12, // 12 hours for immediate safety hazards (live wires, manholes, cave-ins)
  HIGH: 24,     // 24 hours for major utility/sanitation failures
  MEDIUM: 48,   // 48 hours for standard municipal repairs
  LOW: 72       // 72 hours for routine maintenance items
};

/**
 * Calculate SLA deadline timestamp from creation time and priority
 */
function calculateSlaDeadline(createdAtIso, priority) {
  const createdDate = new Date(createdAtIso);
  const hours = SLA_POLICY_HOURS[priority] || 48;
  const deadlineDate = new Date(createdDate.getTime() + hours * 60 * 60 * 1000);
  return deadlineDate.toISOString();
}

/**
 * Evaluate SLA status and countdown for an incident
 */
function evaluateIncidentSla(incident, now = new Date()) {
  if (incident.status === 'RESOLVED') {
    return {
      sla_status: 'RESOLVED',
      is_breached: false,
      is_escalated: incident.is_escalated || 0,
      escalation_level: incident.escalation_level || 0,
      time_display: 'Resolved on time',
      percent_elapsed: 100,
      remaining_ms: 0
    };
  }

  const createdTime = new Date(incident.created_at).getTime();
  const deadlineTime = incident.sla_deadline 
    ? new Date(incident.sla_deadline).getTime() 
    : createdTime + (SLA_POLICY_HOURS[incident.priority] || 48) * 3600 * 1000;
  
  const totalWindowMs = deadlineTime - createdTime;
  const elapsedMs = now.getTime() - createdTime;
  const remainingMs = deadlineTime - now.getTime();

  let percentElapsed = Math.min(100, Math.max(0, Math.round((elapsedMs / totalWindowMs) * 100)));

  if (remainingMs <= 0) {
    const overdueMs = Math.abs(remainingMs);
    const overdueHours = Math.floor(overdueMs / (1000 * 60 * 60));
    const overdueMins = Math.floor((overdueMs % (1000 * 60 * 60)) / (1000 * 60));

    // Overdue by > 12 hours qualifies for Commissioner level escalation
    const level = overdueHours >= 12 ? 2 : 1;

    return {
      sla_status: 'BREACHED',
      is_breached: true,
      is_escalated: 1,
      escalation_level: level,
      time_display: `OVERDUE (+${overdueHours}h ${overdueMins}m)`,
      percent_elapsed: 100,
      remaining_ms: remainingMs
    };
  }

  const remainingHours = Math.floor(remainingMs / (1000 * 60 * 60));
  const remainingMins = Math.floor((remainingMs % (1000 * 60 * 60)) / (1000 * 60));

  // Approaching breach if under 4 hours remaining
  if (remainingHours < 4) {
    return {
      sla_status: 'APPROACHING',
      is_breached: false,
      is_escalated: incident.is_escalated || 0,
      escalation_level: incident.escalation_level || 0,
      time_display: `${remainingHours}h ${remainingMins}m left`,
      percent_elapsed: percentElapsed,
      remaining_ms: remainingMs
    };
  }

  return {
    sla_status: 'ON_TRACK',
    is_breached: false,
    is_escalated: incident.is_escalated || 0,
    escalation_level: incident.escalation_level || 0,
    time_display: `${remainingHours}h ${remainingMins}m left`,
    percent_elapsed: percentElapsed,
    remaining_ms: remainingMs
  };
}

/**
 * Fast-track escalate an incident directly to the Municipal Commissioner
 */
function fastTrackEscalate(incidentId, reason = 'Direct staff escalation request') {
  const incident = db.prepare(`SELECT * FROM incident_clusters WHERE id = ?`).get(incidentId);
  if (!incident) throw new Error('Incident not found');

  const now = new Date().toISOString();
  db.prepare(`
    UPDATE incident_clusters 
    SET is_escalated = 1,
        escalation_level = 2,
        updated_at = ?
    WHERE id = ?
  `).run(now, incidentId);

  db.prepare(`
    INSERT INTO activity_log (incident_id, action, details, timestamp)
    VALUES (?, 'COMMISSIONER_ESCALATED', ?, ?)
  `).run(
    incidentId,
    `🚨 High-priority escalation to Municipal Commissioner triggered. Reason: ${reason}`,
    now
  );

  return db.prepare(`SELECT * FROM incident_clusters WHERE id = ?`).get(incidentId);
}

module.exports = {
  SLA_POLICY_HOURS,
  calculateSlaDeadline,
  evaluateIncidentSla,
  fastTrackEscalate
};
