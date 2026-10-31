// lib/database.js
// SQLite database management using Node.js native DatabaseSync
const { DatabaseSync } = require('node:sqlite');
const path = require('node:path');
const fs = require('node:fs');

const projectRoot = path.resolve(__dirname, '..');
const dbDir = path.join(projectRoot, 'data');
if (!fs.existsSync(dbDir)) {
  fs.mkdirSync(dbDir, { recursive: true });
}

let dbPath = path.join(dbDir, 'civic_triage.sqlite');
if (process.env.DB_PATH) {
  dbPath = path.isAbsolute(process.env.DB_PATH) 
    ? process.env.DB_PATH 
    : path.resolve(projectRoot, process.env.DB_PATH);
}
const db = new DatabaseSync(dbPath);

db.exec('PRAGMA foreign_keys = ON;');

function initDatabase() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS incident_clusters (
      id TEXT PRIMARY KEY,
      headline TEXT NOT NULL,
      department TEXT NOT NULL,
      priority TEXT NOT NULL,
      priority_score INTEGER NOT NULL,
      urgency_reason TEXT,
      city TEXT NOT NULL DEFAULT 'Bengaluru',
      locality TEXT NOT NULL DEFAULT 'Central',
      ward TEXT NOT NULL,
      latitude REAL,
      longitude REAL,
      location_display TEXT NOT NULL,
      status TEXT NOT NULL DEFAULT 'NEW',
      assigned_officer TEXT DEFAULT 'Unassigned',
      assigned_officer_phone TEXT DEFAULT '',
      complaint_count INTEGER DEFAULT 1,
      sla_deadline TEXT,
      sla_status TEXT DEFAULT 'ON_TRACK',
      is_escalated INTEGER DEFAULT 0,
      escalation_level INTEGER DEFAULT 0,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS complaints (
      id TEXT PRIMARY KEY,
      raw_text TEXT NOT NULL,
      citizen_name TEXT DEFAULT 'Resident',
      source TEXT NOT NULL DEFAULT 'PORTAL',
      city TEXT NOT NULL DEFAULT 'Bengaluru',
      locality TEXT NOT NULL DEFAULT 'Central',
      extracted_location TEXT,
      ward TEXT,
      cluster_id TEXT,
      submitted_at TEXT NOT NULL,
      FOREIGN KEY (cluster_id) REFERENCES incident_clusters (id) ON DELETE CASCADE
    );

    CREATE TABLE IF NOT EXISTS officers (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      designation TEXT NOT NULL,
      department TEXT NOT NULL,
      city TEXT NOT NULL,
      locality TEXT NOT NULL,
      phone TEXT NOT NULL,
      email TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS activity_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      incident_id TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT,
      timestamp TEXT NOT NULL
    );

    CREATE INDEX IF NOT EXISTS idx_incident_priority ON incident_clusters (priority_score DESC, updated_at DESC);
    CREATE INDEX IF NOT EXISTS idx_incident_city ON incident_clusters (city);
    CREATE INDEX IF NOT EXISTS idx_incident_locality ON incident_clusters (locality);
    CREATE INDEX IF NOT EXISTS idx_incident_status ON incident_clusters (status);
    CREATE INDEX IF NOT EXISTS idx_incident_dept ON incident_clusters (department);
    CREATE INDEX IF NOT EXISTS idx_incident_escalated ON incident_clusters (is_escalated);
    CREATE INDEX IF NOT EXISTS idx_complaints_cluster ON complaints (cluster_id);
  `);

  // Auto-migrations for Phase 2 & Phase 3 columns
  const migrations = [
    `ALTER TABLE incident_clusters ADD COLUMN sla_deadline TEXT;`,
    `ALTER TABLE incident_clusters ADD COLUMN sla_status TEXT DEFAULT 'ON_TRACK';`,
    `ALTER TABLE incident_clusters ADD COLUMN is_escalated INTEGER DEFAULT 0;`,
    `ALTER TABLE incident_clusters ADD COLUMN escalation_level INTEGER DEFAULT 0;`,
    `ALTER TABLE incident_clusters ADD COLUMN assigned_officer_phone TEXT DEFAULT '';`,
    `ALTER TABLE incident_clusters ADD COLUMN photo_url TEXT;`,
    `ALTER TABLE incident_clusters ADD COLUMN citizen_rating INTEGER DEFAULT 0;`,
    `ALTER TABLE incident_clusters ADD COLUMN citizen_feedback TEXT;`,
    `ALTER TABLE incident_clusters ADD COLUMN reopened_count INTEGER DEFAULT 0;`,
    `ALTER TABLE incident_clusters ADD COLUMN resolution_photo_url TEXT;`,
    `ALTER TABLE incident_clusters ADD COLUMN resolved_at TEXT;`,
    `ALTER TABLE complaints ADD COLUMN citizen_name TEXT DEFAULT 'Resident';`,
    `ALTER TABLE complaints ADD COLUMN photo_url TEXT;`
  ];

  for (const sql of migrations) {
    try { db.exec(sql); } catch (e) {}
  }
}

initDatabase();

module.exports = {
  db,
  initDatabase
};
