// lib/locationService.js
// Location extraction & geocoding engine with City & Locality support

const CITIES_REGISTRY = {
  'Bengaluru': {
    center: { lat: 12.9716, lng: 77.5946 },
    localities: {
      'Jayanagar': { lat: 12.9299, lng: 77.5824, ward: 'Ward 12' },
      'Koramangala': { lat: 12.9352, lng: 77.6245, ward: 'Ward 05' },
      'Bannerghatta': { lat: 12.8988, lng: 77.5986, ward: 'Ward 04' },
      'Gandhi Bazaar': { lat: 12.9463, lng: 77.5701, ward: 'Ward 09' },
      'Indiranagar': { lat: 12.9784, lng: 77.6408, ward: 'Ward 03' },
      'Malleshwaram': { lat: 13.0031, lng: 77.5643, ward: 'Ward 02' },
      'Majestic / Central': { lat: 12.9767, lng: 77.5713, ward: 'Ward 01' },
      'Whitefield': { lat: 12.9698, lng: 77.7500, ward: 'Ward 08' },
      'Electronic City': { lat: 12.8452, lng: 77.6602, ward: 'Ward 10' }
    }
  },
  'Mumbai': {
    center: { lat: 19.0760, lng: 72.8777 },
    localities: {
      'Andheri West': { lat: 19.1363, lng: 72.8277, ward: 'Ward K-West' },
      'Bandra West': { lat: 19.0596, lng: 72.8295, ward: 'Ward H-West' },
      'Dadar': { lat: 19.0178, lng: 72.8478, ward: 'Ward G-North' },
      'Colaba': { lat: 18.9067, lng: 72.8147, ward: 'Ward A' },
      'Powai': { lat: 19.1176, lng: 72.9060, ward: 'Ward S' },
      'Borivali': { lat: 19.2307, lng: 72.8567, ward: 'Ward R-Central' }
    }
  },
  'Delhi': {
    center: { lat: 28.6139, lng: 77.2090 },
    localities: {
      'Connaught Place': { lat: 28.6315, lng: 77.2167, ward: 'Zone Central' },
      'Rohini': { lat: 28.7495, lng: 77.0565, ward: 'Zone Rohini' },
      'Saket': { lat: 28.5244, lng: 77.2066, ward: 'Zone South' },
      'Dwarka': { lat: 28.5921, lng: 77.0460, ward: 'Zone Najafgarh' },
      'Karol Bagh': { lat: 28.6514, lng: 77.1907, ward: 'Zone Karol Bagh' }
    }
  },
  'Hyderabad': {
    center: { lat: 17.3850, lng: 78.4867 },
    localities: {
      'Hitec City': { lat: 17.4435, lng: 78.3772, ward: 'Circle 20' },
      'Banjara Hills': { lat: 17.4156, lng: 78.4350, ward: 'Circle 18' },
      'Jubilee Hills': { lat: 17.4319, lng: 78.4073, ward: 'Circle 18' },
      'Gachibowli': { lat: 17.4401, lng: 78.3489, ward: 'Circle 20' },
      'Secunderabad': { lat: 17.4399, lng: 78.4983, ward: 'Circle 30' }
    }
  },
  'Pune': {
    center: { lat: 18.5204, lng: 73.8567 },
    localities: {
      'Kothrud': { lat: 18.5074, lng: 73.8077, ward: 'Ward 12' },
      'Viman Nagar': { lat: 18.5679, lng: 73.9143, ward: 'Ward 03' },
      'Hinjewadi': { lat: 18.5913, lng: 73.7389, ward: 'Ward 08' },
      'Shivaji Nagar': { lat: 18.5314, lng: 73.8446, ward: 'Ward 07' },
      'Baner': { lat: 18.5590, lng: 73.7868, ward: 'Ward 09' }
    }
  }
};

/**
 * Extract City from text or return default
 */
function extractCityFromText(text, userCity = null) {
  if (userCity && CITIES_REGISTRY[userCity]) return userCity;
  if (!text) return 'Bengaluru';

  for (const city of Object.keys(CITIES_REGISTRY)) {
    const regex = new RegExp(`\\b${city}\\b`, 'i');
    if (regex.test(text)) return city;
  }
  return 'Bengaluru';
}

/**
 * Extract Locality from text based on city
 */
function extractLocalityFromText(text, city = 'Bengaluru', userLocality = null) {
  const cityData = CITIES_REGISTRY[city] || CITIES_REGISTRY['Bengaluru'];
  if (userLocality && cityData.localities[userLocality]) return userLocality;

  if (!text) return Object.keys(cityData.localities)[0];

  for (const loc of Object.keys(cityData.localities)) {
    const locClean = loc.replace(/\s*\/.*$/, ''); // e.g. "Majestic / Central" -> "Majestic"
    const regex = new RegExp(`\\b${locClean}\\b`, 'i');
    if (regex.test(text)) return loc;
  }

  return Object.keys(cityData.localities)[0];
}

