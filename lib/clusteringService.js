// lib/clusteringService.js
// Semantic, spatial & city-aware duplicate detection engine for civic complaints

const { db } = require('./database');

/**
 * Tokenize text into normalized significant keywords
 */
function extractCivicTokens(text) {
  const stopwords = new Set([
    'the', 'is', 'at', 'which', 'on', 'a', 'an', 'and', 'or', 'in', 'near', 'to', 'for', 
    'of', 'with', 'from', 'by', 'this', 'that', 'there', 'please', 'complaint', 'issue', 
    'problem', 'sir', 'madam', 'kindly', 'help', 'urgent', 'area', 'ward', 'city', 'day', 'days'
  ]);

  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(word => (word.length >= 2 || /\d/.test(word)) && !stopwords.has(word));
}

/**
 * Calculate Overlap & Jaccard similarity scores between two token arrays
 */
function calculateSimilarity(tokensA, tokensB) {
  if (!tokensA.length || !tokensB.length) return 0;
  const setA = new Set(tokensA);
  const setB = new Set(tokensB);

  let intersection = 0;
  for (const t of setA) {
    if (setB.has(t)) intersection++;
  }

  const minLen = Math.min(setA.size, setB.size);
  const unionLen = new Set([...setA, ...setB]).size;

  const overlap = minLen > 0 ? intersection / minLen : 0;
  const jaccard = unionLen > 0 ? intersection / unionLen : 0;

  return (overlap * 0.7) + (jaccard * 0.3);
}

/**
 * Calculate distance between two lat/lng points in kilometers (Haversine formula)
 */
function haversineDistanceKm(lat1, lon1, lat2, lon2) {
  if (!lat1 || !lon1 || !lat2 || !lon2) return 999;
  const R = 6371;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

/**
 * Find matching active incident cluster for an incoming complaint within the same City
 */
function findDuplicateCluster(incomingText, department, city, locality, ward, lat, lng) {
  // Query open/active clusters in the SAME department AND SAME city
  const stmt = db.prepare(`
    SELECT * FROM incident_clusters 
    WHERE department = ? AND city = ? AND status != 'RESOLVED'
  `);
  const activeClusters = stmt.all(department, city);

  const incomingTokens = extractCivicTokens(incomingText);
  let bestMatch = null;
  let highestScore = 0;

  for (const cluster of activeClusters) {
    // 1. Keyword & semantic similarity check against headline, location, and linked complaints
    const clusterTokens = extractCivicTokens(cluster.headline + ' ' + cluster.location_display);
    const baseSim = calculateSimilarity(incomingTokens, clusterTokens);

    const linkedComplaints = db.prepare(`SELECT raw_text FROM complaints WHERE cluster_id = ? LIMIT 5`).all(cluster.id);
    let maxLinkedSim = baseSim;
    let maxSharedTokens = 0;

    const setIncoming = new Set(incomingTokens);
    for (const t of extractCivicTokens(cluster.headline + ' ' + cluster.location_display)) {
      if (setIncoming.has(t)) maxSharedTokens++;
    }

    for (const lc of linkedComplaints) {
      const lcTokens = extractCivicTokens(lc.raw_text);
      const lcSim = calculateSimilarity(incomingTokens, lcTokens);
      if (lcSim > maxLinkedSim) maxLinkedSim = lcSim;

      let shared = 0;
      for (const t of lcTokens) {
        if (setIncoming.has(t)) shared++;
      }
      if (shared > maxSharedTokens) maxSharedTokens = shared;
    }

    // 2. Spatial & Locality check:
    const isSameLocality = cluster.locality && locality && cluster.locality.toLowerCase() === locality.toLowerCase();
    const isSameWard = cluster.ward.toLowerCase() === ward.toLowerCase();
    const distanceKm = haversineDistanceKm(lat, lng, cluster.latitude, cluster.longitude);
    const isNearby = distanceKm < 1.0; // Within 1 km

    let totalScore = maxLinkedSim;
    if (isNearby) totalScore += 0.2;
    if (isSameLocality) totalScore += 0.15;
    if (isSameWard) totalScore += 0.1;

    // Spatial requirement: Complaints MUST be in the same locality, same ward, or nearby (within 1.2 km)
    // to be considered duplicates! A pothole in Whitefield cannot be a duplicate of a pothole in Koramangala!
    const isSpatiallyRelated = isSameLocality || isSameWard || isNearby;

    if (!isSpatiallyRelated) {
      continue; // Skip clusters in distant localities
    }

    // Within the same locality/ward:
    // Case A: 3+ specific civic tokens match (e.g. "metro", "pillar", "42")
    // Case B: Semantic token overlap >= 0.28
    const isDuplicate = (maxSharedTokens >= 3) || (maxLinkedSim >= 0.28) || (totalScore >= 0.30);

    if (isDuplicate && (totalScore > highestScore || maxSharedTokens >= 3)) {
      highestScore = totalScore;
      bestMatch = { cluster, score: totalScore };
    }
  }

  return bestMatch ? bestMatch.cluster : null;
}

module.exports = {
  findDuplicateCluster,
  extractCivicTokens,
  calculateSimilarity
};
