// lib/officerService.js
// Municipal Ward Officer Directory & Dispatch Management for Panchayat

const { db } = require('./database');

const DEFAULT_OFFICERS = [
  // Bengaluru
  {
    id: 'OFF-BLR-01',
    name: 'Er. S. Sharma',
    designation: 'Executive Electrical Engineer',
    department: 'ELECTRICAL',
    city: 'Bengaluru',
    locality: 'Jayanagar',
    phone: '+91 98450 11001',
    email: 's.sharma@bbmp.gov.in'
  },
  {
    id: 'OFF-BLR-02',
    name: 'Er. R. Patil',
    designation: 'Assistant Executive Engineer, Water Supply',
    department: 'WATER_SEWER',
    city: 'Bengaluru',
    locality: 'Bannerghatta',
    phone: '+91 98450 22002',
    email: 'r.patil@bwssb.gov.in'
  },
  {
    id: 'OFF-BLR-03',
    name: 'Er. K. Varma',
    designation: 'Assistant Engineer, Roads & Bridges',
    department: 'ROADS',
    city: 'Bengaluru',
    locality: 'Koramangala',
    phone: '+91 98450 33003',
    email: 'k.varma@bbmp.gov.in'
  },
  {
    id: 'OFF-BLR-04',
    name: 'Insp. M. Joseph',
    designation: 'Chief Sanitation Inspector',
    department: 'SANITATION',
    city: 'Bengaluru',
    locality: 'Gandhi Bazaar',
    phone: '+91 98450 44004',
    email: 'm.joseph@bbmp.gov.in'
  },
  {
    id: 'OFF-BLR-05',
    name: 'Dr. A. Rao',
    designation: 'Senior Public Health Officer',
    department: 'HEALTH',
    city: 'Bengaluru',
    locality: 'Majestic / Central',
    phone: '+91 98450 55005',
    email: 'a.rao@bbmp.gov.in'
  },
  {
    id: 'OFF-BLR-06',
    name: 'Rapid Emergency Crew',
    designation: '24/7 Mobile Lineman Van',
    department: 'ELECTRICAL',
    city: 'Bengaluru',
    locality: 'Jayanagar',
    phone: '+91 98450 99999',
    email: 'lineman.emergency@bescom.gov.in'
  },

  // Mumbai
  {
    id: 'OFF-MUM-01',
    name: 'Er. V. Deshmukh',
    designation: 'Stormwater & Drainage AE',
    department: 'WATER_SEWER',
    city: 'Mumbai',
    locality: 'Andheri West',
    phone: '+91 98200 11001',
    email: 'v.deshmukh@mcgm.gov.in'
  },
  {
    id: 'OFF-MUM-02',
    name: 'Insp. S. Sawant',
    designation: 'Solid Waste Management Inspector',
    department: 'SANITATION',
    city: 'Mumbai',
    locality: 'Bandra West',
    phone: '+91 98200 22002',
    email: 's.sawant@mcgm.gov.in'
  },

  // Delhi
  {
    id: 'OFF-DEL-01',
    name: 'Er. R. Kapoor',
    designation: 'PWD Central Zone AE',
    department: 'ROADS',
    city: 'Delhi',
    locality: 'Connaught Place',
    phone: '+91 98110 33003',
    email: 'r.kapoor@pwd.delhi.gov.in'
  },

  // Hyderabad
  {
    id: 'OFF-HYD-01',
    name: 'Er. P. Reddy',
    designation: 'GHMC Power & Streetlights AE',
    department: 'ELECTRICAL',
    city: 'Hyderabad',
    locality: 'Hitec City',
    phone: '+91 98490 44004',
    email: 'p.reddy@ghmc.gov.in'
  }
];

/**
 * Seed officer directory if table is empty
 */
function seedOfficersIfEmpty() {
  const count = db.prepare(`SELECT COUNT(*) as count FROM officers`).get().count;
  if (count === 0) {
    const insert = db.prepare(`
      INSERT INTO officers (id, name, designation, department, city, locality, phone, email)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    for (const off of DEFAULT_OFFICERS) {
      insert.run(off.id, off.name, off.designation, off.department, off.city, off.locality, off.phone, off.email);
    }
  }
}

seedOfficersIfEmpty();

function getOfficers(city = null, dept = null) {
  let query = `SELECT * FROM officers WHERE 1=1`;
  const params = [];
  if (city && city !== 'ALL') {
    query += ` AND city = ?`;
    params.push(city);
  }
  if (dept && dept !== 'ALL') {
    query += ` AND department = ?`;
    params.push(dept);
  }
  query += ` ORDER BY name ASC`;
  return db.prepare(query).all(...params);
}

module.exports = {
  getOfficers,
  seedOfficersIfEmpty,
  DEFAULT_OFFICERS
};