/**
 * Extract ward from raw text using regex
 */
function extractWardFromText(text, city = 'Bengaluru', locality = null) {
  if (!text) text = '';
  const match = text.match(/\b(?:ward|sector|zone|circle)\s*(?:no\.?|#)?\s*([a-z0-9-]+)\b/i);
  if (match) {
    const raw = match[1].toUpperCase();
    if (/^\d+$/.test(raw)) {
      const num = parseInt(raw, 10);
      return `Ward ${num < 10 ? '0' + num : num}`;
    }
    return `Zone ${raw}`;
  }

  // Fallback to locality's mapped ward
  const cityData = CITIES_REGISTRY[city] || CITIES_REGISTRY['Bengaluru'];
  if (locality && cityData.localities[locality]) {
    return cityData.localities[locality].ward;
  }

  return 'Ward 01';
}

/**
 * Extract landmarks and road names from free-text
 */
function extractLandmarkFromText(text) {
  if (!text) return 'Municipal Street / Area';

  const patterns = [
    /(?:near|opposite|opp|behind|beside|outside|at|in front of)\s+([A-Za-z0-9\s,.'-]{4,40}?)(?=[.,\n;]|\b(?:ward|sector|zone|city|pothole|water|garbage|wire)\b|$)/i,
    /([A-Za-z0-9\s]{3,25}(?:road|street|main|cross|junction|circle|avenue|colony|nagar|layout|block|pillar))/i
  ];

  for (const regex of patterns) {
    const match = text.match(regex);
    if (match && match[1]) {
      const landmark = match[1].trim().replace(/^[,.\s]+|[,.\s]+$/g, '');
      if (landmark.length > 3) return landmark;
    }
  }

  return 'Local Area Landmark';
}

/**
 * Geocode using OpenStreetMap Nominatim with City & Locality context
 */
async function geocodeOSM(landmark, locality, city) {
  const searchQuery = `${landmark}, ${locality}, ${city}, India`;
  const url = `https://nominatim.openstreetmap.org/search?q=${encodeURIComponent(searchQuery)}&format=json&limit=1`;

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 3500);

    const res = await fetch(url, {
      signal: controller.signal,
      headers: {
        'User-Agent': 'CivicComplaintTriageEngine/1.0 (StudentProjectCivicTech)',
        'Accept': 'application/json'
      }
    });
    clearTimeout(timeout);

    if (res.ok) {
      const data = await res.json();
      if (Array.isArray(data) && data.length > 0) {
        return {
          latitude: parseFloat(data[0].lat),
          longitude: parseFloat(data[0].lon),
          displayName: data[0].display_name
        };
      }
    }
  } catch (err) {
    // network fallback
  }

  // Reliable Locality Base Coordinates Fallback
  const cityData = CITIES_REGISTRY[city] || CITIES_REGISTRY['Bengaluru'];
  const locData = cityData.localities[locality] || { lat: cityData.center.lat, lng: cityData.center.lng };

  const jitterLat = ((landmark.length * 17) % 40 - 20) / 10000;
  const jitterLng = ((landmark.length * 29) % 40 - 20) / 10000;

  return {
    latitude: parseFloat((locData.lat + jitterLat).toFixed(6)),
    longitude: parseFloat((locData.lng + jitterLng).toFixed(6)),
    displayName: `${landmark}, ${locality}, ${city}`
  };
}

/**
 * Master Location Resolver
 */
async function resolveLocation(rawText, userCity = null, userLocality = null, userWard = null, userCoords = null) {
  const city = extractCityFromText(rawText, userCity);
  const locality = extractLocalityFromText(rawText, city, userLocality);
  const ward = userWard || extractWardFromText(rawText, city, locality);
  const landmark = extractLandmarkFromText(rawText);

  if (userCoords && userCoords.lat && userCoords.lng) {
    return {
      city,
      locality,
      ward,
      landmark,
      latitude: parseFloat(userCoords.lat),
      longitude: parseFloat(userCoords.lng),
      locationDisplay: `${landmark}, ${locality}, ${city} (${ward})`
    };
  }

  const coords = await geocodeOSM(landmark, locality, city);

  return {
    city,
    locality,
    ward,
    landmark,
    latitude: coords.latitude,
    longitude: coords.longitude,
    locationDisplay: `${landmark}, ${locality}, ${city} (${ward})`
  };
}

module.exports = {
  resolveLocation,
  extractCityFromText,
  extractLocalityFromText,
  extractWardFromText,
  extractLandmarkFromText,
  CITIES_REGISTRY
};
