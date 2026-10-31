// lib/triageEngine.js
// Civic Grievance Triage Engine - Integrated with Gemma 4 in the background

const INTERNAL_MODEL_ID = 'gemma-4-it';
const PUBLIC_DISPLAY_NAME = 'Municipal Neural Engine'; // Discreet public naming as requested

/**
 * High-speed local civic heuristic engine
 * Provides robust zero-shot classification & urgency scoring when offline
 */
function localCivicHeuristic(text) {
  const lower = text.toLowerCase();

  // 1. Department Detection with strict word boundaries
  let department = 'ROADS';
  if (/\b(?:wires?|cables?|electrical?|electricity|transformer|electric shock|current|sparks?|sparking|electric meter|blackout|power cut|street\s*lights?|lamp\s*posts?|electric pole|light\s*bulbs?|lighting)\b/i.test(lower)) {
    department = 'ELECTRICAL';
  } else if (/\b(?:sewer|sewers|sewage|drain|drains|drainage|manhole|manholes|water pipe|pipeline|pipe burst|water leak|leakage|waterlogging|tap water|drinking water|contamination)\b/i.test(lower)) {
    department = 'WATER_SEWER';
  } else if (/\b(?:garbage|trash|dump|dumpster|waste|dustbin|debris|litter|dead animal|carcass|rotting)\b/i.test(lower)) {
    department = 'SANITATION';
  } else if (/\b(?:mosquito|mosquitoes|dengue|malaria|clinic|hospital|epidemic|poison|health hazard)\b/i.test(lower)) {
    department = 'HEALTH';
  } else if (/\b(?:pothole|potholes|crater|craters|tar|road|asphalt|divider|speed breaker|footpath|pavement|cave\s*in)\b/i.test(lower)) {
    department = 'ROADS';
  }

  // 2. Priority Scoring (Critical = 4, High = 3, Medium = 2, Low = 1)
  let priority = 'MEDIUM';
  let priority_score = 2;
  let urgency_reason = 'Standard civic service disruption requiring scheduled repair.';

  const criticalKeywords = [
    'spark', 'fire', 'shock', 'electrocution', 'live wire', 'snapped', 'burst', 
    'hospital', 'school', 'emergency', 'accident', 'collapsed', 'danger', 'deadly', 'open manhole'
  ];
  const highKeywords = [
    'overflowing', 'blocked', 'major', 'crater', 'deep', 'flooded', 'stagnant', 
    'stench', 'severe', 'drinking water', 'contamination'
  ];
  const lowKeywords = [
    'flickering', 'dim', 'routine', 'minor', 'cosmetic', 'paint', 'cleaning request', 'slow'
  ];

  if (criticalKeywords.some(kw => lower.includes(kw))) {
    priority = 'CRITICAL';
    priority_score = 4;
    urgency_reason = 'Immediate public safety or life-hazard detected requiring emergency dispatch.';
  } else if (highKeywords.some(kw => lower.includes(kw))) {
    priority = 'HIGH';
    priority_score = 3;
    urgency_reason = 'High-impact civic failure disrupting public health or traffic artery.';
  } else if (lowKeywords.some(kw => lower.includes(kw))) {
    priority = 'LOW';
    priority_score = 1;
    urgency_reason = 'Low-impact maintenance item with minimal safety risk.';
  }

  // 3. Normalized Headline Generator
  let headline = text.slice(0, 75).trim();
  if (text.length > 75) headline += '...';

  if (department === 'ELECTRICAL' && priority === 'CRITICAL') {
    headline = 'Live wire / Electrical hazard reported on roadway';
  } else if (department === 'WATER_SEWER' && /manhole/i.test(lower)) {
    headline = 'Uncovered / damaged manhole posing hazard';
  } else if (department === 'WATER_SEWER' && /burst|leak/i.test(lower)) {
    headline = 'Water main leak / pipe rupture causing waterlogging';
  } else if (department === 'SANITATION' && /overflow|dump/i.test(lower)) {
    headline = 'Heavy garbage accumulation & overflowing waste';
  } else if (department === 'ROADS' && /pothole|crater/i.test(lower)) {
    headline = 'Hazardous road crater / severe pothole damage';
  }

  return {
    headline,
    department,
    priority,
    priority_score,
    urgency_reason,
    internal_model: INTERNAL_MODEL_ID,
    model_used: PUBLIC_DISPLAY_NAME
  };
}

/**
 * Call Gemma 4 via Cloud API (Groq / OpenRouter / Custom Endpoint)
 */
async function callGemma4API(text, apiKey) {
  const model = process.env.GEMMA_MODEL_NAME || INTERNAL_MODEL_ID;
  const prompt = `You are an expert municipal civic grievance triage AI for a city administration.
Classive this citizen complaint:
"${text}"

Respond ONLY with valid JSON in this exact structure:
{
  "headline": "concise 5-10 word title summarizing the issue",
  "department": "ROADS" | "WATER_SEWER" | "SANITATION" | "ELECTRICAL" | "HEALTH",
  "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "priority_score": 4 for CRITICAL, 3 for HIGH, 2 for MEDIUM, 1 for LOW,
  "urgency_reason": "1-sentence operational rationale for the priority"
}`;

  const res = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: model,
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1,
      response_format: { type: 'json_object' }
    })
  });

  if (!res.ok) throw new Error(`AI API error: ${res.statusText}`);
  const data = await res.json();
  const parsed = JSON.parse(data.choices[0].message.content);
  parsed.internal_model = model;
  parsed.model_used = PUBLIC_DISPLAY_NAME;
  return parsed;
}

/**
 * Call Gemma 4 via Local Ollama
 */
async function callGemma4Ollama(text, baseUrl = 'http://127.0.0.1:11434') {
  const model = process.env.GEMMA_MODEL_NAME || INTERNAL_MODEL_ID;
  const prompt = `You are a municipal complaint triage AI. Analyze this grievance:
"${text}"
Output ONLY a JSON object:
{
  "headline": "concise title",
  "department": "ROADS" | "WATER_SEWER" | "SANITATION" | "ELECTRICAL" | "HEALTH",
  "priority": "CRITICAL" | "HIGH" | "MEDIUM" | "LOW",
  "priority_score": 4 | 3 | 2 | 1,
  "urgency_reason": "rationale"
}`;

  const res = await fetch(`${baseUrl}/api/generate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: model,
      prompt: prompt,
      format: 'json',
      stream: false
    })
  });

  if (!res.ok) throw new Error(`Ollama error: ${res.statusText}`);
  const data = await res.json();
  const parsed = JSON.parse(data.response);
  parsed.internal_model = model;
  parsed.model_used = PUBLIC_DISPLAY_NAME;
  return parsed;
}

/**
 * Master Triage Coordinator
 */
async function triageComplaint(text) {
  const provider = (process.env.AI_PROVIDER || 'heuristic').toLowerCase();
  const groqKey = process.env.GROQ_API_KEY;

  if (provider === 'groq' && groqKey) {
    try {
      return await callGemma4API(text, groqKey);
    } catch (err) {
      console.warn('Gemma 4 API fallback to local engine:', err.message);
    }
  } else if (provider === 'ollama') {
    try {
      return await callGemma4Ollama(text, process.env.OLLAMA_BASE_URL);
    } catch (err) {
      console.warn('Ollama Gemma 4 fallback to local engine:', err.message);
    }
  }

  return localCivicHeuristic(text);
}

module.exports = {
  triageComplaint,
  localCivicHeuristic,
  INTERNAL_MODEL_ID,
  PUBLIC_DISPLAY_NAME
};
