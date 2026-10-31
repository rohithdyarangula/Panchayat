// server.js
// PANCHAYAT - Civic Intelligence & SLA Escalation Platform

const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { parse: parseUrl } = require('node:url');

const envPath = path.resolve(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  for (const line of envContent.split('\n')) {
    const trimmed = line.trim();
    if (trimmed && !trimmed.startsWith('#') && trimmed.includes('=')) {
      const idx = trimmed.indexOf('=');
      const key = trimmed.slice(0, idx).trim();
      const val = trimmed.slice(idx + 1).trim();
      if (!process.env[key]) process.env[key] = val;
    }
  }
}

const {
  db,
  initDatabase,
  processIncomingComplaint,
  processBatchComplaints,
  PUBLIC_DISPLAY_NAME,
  CITIES_REGISTRY,
  evaluateIncidentSla,
  fastTrackEscalate,
  getOfficers,
  verifyImageAuthenticity
} = require('./engine');

const PORT = parseInt(process.env.PORT, 10) || 3000;
const HOST = process.env.HOST || '127.0.0.1';
const PUBLIC_DIR = path.resolve(__dirname, 'public');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

function parseRequestBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 5 * 1024 * 1024) reject(new Error('Payload too large'));
    });
    req.on('end', () => {
      if (!body.trim()) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (e) {
        reject(new Error('Invalid JSON'));
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  const parsed = parseUrl(req.url, true);
  const pathname = parsed.pathname;
  const method = req.method;

  if (method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PATCH, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  try {
    // GET /api/config
    if (pathname === '/api/config' && method === 'GET') {
      return sendJson(res, 200, {
        project_name: 'Panchayat',
        display_model: PUBLIC_DISPLAY_NAME,
        geocoding_provider: 'osm_nominatim',
        cities: Object.keys(CITIES_REGISTRY),
        registry: CITIES_REGISTRY
      });
    }

    // GET /api/officers - Officer Directory
    if (pathname === '/api/officers' && method === 'GET') {
      const { city, dept } = parsed.query;
      const officers = getOfficers(city, dept);
      return sendJson(res, 200, { officers });
    }

    // GET /api/incidents - List incidents with live SLA evaluations
    if (pathname === '/api/incidents' && method === 'GET') {
      const { city, locality, priority, department, ward, status, search, sla_filter } = parsed.query;
      
      let query = `SELECT * FROM incident_clusters WHERE 1=1`;
      const params = [];

      if (city && city !== 'ALL') {
        query += ` AND city = ?`;
        params.push(city);
      }
      if (locality && locality !== 'ALL') {
        query += ` AND locality = ?`;
        params.push(locality);
      }
      if (priority && priority !== 'ALL') {
        query += ` AND priority = ?`;
        params.push(priority.toUpperCase());
      }
      if (department && department !== 'ALL') {
        query += ` AND department = ?`;
        params.push(department.toUpperCase());
      }
      if (ward && ward !== 'ALL') {
        query += ` AND ward = ?`;
        params.push(ward);
      }
      if (status && status !== 'ALL') {
        query += ` AND status = ?`;
        params.push(status.toUpperCase());
      }
      if (search && search.trim()) {
        query += ` AND (headline LIKE ? OR location_display LIKE ? OR id LIKE ? OR locality LIKE ? OR city LIKE ?)`;
        const s = `%${search.trim()}%`;
        params.push(s, s, s, s, s);
      }

      query += ` ORDER BY priority_score DESC, updated_at DESC`;

      let rawIncidents = db.prepare(query).all(...params);

      // Dynamically evaluate SLA countdown and status for each row
      const now = new Date();
      let incidents = rawIncidents.map(inc => {
        const sla = evaluateIncidentSla(inc, now);
        return {
          ...inc,
          sla_info: sla
        };
      });

      // Filter by SLA status if requested (e.g. BREACHED)
      if (sla_filter === 'BREACHED') {
        incidents = incidents.filter(i => i.sla_info.is_breached || i.is_escalated);
      }

      // Compute statistics (scoped to city if selected)
      let statComplaintQuery = `SELECT COUNT(*) as count FROM complaints`;
      let statIncidentQuery = `SELECT COUNT(*) as count FROM incident_clusters`;
      const statParams = [];

      if (city && city !== 'ALL') {
        statComplaintQuery += ` WHERE city = ?`;
        statIncidentQuery += ` WHERE city = ?`;
        statParams.push(city);
      }

      const totalComplaints = db.prepare(statComplaintQuery).get(...statParams).count;
      const totalIncidents = db.prepare(statIncidentQuery).get(...statParams).count;
      const criticalCount = incidents.filter(i => i.priority === 'CRITICAL' && i.status !== 'RESOLVED').length;
      const resolvedCount = incidents.filter(i => i.status === 'RESOLVED').length;
      const duplicatesMerged = Math.max(0, totalComplaints - totalIncidents);
      const slaBreachedCount = incidents.filter(i => i.sla_info.is_breached).length;

      // Category-wise problem classification
      const departments = ['ROADS', 'SANITATION', 'WATER_SEWER', 'ELECTRICAL', 'HEALTH'];
      const categoryBreakdown = {};
      for (const dept of departments) {
        const deptIncidents = incidents.filter(i => i.department === dept);
        const resolved = deptIncidents.filter(i => i.status === 'RESOLVED').length;
        categoryBreakdown[dept] = {
          total: deptIncidents.length,
          active: deptIncidents.length - resolved,
          resolved: resolved,
          percent_resolved: deptIncidents.length > 0 ? Math.round((resolved / deptIncidents.length) * 100) : 0
        };
      }

      return sendJson(res, 200, {
        incidents,
        stats: {
          total_complaints: totalComplaints,
          total_incidents: totalIncidents,
          critical_count: criticalCount,
          resolved_count: resolvedCount,
          duplicates_merged: duplicatesMerged,
          sla_breached_count: slaBreachedCount,
          auto_triaged_pct: totalComplaints > 0 ? 100 : 0,
          category_breakdown: categoryBreakdown
        }
      });
    }

    // GET /api/incidents/:id - Details with complaints, SLA, and activity
    if (pathname.startsWith('/api/incidents/') && method === 'GET') {
      const id = pathname.split('/')[3];
      const incident = db.prepare(`SELECT * FROM incident_clusters WHERE id = ?`).get(id);
      if (!incident) return sendJson(res, 404, { error: 'Incident not found' });

      const slaInfo = evaluateIncidentSla(incident);
      const complaints = db.prepare(`SELECT * FROM complaints WHERE cluster_id = ? ORDER BY submitted_at DESC`).all(id);
      const activity = db.prepare(`SELECT * FROM activity_log WHERE incident_id = ? ORDER BY timestamp DESC`).all(id);

      return sendJson(res, 200, {
        incident: { ...incident, sla_info: slaInfo },
        complaints,
        activity
      });
    }

    // POST /api/incidents/:id/escalate - Fast-track Escalate to Commissioner
    if (pathname.startsWith('/api/incidents/') && pathname.endsWith('/escalate') && method === 'POST') {
      const parts = pathname.split('/');
      const id = parts[2];
      const body = await parseRequestBody(req);

      const updated = fastTrackEscalate(id, body.reason || 'Manual staff high-priority escalation');
      const slaInfo = evaluateIncidentSla(updated);
      return sendJson(res, 200, { success: true, incident: { ...updated, sla_info: slaInfo } });
    }

    // POST /api/verify-image-ai - AI Authenticity & Deepfake Checker
    if (pathname === '/api/verify-image-ai' && method === 'POST') {
      const body = await parseRequestBody(req);
      const inspection = verifyImageAuthenticity(body.image || body.url || '', body.filename || '');
      return sendJson(res, 200, {
        success: true,
        inspection
      });
    }

    // POST /api/upload - Direct Evidence Photo Upload (Base64)
    if (pathname === '/api/upload' && method === 'POST') {
      const body = await parseRequestBody(req);
      if (!body.image) {
        return sendJson(res, 400, { error: 'Missing image data' });
      }

      const uploadDir = path.join(PUBLIC_DIR, 'uploads');
      if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
      }

      const matches = body.image.match(/^data:([A-Za-z-+\/]+);base64,(.+)$/);
      let buffer;
      let ext = '.jpg';
      if (matches && matches.length === 3) {
        const mime = matches[1];
        if (mime.includes('png')) ext = '.png';
        else if (mime.includes('webp')) ext = '.webp';
        buffer = Buffer.from(matches[2], 'base64');
      } else {
        buffer = Buffer.from(body.image, 'base64');
      }

      const filename = `evidence_${Date.now()}_${Math.random().toString(36).substring(2, 7)}${ext}`;
      const filePath = path.join(uploadDir, filename);
      fs.writeFileSync(filePath, buffer);

      const inspection = verifyImageAuthenticity(buffer, body.filename || filename);

      return sendJson(res, 201, {
        success: true,
        url: `/uploads/${filename}`,
        inspection
      });
    }

    // POST /api/incidents/:id/feedback - Citizen Resolution Verification & Contractor Rating
    if (pathname.startsWith('/api/incidents/') && pathname.endsWith('/feedback') && method === 'POST') {
      const parts = pathname.split('/');
      const id = parts[2];
      const body = await parseRequestBody(req);

      const incident = db.prepare(`SELECT * FROM incident_clusters WHERE id = ?`).get(id);
      if (!incident) return sendJson(res, 404, { error: 'Incident not found' });

      const rating = parseInt(body.rating, 10) || 0;
      const feedback = (body.feedback || '').trim();
      const citizenName = body.citizen_name || 'Resident';
      const dispute = Boolean(body.dispute);
      const now = new Date().toISOString();

      if (dispute) {
        // Citizen disputes the resolution -> re-open ticket
        db.prepare(`
          UPDATE incident_clusters 
          SET status = 'IN_PROGRESS',
              reopened_count = reopened_count + 1,
              citizen_feedback = ?,
              updated_at = ?
          WHERE id = ?
        `).run(feedback, now, id);

        db.prepare(`
          INSERT INTO activity_log (incident_id, action, details, timestamp)
          VALUES (?, ?, ?, ?)
        `).run(
          id,
          'CITIZEN_DISPUTE',
          `Citizen ${citizenName} disputed resolution: "${feedback || 'Work incomplete or unsatisfactory'}". Re-opened for ward engineer inspection.`,
          now
        );
      } else {
        // Citizen verified and rated
        db.prepare(`
          UPDATE incident_clusters 
          SET citizen_rating = ?,
              citizen_feedback = ?,
              updated_at = ?
          WHERE id = ?
        `).run(rating, feedback, now, id);

        db.prepare(`
          INSERT INTO activity_log (incident_id, action, details, timestamp)
          VALUES (?, ?, ?, ?)
        `).run(
          id,
          'CITIZEN_RATED',
          `Citizen ${citizenName} verified resolution and rated ${rating}/5 stars. Feedback: "${feedback || 'Satisfied with resolution'}".`,
          now
        );
      }

      const updated = db.prepare(`SELECT * FROM incident_clusters WHERE id = ?`).get(id);
      const slaInfo = evaluateIncidentSla(updated);
      return sendJson(res, 200, {
        success: true,
        incident: { ...updated, sla_info: slaInfo },
        message: dispute ? 'Incident re-opened for department inspection' : 'Thank you! Rating recorded successfully'
      });
    }

    // POST /api/complaints - Ingest Single Complaint
    if (pathname === '/api/complaints' && method === 'POST') {
      const body = await parseRequestBody(req);
      if (!body.text || !body.text.trim()) {
        return sendJson(res, 400, { error: 'Grievance text is required' });
      }

      const result = await processIncomingComplaint({
        text: body.text,
        citizenName: body.citizen_name || body.citizenName || 'Resident',
        source: body.source || 'CITIZEN_PORTAL',
        userCity: body.city || null,
        userLocality: body.locality || null,
        userWard: body.ward || null,
        userCoords: body.coords || null,
        photoUrl: body.photo_url || body.photoUrl || null
      });

      return sendJson(res, 201, {
        success: true,
        data: result
      });
    }

    // POST /api/complaints/batch - Batch Ingestion
    if (pathname === '/api/complaints/batch' && method === 'POST') {
      const body = await parseRequestBody(req);
      if (!body.items || !Array.isArray(body.items)) {
        return sendJson(res, 400, { error: 'Expected items array' });
      }

      const results = await processBatchComplaints(body.items);
      return sendJson(res, 200, {
        success: true,
        count: results.length,
        results
      });
    }

    // POST /api/simulate-stream - Simulates Multi-Channel Inbound Stream (WhatsApp, SMS, IVR, Twitter)
    if (pathname === '/api/simulate-stream' && method === 'POST') {
      const sampleStream = [
        {
          text: "Live high-voltage wire snapped near Metro Pillar 42, 8th Main Jayanagar. Huge sparking hazard on wet road!",
          citizen_name: "Kavitha R (WhatsApp)",
          source: "WHATSAPP_BOT",
          city: "Bengaluru",
          locality: "Jayanagar"
        },
        {
          text: "Massive road crater / pothole on 80ft road Koramangala near Sony World junction. Two 2-wheelers skidded today.",
          citizen_name: "Rahul Verma (SMS)",
          source: "SMS_GATEWAY",
          city: "Bengaluru",
          locality: "Koramangala"
        },
        {
          text: "Garbage collection truck hasn't arrived for 4 days in Gandhi Bazaar market area. Rotten vegetable waste piling up.",
          citizen_name: "Citizen Voice IVR Helpline",
          source: "VOICE_CALL_IVR",
          city: "Bengaluru",
          locality: "Gandhi Bazaar"
        },
        {
          text: "Drinking water main pipe burst near Bannerghatta main road junction, clean water gushing into storm drain.",
          citizen_name: "@SureshCivic (Twitter/X)",
          source: "TWITTER_FEED",
          city: "Bengaluru",
          locality: "Bannerghatta"
        },
        {
          text: "Open drain manhole lid broken on pedestrian walkway outside Majestic central railway station, extreme hazard.",
          citizen_name: "Deepak N (Citizen App)",
          source: "CITIZEN_PORTAL",
          city: "Bengaluru",
          locality: "Majestic / Central"
        }
      ];

      const results = await processBatchComplaints(sampleStream);
      return sendJson(res, 200, {
        success: true,
        message: `Successfully triaged ${results.length} multi-channel complaints across WhatsApp, SMS, IVR & Twitter!`,
        count: results.length,
        results
      });
    }

    // POST /api/incidents/:id/resolve - Municipal Ward Officer marks task completed & uploads resolution photo proof
    if (pathname.startsWith('/api/incidents/') && pathname.endsWith('/resolve') && method === 'POST') {
      const parts = pathname.split('/');
      const id = parts[2];
      const body = await parseRequestBody(req);

      const incident = db.prepare(`SELECT * FROM incident_clusters WHERE id = ?`).get(id);
      if (!incident) return sendJson(res, 404, { error: 'Incident not found' });

      const now = new Date().toISOString();
      const resolutionPhoto = body.resolution_photo_url || null;
      const notes = body.notes || 'Task completed by ward crew';
      const officer = body.officer_name || incident.assigned_officer || 'Ward Engineer';
      const filename = body.filename || (resolutionPhoto ? path.basename(resolutionPhoto) : '');

      // AI Image Authenticity & Deepfake Checker
      const inspection = verifyImageAuthenticity(body.image_data || resolutionPhoto || '', filename);

      if (resolutionPhoto && (inspection.is_ai_generated || inspection.is_ai_modified) && !body.allow_ai_override) {
        db.prepare(`
          INSERT INTO activity_log (incident_id, action, details, timestamp)
          VALUES (?, ?, ?, ?)
        `).run(
          id,
          'AI_PROOF_REJECTED',
          `🚨 REJECTED BY AI FORENSIC CHECKER: Uploaded resolution proof failed authenticity check (${inspection.verdict}). Confidence: ${inspection.confidence}%. Action blocked for integrity review.`,
          now
        );

        return sendJson(res, 422, {
          success: false,
          rejected_by_ai: true,
          error: `Resolution photo rejected: Detected as ${inspection.verdict}. Municipal crew must provide authentic camera evidence from the site.`,
          inspection
        });
      }

      db.prepare(`
        UPDATE incident_clusters 
        SET status = 'RESOLVED',
            resolution_photo_url = ?,
            resolved_at = ?,
            updated_at = ?
        WHERE id = ?
      `).run(resolutionPhoto, now, now, id);

      db.prepare(`
        INSERT INTO activity_log (incident_id, action, details, timestamp)
        VALUES (?, ?, ?, ?)
      `).run(
        id,
        'TASK_RESOLVED_WITH_PROOF',
        `Municipal Officer ${officer} marked task RESOLVED and uploaded verified proof (AI Authenticity: ${inspection.authenticity_score}%). Note: "${notes}". Photo proof delivered to citizen.`,
        now
      );

      const updated = db.prepare(`SELECT * FROM incident_clusters WHERE id = ?`).get(id);
      const slaInfo = evaluateIncidentSla(updated);
      return sendJson(res, 200, {
        success: true,
        incident: { ...updated, sla_info: slaInfo },
        inspection,
        message: 'Task successfully resolved! Resolution photo proof has been verified and delivered to the reporting citizen.'
      });
    }

    // PATCH /api/incidents/:id - Route Officer & Update
    if (pathname.startsWith('/api/incidents/') && method === 'PATCH') {
      const id = pathname.split('/')[3];
      const body = await parseRequestBody(req);

      const incident = db.prepare(`SELECT * FROM incident_clusters WHERE id = ?`).get(id);
      if (!incident) return sendJson(res, 404, { error: 'Incident not found' });

      const updates = [];
      const params = [];

      if (body.status) {
        updates.push('status = ?');
        params.push(body.status.toUpperCase());
      }
      if (body.resolution_photo_url) {
        updates.push('resolution_photo_url = ?');
        params.push(body.resolution_photo_url);
        updates.push('resolved_at = ?');
        params.push(new Date().toISOString());
      }
      if (body.assigned_officer) {
        updates.push('assigned_officer = ?');
        params.push(body.assigned_officer);

        // Fetch officer phone if in directory
        const officerRec = db.prepare(`SELECT phone FROM officers WHERE name LIKE ? LIMIT 1`).get(`%${body.assigned_officer.split('(')[0].trim()}%`);
        if (officerRec) {
          updates.push('assigned_officer_phone = ?');
          params.push(officerRec.phone);
        }
      }
      if (body.priority) {
        updates.push('priority = ?');
        params.push(body.priority.toUpperCase());
        const scores = { CRITICAL: 4, HIGH: 3, MEDIUM: 2, LOW: 1 };
        updates.push('priority_score = ?');
        params.push(scores[body.priority.toUpperCase()] || 2);
      }

      updates.push('updated_at = ?');
      const now = new Date().toISOString();
      params.push(now);
      params.push(id);

      db.prepare(`UPDATE incident_clusters SET ${updates.join(', ')} WHERE id = ?`).run(...params);

      if (body.assigned_officer || body.status || body.notes || body.resolution_photo_url) {
        const detailParts = [];
        if (body.assigned_officer) detailParts.push(`Dispatched to ${body.assigned_officer}`);
        if (body.status) detailParts.push(`Status changed to ${body.status}`);
        if (body.resolution_photo_url) detailParts.push(`Resolution proof photo uploaded by ward crew: ${body.resolution_photo_url}`);
        if (body.notes) detailParts.push(`Note: ${body.notes}`);

        db.prepare(`
          INSERT INTO activity_log (incident_id, action, details, timestamp)
          VALUES (?, ?, ?, ?)
        `).run(id, 'OFFICER_ROUTED', detailParts.join(' | '), now);
      }

      const updated = db.prepare(`SELECT * FROM incident_clusters WHERE id = ?`).get(id);
      const slaInfo = evaluateIncidentSla(updated);
      return sendJson(res, 200, { success: true, incident: { ...updated, sla_info: slaInfo } });
    }

    // STATIC FILE & ROUTE SERVING (With No-Cache Headers for Immediate Live Updates)
    const noCacheHeaders = {
      'Cache-Control': 'no-cache, no-store, must-revalidate',
      'Pragma': 'no-cache',
      'Expires': '0'
    };

    if (pathname === '/' || pathname === '/dashboard' || pathname === '/complaint') {
      const indexPath = path.join(PUBLIC_DIR, 'index.html');
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', ...noCacheHeaders });
      return fs.createReadStream(indexPath).pipe(res);
    }

    let filePath = path.join(PUBLIC_DIR, pathname);

    if (!filePath.startsWith(PUBLIC_DIR)) {
      res.writeHead(403);
      return res.end('Forbidden');
    }

    if (fs.existsSync(filePath) && fs.statSync(filePath).isFile()) {
      const ext = path.extname(filePath).toLowerCase();
      const contentType = MIME_TYPES[ext] || 'application/octet-stream';
      res.writeHead(200, { 'Content-Type': contentType, ...noCacheHeaders });
      return fs.createReadStream(filePath).pipe(res);
    }

    const indexPath = path.join(PUBLIC_DIR, 'index.html');
    if (fs.existsSync(indexPath)) {
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', ...noCacheHeaders });
      return fs.createReadStream(indexPath).pipe(res);
    }

    res.writeHead(404);
    res.end('Not Found');

  } catch (err) {
    console.error('Server error:', err);
    sendJson(res, 500, { error: err.message });
  }
});

server.listen(PORT, HOST, () => {
  console.log(`=======================================================`);
  console.log(` PANCHAYAT - Civic Intelligence & SLA Escalation Engine`);
  console.log(` Web Server running on  : http://${HOST}:${PORT}`);
  console.log(` AI Intelligence Model  : Integrated Neural Core`);
  console.log(` SLA Response Windows   : Critical(12h), High(24h), Med(48h)`);
  console.log(`=======================================================`);
});
