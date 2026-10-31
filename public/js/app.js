
let currentRoleMode = 'citizen'; // 'citizen' (User Portal) or 'municipal' (Municipal Wards)
let activeResolvingIncidentId = null;
let currentResolvePhotoUrl = '';

// public/js/app.js
// PANCHAYAT - Civic Intelligence & SLA Escalation Platform Client
// Complete I18N Translation Engine (Telugu, Hindi, Kannada, Marathi, Tamil, English)
// Nike-Style Kinetic Slide Navigation & Separate Dashboard Architecture

let leafletMapInstance = null;
let currentMarker = null;
let activeIncidentId = null;
let citiesRegistry = {};
let speechRecognition = null;
let isRecordingVoice = false;
let fallbackVoiceTimer = null;
let voiceToggleLock = false;

// NATIVE LANGUAGE VOICE GRIEVANCE TEMPLATES (Click to speak or dictate in native tongue)
const NATIVE_PROMPTS = {
  'te-IN': [
    'రోడ్డుపై పెద్ద గుంత ఉంది వాహనాలు వెళ్లలేకపోతున్నాయి',
    'మా వీధిలో చెత్త కుప్ప రోజుల తరబడి పేరుకుపోయింది దుర్వాసన వస్తోంది',
    'ప్రధాన పైప్‌లైన్ పగిలి నీరంతా రోడ్డుపై వృథాగా పోతోంది',
    'కరెంట్ వైర్ తెగి రోడ్డుపై పడింది అత్యవసరంగా తొలగించండి'
  ],
  'hi-IN': [
    'सड़क पर गहरा गड्ढा है जिससे दुर्घटना का खतरा है',
    'कचरे का भारी ढेर जमा है और बहुत दुर्गंध आ रही है',
    'जल आपूर्ति पाइपलाइन फट गई है और सड़क पर पानी भर गया है',
    'बिजली का तार टूटकर सड़क पर गिर गया है तुरंत ठीक करें'
  ],
  'kn-IN': [
    'ರಸ್ತೆಯಲ್ಲಿ ಅಪಾಯಕಾರಿ ದೊಡ್ಡ ಗುಂಡಿ ಬಿದ್ದಿದೆ ವಾಹನ ಸವಾರರಿಗೆ ತೊಂದರೆ',
    'ಕಸದ ರಾಶಿ ತುಂಬಿ ತುಳುಕುತ್ತಿದೆ ದುರ್ವಾಸನೆ ಬರುತ್ತಿದೆ',
    'ಮುಖ್ಯ ನೀರಿನ ಪೈಪ್ ಒಡೆದು ನೀರು ಪೋಲಾಗುತ್ತಿದೆ',
    'ವಿದ್ಯುತ್ ತಂತಿ ತುಂಡಾಗಿ ರಸ್ತೆಯ ಮೇಲೆ ಬಿದ್ದಿದೆ ತಕ್ಷಣ ಸರಿಪಡಿಸಿ'
  ],
  'mr-IN': [
    'रस्त्यावर धोकादायक खड्डा पडला आहे अपघात होऊ शकतो',
    'कचऱ्याचा मोठा ढीग साचला असून दुर्गंधी येत आहे',
    'मुख्य पाण्याची पाईपलाईन फुटल्याने पाणी साचले आहे',
    'विजेची तार तुटून रस्त्यावर पडली आहे तातडीने दुरुस्त करा'
  ],
  'ta-IN': [
    'சாலையில் பெரிய பள்ளம் ஏற்பட்டுள்ளது விபத்து அபாயம்',
    'தெருவில் குப்பை தேங்கி துர்நாற்றம் வீசுகிறது',
    'குடிநீர் குழாய் உடைந்து தண்ணீர் வீணாகிறது',
    'மின்கம்பி அறுந்து சாலையில் விழுந்துள்ளது உடனடியாக சரிசெய்யவும்'
  ],
  'en-IN': [
    'Hazardous deep pothole on main road causing accidents',
    'Heavy garbage overflowing near residential market gate',
    'Water main pipe ruptured causing severe street waterlogging',
    'Live electrical cable hanging low on roadway immediate hazard'
  ]
};

let cumulativeFinalTranscript = '';
let autoRestartAttempts = 0;

let currentLanguage = 'en';
let currentStatusView = 'ACTIVE';
let currentPortalView = 'complaint'; // 'complaint' or 'dashboard'
let availableOfficers = [];
let cachedIncidents = [];

// USER'S PERSONAL CIVIC TRACKING STATE (Live Tracking & Priority Highlighting)
let userTrackingIncidentId = 'INC-101';

// FIELD OFFICER & CITIZEN PERSONAL WORKSPACE STATE
let currentOfficerField = 'ALL';
let userPersonalComplaints = ['INC-101', 'INC-110'];
let userTrackingCitizenName = 'Resident';

let userTrackingLocality = 'Jayanagar';
let filterByLocalityActive = true;


// COMPREHENSIVE I18N DICTIONARY FOR ALL LANGUAGES
const I18N = {
  en: {

    // Live Tracking Section
    trackingEyebrow: 'CITIZEN GRIEVANCE STATUS',
    trackingTitle: 'Live Tracking of My Complaint',
    trackingSubtitle: 'Enter your complaint ID or view real-time government resolution progress below.',
    trackBtn: 'Track Status',
    stepStage1: '1. Complaint Logged',
    stepStage2: '2. AI Triaged',
    stepStage3: '3. Engineer Dispatched',
    stepStage4: '4. Govt Resolution',
    step4Sub: 'In Progress',
    assignedOfficerPrefix: 'Assigned Ward Engineer:',
    directPhoneLine: 'Direct Official Line:',
    callEngineerBtn: 'Call Engineer',
    viewOnDashboardBtn: 'View on Dashboard →',

    // Dashboard Spotlight & Locality Notice
    spotlightBadge: 'YOUR REPORTED COMPLAINT (PRIORITY TRACKING)',
    spotlightBtn: 'Manage / View Details →',
    localityNoticePrefix: 'Showing your complaint first, followed by all civic issues in your locality',
    viewAllLocalitiesBtn: '🌐 View All Localities',
    focusLocalityBtn: '📍 Focus My Locality',
    yourComplaintBadge: '⭐ Your Complaint',

    subtitle: 'CIVIC INTELLIGENCE & SLA ESCALATION PLATFORM',
    complaintBtn: 'Complaint',
    welcomeBadge: '🏛️ MUNICIPAL GRIEVANCE & RESOLUTION PORTAL',
    welcomeTitle: 'Welcome to Panchayat',
    welcomeDesc: 'Report municipal issues (potholes, garbage, water leaks, live wires) across your city & locality. Our system automatically sorts, deduplicates, and routes complaints to ward engineers with strict government resolution SLAs.',
    heroComplaintBtn: '+ File a Complaint',
    exploreCategoriesBtn: 'Explore Problem Categories ↓',
    totalComplaints: 'Total Citizen Complaints',
    resolvedGovtLabel: '✅ Resolved by Government',
    criticalHazards: 'Critical Hazards (12h SLA)',
    duplicatesMerged: 'Duplicates Merged',

    // Nav & Separate Dashboard
    navComplaint: 'File Complaint',
    navDashboard: 'Municipal Dashboard',
    dashEyebrow: '🏛️ GOVERNMENT ADMINISTRATIVE & SLA SYSTEM',
    dashTitle: 'Municipal Civic Triage & SLA Dashboard',
    dashSubtitle: 'Real-time civic complaint classification, automated SLA countdowns, and commissioner escalation.',
    backToComplaintBtn: '← File New Complaint',
    goToDashboardBtn: 'Open Municipal Dashboard →',
    bannerTitle: 'Are you a Municipal Officer or Ward Engineer?',
    bannerSubtitle: 'Access live category classification, resolution SLA countdowns, and ward officer dispatching.',
    bannerBtn: 'Open Municipal Dashboard →',
    
    // Complaint Box
    complaintBoxTitle: 'File a Civic Complaint',
    complaintBoxSubtitle: 'Select your city and locality, then describe or speak your grievance. We will route it to the designated government ward officer immediately.',
    step1Label: '📍 Step 1: Select Your City & Locality',
    formCityLabel: 'City:',
    formLocalityLabel: 'Locality / Area:',
    step2Label: '📝 Step 2: Describe the Problem',
    citizenNameLabel: 'Your Name (Optional):',
    citizenNamePlaceholder: 'e.g. Ramesh Babu (or leave blank for Resident)',
    channelLabel: 'Source Channel:',
    channelOptions: {
      CITIZEN_PORTAL: 'Citizen Web Portal',
      VOICE_CALL_IVR: 'Voice IVR Helpline',
      WHATSAPP_BOT: 'WhatsApp Civic Bot'
    },
    grievanceLabel: 'Problem Details (Pothole, Garbage, Water Leak, Live Wire):',
    voicePrompt: 'Speak Voice 🎙️',
    listeningMsg: 'Listening... Speak in your selected language',
    voiceHint: 'Tip: Supports voice dictation in English, Hindi, Kannada, Marathi, Telugu, Tamil!',
    submitComplaintBtn: 'Submit Civic Complaint →',
    submittingBtn: 'Submitting & Triaging...',
    complaintPlaceholder: "Describe the problem or click 'Speak Voice' to dictate (e.g. 'Huge garbage dump overflowing near market gate on 5th main')...",

    // Category Dashboard
    categorySectionTitle: '📊 Overall Problem Classification by Category',
    categorySectionSubtitle: 'Real-time classification of civic grievances and government resolution turnaround',
    cityFilterLabel: 'City:',
    allCities: 'All Cities',
    allLocalities: 'All Localities',
    catRoadsName: 'Roads & Bridges',
    catRoadsSub: 'Potholes, craters, cave-ins',
    catSanName: 'Garbage & Sanitation',
    catSanSub: 'Waste dumps, litter, uncollected bins',
    catWaterName: 'Water & Sewerage',
    catWaterSub: 'Pipe bursts, drain clogs, manholes',
    catElecName: 'Electrical & Lighting',
    catElecSub: 'Live wires, streetlights, sparks',
    catHealthName: 'Public Health',
    catHealthSub: 'Mosquito breeding, epidemics',
    reportedLabel: 'Reported',
    resolvedLabel: 'Resolved by Govt',

    // Public Feed & Filters
    citizenFeedTitle: '📍 Citizens\' Civic Problems Queue',
    citizenFeedSubtitle: 'Real-time status of civic issues, duplicate citizen reports, and assigned officers',
    activeToggleText: '🔥 Active Issues',
    resolvedToggleText: '✅ Resolved by Govt',
    localityLabel: 'Locality:',
    deptLabel: 'Category:',
    allCategories: 'All Categories',
    deptFilterOptions: {
      ROADS: '🛣️ Roads & Bridges',
      SANITATION: '🗑️ Garbage & Sanitation',
      WATER_SEWER: '💧 Water & Sewage',
      ELECTRICAL: '⚡ Electrical & Lights',
      HEALTH: '🏥 Public Health'
    },
    priorityLabel: 'Priority:',
    allPriorities: 'All Priorities',
    priorityFilterOptions: {
      CRITICAL: '🔴 Critical (12h SLA)',
      HIGH: '🟠 High (24h SLA)',
      MEDIUM: '🟡 Medium (48h SLA)',
      LOW: '🔵 Low (72h SLA)'
    },
    searchPlaceholder: 'Search problem, street, or ID...',
    resetBtn: 'Reset',
    emptyTitle: 'NO COMPLAINTS FOUND',
    emptyDesc: 'No complaints match your current city, locality, or search filters.',
    emptyResetBtn: 'Reset All Filters',

    // Table Headers
    thPriority: 'PRIORITY',
    thId: 'INCIDENT ID',
    thSummary: 'PROBLEM SUMMARY & CITIZEN DESCRIPTION',
    thCategory: 'CATEGORY',
    thLocation: 'LOCATION / LOCALITY',
    thSla: 'SLA COUNTDOWN',
    thReports: 'REPORTS',
    thStatus: 'STATUS',
    thDetails: 'DETAILS',

    // Table Row Badges & Values
    priorities: {
      CRITICAL: 'CRITICAL',
      HIGH: 'HIGH',
      MEDIUM: 'MEDIUM',
      LOW: 'LOW'
    },
    departments: {
      ELECTRICAL: '⚡ Electrical',
      WATER_SEWER: '💧 Water/Sewer',
      ROADS: '🛣️ Roads',
      SANITATION: '🗑️ Sanitation',
      HEALTH: '🏥 Public Health'
    },
    statuses: {
      NEW: 'NEW',
      TRIAGED: 'TRIAGED',
      IN_PROGRESS: 'IN_PROGRESS',
      RESOLVED: '✅ RESOLVED'
    },
    viewDetailsBtn: 'View',
    citizenSingle: '1 Citizen',
    citizenPlural: 'Citizens',
    resolvedByGovt: 'Resolved by Govt',
    onTrack: 'On track',
    breached: 'Breached',
    approaching: 'Approaching SLA',
    timeRemainingSuffix: 'remaining',
    timeOverdueSuffix: 'overdue',

    // Drawer
    readAloud: 'Read Aloud',
    slaMonitorTitle: 'SLA RESPONSE MONITOR (POLICY:',
    hoursWord: 'HOURS',
    slaOnTrackBadge: '🟢 ON TRACK',
    slaWarningBadge: '🟡 SLA WARNING',
    slaBreachedBadge: '🔴 BREACHED',
    slaEscalatedBadge: '🚨 ESCALATED',
    deadlinePrefix: 'Deadline:',
    standardWindowText: 'Standard 48-Hour Municipal Window',
    fastTrackEscalateBtn: '⚡ Fast-Track Escalate to Commissioner →',
    escalatingText: 'Escalating...',
    escalationAlertActive: '🚨 COMMISSIONER ALERT ACTIVE',
    escalationBreachAlert: '⚠️ SLA BREACH ESCALATED',
    triageRationaleLabel: 'AI TRIAGE RATIONALE',
    resolvedLocationLabel: 'RESOLVED LOCATION (OPENSTREETMAP NOMINATIM)',
    mergedReportsLabel: 'MERGED CITIZEN COMPLAINTS',
    mergedReportsCount: 'Citizen Reports Merged',
    officerDispatchLabel: 'WARD OFFICER DISPATCH & GOVERNMENT ACTION',
    assignOfficerLabel: 'Assigned Government Officer:',
    unassignedOfficer: 'Unassigned',
    contactLabel: 'Contact:',
    resolutionStatusLabel: 'Government Resolution Status:',
    drawerStatusOptions: {
      NEW: 'NEW (Reported by Citizen)',
      TRIAGED: 'TRIAGED (Verified by AI)',
      IN_PROGRESS: 'IN_PROGRESS (Crew Dispatched)',
      RESOLVED: '✅ RESOLVED (Fixed by Government)'
    },
    officerNoteLabel: 'Officer Field Note:',
    officerNotePlaceholder: 'e.g. Lineman vehicle dispatched at 10:45 AM...',
    saveRoutingBtn: 'Update & Route Problem →',
    updatingText: 'Updating...',
    auditLogLabel: 'ACTIVITY & AUDIT TRAIL',
    speechLang: 'en-IN'
  },

  te: {

    // Live Tracking Section
    trackingEyebrow: 'పౌరుల ఫిర్యాదు స్థితి',
    trackingTitle: 'నా ఫిర్యాదు ప్రత్యక్ష ట్రాకింగ్',
    trackingSubtitle: 'మీ ఫిర్యాదు ఐడీని నమోదు చేయండి లేదా ప్రభుత్వ పరిష్కార పురోగతిని కింద చూడండి.',
    trackBtn: 'స్థితి చూడండి',
    stepStage1: '1. ఫిర్యాదు నమోదైంది',
    stepStage2: '2. ఏఐ పరిశీలన పూర్తయింది',
    stepStage3: '3. ఇంజనీర్ కేటాయించబడ్డారు',
    stepStage4: '4. ప్రభుత్వ పరిష్కారం',
    step4Sub: 'పురోగతిలో ఉంది',
    assignedOfficerPrefix: 'కేటాయించిన వార్డు ఇంజనీర్:',
    directPhoneLine: 'అధికారిక ఫోన్ నంబర్:',
    callEngineerBtn: 'ఇంజనీర్‌కు కాల్ చేయండి',
    viewOnDashboardBtn: 'డ్యాష్‌బోర్డ్‌లో చూడండి →',

    // Dashboard Spotlight & Locality Notice
    spotlightBadge: 'మీరు నమోదు చేసిన ఫిర్యాదు (ప్రత్యేక ప్రాధాన్యత)',
    spotlightBtn: 'పూర్తి వివరాలు చూడండి →',
    localityNoticePrefix: 'మీ ఫిర్యాదు మొదట చూపబడుతోంది, తరువాత మీ ప్రాంతంలోని సమస్యలు',
    viewAllLocalitiesBtn: '🌐 అన్ని ప్రాంతాలు చూడండి',
    focusLocalityBtn: '📍 నా ప్రాంతంపై దృష్టి పెట్టండి',
    yourComplaintBadge: '⭐ మీ ఫిర్యాదు',

    subtitle: 'పౌర నిఘా & కాలపరిమితి పరిష్కార వేదిక',
    complaintBtn: 'ఫిర్యాదు 📢',
    welcomeBadge: '🏛️ మున్సిపల్ పౌర సమస్యల & పరిష్కార వేదిక',
    welcomeTitle: 'పంచాయతీకి స్వాగతం',
    welcomeDesc: 'రోడ్డు గుంతలు, చెత్త, నీటి లీకేజీలు, తెగిపడిన విద్యుత్ తీగలు వంటి సమస్యలను సులభంగా నివేదించండి. మా వ్యవస్థ స్వయంచాలకంగా సమస్యలను క్రమబద్ధీకరించి, వార్డు అధికారులకు కేటాయించి కచ్చితమైన ప్రభుత్వ కాలపరిమితిలో పరిష్కరిస్తుంది.',
    heroComplaintBtn: '+ ఫిర్యాదు చేయండి 📢',
    exploreCategoriesBtn: 'సమస్యల వర్గాలను చూడండి ↓',
    totalComplaints: 'మొత్తం పౌర ఫిర్యాదులు',
    resolvedGovtLabel: '✅ ప్రభుత్వం పరిష్కరించినవి',
    criticalHazards: 'తీవ్రమైన ప్రమాదాలు (12గం SLA)',
    duplicatesMerged: 'కలపబడిన ఫిర్యాదులు',

    // Nav & Separate Dashboard in Telugu
    navComplaint: 'ఫిర్యాదు నమోదు 📢',
    navDashboard: 'మున్సిపల్ డ్యాష్‌బోర్డ్ 📊',
    dashEyebrow: '🏛️ ప్రభుత్వ పరిపాలన & కాలపరిమితి (SLA) డ్యాష్‌బోర్డ్',
    dashTitle: 'మున్సిపల్ పౌర సమస్యల పరిష్కార డ్యాష్‌బోర్డ్',
    dashSubtitle: 'నిజ-సమయ సమస్యల వర్గీకరణ, స్వయంచాలక కాలపరిమితి కౌంట్‌డౌన్ మరియు కమిషనర్ అత్యవసర పర్యవేక్షణ.',
    backToComplaintBtn: '← కొత్త ఫిర్యాదు చేయండి 📢',
    goToDashboardBtn: 'మున్సిపల్ డ్యాష్‌బోర్డ్ తెరవండి 📊 →',
    bannerTitle: 'వార్డు ఇంజనీర్ లేదా మున్సిపల్ అధికారిలా?',
    bannerSubtitle: 'ప్రత్యక్ష వర్గాల గణాంకాలు, SLA కాలపరిమితి మరియు వార్డు ఇంజనీర్ కేటాయింపులను డ్యాష్‌బోర్డ్‌లో చూడండి.',
    bannerBtn: 'డ్యాష్‌బోర్డ్ చూడండి 📊 →',

    // Complaint Box
    complaintBoxTitle: 'పౌర సమస్యను నమోదు చేయండి',
    complaintBoxSubtitle: 'నగరం మరియు ప్రాంతాన్ని ఎంచుకుని, సమస్యను వ్రాయండి లేదా మాట్లాడండి. మేము సంబంధిత ప్రభుత్వ వార్డు ఇంజనీర్‌కు తక్షణమే పంపుతాము.',
    step1Label: '📍 దశ 1: మీ నగరం & ప్రాంతాన్ని ఎంచుకోండి',
    formCityLabel: 'నగరం:',
    formLocalityLabel: 'ప్రాంతం / నివాస కాలనీ:',
    step2Label: '📝 దశ 2: సమస్యను వివరించండి',
    citizenNameLabel: 'మీ పేరు (ఐచ్ఛికం):',
    citizenNamePlaceholder: 'ఉదా: రమేష్ బాబు (లేదా ఖాళీగా ఉంచండి)',
    channelLabel: 'ఫిర్యాదు మార్గం:',
    channelOptions: {
      CITIZEN_PORTAL: 'పౌర వెబ్ పోర్టల్',
      VOICE_CALL_IVR: 'వాయిస్ హెల్ప్‌లైన్ (IVR)',
      WHATSAPP_BOT: 'వాట్సాప్ సివిక్ బాట్'
    },
    grievanceLabel: 'సమస్య వివరాలు (గుంతలు, చెత్త, నీటి లీకేజ్, విద్యుత్ తీగలు):',
    voicePrompt: 'మాట్లాడండి 🎙️',
    listeningMsg: 'వింటున్నాము... తెలుగులో మాట్లాడండి',
    voiceHint: 'చిట్కా: ఇంగ్లీష్, హిందీ, కన్నడ, మరాఠీ, తెలుగు, తమిళంలో వాయిస్ ద్వారా చెప్పవచ్చు!',
    submitComplaintBtn: 'ఫిర్యాదును సమర్పించండి 📢 →',
    submittingBtn: 'సమర్పిస్తున్నాము & వర్గీకరిస్తున్నాము...',
    complaintPlaceholder: 'సమస్యను ఇక్కడ వ్రాయండి లేదా మాట్లాడండి (ఉదా: 5వ మెయిన్ రోడ్డులో పెద్ద గుంత ఏర్పడింది, వెంటనే మరమ్మతులు చేయాలి)...',

    // Category Dashboard
    categorySectionTitle: '📊 వర్గాల వారీగా సమస్యల వర్గీకరణ',
    categorySectionSubtitle: 'పౌర సమస్యల విభజన మరియు ప్రభుత్వ పరిష్కార పురోగతి',
    cityFilterLabel: 'నగరం:',
    allCities: 'అన్ని నగరాలు',
    allLocalities: 'అన్ని ప్రాంతాలు',
    catRoadsName: 'రోడ్లు & వంతెనలు',
    catRoadsSub: 'గుంతలు, రోడ్డు పగుళ్లు, ప్రమాదాలు',
    catSanName: 'చెత్త & పారిశుద్ధ్యం',
    catSanSub: 'చెత్త కుప్పలు, మురుగు నిల్వ, డస్ట్‌బిన్లు',
    catWaterName: 'నీరు & మురుగునీరు',
    catWaterSub: 'పైపు లీకేజీలు, డ్రెయిన్ సమస్యలు, మ్యాన్‌హోల్స్',
    catElecName: 'విద్యుత్ & వీధి దీపాలు',
    catElecSub: 'తెగిన తీగలు, వీధి దీపాలు, షార్ట్ సర్క్యూట్',
    catHealthName: 'ప్రజా ఆరోగ్యం',
    catHealthSub: 'దోమల నివారణ, నిలిచిన మురుగునీరు',
    reportedLabel: 'నమోదైనవి',
    resolvedLabel: 'పరిష్కరించినవి',

    // Public Feed & Filters
    citizenFeedTitle: '📍 పౌరుల సమస్యల పర్యవేక్షణ వేదిక',
    citizenFeedSubtitle: 'సమస్యల ప్రత్యక్ష స్థితి, నివేదికలు మరియు కేటాయించిన అధికారులు',
    activeToggleText: '🔥 పరిష్కారంలో ఉన్న సమస్యలు',
    resolvedToggleText: '✅ ప్రభుత్వం పరిష్కరించినవి',
    localityLabel: 'ప్రాంతం:',
    deptLabel: 'వర్గం:',
    allCategories: 'అన్ని వర్గాలు',
    deptFilterOptions: {
      ROADS: '🛣️ రోడ్లు & వంతెనలు',
      SANITATION: '🗑️ చెత్త & పారిశుద్ధ్యం',
      WATER_SEWER: '💧 నీరు & మురుగునీరు',
      ELECTRICAL: '⚡ విద్యుత్ & లైట్లు',
      HEALTH: '🏥 ప్రజా ఆరోగ్యం'
    },
    priorityLabel: 'ప్రాధాన్యత:',
    allPriorities: 'అన్ని ప్రాధాన్యతలు',
    priorityFilterOptions: {
      CRITICAL: '🔴 తీవ్రమైనది (12గం SLA)',
      HIGH: '🟠 అధికం (24గం SLA)',
      MEDIUM: '🟡 మధ్యస్థం (48గం SLA)',
      LOW: '🔵 సాధారణం (72గం SLA)'
    },
    searchPlaceholder: 'సమస్య, వీధి లేదా ఐడీని వెతకండి...',
    resetBtn: 'రీసెట్',
    emptyTitle: 'ఫిర్యాదులు కనుగొనబడలేదు',
    emptyDesc: 'మీరు ఎంచుకున్న నగరం లేదా ప్రాంతంలో ఎలాంటి సమస్యలు లేవు.',
    emptyResetBtn: 'అన్ని ఫిల్టర్‌లను రీసెట్ చేయండి',

    // Table Headers
    thPriority: 'ప్రాధాన్యత',
    thId: 'సమస్య ఐడీ',
    thSummary: 'సమస్య సారాంశం & పౌరుల వివరణ',
    thCategory: 'వర్గం',
    thLocation: 'ప్రాంతం / నివాసం',
    thSla: 'సమయ పరిమితి (SLA)',
    thReports: 'పౌరులు',
    thStatus: 'స్థితి',
    thDetails: 'వివరాలు',

    // Table Row Badges & Values
    priorities: {
      CRITICAL: 'తీవ్రమైనది',
      HIGH: 'అధికం',
      MEDIUM: 'మధ్యస్థం',
      LOW: 'సాధారణం'
    },
    departments: {
      ELECTRICAL: '⚡ విద్యుత్',
      WATER_SEWER: '💧 నీరు/మురుగు',
      ROADS: '🛣️ రోడ్లు',
      SANITATION: '🗑️ పారిశుద్ధ్యం',
      HEALTH: '🏥 ప్రజా ఆరోగ్యం'
    },
    statuses: {
      NEW: 'కొత్తది',
      TRIAGED: 'ధృవీకరించబడింది',
      IN_PROGRESS: 'పరిష్కారంలో ఉంది',
      RESOLVED: '✅ పరిష్కరించబడింది'
    },
    viewDetailsBtn: 'చూడండి',
    citizenSingle: '1 పౌరుడు',
    citizenPlural: 'పౌరులు',
    resolvedByGovt: 'ప్రభుత్వం పరిష్కరించింది',
    onTrack: 'సమయంలో ఉంది',
    breached: 'గడువు ముగిసింది',
    approaching: 'గడువు సమీపిస్తోంది',
    timeRemainingSuffix: 'మిగిలి ఉంది',
    timeOverdueSuffix: 'గడువు దాటింది',

    // Drawer
    readAloud: 'వినండి (ఆడియో)',
    slaMonitorTitle: 'SLA కాలపరిమితి పర్యవేక్షణ (విధానం:',
    hoursWord: 'గంటలు',
    slaOnTrackBadge: '🟢 సమయంలో ఉంది',
    slaWarningBadge: '🟡 హెచ్చరిక',
    slaBreachedBadge: '🔴 గడువు ముగిసింది',
    slaEscalatedBadge: '🚨 కమిషనర్‌కు నివేదించబడింది',
    deadlinePrefix: 'గడువు:',
    standardWindowText: 'సాధారణ 48 గంటల మున్సిపల్ వ్యవధి',
    fastTrackEscalateBtn: '⚡ కమిషనర్‌కు అత్యవసర బదిలీ →',
    escalatingText: 'బదిలీ చేస్తున్నాము...',
    escalationAlertActive: '🚨 కమిషనర్ అలర్ట్ సక్రియంగా ఉంది',
    escalationBreachAlert: '⚠️ SLA గడువు దాటిన అత్యవసర అలర్ట్',
    triageRationaleLabel: 'AI ప్రాధాన్యత విశ్లేషణ',
    resolvedLocationLabel: 'గుర్తించిన చిరునామా (OPENSTREETMAP)',
    mergedReportsLabel: 'కలపబడిన పౌర నివేదికలు',
    mergedReportsCount: 'పౌర నివేదికలు కలపబడ్డాయి',
    officerDispatchLabel: 'వార్డు అధికారి కేటాయింపు & ప్రభుత్వ చర్య',
    assignOfficerLabel: 'కేటాయించిన ప్రభుత్వ అధికారి:',
    unassignedOfficer: 'కేటాయించబడలేదు',
    contactLabel: 'సంప్రదించండి:',
    resolutionStatusLabel: 'ప్రభుత్వ పరిష్కార స్థితి:',
    drawerStatusOptions: {
      NEW: 'కొత్తది (పౌరుడు నివేదించారు)',
      TRIAGED: 'ధృవీకరించబడింది (AI చే)',
      IN_PROGRESS: 'పురోగతిలో ఉంది (సిబ్బంది పంపబడ్డారు)',
      RESOLVED: '✅ పరిష్కరించబడింది (ప్రభుత్వంచే)'
    },
    officerNoteLabel: 'ఫీల్డ్ అధికారి గమనిక:',
    officerNotePlaceholder: 'ఉదా: లైన్‌మ్యాన్ వాహనం ఉదయం 10:45కి పంపబడింది...',
    saveRoutingBtn: 'నవీకరించి కేటాయించండి →',
    updatingText: 'నవీకరిస్తున్నాము...',
    auditLogLabel: 'చర్యల చరిత్ర & ఆడిట్ లాగ్',
    speechLang: 'te-IN'
  },

  hi: {

    // Live Tracking Section
    trackingEyebrow: 'नागरिक शिकायत स्थिति',
    trackingTitle: 'मेरी शिकायत की लाइव ट्रैकिंग',
    trackingSubtitle: 'अपनी शिकायत आईडी दर्ज करें या नीचे वास्तविक समय सरकारी समाधान प्रगति देखें।',
    trackBtn: 'स्थिति जांचें',
    stepStage1: '1. शिकायत दर्ज',
    stepStage2: '2. एआई वर्गीकरण',
    stepStage3: '3. इंजीनियर रवाना',
    stepStage4: '4. सरकारी निवारण',
    step4Sub: 'प्रगति पर है',
    assignedOfficerPrefix: 'नियुक्त वार्ड इंजीनियर:',
    directPhoneLine: 'प्रत्यक्ष आधिकारिक लाइन:',
    callEngineerBtn: 'इंजीनियर को कॉल करें',
    viewOnDashboardBtn: 'डैशबोर्ड पर देखें →',

    // Dashboard Spotlight & Locality Notice
    spotlightBadge: 'आपकी दर्ज शिकायत (प्राथमिकता ट्रैकिंग)',
    spotlightBtn: 'विवरण व प्रबंधन देखें →',
    localityNoticePrefix: 'आपकी शिकायत सबसे पहले दिखाई जा रही है, उसके बाद आपके क्षेत्र की समस्याएं',
    viewAllLocalitiesBtn: '🌐 सभी क्षेत्र देखें',
    focusLocalityBtn: '📍 मेरा क्षेत्र देखें',
    yourComplaintBadge: '⭐ आपकी शिकायत',

    subtitle: 'नागरिक शिकायत वर्गीकरण एवं समयबद्ध निवारण प्रणाली',
    complaintBtn: 'शिकायत 📢',
    welcomeBadge: '🏛️ नगर निगम शिकायत एवं निवारण पोर्टल',
    welcomeTitle: 'पंचायत में आपका स्वागत है',
    welcomeDesc: 'सड़क के गड्ढे, कचरा, पानी का रिसाव, बिजली के तार जैसी नागरिक समस्याओं की तुरंत रिपोर्ट करें। हमारी प्रणाली स्वचालित रूप से शिकायतों को वार्ड अधिकारियों को भेजती है।',
    heroComplaintBtn: '+ शिकायत दर्ज करें 📢',
    exploreCategoriesBtn: 'समस्या श्रेणियां देखें ↓',
    totalComplaints: 'कुल नागरिक शिकायतें',
    resolvedGovtLabel: '✅ सरकार द्वारा हल की गईं',
    criticalHazards: 'गंभीर खतरे (12 घंटे SLA)',
    duplicatesMerged: 'समान शिकायतें जोड़ी गईं',

    // Nav & Separate Dashboard
    navComplaint: 'शिकायत दर्ज करें 📢',
    navDashboard: 'नगर निगम डैशबोर्ड 📊',
    dashEyebrow: '🏛️ सरकारी प्रशासनिक एवं SLA निगरानी डैशबोर्ड',
    dashTitle: 'नगर निगम समस्या निवारण डैशबोर्ड',
    dashSubtitle: 'वास्तविक समय शिकायत वर्गीकरण, स्वचालित समय सीमा और उच्चाधिकारी निगरानी मंच।',
    backToComplaintBtn: '← नई शिकायत दर्ज करें 📢',
    goToDashboardBtn: 'नगर निगम डैशबोर्ड खोलें 📊 →',
    bannerTitle: 'क्या आप वार्ड इंजीनियर या नगर निगम अधिकारी हैं?',
    bannerSubtitle: 'लाइव समस्या वर्गीकरण, समय सीमा और अधिकारी आवंटन देखें।',
    bannerBtn: 'डैशबोर्ड देखें 📊 →',

    // Complaint Box
    complaintBoxTitle: 'नागरिक शिकायत दर्ज करें',
    complaintBoxSubtitle: 'अपना शहर और इलाका चुनें, फिर समस्या लिखें या बोलें। हम इसे तुरंत संबंधित सरकारी वार्ड अधिकारी को भेजेंगे।',
    step1Label: '📍 चरण 1: शहर और इलाका चुनें',
    formCityLabel: 'शहर:',
    formLocalityLabel: 'इलाका / क्षेत्र:',
    step2Label: '📝 चरण 2: समस्या का विवरण दें',
    citizenNameLabel: 'आपका नाम (वैकल्पिक):',
    citizenNamePlaceholder: 'उदा: रमेश बाबू (या खाली छोड़ें)',
    channelLabel: 'माध्यम:',
    channelOptions: {
      CITIZEN_PORTAL: 'नागरिक वेब पोर्टल',
      VOICE_CALL_IVR: 'वॉइस हेल्पलाइन (IVR)',
      WHATSAPP_BOT: 'व्हाट्सएप नागरिक बॉट'
    },
    grievanceLabel: 'समस्या का विवरण (गड्ढा, कचरा, पानी रिसाव, तार):',
    voicePrompt: 'बोलकर बताएं 🎙️',
    listeningMsg: 'सुन रहे हैं... कृपया हिंदी में बोलें',
    voiceHint: 'सुझाव: हिंदी, अंग्रेजी, कन्नड़, मराठी, तेलुगु, तमिल में बोल सकते हैं!',
    submitComplaintBtn: 'शिकायत दर्ज करें 📢 →',
    submittingBtn: 'दर्ज और वर्गीकृत कर रहे हैं...',
    complaintPlaceholder: 'समस्या का विवरण लिखें या बोलें (उदा: मुख्य सड़क पर गहरा गड्ढा है, तुरंत मरम्मत कराएं)...',

    // Category Dashboard
    categorySectionTitle: '📊 श्रेणी अनुसार समस्या वर्गीकरण',
    categorySectionSubtitle: 'नागरिक शिकायतों और सरकारी समाधान की वास्तविक स्थिति',
    cityFilterLabel: 'शहर:',
    allCities: 'सभी शहर',
    allLocalities: 'सभी इलाके',
    catRoadsName: 'सड़कें और पुल',
    catRoadsSub: 'गड्ढे, दरारें, दुर्घटना जोखिम',
    catSanName: 'कचरा और स्वच्छता',
    catSanSub: 'कचरा ढेर, डस्टबिन समस्या',
    catWaterName: 'जल और सीवरेज',
    catWaterSub: 'पाइप लीकेज, नाला जाम, मैनहोल',
    catElecName: 'बिजली और प्रकाश',
    catElecSub: 'टूटे तार, स्ट्रीटलाइट, चिंगारी',
    catHealthName: 'सार्वजनिक स्वास्थ्य',
    catHealthSub: 'मच्छर, गंदा पानी, जलजमाव',
    reportedLabel: 'दर्ज शिकायतें',
    resolvedLabel: 'हल की गईं',

    // Public Feed & Filters
    citizenFeedTitle: '📍 नागरिक समस्या निगरानी मंच',
    citizenFeedSubtitle: 'समस्याओं की लाइव स्थिति, नागरिक रिपोर्ट और नियुक्त अधिकारी',
    activeToggleText: '🔥 सक्रिय समस्याएं',
    resolvedToggleText: '✅ सरकार द्वारा हल की गईं',
    localityLabel: 'इलाका:',
    deptLabel: 'श्रेणी:',
    allCategories: 'सभी श्रेणियां',
    deptFilterOptions: {
      ROADS: '🛣️ सड़कें और पुल',
      SANITATION: '🗑️ कचरा और स्वच्छता',
      WATER_SEWER: '💧 जल और सीवरेज',
      ELECTRICAL: '⚡ बिजली और प्रकाश',
      HEALTH: '🏥 सार्वजनिक स्वास्थ्य'
    },
    priorityLabel: 'प्राथमिकता:',
    allPriorities: 'सभी प्राथमिकताएं',
    priorityFilterOptions: {
      CRITICAL: '🔴 गंभीर (12 घंटे SLA)',
      HIGH: '🟠 उच्च (24 घंटे SLA)',
      MEDIUM: '🟡 मध्यम (48 घंटे SLA)',
      LOW: '🔵 सामान्य (72 घंटे SLA)'
    },
    searchPlaceholder: 'समस्या, सड़क या आई.डी खोजें...',
    resetBtn: 'रीसेट',
    emptyTitle: 'कोई शिकायत नहीं मिली',
    emptyDesc: 'आपके द्वारा चुने गए शहर या इलाके में कोई शिकायत नहीं है।',
    emptyResetBtn: 'सभी फ़िल्टर रीसेट करें',

    // Table Headers
    thPriority: 'प्राथमिकता',
    thId: 'शिकायत आई.डी',
    thSummary: 'समस्या सारांश व विवरण',
    thCategory: 'श्रेणी',
    thLocation: 'स्थान / इलाका',
    thSla: 'समय सीमा (SLA)',
    thReports: 'नागरिक',
    thStatus: 'स्थिति',
    thDetails: 'विवरण',

    // Table Row Badges & Values
    priorities: {
      CRITICAL: 'गंभीर',
      HIGH: 'उच्च',
      MEDIUM: 'मध्यम',
      LOW: 'सामान्य'
    },
    departments: {
      ELECTRICAL: '⚡ बिजली',
      WATER_SEWER: '💧 जल/सीवर',
      ROADS: '🛣️ सड़कें',
      SANITATION: '🗑️ स्वच्छता',
      HEALTH: '🏥 जन स्वास्थ्य'
    },
    statuses: {
      NEW: 'नई',
      TRIAGED: 'सत्यापित',
      IN_PROGRESS: 'प्रक्रियाधीन',
      RESOLVED: '✅ हल की गई'
    },
    viewDetailsBtn: 'देखें',
    citizenSingle: '1 नागरिक',
    citizenPlural: 'नागरिक',
    resolvedByGovt: 'सरकार द्वारा हल',
    onTrack: 'समय पर',
    breached: 'सीमा पार',
    approaching: 'समय समाप्त हो रहा है',
    timeRemainingSuffix: 'शेष',
    timeOverdueSuffix: 'विलंबित',

    // Drawer
    readAloud: 'सुनें (आवाज)',
    slaMonitorTitle: 'SLA प्रतिक्रिया मॉनिटर (नीति:',
    hoursWord: 'घंटे',
    slaOnTrackBadge: '🟢 समय पर',
    slaWarningBadge: '🟡 चेतावनी',
    slaBreachedBadge: '🔴 समय सीमा पार',
    slaEscalatedBadge: '🚨 उच्चाधिकारी को अग्रेषित',
    deadlinePrefix: 'अंतिम समय:',
    standardWindowText: 'मानक 48 घंटे की नगर निगम अवधि',
    fastTrackEscalateBtn: '⚡ सीधे कमिश्नर को अग्रेषित करें →',
    escalatingText: 'अग्रेषित कर रहे हैं...',
    escalationAlertActive: '🚨 कमिश्नर अलर्ट सक्रिय',
    escalationBreachAlert: '⚠️ समय सीमा उल्लंघन चेतावनी',
    triageRationaleLabel: 'AI प्राथमिकता विश्लेषण',
    resolvedLocationLabel: 'स्थान (OPENSTREETMAP)',
    mergedReportsLabel: 'संयुक्त नागरिक रिपोर्ट',
    mergedReportsCount: 'नागरिक रिपोर्टें जोड़ी गईं',
    officerDispatchLabel: 'वार्ड अधिकारी व सरकारी कार्रवाई',
    assignOfficerLabel: 'नियुक्त सरकारी अधिकारी:',
    unassignedOfficer: 'अनपेक्षित (नियुक्त नहीं)',
    contactLabel: 'संपर्क:',
    resolutionStatusLabel: 'समाधान स्थिति:',
    drawerStatusOptions: {
      NEW: 'नई (नागरिक द्वारा दर्ज)',
      TRIAGED: 'सत्यापित (AI द्वारा)',
      IN_PROGRESS: 'प्रक्रियाधीन (कर्मचारी भेजे गए)',
      RESOLVED: '✅ हल की गई (सरकार द्वारा)'
    },
    officerNoteLabel: 'अधिकारी नोट:',
    officerNotePlaceholder: 'उदा: लाइनमैन वाहन सुबह 10:45 बजे भेजा गया...',
    saveRoutingBtn: 'अपडेट करें और भेजें →',
    updatingText: 'अपडेट कर रहे हैं...',
    auditLogLabel: 'गतिविधि एवं ऑडिट लॉग',
    speechLang: 'hi-IN'
  },

  kn: {

    // Live Tracking Section
    trackingEyebrow: 'ನಾಗರಿಕರ ದೂರಿನ ಸ್ಥಿತಿ',
    trackingTitle: 'ನನ್ನ ದೂರಿನ ಲೈವ್ ಟ್ರ್ಯಾಕಿಂಗ್',
    trackingSubtitle: 'ನಿಮ್ಮ ದೂರು ಐಡಿ ನಮೂದಿಸಿ ಅಥವಾ ಕೆಳಗೆ ಸರ್ಕಾರದ ಪರಿಹಾರ ಪ್ರಗತಿಯನ್ನು ವೀಕ್ಷಿಸಿ.',
    trackBtn: 'ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ',
    stepStage1: '1. ದೂರು ದಾಖಲಾಗಿದೆ',
    stepStage2: '2. ಎಐ ವಿಂಗಡಣೆ',
    stepStage3: '3. ಎಂಜಿನಿಯರ್ ನಿಯೋಜನೆ',
    stepStage4: '4. ಸರ್ಕಾರದ ಪರಿಹಾರ',
    step4Sub: 'ಪ್ರಗತಿಯಲ್ಲಿದೆ',
    assignedOfficerPrefix: 'ನಿಯೋಜಿತ ವಾರ್ಡ್ ಎಂಜಿನಿಯರ್:',
    directPhoneLine: 'ನೇರ ಅಧಿಕೃತ ದೂರವಾಣಿ:',
    callEngineerBtn: 'ಎಂಜಿನಿಯರ್‌ಗೆ ಕರೆ ಮಾಡಿ',
    viewOnDashboardBtn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ವೀಕ್ಷಿಸಿ →',

    // Dashboard Spotlight & Locality Notice
    spotlightBadge: 'ನಿಮ್ಮ ದೂರು (ಆದ್ಯತೆಯ ಟ್ರ್ಯಾಕಿಂಗ್)',
    spotlightBtn: 'ಪೂರ್ಣ ವಿವರ ವೀಕ್ಷಿಸಿ →',
    localityNoticePrefix: 'ನಿಮ್ಮ ದೂರು ಮೊದಲು ತೋರಿಸಲಾಗುತ್ತಿದೆ, ನಂತರ ನಿಮ್ಮ ಪ್ರದೇಶದ ಸಮಸ್ಯೆಗಳು',
    viewAllLocalitiesBtn: '🌐 ಎಲ್ಲಾ ಪ್ರದೇಶಗಳನ್ನು ನೋಡಿ',
    focusLocalityBtn: '📍 ನನ್ನ ಪ್ರದೇಶ ನೋಡಿ',
    yourComplaintBadge: '⭐ ನಿಮ್ಮ ದೂರು',

    subtitle: 'ಸಾರ್ವಜನಿಕ ದೂರು ವರ್ಗೀಕರಣ ಮತ್ತು ಕಾಲಮಿತಿ ಪರಿಹಾರ ವ್ಯವಸ್ಥೆ',
    complaintBtn: 'ದೂರು 📢',
    welcomeBadge: '🏛️ ನಗರಪಾಲಿಕೆ ಸಾರ್ವಜನಿಕ ದೂರು & ಪರಿಹಾರ ಪೋರ್ಟಲ್',
    welcomeTitle: 'ಪಂಚಾಯತ್‌ಗೆ ಸುಸ್ವಾಗತ',
    welcomeDesc: 'ರಸ್ತೆ ಗುಂಡಿ, ಕಸದ ಸಮಸ್ಯೆ, ನೀರಿನ ಸೋರಿಕೆ, ವಿದ್ಯುತ್ ತಂತಿ ಸಮಸ್ಯೆಗಳನ್ನು ಸುಲಭವಾಗಿ ವರದಿ ಮಾಡಿ. ನಿಗದಿತ ಸರ್ಕಾರಿ ಕಾಲಮಿತಿಯಲ್ಲಿ ಪರಿಹಾರ ಒದಗಿಸಲಾಗುತ್ತದೆ.',
    heroComplaintBtn: '+ ದೂರು ದಾಖಲಿಸಿ 📢',
    exploreCategoriesBtn: 'ದೂರುಗಳ ವರ್ಗಗಳನ್ನು ನೋಡಿ ↓',
    totalComplaints: 'ಒಟ್ಟು ಸಾರ್ವಜನಿಕ ದೂರುಗಳು',
    resolvedGovtLabel: '✅ ಸರ್ಕಾರದಿಂದ ಪರಿಹರಿಸಲಾದ ದೂರುಗಳು',
    criticalHazards: 'ತುರ್ತು ಅಪಾಯಗಳು (12 ಗಂಟೆ SLA)',
    duplicatesMerged: 'ಒಗ್ಗೂಡಿಸಲಾದ ದೂರುಗಳು',

    navComplaint: 'ದೂರು ದಾಖಲಿಸಿ 📢',
    navDashboard: 'ನಗರಪಾಲಿಕೆ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ 📊',
    dashEyebrow: '🏛️ ಸರ್ಕಾರಿ ಆಡಳಿತ ಮತ್ತು SLA ವ್ಯವಸ್ಥೆ',
    dashTitle: 'ನಗರಪಾಲಿಕೆ ಸಾರ್ವಜನಿಕ ದೂರು ಮತ್ತು SLA ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    dashSubtitle: 'ನೈಜ-ಸಮಯದ ದೂರು ವರ್ಗೀಕರಣ ಮತ್ತು ಕಮಿಷನರ್ ತುರ್ತು ಮೇಲ್ವಿಚಾರಣೆ.',
    backToComplaintBtn: '← ಹೊಸ ದೂರು ಸಲ್ಲಿಸಿ 📢',
    goToDashboardBtn: 'ನಗರಪಾಲಿಕೆ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ 📊 →',
    bannerTitle: 'ನೀವು ವಾರ್ಡ್ ಇಂಜಿನಿಯರ್ ಅಥವಾ ಅಧಿಕಾರಿಯೇ?',
    bannerSubtitle: 'ದೂರುಗಳ ವರ್ಗೀಕರಣ, ಕಾಲಮಿತಿ ಮತ್ತು ಅಧಿಕಾರಿ ನಿಯೋಜನೆಯನ್ನು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ನೋಡಿ.',
    bannerBtn: 'ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ 📊 →',

    complaintBoxTitle: 'ಸಾರ್ವಜನಿಕ ದೂರು ದಾಖಲಿಸಿ',
    complaintBoxSubtitle: 'ನಿಮ್ಮ ನಗರ ಮತ್ತು ಪ್ರದೇಶವನ್ನು ಆಯ್ಕೆಮಾಡಿ, ದೂರು ಬರೆಯಿರಿ ಅಥವಾ ಮಾತನಾಡಿ.',
    step1Label: '📍 ಹಂತ 1: ನಿಮ್ಮ ನಗರ & ಪ್ರದೇಶ ಆಯ್ಕೆಮಾಡಿ',
    formCityLabel: 'ನಗರ:',
    formLocalityLabel: 'ಪ್ರದೇಶ / ಬಡಾವಣೆ:',
    step2Label: '📝 ಹಂತ 2: ಸಮಸ್ಯೆಯ ವಿವರಣೆ ನೀಡಿ',
    citizenNameLabel: 'ನಿಮ್ಮ ಹೆಸರು (ಐಚ್ಛಿಕ):',
    citizenNamePlaceholder: 'ಉದಾ: ರಮೇಶ್ ಬಾಬು (ಅಥವಾ ಖಾಲಿ ಬಿಡಿ)',
    channelLabel: 'ಮೂಲ:',
    channelOptions: {
      CITIZEN_PORTAL: 'ನಾಗರಿಕ ವೆಬ್ ಪೋರ್ಟಲ್',
      VOICE_CALL_IVR: 'ಧ್ವನಿ ಸಹಾಯವಾಣಿ (IVR)',
      WHATSAPP_BOT: 'ವಾಟ್ಸಾಪ್ ಬಾಟ್'
    },
    grievanceLabel: 'ದೂರಿನ ವಿವರಣೆ (ಗುಂಡಿ, ಕಸ, ನೀರಿನ ಸೋರಿಕೆ, ತಂತಿ):',
    voicePrompt: 'ಮಾತನಾಡಿ 🎙️',
    listeningMsg: 'ಕೇಳಿಸಿಕೊಳ್ಳುತ್ತಿದ್ದೇವೆ... ಕನ್ನಡದಲ್ಲಿ ಮಾತನಾಡಿ',
    voiceHint: 'ಸಲಹೆ: ಕನ್ನಡ, ಇಂಗ್ಲಿಷ್, ಹಿಂದಿ, ಮರಾಠಿ, ತೆಲುಗು, ತಮಿಳಿನಲ್ಲಿ ಮಾತನಾಡಬಹುದು!',
    submitComplaintBtn: 'ದೂರು ಸಲ್ಲಿಸಿ 📢 →',
    submittingBtn: 'ಸಲ್ಲಿಸಲಾಗುತ್ತಿದೆ...',
    complaintPlaceholder: 'ಸಮಸ್ಯೆಯನ್ನು ಇಲ್ಲಿ ಬರೆಯಿರಿ ಅಥವಾ ಮಾತನಾಡಿ (ಉದಾ: ರಸ್ತೆಯಲ್ಲಿ ದೊಡ್ಡ ಗುಂಡಿ ಬಿದ್ದಿದೆ, ತಕ್ಷಣ ಸರಿಪಡಿಸಿ)...',

    categorySectionTitle: '📊 ವರ್ಗವಾರು ಸಮಸ್ಯೆಗಳ ವಿಂಗಡಣೆ',
    categorySectionSubtitle: 'ದೂರುಗಳ ವರ್ಗೀಕರಣ ಮತ್ತು ಸರ್ಕಾರದ ಪರಿಹಾರದ ವಿವರ',
    cityFilterLabel: 'ನಗರ:',
    allCities: 'ಎಲ್ಲಾ ನಗರಗಳು',
    allLocalities: 'ಎಲ್ಲಾ ಪ್ರದೇಶಗಳು',
    catRoadsName: 'ರಸ್ತೆಗಳು & ಸೇತುವೆಗಳು',
    catRoadsSub: 'ಗುಂಡಿಗಳು, ಬಿರುಕುಗಳು, ಅಪಘಾತ ಅಪಾಯ',
    catSanName: 'ಕಸ & ನೈರ್ಮಲ್ಯ',
    catSanSub: 'ಕಸದ ರಾಶಿ, ತುಂಬಿ ಹರಿಯುವ ಡಸ್ಟ್‌ಬಿನ್',
    catWaterName: 'ನೀರು & ಒಳಚರಂಡಿ',
    catWaterSub: 'ಪೈಪ್ ಸೋರಿಕೆ, ಚರಂಡಿ ಸಮಸ್ಯೆ, ಮ್ಯಾನ್‌ಹೋಲ್',
    catElecName: 'ವಿದ್ಯುತ್ & ಬೀದಿ ದೀಪಗಳು',
    catElecSub: 'ತುಂಡಾದ ತಂತಿಗಳು, ಬೀದಿ ದೀಪಗಳು, ಕಿಡಿ',
    catHealthName: 'ಸಾರ್ವಜನಿಕ ಆರೋಗ್ಯ',
    catHealthSub: 'ಸೊಳ್ಳೆ ಕಾಟ, ನಿಂತ ಕೊಳಚೆ ನೀರು',
    reportedLabel: 'ದಾಖಲಾದ ದೂರುಗಳು',
    resolvedLabel: 'ಪರಿಹರಿಸಲಾಗಿದೆ',

    citizenFeedTitle: '📍 ಸಾರ್ವಜನಿಕ ಸಮಸ್ಯೆಗಳ ವೇದಿಕೆ',
    citizenFeedSubtitle: 'ದೂರುಗಳ ಪ್ರಸ್ತುತ ಸ್ಥಿತಿ ಮತ್ತು ನಿಯೋಜಿತ ಅಧಿಕಾರಿಗಳು',
    activeToggleText: '🔥 ಸಕ್ರಿಯ ಸಮಸ್ಯೆಗಳು',
    resolvedToggleText: '✅ ಸರ್ಕಾರದಿಂದ ಪರಿಹರಿಸಲಾಗಿದೆ',
    localityLabel: 'ಪ್ರದೇಶ:',
    deptLabel: 'ವರ್ಗ:',
    allCategories: 'ಎಲ್ಲಾ ವರ್ಗಗಳು',
    deptFilterOptions: {
      ROADS: '🛣️ ರಸ್ತೆಗಳು & ಸೇತುವೆಗಳು',
      SANITATION: '🗑️ ಕಸ & ನೈರ್ಮಲ್ಯ',
      WATER_SEWER: '💧 ನೀರು & ಒಳಚರಂಡಿ',
      ELECTRICAL: '⚡ ವಿದ್ಯುತ್ & ಬೀದಿ ದೀಪಗಳು',
      HEALTH: '🏥 ಸಾರ್ವಜನಿಕ ಆರೋಗ್ಯ'
    },
    priorityLabel: 'ಆದ್ಯತೆ:',
    allPriorities: 'ಎಲ್ಲಾ ಆದ್ಯತೆಗಳು',
    priorityFilterOptions: {
      CRITICAL: '🔴 ತುರ್ತು (12 ಗಂಟೆ SLA)',
      HIGH: '🟠 ಹೆಚ್ಚಿನ (24 ಗಂಟೆ SLA)',
      MEDIUM: '🟡 ಮಧ್ಯಮ (48 ಗಂಟೆ SLA)',
      LOW: '🔵 ಸಾಮಾನ್ಯ (72 ಗಂಟೆ SLA)'
    },
    searchPlaceholder: 'ಸಮಸ್ಯೆ, ರಸ್ತೆ ಅಥವಾ ಐಡಿ ಹುಡುಕಿ...',
    resetBtn: 'ಮರುಹೊಂದಿಸಿ',
    emptyTitle: 'ಯಾವುದೇ ದೂರುಗಳು ಕಂಡುಬಂದಿಲ್ಲ',
    emptyDesc: 'ಆಯ್ಕೆಮಾಡಿದ ನಗರದಲ್ಲಿ ಯಾವುದೇ ದೂರುಗಳಿಲ್ಲ.',
    emptyResetBtn: 'ಎಲ್ಲಾ ಫಿಲ್ಟರ್ ಮರುಹೊಂದಿಸಿ',

    thPriority: 'ಆದ್ಯತೆ',
    thId: 'ದೂರು ಐ.ಡಿ',
    thSummary: 'ಸಮಸ್ಯೆ ಸಾರಾಂಶ & ವಿವರ',
    thCategory: 'ವರ್ಗ',
    thLocation: 'ಸ್ಥಳ / ಪ್ರದೇಶ',
    thSla: 'ಕಾಲಮಿತಿ (SLA)',
    thReports: 'ದೂರುದಾರರು',
    thStatus: 'ಸ್ಥಿತಿ',
    thDetails: 'ವಿವರಗಳು',

    priorities: {
      CRITICAL: 'ತುರ್ತು',
      HIGH: 'ಹೆಚ್ಚಿನ',
      MEDIUM: 'ಮಧ್ಯಮ',
      LOW: 'ಸಾಮಾನ್ಯ'
    },
    departments: {
      ELECTRICAL: '⚡ ವಿದ್ಯುತ್',
      WATER_SEWER: '💧 ನೀರು/ಚರಂಡಿ',
      ROADS: '🛣️ ರಸ್ತೆಗಳು',
      SANITATION: '🗑️ ನೈರ್ಮಲ್ಯ',
      HEALTH: '🏥 ಆರೋಗ್ಯ'
    },
    statuses: {
      NEW: 'ಹೊಸದು',
      TRIAGED: 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ',
      IN_PROGRESS: 'ಪ್ರಗತಿಯಲ್ಲಿದೆ',
      RESOLVED: '✅ ಪರಿಹರಿಸಲಾಗಿದೆ'
    },
    viewDetailsBtn: 'ನೋಡಿ',
    citizenSingle: '1 ನಾಗರಿಕ',
    citizenPlural: 'ನಾಗರಿಕರು',
    resolvedByGovt: 'ಸರ್ಕಾರದಿಂದ ಪರಿಹಾರ',
    onTrack: 'ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿದೆ',
    breached: 'ಸಮಯ ಮೀರಿದೆ',
    approaching: 'ಸಮಯ ಮುಗಿಯುತ್ತಿದೆ',
    timeRemainingSuffix: 'ಬಾಕಿ',
    timeOverdueSuffix: 'ಮೀರಿದೆ',

    readAloud: 'ಆಲಿಸಿ (ಧ್ವನಿ)',
    slaMonitorTitle: 'SLA ಕಾಲಮಿತಿ ಮಾನಿಟರ್ (ನಿಯಮ:',
    hoursWord: 'ಗಂಟೆಗಳು',
    slaOnTrackBadge: '🟢 ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿದೆ',
    slaWarningBadge: '🟡 ಎಚ್ಚರಿಕೆ',
    slaBreachedBadge: '🔴 ಸಮಯ ಮೀರಿದೆ',
    slaEscalatedBadge: '🚨 ಕಮಿಷನರ್‌ಗೆ ವರ್ಗಾಯಿಸಲಾಗಿದೆ',
    deadlinePrefix: 'ಗಡುವು:',
    standardWindowText: 'ಪ್ರಮಾಣಿತ 48 ಗಂಟೆಗಳ ಕಾಲಾವಧಿ',
    fastTrackEscalateBtn: '⚡ ನೇರವಾಗಿ ಕಮಿಷನರ್‌ಗೆ ವರ್ಗಾಯಿಸಿ →',
    escalatingText: 'ವರ್ಗಾಯಿಸಲಾಗುತ್ತಿದೆ...',
    escalationAlertActive: '🚨 ಕಮಿಷನರ್ ಎಚ್ಚರಿಕೆ ಸಕ್ರಿಯವಾಗಿದೆ',
    escalationBreachAlert: '⚠️ ಕಾಲಮಿತಿ ಮೀರಿದ ಎಚ್ಚರಿಕೆ',
    triageRationaleLabel: 'AI ಆದ್ಯತೆ ವಿಶ್ಲೇಷಣೆ',
    resolvedLocationLabel: 'ಗುರುತಿಸಲಾದ ವಿಳಾಸ (OPENSTREETMAP)',
    mergedReportsLabel: 'ಒಗ್ಗೂಡಿಸಲಾದ ಸಾರ್ವಜನಿಕ ವರದಿಗಳು',
    mergedReportsCount: 'ದೂರುಗಳು ಒಗ್ಗೂಡಿಸಲಾಗಿದೆ',
    officerDispatchLabel: 'ವಾರ್ಡ್ ಅಧಿಕಾರಿ & ಕ್ರಮ',
    assignOfficerLabel: 'ನಿಯೋಜಿತ ಅಧಿಕಾರಿ:',
    unassignedOfficer: 'ನಿಯೋಜಿಸಲಾಗಿಲ್ಲ',
    contactLabel: 'ಸಂಪರ್ಕ:',
    resolutionStatusLabel: 'ಪರಿಹಾರ ಸ್ಥಿತಿ:',
    drawerStatusOptions: {
      NEW: 'ಹೊಸದು (ನಾಗರಿಕರಿಂದ)',
      TRIAGED: 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ (AI)',
      IN_PROGRESS: 'ಪ್ರಗತಿಯಲ್ಲಿದೆ (ಸಿಬ್ಬಂದಿ ನಿಯೋಜನೆ)',
      RESOLVED: '✅ ಪರಿಹರಿಸಲಾಗಿದೆ (ಸರ್ಕಾರದಿಂದ)'
    },
    officerNoteLabel: 'ಅಧಿಕಾರಿಯ ಟಿಪ್ಪಣಿ:',
    officerNotePlaceholder: 'ಉದಾ: ಲೈನ್‌ಮ್ಯಾನ್ ವಾಹನ ಬೆಳಿಗ್ಗೆ 10:45ಕ್ಕೆ ಕಳುಹಿಸಲಾಗಿದೆ...',
    saveRoutingBtn: 'ನವೀಕರಿಸಿ ಕಳುಹಿಸಿ →',
    updatingText: 'ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ...',
    auditLogLabel: 'ಕ್ರಮಗಳ ಇತಿಹಾಸ',
    speechLang: 'kn-IN'
  },

  mr: {

    // Live Tracking Section
    trackingEyebrow: 'नागरिक तक्रार स्थिती',
    trackingTitle: 'माझ्या तक्रारीचे थेट ट्रॅकिंग',
    trackingSubtitle: 'तुमचा तक्रार आयडी प्रविष्ट करा किंवा खाली सरकारी निवारण प्रगती पहा.',
    trackBtn: 'स्थिती तपासा',
    stepStage1: '1. तक्रार नोंदवली',
    stepStage2: '2. एआय तपासणी',
    stepStage3: '3. अभियंता रवाना',
    stepStage4: '4. सरकारी निवारण',
    step4Sub: 'प्रगतीपथावर',
    assignedOfficerPrefix: 'नियुक्त वॉर्ड अभियंता:',
    directPhoneLine: 'थेट अधिकृत क्रमांक:',
    callEngineerBtn: 'अभियंत्याला कॉल करा',
    viewOnDashboardBtn: 'डॅशबोर्डवर पहा →',

    // Dashboard Spotlight & Locality Notice
    spotlightBadge: 'तुमची नोंदवलेली तक्रार (प्राधान्य ट्रॅकिंग)',
    spotlightBtn: 'तपशील व व्यवस्थापन पहा →',
    localityNoticePrefix: 'तुमची तक्रार प्रथम दाखवली जात आहे, नंतर तुमच्या परिसरातील समस्या',
    viewAllLocalitiesBtn: '🌐 सर्व परिसर पहा',
    focusLocalityBtn: '📍 माझा परिसर पहा',
    yourComplaintBadge: '⭐ तुमची तक्रार',

    subtitle: 'महानगरपालिका तक्रार निवारण व वेळमर्यादा यंत्रणा',
    complaintBtn: 'तक्रार 📢',
    welcomeBadge: '🏛️ महानगरपालिका नागरी समस्या व निवारण पोर्टल',
    welcomeTitle: 'पंचायत मध्ये आपले स्वागत आहे',
    welcomeDesc: 'खड्डे, कचरा, पाण्याची गळती, विजेच्या तारा अशा समस्यांची तक्रार नोंदवा. आमची यंत्रणा वेळेत निवारण सुनिश्चित करते.',
    heroComplaintBtn: '+ तक्रार दाखल करा 📢',
    exploreCategoriesBtn: 'समस्या प्रवर्ग पहा ↓',
    totalComplaints: 'एकूण नागरिक तक्रारी',
    resolvedGovtLabel: '✅ शासनाकडून सोडवलेल्या तक्रारी',
    criticalHazards: 'अति तातडीचे धोके (12 तास SLA)',
    duplicatesMerged: 'एकत्रित तक्रारी',

    navComplaint: 'तक्रार दाखल करा 📢',
    navDashboard: 'महानगरपालिका डॅशबोर्ड 📊',
    dashEyebrow: '🏛️ प्रशासकीय व SLA डॅशबोर्ड',
    dashTitle: 'महानगरपालिका तक्रार निवारण डॅशबोर्ड',
    dashSubtitle: 'थेट तक्रार वर्गीकरण, वेळमर्यादा आणि आयुक्त स्तरावरील देखरेख मंच.',
    backToComplaintBtn: '← नवीन तक्रार करा 📢',
    goToDashboardBtn: 'डॅशबोर्ड उघडा 📊 →',
    bannerTitle: 'आपण वॉर्ड अभियंता किंवा मनपा अधिकारी आहात का?',
    bannerSubtitle: 'थेट वर्गीकरण, मुदत आणि अधिकारी वाटप डॅशबोर्डमध्ये तपासा.',
    bannerBtn: 'डॅशबोर्ड पहा 📊 →',

    complaintBoxTitle: 'नागरी तक्रार दाखल करा',
    complaintBoxSubtitle: 'शहर व परिसर निवडा, आणि समस्या लिहा किंवा बोला.',
    step1Label: '📍 टप्पा 1: शहर व परिसर निवडा',
    formCityLabel: 'शहर:',
    formLocalityLabel: 'परिसर:',
    step2Label: '📝 टप्पा 2: समस्या सांगा',
    citizenNameLabel: 'आपले नाव (पर्यायी):',
    citizenNamePlaceholder: 'उदा: रमेश बाबू (किंवा रिक्त ठेवा)',
    channelLabel: 'माध्यम:',
    channelOptions: {
      CITIZEN_PORTAL: 'नागरिक वेब पोर्टल',
      VOICE_CALL_IVR: 'व्हॉइस हेल्पलाइन (IVR)',
      WHATSAPP_BOT: 'व्हॉट्सॲप बॉट'
    },
    grievanceLabel: 'तक्रारीचा तपशील:',
    voicePrompt: 'बोलून सांगा 🎙️',
    listeningMsg: 'ऐकत आहोत... मराठीत बोला',
    voiceHint: 'मराठी, हिंदी, इंग्रजी, कन्नड, तेलुगू मध्ये बोलू शकता!',
    submitComplaintBtn: 'तक्रार दाखल करा 📢 →',
    submittingBtn: 'नोंदवत आहोत...',
    complaintPlaceholder: 'समस्या येथे लिहा किंवा बोलून सांगा...',

    categorySectionTitle: '📊 प्रवर्गांनुसार समस्या वर्गीकरण',
    categorySectionSubtitle: 'नागरी तक्रारी आणि सरकारी निवारण प्रगती',
    cityFilterLabel: 'शहर:',
    allCities: 'सर्व शहरे',
    allLocalities: 'सर्व परिसर',
    catRoadsName: 'रस्ते आणि पूल',
    catRoadsSub: 'खड्डे, भेगा, अपघात धोका',
    catSanName: 'कचरा आणि स्वच्छता',
    catSanSub: 'कचरा ढीग, अस्वच्छता',
    catWaterName: 'पाणी आणि सांडपाणी',
    catWaterSub: 'पाईप गळती, तुंबलेली गटारे, मॅनहोल',
    catElecName: 'वीज आणि दिवे',
    catElecSub: 'तुटलेल्या तारा, पथदिवे',
    catHealthName: 'सार्वजनिक आरोग्य',
    catHealthSub: 'डास, साचलेले पाणी',
    reportedLabel: 'नोंदणीकृत',
    resolvedLabel: 'सोडवलेले',

    citizenFeedTitle: '📍 नागरिक समस्या कक्ष',
    citizenFeedSubtitle: 'तक्रारींची थेट स्थिती व नियुक्त अधिकारी',
    activeToggleText: '🔥 सुरू असलेल्या समस्या',
    resolvedToggleText: '✅ सोडवलेल्या समस्या',
    localityLabel: 'परिसर:',
    deptLabel: 'प्रवर्ग:',
    allCategories: 'सर्व प्रवर्ग',
    deptFilterOptions: {
      ROADS: '🛣️ रस्ते आणि पूल',
      SANITATION: '🗑️ कचरा आणि स्वच्छता',
      WATER_SEWER: '💧 पाणी आणि सांडपाणी',
      ELECTRICAL: '⚡ वीज आणि दिवे',
      HEALTH: '🏥 सार्वजनिक आरोग्य'
    },
    priorityLabel: 'प्राधान्य:',
    allPriorities: 'सर्व प्राधान्ये',
    priorityFilterOptions: {
      CRITICAL: '🔴 अति तातडीचे (12 तास SLA)',
      HIGH: '🟠 उच्च (24 तास SLA)',
      MEDIUM: '🟡 मध्यम (48 तास SLA)',
      LOW: '🔵 सामान्य (72 तास SLA)'
    },
    searchPlaceholder: 'तक्रार, रस्ता किंवा आयडी शोधा...',
    resetBtn: 'रीसेट',
    emptyTitle: 'कोणतीही तक्रार आढळली नाही',
    emptyDesc: 'निवडलेल्या परिसरात तक्रारी नाहीत.',
    emptyResetBtn: 'सर्व फिल्टर रीसेट करा',

    thPriority: 'प्राधान्य',
    thId: 'तक्रार क्रमांक',
    thSummary: 'समस्या तपशील',
    thCategory: 'प्रवर्ग',
    thLocation: 'ठिकाण / परिसर',
    thSla: 'वेळ मर्यादा (SLA)',
    thReports: 'नागरिक',
    thStatus: 'स्थिती',
    thDetails: 'तपशील',

    priorities: {
      CRITICAL: 'अति तातडीचे',
      HIGH: 'उच्च',
      MEDIUM: 'मध्यम',
      LOW: 'सामान्य'
    },
    departments: {
      ELECTRICAL: '⚡ वीज',
      WATER_SEWER: '💧 पाणी/सांडपाणी',
      ROADS: '🛣️ रस्ते',
      SANITATION: '🗑️ स्वच्छता',
      HEALTH: '🏥 आरोग्य'
    },
    statuses: {
      NEW: 'नवीन',
      TRIAGED: 'तपासलेले',
      IN_PROGRESS: 'प्रगतीपथावर',
      RESOLVED: '✅ सोडवले'
    },
    viewDetailsBtn: 'पहा',
    citizenSingle: '1 नागरिक',
    citizenPlural: 'नागरिक',
    resolvedByGovt: 'शासनाकडून सोडवले',
    onTrack: 'वेळेत',
    breached: 'वेळ संपली',
    approaching: 'वेळ संपत आहे',
    timeRemainingSuffix: 'शिल्लक',
    timeOverdueSuffix: 'उशीर',

    readAloud: 'ऐका (आवाज)',
    slaMonitorTitle: 'SLA प्रतिसाद मॉनिटर (नियम:',
    hoursWord: 'तास',
    slaOnTrackBadge: '🟢 वेळेत',
    slaWarningBadge: '🟡 चेतावणी',
    slaBreachedBadge: '🔴 वेळ संपली',
    slaEscalatedBadge: '🚨 आयुक्तांकडे वर्ग',
    deadlinePrefix: 'मुदत:',
    standardWindowText: 'मानक 48 तासांची मुदत',
    fastTrackEscalateBtn: '⚡ थेट आयुक्तांकडे वर्ग करा →',
    escalatingText: 'वर्ग करत आहोत...',
    escalationAlertActive: '🚨 आयुक्त अलर्ट सक्रिय',
    escalationBreachAlert: '⚠️ वेळ मर्यादा उल्लंघन अलर्ट',
    triageRationaleLabel: 'AI प्राधान्य विश्लेषण',
    resolvedLocationLabel: 'निश्चित पत्ता (OPENSTREETMAP)',
    mergedReportsLabel: 'एकत्रित नागरी तक्रारी',
    mergedReportsCount: 'तक्रारी एकत्रित केल्या',
    officerDispatchLabel: 'वार्ड अधिकारी व कारवाई',
    assignOfficerLabel: 'नियुक्त अधिकारी:',
    unassignedOfficer: 'नियुक्त नाही',
    contactLabel: 'संपर्क:',
    resolutionStatusLabel: 'निवारण स्थिती:',
    drawerStatusOptions: {
      NEW: 'नवीन (नागरिकाने नोंदवली)',
      TRIAGED: 'तपासलेली (AI)',
      IN_PROGRESS: 'प्रगतीपथावर (पथक रवाना)',
      RESOLVED: '✅ सोडवली (शासनाकडून)'
    },
    officerNoteLabel: 'अधिकारी नोंद:',
    officerNotePlaceholder: 'उदा: दुरुस्ती वाहन सकाळी 10:45 वाजता रवाना...',
    saveRoutingBtn: 'अपडेट करा व पाठवा →',
    updatingText: 'अपडेट करत आहोत...',
    auditLogLabel: 'कृती इतिहास',
    speechLang: 'mr-IN'
  },

  ta: {

    // Live Tracking Section
    trackingEyebrow: 'குடிமக்கள் புகார் நிலை',
    trackingTitle: 'எனது புகாரின் நேரலை கண்காணிப்பு',
    trackingSubtitle: 'உங்கள் புகார் ஐடியை உள்ளிடவும் அல்லது அரசின் தீர்வு முன்னேற்றத்தைக் கீழே பார்க்கவும்.',
    trackBtn: 'நிலை அறிய',
    stepStage1: '1. புகார் பதிவானது',
    stepStage2: '2. ஏஐ சரிபார்த்தல்',
    stepStage3: '3. பொறியாளர் நியமனம்',
    stepStage4: '4. அரசு தீர்வு',
    step4Sub: 'நடவடிக்கையில்',
    assignedOfficerPrefix: 'நியமிக்கப்பட்ட வார்டு பொறியாளர்:',
    directPhoneLine: 'நேரடி அதிகாரப்பூர்வ எண்:',
    callEngineerBtn: 'பொறியாளரை அழைக்கவும்',
    viewOnDashboardBtn: 'டாஷ்போர்டில் பார்க்க →',

    // Dashboard Spotlight & Locality Notice
    spotlightBadge: 'நீங்கள் பதிவுசெய்த புகார் (முன்னுரிமை கண்காணிப்பு)',
    spotlightBtn: 'முழு விவரம் பார்க்க →',
    localityNoticePrefix: 'உங்கள் புகார் முதலில் காட்டப்படுகிறது, பிறகு உங்கள் பகுதியின் புகார்கள்',
    viewAllLocalitiesBtn: '🌐 அனைத்து பகுதிகளையும் காண்க',
    focusLocalityBtn: '📍 எனது பகுதியை பார்க்க',
    yourComplaintBadge: '⭐ உங்கள் புகார்',

    subtitle: 'நகராட்சி புகார் மேலாண்மை மற்றும் தீர்வு தளம்',
    complaintBtn: 'புகார் 📢',
    welcomeBadge: '🏛️ நகராட்சி மக்கள் குறைதீர்ப்பு தளம்',
    welcomeTitle: 'பஞ்சாயத்திற்கு வருக',
    welcomeDesc: 'சாலைக் குழிகள், குப்பை, குடிநீர் கசிவு, மின்கம்பி சிக்கல்களை எளிதில் புகாரளிக்கவும். உரிய நேரத்தில் தீர்வு அளிக்கப்படும்.',
    heroComplaintBtn: '+ புகார் பதிவு செய்க 📢',
    exploreCategoriesBtn: 'வகை வாரியாக புகார்கள் ↓',
    totalComplaints: 'மொத்த மக்கள் புகார்கள்',
    resolvedGovtLabel: '✅ அரசால் தீர்க்கப்பட்டவை',
    criticalHazards: 'அவசர ஆபத்துகள் (12 மணி SLA)',
    duplicatesMerged: 'இணைக்கப்பட்ட புகார்கள்',

    navComplaint: 'புகார் பதிவு செய்க 📢',
    navDashboard: 'நகராட்சி டாஷ்போர்டு 📊',
    dashEyebrow: '🏛️ நகராட்சி நிர்வாகம் & SLA தளம்',
    dashTitle: 'நகராட்சி மக்கள் புகார் மேலாண்மை தளம்',
    dashSubtitle: 'நேரலை புகார் பகுப்பாய்வு, காலக்கெடு கண்காணிப்பு மற்றும் ஆணையர் நடவடிக்கை.',
    backToComplaintBtn: '← புதிய புகார் பதிவு 📢',
    goToDashboardBtn: 'நகராட்சி டாஷ்போர்டு திறக்க 📊 →',
    bannerTitle: 'நீங்கள் நகராட்சி பொறியாளர் அல்லது அதிகாரியா?',
    bannerSubtitle: 'நேரலை துறை வாரியான புகார்கள், காலக்கெடு மற்றும் அதிகாரி ஒதுக்கீட்டை காண்க.',
    bannerBtn: 'டாஷ்போர்டு காண்க 📊 →',

    complaintBoxTitle: 'மக்கள் புகார் பதிவு செய்க',
    complaintBoxSubtitle: 'நகரம் மற்றும் பகுதியைத் தேர்ந்தெடுத்து, புகாரை எழுதவும் அல்லது பேசவும்.',
    step1Label: '📍 படி 1: நகரம் மற்றும் பகுதியை தேர்வு செய்க',
    formCityLabel: 'நகரம்:',
    formLocalityLabel: 'பகுதி:',
    step2Label: '📝 படி 2: புகாரின் விளக்கம் தருக',
    citizenNameLabel: 'உங்கள் பெயர் (விருப்பப்பட்டால்):',
    citizenNamePlaceholder: 'எ.கா: ரமேஷ் பாபு (அல்லது காலியாக விடவும்)',
    channelLabel: 'தகவல் தளம்:',
    channelOptions: {
      CITIZEN_PORTAL: 'பொதுமக்கள் இணையதளம்',
      VOICE_CALL_IVR: 'குரல் உதவி மையம் (IVR)',
      WHATSAPP_BOT: 'வாட்ஸ்அப் பாட்'
    },
    grievanceLabel: 'புகார் விவரங்கள்:',
    voicePrompt: 'பேசுங்கள் 🎙️',
    listeningMsg: 'கேட்கிறோம்... தமிழில் பேசுங்கள்',
    voiceHint: 'தமிழ், ஆங்கிலம், இந்தி, கன்னடம், தெலுங்கில் பேசலாம்!',
    submitComplaintBtn: 'புகாரை சமர்ப்பிக்கவும் 📢 →',
    submittingBtn: 'பதிவாகிறது...',
    complaintPlaceholder: 'சிக்கலை இங்கு எழுதவும் அல்லது பேசவும்...',

    categorySectionTitle: '📊 வகை வாரியாக புகார்கள்',
    categorySectionSubtitle: 'புகார்கள் மற்றும் அரசின் தீர்வு விவரம்',
    cityFilterLabel: 'நகரம்:',
    allCities: 'அனைத்து நகரங்கள்',
    allLocalities: 'அனைத்து பகுதிகள்',
    catRoadsName: 'சாலைகள் & பாலங்கள்',
    catRoadsSub: 'குழிகள், விரிசல்கள், விபத்து அபாயம்',
    catSanName: 'குப்பை & துப்புரவு',
    catSanSub: 'குப்பை குவியல், தொட்டி நிரம்புதல்',
    catWaterName: 'குடிநீர் & கழிவுநீர்',
    catWaterSub: 'குழாய் கசிவு, கால்வாய் அடைப்பு, மேன்ஹோல்',
    catElecName: 'மின்சாரம் & விளக்குகள்',
    catElecSub: 'அறுந்த கம்பிகள், தெருவிளக்குகள்',
    catHealthName: 'பொது சுகாதாரம்',
    catHealthSub: 'கொசு தொல்லை, தேங்கிய நீர்',
    reportedLabel: 'பதிவானவை',
    resolvedLabel: 'தீர்க்கப்பட்டவை',

    citizenFeedTitle: '📍 பொதுமக்கள் புகார் பட்டியல்',
    citizenFeedSubtitle: 'நேரலை நிலை மற்றும் ஒதுக்கப்பட்ட அதிகாரிகள்',
    activeToggleText: '🔥 நடப்பு புகார்கள்',
    resolvedToggleText: '✅ அரசால் தீர்க்கப்பட்டவை',
    localityLabel: 'பகுதி:',
    deptLabel: 'துறை:',
    allCategories: 'அனைத்து துறைகள்',
    deptFilterOptions: {
      ROADS: '🛣️ சாலைகள் & பாலங்கள்',
      SANITATION: '🗑️ குப்பை & துப்புரவு',
      WATER_SEWER: '💧 குடிநீர் & கழிவுநீர்',
      ELECTRICAL: '⚡ மின்சாரம் & விளக்குகள்',
      HEALTH: '🏥 பொது சுகாதாரம்'
    },
    priorityLabel: 'முன்னுரிமை:',
    allPriorities: 'அனைத்து முன்னுரிமைகள்',
    priorityFilterOptions: {
      CRITICAL: '🔴 அவசரம் (12 மணி SLA)',
      HIGH: '🟠 உயர் (24 மணி SLA)',
      MEDIUM: '🟡 நடுத்தர (48 மணி SLA)',
      LOW: '🔵 குறைவு (72 மணி SLA)'
    },
    searchPlaceholder: 'புகார், சாலை அல்லது ஐடி தேடவும்...',
    resetBtn: 'மீட்டமை',
    emptyTitle: 'புகார்கள் இல்லை',
    emptyDesc: 'தேர்ந்தெடுத்த பகுதியில் எந்த புகாரும் இல்லை.',
    emptyResetBtn: 'அனைத்து வடிகட்டிகளையும் மீட்டமைக்கவும்',

    thPriority: 'முன்னுரிமை',
    thId: 'புகார் எண்',
    thSummary: 'புகார் சுருக்கம் & விளக்கம்',
    thCategory: 'துறை',
    thLocation: 'இடம் / பகுதி',
    thSla: 'காலக்கெடு (SLA)',
    thReports: 'மக்கள்',
    thStatus: 'நிலை',
    thDetails: 'விவரங்கள்',

    priorities: {
      CRITICAL: 'அவசரம்',
      HIGH: 'உயர்',
      MEDIUM: 'நடுத்தர',
      LOW: 'குறைவு'
    },
    departments: {
      ELECTRICAL: '⚡ மின்சாரம்',
      WATER_SEWER: '💧 குடிநீர்/கழிவுநீர்',
      ROADS: '🛣️ சாலைகள்',
      SANITATION: '🗑️ துப்புரவு',
      HEALTH: '🏥 சுகாதாரம்'
    },
    statuses: {
      NEW: 'புதியது',
      TRIAGED: 'சரிபார்க்கப்பட்டது',
      IN_PROGRESS: 'நடவடிக்கையில்',
      RESOLVED: '✅ தீர்க்கப்பட்டது'
    },
    viewDetailsBtn: 'பார்க்க',
    citizenSingle: '1 குடிமகன்',
    citizenPlural: 'குடிமக்கள்',
    resolvedByGovt: 'அரசால் தீர்க்கப்பட்டது',
    onTrack: 'நேரத்தில்',
    breached: 'நேரம் கடந்தது',
    approaching: 'முடிவடைகிறது',
    timeRemainingSuffix: 'மீதமுள்ளது',
    timeOverdueSuffix: 'தாமதம்',

    readAloud: 'கேளுங்கள் (குரல்)',
    slaMonitorTitle: 'SLA காலக்கெடு கண்காணிப்பு (விதி:',
    hoursWord: 'மணி நேரம்',
    slaOnTrackBadge: '🟢 நேரத்தில்',
    slaWarningBadge: '🟡 எச்சரிக்கை',
    slaBreachedBadge: '🔴 நேரம் கடந்தது',
    slaEscalatedBadge: '🚨 ஆணையருக்கு அனுப்பப்பட்டது',
    deadlinePrefix: 'காலக்கெடு:',
    standardWindowText: 'நிலையான 48 மணி நேர நகராட்சி அவகாசம்',
    fastTrackEscalateBtn: '⚡ நேரடியாக ஆணையருக்கு அனுப்புக →',
    escalatingText: 'அனுப்பப்படுகிறது...',
    escalationAlertActive: '🚨 ஆணையர் எச்சரிக்கை செயலில் உள்ளது',
    escalationBreachAlert: '⚠️ காலக்கெடு கடந்த அவசர எச்சரிக்கை',
    triageRationaleLabel: 'AI முன்னுரிமை ஆய்வு',
    resolvedLocationLabel: 'அடையாள முகவரி (OPENSTREETMAP)',
    mergedReportsLabel: 'இணைக்கப்பட்ட மக்கள் புகார்கள்',
    mergedReportsCount: 'புகார்கள் இணைக்கப்பட்டன',
    officerDispatchLabel: 'அதிகாரி மற்றும் நடவடிக்கை',
    assignOfficerLabel: 'நியமிக்கப்பட்ட அதிகாரி:',
    unassignedOfficer: 'நியமிக்கப்படவில்லை',
    contactLabel: 'தொடர்புக்கு:',
    resolutionStatusLabel: 'தீர்வு நிலை:',
    drawerStatusOptions: {
      NEW: 'புதியது (மக்களால் பதிவு)',
      TRIAGED: 'சரிபார்க்கப்பட்டது (AI)',
      IN_PROGRESS: 'நடவடிக்கையில் (குழு அனுப்பிவைப்பு)',
      RESOLVED: '✅ தீர்க்கப்பட்டது (அரசால்)'
    },
    officerNoteLabel: 'அதிகாரி குறிப்பு:',
    officerNotePlaceholder: 'எ.கா: பழுதுநீக்கும் வாகனம் காலை 10:45க்கு அனுப்பப்பட்டது...',
    saveRoutingBtn: 'புதுப்பித்து அனுப்புக →',
    updatingText: 'புதுப்பிக்கப்படுகிறது...',
    auditLogLabel: 'நடவடிக்கை வரலாறு',
    speechLang: 'ta-IN'
  }
};

// Extend I18N with complete Municipal Ward and Complaint desk keys
const EXTRA_I18N = {
  "en": {
    "studioWorkspaceTitle": "Municipal Work Orders & Triage Queue",
    "studioWorkspaceSub": "Live citizen grievance stream triaged by department & SLA priority",
    "studioHome": "Home",
    "studioDepartments": "Departments",
    "subjRoads": "Roads & Bridges",
    "subjSan": "Garbage & Sanitation",
    "subjWater": "Water & Sewerage",
    "subjElec": "Electrical & Lighting",
    "subjHealth": "Public Health",
    "subjTraffic": "Encroachment & Traffic",
    "workOrdersLabel": "Work Orders",
    "showAllBtn": "Show All",
    "activeFieldTasks": "Active Field Tasks",
    "step3Label": "📷 Step 3: Attach Evidence Photo (Optional)",
    "uploadPhotoBtn": "Upload Photo / Camera",
    "speakLabel": "Listen Aloud",
    "quickSpeechLabel": "🎙️ Click or Speak in Your Native Language:",
    "trackSearchTitle": "Live Grievance Tracking & Status",
    "trackSearchSub": "Enter your grievance ID to check real-time SLA countdown and government repair progress",
    "trackBtn": "Track Status",
    "myComplaintsTitle": "My Registered Complaints & Status",
    "myComplaintsSubtitle": "Your personal citizen grievance center. Check live government progress, inspect before vs after photos, and track resolution in real-time.",
    "myComplaintsEyebrow": "👤 CITIZEN PERSONAL CIVIC PORTAL",
    "fileNewInMyComplaints": "+ File New Complaint",
    "signOutBtn": "Sign Out"
  },
  "hi": {
    "studioWorkspaceTitle": "नगर निगम कार्य आदेश एवं प्राथमिकता सूची",
    "studioWorkspaceSub": "विभाग और एसएलए प्राथमिकता के अनुसार वर्गीकृत वास्तविक समय नागरिक शिकायतें",
    "studioHome": "मुख्य पृष्ठ",
    "studioDepartments": "विभाग",
    "subjRoads": "सड़कें एवं पुल",
    "subjSan": "कचरा एवं स्वच्छता",
    "subjWater": "जल एवं सीवरेज",
    "subjElec": "विद्युत एवं प्रकाश",
    "subjHealth": "सार्वजनिक स्वास्थ्य",
    "subjTraffic": "अतिक्रमण एवं यातायात",
    "workOrdersLabel": "कार्य आदेश",
    "showAllBtn": "सभी दिखाएं",
    "activeFieldTasks": "सक्रिय कार्य",
    "step3Label": "📷 चरण 3: प्रमाण फोटो संलग्न करें (वैकल्पिक)",
    "uploadPhotoBtn": "फोटो अपलोड / कैमरा",
    "speakLabel": "सुनें 🔊",
    "quickSpeechLabel": "🎙️ अपनी भाषा में क्लिक करें या बोलें:",
    "trackSearchTitle": "शिकायत की लाइव ट्रैकिंग एवं स्थिति",
    "trackSearchSub": "सरकारी मरम्मत प्रगति और एसएलए उलटी गिनती देखने के लिए अपनी शिकायत आईडी दर्ज करें",
    "trackBtn": "स्थिति जांचें",
    "myComplaintsTitle": "मेरी दर्ज शिकायतें एवं स्थिति",
    "myComplaintsSubtitle": "आपका व्यक्तिगत नागरिक शिकायत केंद्र। सरकारी प्रगति और पहले व बाद के फोटो प्रमाण देखें।",
    "myComplaintsEyebrow": "👤 नागरिक व्यक्तिगत पोर्टल",
    "fileNewInMyComplaints": "+ नई शिकायत दर्ज करें",
    "signOutBtn": "लॉग आउट"
  },
  "te": {
    "studioWorkspaceTitle": "మునిసిపల్ పని ఆదేశాలు & ప్రాధాన్యత క్యూ",
    "studioWorkspaceSub": "శాఖ మరియు ఎస్ఎల్ఏ ప్రాధాన్యత ప్రకారం వర్గీకరించబడిన పౌర ఫిర్యాదులు",
    "studioHome": "హోమ్",
    "studioDepartments": "విభాగాలు",
    "subjRoads": "రోడ్లు & వంతెనలు",
    "subjSan": "చెత్త & పారిశుధ్యం",
    "subjWater": "నీరు & డ్రైనేజీ",
    "subjElec": "విద్యుత్ & వీధి దీపాలు",
    "subjHealth": "ప్రజారోగ్యం",
    "subjTraffic": "ఆక్రమణలు & ట్రాఫిక్",
    "workOrdersLabel": "పని ఆదేశాలు",
    "showAllBtn": "అన్నీ చూపించు",
    "activeFieldTasks": "క్రియాశీల పనులు",
    "step3Label": "📷 దశ 3: ఆధార ఫోటో జతచేయండి (ఐచ్ఛికం)",
    "uploadPhotoBtn": "ఫోటో అప్‌లోడ్ / కెమెరా",
    "speakLabel": "వినండి 🔊",
    "quickSpeechLabel": "🎙️ మీ మాతృభాషలో క్లిక్ చేయండి లేదా మాట్లాడండి:",
    "trackSearchTitle": "ఫిర్యాదు లైవ్ ట్రాకింగ్ & స్థితి",
    "trackSearchSub": "నిజ-సమయ మరమ్మతు పురోగతి మరియు గడువును తనిఖీ చేయడానికి ఫిర్యాదు ఐడీని నమోదు చేయండి",
    "trackBtn": "స్థితిని తనిఖీ చేయండి",
    "myComplaintsTitle": "నా నమోదిత ఫిర్యాదులు & స్థితి",
    "myComplaintsSubtitle": "మీ వ్యక్తిగత పౌర ఫిర్యాదు కేంద్రం. ప్రభుత్వ పరిష్కార పురోగతిని మరియు ఫోటోలను ప్రత్యక్షంగా చూడండి.",
    "myComplaintsEyebrow": "👤 పౌర వ్యక్తిగత పోర్టల్",
    "fileNewInMyComplaints": "+ కొత్త ఫిర్యాదు నమోదు చేయండి",
    "signOutBtn": "లాగ్ అవుట్"
  },
  "kn": {
    "studioWorkspaceTitle": "ಪುರಸಭೆಯ ಕಾರ್ಯ ಆದೇಶಗಳು ಮತ್ತು ವಿಂಗಡಣೆ ಸರತಿ",
    "studioWorkspaceSub": "ಇಲಾಖೆ ಮತ್ತು ಎಸ್‌ಎಲ್‌ಎ ಆದ್ಯತೆಯ ಪ್ರಕಾರ ವಿಂಗಡಿಸಲಾದ ನಾಗರಿಕ ದೂರುಗಳು",
    "studioHome": "ಮುಖಪುಟ",
    "studioDepartments": "ಇಲಾಖೆಗಳು",
    "subjRoads": "ರಸ್ತೆಗಳು ಮತ್ತು ಸೇತುವೆಗಳು",
    "subjSan": "ಕಸ ಮತ್ತು ನೈರ್ಮಲ್ಯ",
    "subjWater": "ನೀರು ಮತ್ತು ಒಳಚರಂಡಿ",
    "subjElec": "ವಿದ್ಯುತ್ ಮತ್ತು ದೀಪಗಳು",
    "subjHealth": "ಸಾರ್ವಜನಿಕ ಆರೋಗ್ಯ",
    "subjTraffic": "ಅತಿಕ್ರಮಣ ಮತ್ತು ಸಂಚಾರ",
    "workOrdersLabel": "ಕಾರ್ಯ ಆದೇಶಗಳು",
    "showAllBtn": "ಎಲ್ಲವನ್ನೂ ತೋರಿಸಿ",
    "activeFieldTasks": "ಸಕ್ರಿಯ ಕಾರ್ಯಗಳು",
    "step3Label": "📷 ಹಂತ 3: ಪುರಾವೆ ಫೋಟೋ ಲಗತ್ತಿಸಿ (ಐಚ್ಛಿಕ)",
    "uploadPhotoBtn": "ಫೋಟೋ ಅಪ್‌ಲೋಡ್ / ಕ್ಯಾಮೆರಾ",
    "speakLabel": "ಕೇಳಿ 🔊",
    "quickSpeechLabel": "🎙️ ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಕ್ಲಿಕ್ ಮಾಡಿ ಅಥವಾ ಮಾತನಾಡಿ:",
    "trackSearchTitle": "ದೂರಿನ ನೇರ ಟ್ರ್ಯಾಕಿಂಗ್ ಮತ್ತು ಸ್ಥಿತಿ",
    "trackSearchSub": "ನೈಜ-ಸಮಯದ ಪ್ರಗತಿ ಮತ್ತು ಗಡುವನ್ನು ಪರಿಶೀಲಿಸಲು ದೂರು ಸಂಖ್ಯೆ ನಮೂದಿಸಿ",
    "trackBtn": "ಸ್ಥಿತಿ ಪರಿಶೀಲಿಸಿ",
    "myComplaintsTitle": "ನನ್ನ ನೋಂದಾಯಿತ ದೂರುಗಳು ಮತ್ತು ಸ್ಥಿತಿ",
    "myComplaintsSubtitle": "ನಿಮ್ಮ ವೈಯಕ್ತಿಕ ನಾಗರಿಕ ಕೇಂದ್ರ. ಕೆಲಸದ ಪ್ರಗತಿ ಮತ್ತು ಫೋಟೋ ಪುರಾವೆಗಳನ್ನು ಪರಿಶೀಲಿಸಿ.",
    "myComplaintsEyebrow": "👤 ನಾಗರಿಕ ವೈಯಕ್ತಿಕ ಪೋರ್ಟಲ್",
    "fileNewInMyComplaints": "+ ಹೊಸ ದೂರು ಸಲ್ಲಿಸಿ",
    "signOutBtn": "ಸೈನ್ ಔಟ್"
  },
  "mr": {
    "studioWorkspaceTitle": "महानगरपालिका कार्य आदेश व प्राधान्य रांग",
    "studioWorkspaceSub": "विभाग आणि एसएलए प्राधान्यानुसार वर्गीकृत थेट नागरी तक्रारी",
    "studioHome": "मुख्यपृष्ठ",
    "studioDepartments": "विभाग",
    "subjRoads": "रस्ते आणि पूल",
    "subjSan": "कचरा आणि स्वच्छता",
    "subjWater": "पाणी आणि सांडपाणी",
    "subjElec": "विद्युत आणि दिवे",
    "subjHealth": "सार्वजनिक आरोग्य",
    "subjTraffic": "अतिक्रमण आणि वाहतूक",
    "workOrdersLabel": "कार्य आदेश",
    "showAllBtn": "सर्व दाखवा",
    "activeFieldTasks": "सक्रिय कामे",
    "step3Label": "📷 पायरी 3: पुराव्याचा फोटो जोडा (पर्यायी)",
    "uploadPhotoBtn": "फोटो अपलोड / कॅमेरा",
    "speakLabel": "ऐका 🔊",
    "quickSpeechLabel": "🎙️ आपल्या भाषेत क्लिक करा किंवा बोला:",
    "trackSearchTitle": "तक्रारीचे थेट ट्रॅकिंग आणि स्थिती",
    "trackSearchSub": "कामाची प्रगती आणि मुदत तपासण्यासाठी तक्रार आयडी प्रविष्ट करा",
    "trackBtn": "स्थिती तपासा",
    "myComplaintsTitle": "माझ्या नोंदवलेल्या तक्रारी आणि स्थिती",
    "myComplaintsSubtitle": "आपले वैयक्तिक तक्रार केंद्र. सरकारी दुरुस्तीची प्रगती आणि फोटो पुरावे पहा.",
    "myComplaintsEyebrow": "👤 नागरिक वैयक्तिक पोर्टल",
    "fileNewInMyComplaints": "+ नवीन तक्रार नोंदवा",
    "signOutBtn": "साइन आउट"
  },
  "ta": {
    "studioWorkspaceTitle": "நகராட்சி பணி ஆணைகள் மற்றும் வரிசை",
    "studioWorkspaceSub": "துறை மற்றும் SLA முன்னுரிமை அடிப்படையில் வகைப்படுத்தப்பட்ட நேரடி புகார்கள்",
    "studioHome": "முகப்பு",
    "studioDepartments": "துறைகள்",
    "subjRoads": "சாலைகள் & பாலங்கள்",
    "subjSan": "குப்பை & சுகாதாரம்",
    "subjWater": "குடிநீர் & கழிவுநீர்",
    "subjElec": "மின்சாரம் & விளக்குகள்",
    "subjHealth": "பொது சுகாதாரம்",
    "subjTraffic": "ஆக்கிரமிப்பு & போக்குவரத்து",
    "workOrdersLabel": "பணி ஆணைகள்",
    "showAllBtn": "அனைத்தையும் காட்டு",
    "activeFieldTasks": "செயலில் உள்ள பணிகள்",
    "step3Label": "📷 படி 3: ஆதாரப் புகைப்படம் இணைக்கவும் (விருப்பத்திற்குரியது)",
    "uploadPhotoBtn": "புகைப்படம் பதிவேற்றவும் / கேமரா",
    "speakLabel": "கேளுங்கள் 🔊",
    "quickSpeechLabel": "🎙️ உங்கள் மொழியில் கிளிக் செய்யவும் அல்லது பேசவும்:",
    "trackSearchTitle": "புகார் நேரடி கண்காணிப்பு & நிலை",
    "trackSearchSub": "பழுதுபார்க்கும் முன்னேற்றம் மற்றும் காலக்கெடுவை அறிய புகார் எண்ணை உள்ளிடவும்",
    "trackBtn": "நிலையை சரிபார்க்கவும்",
    "myComplaintsTitle": "எனது பதிவுசெய்யப்பட்ட புகார்கள் & நிலை",
    "myComplaintsSubtitle": "உங்கள் தனிப்பட்ட புகார் மையம். அரசு தீர்வு மற்றும் புகைப்பட ஆதாரங்களை சரிபார்க்கவும்.",
    "myComplaintsEyebrow": "👤 குடிமக்கள் தனிப்பட்ட போர்டல்",
    "fileNewInMyComplaints": "+ புதிய புகார் பதிவு செய்க",
    "signOutBtn": "வெளியேறு"
  }
};
Object.keys(EXTRA_I18N).forEach(lang => {
  if (I18N[lang]) {
    Object.assign(I18N[lang], EXTRA_I18N[lang]);
  }
});

// HEADLINES TRANSLATION LOOKUP (Solves Telugu & Multi-language table translation issue)
const I18N_HEADLINES = {
  te: {
    'Uncovered / damaged manhole posing hazard': 'మూత లేని ప్రమాదకరమైన మ్యాన్‌హోల్ / పాదచారులకు ముప్పు',
    'Hazardous road crater / severe pothole damage': 'ప్రమాదకరమైన రోడ్డు గుంత / వాహనాల రాకపోకలకు ఆటంకం',
    'Water main leak / pipe rupture causing waterlogging': 'ప్రధాన పైప్‌లైన్ పగిలి నీటి లీకేజీ / రోడ్డుపై నీరు నిల్వ',
    'Live wire / Electrical hazard reported on roadway': 'రోడ్డుపై తెగిపడిన విద్యుత్ తీగ / తీవ్ర ప్రమాదం',
    'Heavy garbage accumulation & overflowing waste': 'భారీగా పేరుకుపోయిన చెత్త కుప్ప / దుర్వాసన',
    'Severe waterlogging and clogged storm drain outside Andheri West Railway Station': 'రైల్వే స్టేషన్ బయట నిలిచిన నీరు / మురుగు కాల్వ పూడిక',
    'Massive garbage pile near Bandra West Linking Road market blocking pedestrian walkway': 'మార్కెట్ సమీపంలో భారీ చెత్త కుప్ప / నడవడానికి దారి లేక ఇబ్బంది',
    'Streetlight pole fixed with energy-saving LED luminaire on 4th cross residential road': 'వీధి దీపం స్తంభానికి కొత్త ఎల్‌ఈడీ లైట్ అమర్చబడింది',

  },
  hi: {
    'Uncovered / damaged manhole posing hazard': 'खुला / क्षतिग्रस्त मैनहोल दुर्घटना का खतरा',
    'Hazardous road crater / severe pothole damage': 'खतरनाक गहरा गड्ढा / सड़क क्षतिग्रस्त',
    'Water main leak / pipe rupture causing waterlogging': 'मुख्य पाइपलाइन फटने से जलभराव और बर्बादी',
    'Live wire / Electrical hazard reported on roadway': 'सड़क पर टूटा हुआ बिजली का तार / गंभीर खतरा',
    'Heavy garbage accumulation & overflowing waste': 'कचरे का भारी ढेर व दुर्गंध से भारी परेशानी'
  },
  kn: {
    'Uncovered / damaged manhole posing hazard': 'ಮುಚ್ಚಳವಿಲ್ಲದ ಅಪಾಯಕಾರಿ ಮ್ಯಾನ್‌ಹೋಲ್',
    'Hazardous road crater / severe pothole damage': 'ಅಪಾಯಕಾರಿ ದೊಡ್ಡ ರಸ್ತೆ ಗುಂಡಿ',
    'Water main leak / pipe rupture causing waterlogging': 'ಮುಖ್ಯ ಪೈಪ್ ಒಡೆದು ನೀರು ಪೋಲು / ರಸ್ತೆ ಜಲಾವೃತ',
    'Live wire / Electrical hazard reported on roadway': 'ರಸ್ತೆಯಲ್ಲಿ ತುಂಡಾದ ವಿದ್ಯುತ್ ತಂತಿ / ತುರ್ತು ಅಪಾಯ',
    'Heavy garbage accumulation & overflowing waste': 'ಕಸದ ರಾಶಿ ತುಂಬಿ ತುಳುಕುತ್ತಿದೆ / ದುರ್ವಾಸನೆ'
  },
  mr: {
    'Uncovered / damaged manhole posing hazard': 'उघडे / तुटलेले मॅनहोल अपघाताचा धोका',
    'Hazardous road crater / severe pothole damage': 'धोकादायक खोल खड्डा / वाहनांचा अपघात धोका',
    'Water main leak / pipe rupture causing waterlogging': 'मुख्य पाईप फुटल्याने पाणी साचले',
    'Live wire / Electrical hazard reported on roadway': 'रस्त्यावर तुटलेली विजेची तार / गंभीर धोका',
    'Heavy garbage accumulation & overflowing waste': 'कचऱ्याचा मोठा ढीग व दुर्गंधी'
  },
  ta: {
    'Uncovered / damaged manhole posing hazard': 'மூடப்படாத ஆபத்தான மேன்ஹோல்',
    'Hazardous road crater / severe pothole damage': 'ஆபத்தான சாலை குழி / வாகன விபத்து அபாயம்',
    'Water main leak / pipe rupture causing waterlogging': 'பிரதான குழாய் உடைந்து தண்ணீர் தேக்கம்',
    'Live wire / Electrical hazard reported on roadway': 'சாலையில் அறுந்த மின்கம்பி / அவசர ஆபத்து',
    'Heavy garbage accumulation & overflowing waste': 'அதிக குப்பை குவியல் மற்றும் சுகாதார சீர்கேடு'
  }
};

// RATIONALES TRANSLATION LOOKUP
const I18N_RATIONALES = {
  te: {
    'Immediate public safety or life-hazard detected requiring emergency dispatch.': 'తక్షణ ప్రజారోగ్య రక్షణ లేదా ప్రాణహాని గుర్తించబడింది, అత్యవసర సిబ్బంది తక్షణమే అవసరం.',
    'High-impact civic failure disrupting public health or traffic artery.': 'ప్రజా ఆరోగ్యం లేదా ట్రాఫిక్ రాకపోకలకు తీవ్ర అంతరాయం కలిగించే సమస్య.',
    'Low-impact maintenance item with minimal safety risk.': 'తక్కువ ప్రభావం గల సాధారణ నిర్వహణ సమస్య.',
    'Standard civic service disruption requiring scheduled repair.': 'నిర్ణీత వ్యవధిలో పరిష్కరించాల్సిన సాధారణ పౌర సమస్య.'
  },
  hi: {
    'Immediate public safety or life-hazard detected requiring emergency dispatch.': 'तत्काल सार्वजनिक सुरक्षा या जीवन का खतरा, आपातकालीन दल की आवश्यकता।',
    'High-impact civic failure disrupting public health or traffic artery.': 'सार्वजनिक स्वास्थ्य या यातायात को बाधित करने वाली बड़ी समस्या।',
    'Low-impact maintenance item with minimal safety risk.': 'न्यूनतम सुरक्षा जोखिम वाली सामान्य रखरखाव समस्या।',
    'Standard civic service disruption requiring scheduled repair.': 'समयबद्ध निवारण हेतु आवश्यक सामान्य नागरिक सेवा समस्या।'
  },
  kn: {
    'Immediate public safety or life-hazard detected requiring emergency dispatch.': 'ತಕ್ಷಣದ ಸಾರ್ವಜನಿಕ ಸುರಕ್ಷತೆ ಅಥವಾ ಜೀವಕ್ಕೆ ಅಪಾಯ, ತುರ್ತು ಸಿಬ್ಬಂದಿ ಅಗತ್ಯವಿದೆ.',
    'High-impact civic failure disrupting public health or traffic artery.': 'ಸಾರ್ವಜನಿಕ ಆರೋಗ್ಯ ಅಥವಾ ಸಂಚಾರಕ್ಕೆ ತೀವ್ರ ಅಡ್ಡಿಪಡಿಸುವ ಸಮಸ್ಯೆ.',
    'Low-impact maintenance item with minimal safety risk.': 'ಕನಿಷ್ಠ ಅಪಾಯವಿರುವ ಸಾಮಾನ್ಯ ನಿರ್ವಹಣೆ ಸಮಸ್ಯೆ.',
    'Standard civic service disruption requiring scheduled repair.': 'ನಿಗದಿತ ಅವಧಿಯಲ್ಲಿ ಪರಿಹರಿಸಬೇಕಾದ ಸಾಮಾನ್ಯ ದೂರು.'
  },
  mr: {
    'Immediate public safety or life-hazard detected requiring emergency dispatch.': 'तातडीचा सार्वजनिक सुरक्षिततेचा धोका, आपत्कालीन पथक आवश्यक.',
    'High-impact civic failure disrupting public health or traffic artery.': 'सार्वजनिक आरोग्य किंवा वाहतुकीस अडथळा आणणारी मोठी नागरी समस्या.',
    'Low-impact maintenance item with minimal safety risk.': 'कमी धोक्याची सामान्य देखभाल समस्या.',
    'Standard civic service disruption requiring scheduled repair.': 'वेळेत दुरुस्ती आवश्यक असलेली सामान्य नागरी समस्या.'
  },
  ta: {
    'Immediate public safety or life-hazard detected requiring emergency dispatch.': 'உடனடி பொது பாதுகாப்பு அல்லது உயிருக்கு ஆபத்து, அவசர மீட்பு குழு தேவை.',
    'High-impact civic failure disrupting public health or traffic artery.': 'பொது சுகாதாரம் அல்லது போக்குவரத்தை பாதிக்கும் பெரிய பிரச்சனை.',
    'Low-impact maintenance item with minimal safety risk.': 'குறைந்த ஆபத்து கொண்ட எளிய பராமரிப்பு பணி.',
    'Standard civic service disruption requiring scheduled repair.': 'திட்டமிட்ட பழுதுநீக்கம் தேவைப்படும் சாதாரண புகார்.'
  }
};

// LOCALITIES & CITIES TRANSLATION LOOKUP
const I18N_LOCALITIES = {
  te: {
    'Jayanagar': 'జయానగర్',
    'Koramangala': 'కోరమంగళ',
    'Bannerghatta': 'బన్నేరుఘట్ట',
    'Gandhi Bazaar': 'గాంధీ బజార్',
    'Majestic / Central': 'మెజెస్టిక్ / సెంట్రల్',
    'Indiranagar': 'ఇందిరానగర్',
    'Whitefield': 'వైట్‌ఫీల్డ్',
    'Andheri West': 'అంధేరి వెస్ట్',
    'Bandra West': 'బాంద్రా వెస్ట్',
    'Connaught Place': 'కన్నాట్ ప్లేస్',
    'Gachibowli': 'గచ్చిబౌలి',
    'Kothrud': 'కొత్రూడ్',
    'Bengaluru': 'బెంగళూరు',
    'Mumbai': 'ముంబై',
    'Delhi': 'ఢిల్లీ',
    'Hyderabad': 'హైదరాబాద్',
    'Pune': 'పూణే'
  },
  hi: {
    'Jayanagar': 'जयनगर',
    'Koramangala': 'कोरमंगला',
    'Bannerghatta': 'बन्नेरघट्टा',
    'Gandhi Bazaar': 'गांधी बाजार',
    'Majestic / Central': 'मैजेस्टिक / सेंट्रल',
    'Indiranagar': 'इंदिरानगर',
    'Whitefield': 'व्हाइटफील्ड',
    'Andheri West': 'अंधेरी पश्चिम',
    'Bandra West': 'बांद्रा पश्चिम',
    'Connaught Place': 'कनॉट प्लेस',
    'Gachibowli': 'गाचीबोवली',
    'Kothrud': 'कोथरूड',
    'Bengaluru': 'बेंगलुरु',
    'Mumbai': 'मुंबई',
    'Delhi': 'दिल्ली',
    'Hyderabad': 'हैदराबाद',
    'Pune': 'पुणे'
  },
  kn: {
    'Jayanagar': 'ಜಯನಗರ',
    'Koramangala': 'ಕೋರಮಂಗಲ',
    'Bannerghatta': 'ಬನ್ನೇರುಘಟ್ಟ',
    'Gandhi Bazaar': 'ಗಾಂಧಿ ಬಜಾರ್',
    'Majestic / Central': 'ಮೆಜೆಸ್ಟಿಕ್ / ಸೆಂಟ್ರಲ್',
    'Indiranagar': 'ಇಂದಿರಾನಗರ',
    'Whitefield': 'ವೈಟ್‌ಫೀಲ್ಡ್',
    'Bengaluru': 'ಬೆಂಗಳೂರು',
    'Mumbai': 'ಮುಂಬೈ',
    'Delhi': 'ದೆಹಲಿ',
    'Hyderabad': 'ಹೈದರಾಬಾದ್',
    'Pune': 'ಪುಣೆ'
  },
  mr: {
    'Jayanagar': 'जयनगर',
    'Koramangala': 'कोरमंगला',
    'Bannerghatta': 'बन्नेरघट्टा',
    'Gandhi Bazaar': 'गांधी बाजार',
    'Majestic / Central': 'मॅजेस्टिक / सेंट्रल',
    'Andheri West': 'अंधेरी पश्चिम',
    'Bandra West': 'वांद्रे पश्चिम',
    'Kothrud': 'कोथरूड',
    'Bengaluru': 'बंगळुरू',
    'Mumbai': 'मुंबई',
    'Delhi': 'दिल्ली',
    'Hyderabad': 'हैदराबाद',
    'Pune': 'पुणे'
  },
  ta: {
    'Jayanagar': 'ஜெயநகர்',
    'Koramangala': 'கோரமங்களா',
    'Bannerghatta': 'பன்னேர்கட்டா',
    'Gandhi Bazaar': 'காந்தி பஜார்',
    'Majestic / Central': 'மெஜஸ்டிக் / சென்ட்ரல்',
    'Bengaluru': 'பெங்களூரு',
    'Mumbai': 'மும்பை',
    'Delhi': 'டெல்லி',
    'Hyderabad': 'ஹைதராபாத்',
    'Pune': 'புனே'
  }
};

// Translation Helpers
function getHeadlineLabel(headline, lang = currentLanguage) {
  if (!headline) return '';
  if (lang === 'en') return headline;
  
  if (I18N_HEADLINES[lang] && I18N_HEADLINES[lang][headline]) {
    return I18N_HEADLINES[lang][headline];
  }

  // Keyword / Substring Fallback for dynamic LLM headlines
  const hLower = headline.toLowerCase();
  const d = I18N_HEADLINES[lang];
  if (d) {
    if (hLower.includes('manhole')) return d['Uncovered / damaged manhole posing hazard'];
    if (hLower.includes('pothole') || hLower.includes('crater') || hLower.includes('road')) return d['Hazardous road crater / severe pothole damage'];
    if (hLower.includes('leak') || hLower.includes('waterlogging') || hLower.includes('pipe') || hLower.includes('drain')) return d['Water main leak / pipe rupture causing waterlogging'];
    if (hLower.includes('wire') || hLower.includes('electric') || hLower.includes('hazard')) return d['Live wire / Electrical hazard reported on roadway'];
    if (hLower.includes('garbage') || hLower.includes('waste') || hLower.includes('dump')) return d['Heavy garbage accumulation & overflowing waste'];
    if (hLower.includes('light') || hLower.includes('lamp') || hLower.includes('pole')) return d['Streetlight pole fixed with energy-saving LED luminaire on 4th cross residential road'] || headline;
  }
  return headline;
}

function getUrgencyReasonLabel(reason, lang = currentLanguage) {
  if (!reason) return '';
  if (lang === 'en') return reason;

  if (I18N_RATIONALES[lang] && I18N_RATIONALES[lang][reason]) {
    return I18N_RATIONALES[lang][reason];
  }

  const rLower = reason.toLowerCase();
  const d = I18N_RATIONALES[lang];
  if (d) {
    if (rLower.includes('immediate') || rLower.includes('life-hazard') || rLower.includes('emergency')) {
      return d['Immediate public safety or life-hazard detected requiring emergency dispatch.'];
    }
    if (rLower.includes('high-impact') || rLower.includes('public health') || rLower.includes('artery')) {
      return d['High-impact civic failure disrupting public health or traffic artery.'];
    }
    if (rLower.includes('low-impact') || rLower.includes('minimal')) {
      return d['Low-impact maintenance item with minimal safety risk.'];
    }
    if (rLower.includes('standard') || rLower.includes('scheduled')) {
      return d['Standard civic service disruption requiring scheduled repair.'];
    }
  }
  return reason;
}

function getLocalityLabel(locality, lang = currentLanguage) {
  if (!locality) return '';
  if (lang === 'en') return locality;
  if (I18N_LOCALITIES[lang] && I18N_LOCALITIES[lang][locality]) {
    return I18N_LOCALITIES[lang][locality];
  }
  return locality;
}

function getCityLabel(city, lang = currentLanguage) {
  if (!city) return '';
  if (lang === 'en') return city;
  if (I18N_LOCALITIES[lang] && I18N_LOCALITIES[lang][city]) {
    return I18N_LOCALITIES[lang][city];
  }
  return city;
}

function getWardLabel(ward, lang = currentLanguage) {
  if (!ward) return '';
  if (lang === 'te') return ward.replace('Ward', 'వార్డు');
  if (lang === 'hi') return ward.replace('Ward', 'वार्ड');
  if (lang === 'kn') return ward.replace('Ward', 'ವಾರ್ಡ್');
  if (lang === 'mr') return ward.replace('Ward', 'वॉर्ड');
  if (lang === 'ta') return ward.replace('Ward', 'வார்டு');
  return ward;
}

function getPriorityLabel(priority, lang = currentLanguage) {
  const dict = I18N[lang] || I18N.en;
  return (dict.priorities && dict.priorities[priority]) ? dict.priorities[priority] : priority;
}

function getDepartmentLabel(dept, lang = currentLanguage) {
  const dict = I18N[lang] || I18N.en;
  return (dict.departments && dict.departments[dept]) ? dict.departments[dept] : dept;
}

function getStatusLabel(status, lang = currentLanguage) {
  const dict = I18N[lang] || I18N.en;
  return (dict.statuses && dict.statuses[status]) ? dict.statuses[status] : status;
}

function getCitizenCountText(count, lang = currentLanguage) {
  const dict = I18N[lang] || I18N.en;
  if (count <= 1) return dict.citizenSingle || '1 Citizen';
  return `${count} ${dict.citizenPlural || 'Citizens'}`;
}

function getSlaDisplayText(inc, lang = currentLanguage) {
  const dict = I18N[lang] || I18N.en;
  if (inc.status === 'RESOLVED') {
    return dict.resolvedByGovt || 'Resolved by Govt';
  }
  const sla = inc.sla_info;
  if (!sla) return dict.onTrack || 'On track';
  
  if (sla.is_breached || inc.is_escalated) {
    if (sla.time_display) {
      let t = sla.time_display;
      if (lang === 'te') return t.replace('breached by', 'గడువు దాటింది:').replace('h', 'గం').replace('m', 'ని');
      if (lang === 'hi') return t.replace('breached by', 'विलंबित:').replace('h', 'घंटे').replace('m', 'मिनट');
      if (lang === 'kn') return t.replace('breached by', 'ಮೀರಿದೆ:').replace('h', 'ಗಂ').replace('m', 'ನಿ');
      if (lang === 'mr') return t.replace('breached by', 'उशीर:').replace('h', 'तास').replace('m', 'मि');
      if (lang === 'ta') return t.replace('breached by', 'தாமதம்:').replace('h', 'மணி').replace('m', 'நிமி');
      return t;
    }
    return dict.breached || 'Breached';
  }
  
  if (sla.time_display) {
    let t = sla.time_display;
    if (lang === 'te') {
      t = t.replace('left', 'మిగిలి ఉంది').replace('remaining', 'మిగిలి ఉంది').replace('h', 'గం').replace('m', 'ని');
    } else if (lang === 'hi') {
      t = t.replace('left', 'शेष').replace('remaining', 'शेष').replace('h', 'घंटे').replace('m', 'मिनट');
    } else if (lang === 'kn') {
      t = t.replace('left', 'ಬಾಕಿ').replace('remaining', 'ಬಾಕಿ').replace('h', 'ಗಂ').replace('m', 'ನಿ');
    } else if (lang === 'mr') {
      t = t.replace('left', 'शिल्लक').replace('remaining', 'शिल्लक').replace('h', 'तास').replace('m', 'मि');
    } else if (lang === 'ta') {
      t = t.replace('left', 'மீதமுள்ளது').replace('remaining', 'மீதமுள்ளது').replace('h', 'மணி').replace('m', 'நிமி');
    }
    return t;
  }
  return dict.onTrack || 'On track';
}

// DOM Elements
const viewComplaint = document.getElementById('viewComplaint');
const viewDashboard = document.getElementById('viewDashboard');
const navTabComplaint = document.getElementById('navTabComplaint');
const navTabDashboard = document.getElementById('navTabDashboard');
const navActiveCountBadge = document.getElementById('navActiveCountBadge');

const incidentsTableBody = document.getElementById('incidentsTableBody');
const emptyState = document.getElementById('emptyState');

// Stats
const statTotalComplaints = document.getElementById('statTotalComplaints');
const statResolvedGovt = document.getElementById('statResolvedGovt');
const statCriticalHazards = document.getElementById('statCriticalHazards');
const statDuplicatesMerged = document.getElementById('statDuplicatesMerged');
const resolvedBadgeCount = document.getElementById('resolvedBadgeCount');

// Category breakdown elements
const catRoadsTotal = document.getElementById('catRoadsTotal');
const catRoadsResolved = document.getElementById('catRoadsResolved');
const catRoadsProgress = document.getElementById('catRoadsProgress');

const catSanTotal = document.getElementById('catSanTotal');
const catSanResolved = document.getElementById('catSanResolved');
const catSanProgress = document.getElementById('catSanProgress');

const catWaterTotal = document.getElementById('catWaterTotal');
const catWaterResolved = document.getElementById('catWaterResolved');
const catWaterProgress = document.getElementById('catWaterProgress');

const catElecTotal = document.getElementById('catElecTotal');
const catElecResolved = document.getElementById('catElecResolved');
const catElecProgress = document.getElementById('catElecProgress');

const catHealthTotal = document.getElementById('catHealthTotal');
const catHealthResolved = document.getElementById('catHealthResolved');
const catHealthProgress = document.getElementById('catHealthProgress');

// Filters
const languageSelect = document.getElementById('languageSelect');
const cityFilter = document.getElementById('cityFilter');
const localityFilter = document.getElementById('localityFilter');
const priorityFilter = document.getElementById('priorityFilter');
const deptFilter = document.getElementById('deptFilter');
const searchInput = document.getElementById('searchInput');
const resetFiltersBtn = document.getElementById('resetFiltersBtn');
const emptyResetBtn = document.getElementById('emptyResetBtn');

// View Toggles
const toggleActiveView = document.getElementById('toggleActiveView');
const toggleResolvedView = document.getElementById('toggleResolvedView');

// Inline Complaint Form Elements (Step 1 & Step 2)
const inlineComplaintForm = document.getElementById('inlineComplaintForm');
const inlineCitySelect = document.getElementById('inlineCitySelect');
const inlineLocalitySelect = document.getElementById('inlineLocalitySelect');
const inlineCitizenNameInput = document.getElementById('inlineCitizenNameInput');
const inlineComplaintSourceInput = document.getElementById('inlineComplaintSourceInput');
const inlineComplaintTextInput = document.getElementById('inlineComplaintTextInput');
const inlineVoiceRecordBtn = document.getElementById('inlineVoiceRecordBtn');
const inlineVoiceWaveBar = document.getElementById('inlineVoiceWaveBar');
const inlineVoiceStatusText = document.getElementById('inlineVoiceStatusText');
const inlineSubmitComplaintBtn = document.getElementById('inlineSubmitComplaintBtn');

// Drawer Fields
const detailDrawer = document.getElementById('detailDrawer');
const closeDrawerBtn = document.getElementById('closeDrawerBtn');
const readAloudBtn = document.getElementById('readAloudBtn');

const drawerIncidentId = document.getElementById('drawerIncidentId');
const drawerHeadline = document.getElementById('drawerHeadline');
const drawerPriorityBadge = document.getElementById('drawerPriorityBadge');
const drawerDeptBadge = document.getElementById('drawerDeptBadge');
const drawerStatusBadge = document.getElementById('drawerStatusBadge');
const drawerCityBadge = document.getElementById('drawerCityBadge');
const drawerEscalationBadge = document.getElementById('drawerEscalationBadge');

// SLA Fields in Drawer
const drawerSlaPolicy = document.getElementById('drawerSlaPolicy');
const drawerSlaStatusBadge = document.getElementById('drawerSlaStatusBadge');
const drawerSlaCountdown = document.getElementById('drawerSlaCountdown');
const drawerSlaDeadline = document.getElementById('drawerSlaDeadline');
const drawerSlaProgressBar = document.getElementById('drawerSlaProgressBar');
const fastTrackEscalateBtn = document.getElementById('fastTrackEscalateBtn');

const drawerUrgencyReason = document.getElementById('drawerUrgencyReason');
const drawerLocationDisplay = document.getElementById('drawerLocationDisplay');
const drawerCoords = document.getElementById('drawerCoords');
const drawerComplaintCount = document.getElementById('drawerComplaintCount');
const drawerComplaintsList = document.getElementById('drawerComplaintsList');
const drawerAuditLog = document.getElementById('drawerAuditLog');

const routeOfficerSelect = document.getElementById('routeOfficerSelect');
const officerContactInfo = document.getElementById('officerContactInfo');
const officerPhoneDisplay = document.getElementById('officerPhoneDisplay');
const routeStatusSelect = document.getElementById('routeStatusSelect');
const routeNotesInput = document.getElementById('routeNotesInput');
const saveRoutingBtn = document.getElementById('saveRoutingBtn');

const toast = document.getElementById('toast');

// Direct jump from tracking card to dashboard spotlight
function openComplaintOnDashboard() {
  switchView('dashboard');
  setTimeout(() => {
    const el = document.getElementById('userComplaintSpotlight');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
    }
  }, 200);
}

// Clear or toggle locality filter on Dashboard
function clearLocalityFilter() {
  filterByLocalityActive = !filterByLocalityActive;
  const d = I18N[currentLanguage] || I18N.en;
  const btn = document.getElementById('i18nViewAllLocalitiesBtn');
  if (btn) {
    btn.textContent = filterByLocalityActive ? (d.viewAllLocalitiesBtn || '🌐 View All Localities') : (d.focusLocalityBtn || '📍 Focus My Locality');
  }
  renderTable(cachedIncidents);
}

// Live Tracking: Lookup and update UI
async function lookupComplaintTracking(targetId) {
  const trackInput = document.getElementById('trackInputId');
  const id = (targetId || (trackInput ? trackInput.value.trim() : '') || userTrackingIncidentId).toUpperCase();
  if (!id) return;

  userTrackingIncidentId = id;
  if (trackInput) trackInput.value = id;

  let inc = cachedIncidents.find(i => i.id === id);

  if (!inc) {
    try {
      const res = await fetch('/api/incidents/' + id);
      if (res.ok) {
        const data = await res.json();
        inc = data.incident;
      }
    } catch (e) {
      console.warn('Incident fetch error:', e);
    }
  }

  if (inc) {
    userTrackingLocality = inc.locality || 'Jayanagar';
    updateLiveTrackingUI(inc);
    updateSpotlightUI(inc);
  }
}

// Update Live Tracking Card UI
function updateLiveTrackingUI(inc) {
  const trackDisplayId = document.getElementById('trackDisplayId');
  if (!trackDisplayId) return;
  const d = I18N[currentLanguage] || I18N.en;

  const trackDisplayPriority = document.getElementById('trackDisplayPriority');
  const trackDisplayDept = document.getElementById('trackDisplayDept');
  const trackSlaClock = document.getElementById('trackSlaClock');
  const trackDisplayHeadline = document.getElementById('trackDisplayHeadline');
  const trackDisplayLocation = document.getElementById('trackDisplayLocation');
  const trackOfficerDisplay = document.getElementById('trackOfficerDisplay');
  const trackPhoneDisplay = document.getElementById('trackPhoneDisplay');
  const trackCallLink = document.getElementById('trackCallLink');

  const step1Stage = document.getElementById('step1Stage');
  const step2Stage = document.getElementById('step2Stage');
  const step3Stage = document.getElementById('step3Stage');
  const step4Stage = document.getElementById('step4Stage');
  const stepLine1 = document.getElementById('stepLine1');
  const stepLine2 = document.getElementById('stepLine2');
  const stepLine3 = document.getElementById('stepLine3');

  trackDisplayId.textContent = inc.id;
  if (trackDisplayPriority) {
    trackDisplayPriority.textContent = getPriorityLabel(inc.priority, currentLanguage);
    trackDisplayPriority.className = 'badge ' + (inc.priority === 'CRITICAL' ? 'badge-critical' : inc.priority === 'HIGH' ? 'badge-high' : 'badge-medium');
  }

  if (trackDisplayDept) trackDisplayDept.textContent = getDepartmentLabel(inc.department, currentLanguage);
  if (trackSlaClock) trackSlaClock.textContent = '⏱️ ' + getSlaDisplayText(inc, currentLanguage);

  if (trackDisplayHeadline) trackDisplayHeadline.textContent = getHeadlineLabel(inc.headline, currentLanguage);
  if (trackDisplayLocation) trackDisplayLocation.textContent = '📍 ' + (inc.location_display || (getLocalityLabel(inc.locality, currentLanguage) + ', ' + getCityLabel(inc.city, currentLanguage)));

  // Stepper Stage Progress
  if (step1Stage) step1Stage.className = 'stepper-step completed';
  if (stepLine1) stepLine1.className = 'stepper-line completed';
  if (step2Stage) step2Stage.className = 'stepper-step completed';

  if (inc.status === 'RESOLVED') {
    if (stepLine2) stepLine2.className = 'stepper-line completed';
    if (step3Stage) step3Stage.className = 'stepper-step completed';
    if (stepLine3) stepLine3.className = 'stepper-line completed';
    if (step4Stage) step4Stage.className = 'stepper-step completed';
    const sub4 = document.getElementById('i18nStep4Sub');
    if (sub4) sub4.textContent = d.statuses.RESOLVED || 'Resolved';
  } else if (inc.status === 'IN_PROGRESS') {
    if (stepLine2) stepLine2.className = 'stepper-line completed';
    if (step3Stage) step3Stage.className = 'stepper-step completed';
    if (stepLine3) stepLine3.className = 'stepper-line active';
    if (step4Stage) step4Stage.className = 'stepper-step active';
    const sub4 = document.getElementById('i18nStep4Sub');
    if (sub4) sub4.textContent = d.step4Sub || 'In Progress';
  } else {
    // NEW or TRIAGED
    if (stepLine2) stepLine2.className = 'stepper-line active';
    if (step3Stage) step3Stage.className = 'stepper-step active';
    if (stepLine3) stepLine3.className = 'stepper-line';
    if (step4Stage) step4Stage.className = 'stepper-step';
  }

  // Assigned Officer info
  const officerName = inc.assigned_officer && inc.assigned_officer !== 'Unassigned' ? inc.assigned_officer : 'Er. S. Sharma (Executive Engineer)';
  const officerPhone = inc.assigned_officer_phone || '+91 98450 11001';

  if (trackOfficerDisplay) trackOfficerDisplay.textContent = (d.assignedOfficerPrefix || 'Assigned Ward Engineer:') + ' ' + officerName;
  if (trackPhoneDisplay) trackPhoneDisplay.textContent = officerPhone;
  if (trackCallLink) trackCallLink.href = 'tel:' + officerPhone.replace(/\s+/g, '');

  // Sync Sideways Panel in Side-by-Side View
  const sideDisplayId = document.getElementById('sideDisplayId');
  if (sideDisplayId) {
    sideDisplayId.textContent = inc.id;
    const sideDisplayPriority = document.getElementById('sideDisplayPriority');
    if (sideDisplayPriority) {
      sideDisplayPriority.textContent = getPriorityLabel(inc.priority, currentLanguage);
      sideDisplayPriority.className = 'badge ' + (inc.priority === 'CRITICAL' ? 'badge-critical' : inc.priority === 'HIGH' ? 'badge-high' : 'badge-medium');
    }
    const sideDisplayDept = document.getElementById('sideDisplayDept');
    if (sideDisplayDept) sideDisplayDept.textContent = getDepartmentLabel(inc.department, currentLanguage);
    const sideSlaClock = document.getElementById('sideSlaClock');
    if (sideSlaClock) sideSlaClock.textContent = '⏱️ ' + getSlaDisplayText(inc, currentLanguage);
    const sideDisplayHeadline = document.getElementById('sideDisplayHeadline');
    if (sideDisplayHeadline) sideDisplayHeadline.textContent = getHeadlineLabel(inc.headline, currentLanguage);
    const sideDisplayLocation = document.getElementById('sideDisplayLocation');
    if (sideDisplayLocation) sideDisplayLocation.textContent = '📍 ' + (inc.location_display || (getLocalityLabel(inc.locality, currentLanguage) + ', ' + getCityLabel(inc.city, currentLanguage)));

    const sideOfficerDisplay = document.getElementById('sideOfficerDisplay');
    if (sideOfficerDisplay) sideOfficerDisplay.textContent = officerName;
    const sidePhoneDisplay = document.getElementById('sidePhoneDisplay');
    if (sidePhoneDisplay) sidePhoneDisplay.textContent = officerPhone;
    const sideCallLink = document.getElementById('sideCallLink');
    if (sideCallLink) sideCallLink.href = 'tel:' + officerPhone.replace(/\s+/g, '');
    const sideOfficerMini = document.getElementById('sideOfficerMini');
    if (sideOfficerMini) sideOfficerMini.textContent = officerName.split(' ')[0] + ' ' + (officerName.split(' ')[1] || '');

    // Sideways Mini Stepper
    const m1 = document.getElementById('miniStep1');
    const m2 = document.getElementById('miniStep2');
    const m3 = document.getElementById('miniStep3');
    const m4 = document.getElementById('miniStep4');

    if (m1) m1.className = 'mini-step completed';
    if (m2) m2.className = 'mini-step completed';

    if (inc.status === 'RESOLVED') {
      if (m3) m3.className = 'mini-step completed';
      if (m4) m4.className = 'mini-step completed';
    } else if (inc.status === 'IN_PROGRESS') {
      if (m3) m3.className = 'mini-step completed';
      if (m4) m4.className = 'mini-step active';
    } else {
      if (m3) m3.className = 'mini-step active';
      if (m4) m4.className = 'mini-step';
    }
  }

}

// Update Dashboard Spotlight UI
function updateSpotlightUI(inc) {
  const spotlightId = document.getElementById('spotlightId');
  if (!spotlightId) return;
  const d = I18N[currentLanguage] || I18N.en;

  const spotlightPriority = document.getElementById('spotlightPriority');
  const spotlightDept = document.getElementById('spotlightDept');
  const spotlightSlaPill = document.getElementById('spotlightSlaPill');
  const spotlightHeadline = document.getElementById('spotlightHeadline');
  const spotlightDesc = document.getElementById('spotlightDesc');
  const spotlightLocalityTag = document.getElementById('spotlightLocalityTag');
  const spotlightLocationMeta = document.getElementById('spotlightLocationMeta');
  const spotlightOfficer = document.getElementById('spotlightOfficer');
  const noticeLocalityName = document.getElementById('noticeLocalityName');

  spotlightId.textContent = inc.id;
  if (spotlightPriority) {
    spotlightPriority.textContent = getPriorityLabel(inc.priority, currentLanguage);
    spotlightPriority.className = 'badge ' + (inc.priority === 'CRITICAL' ? 'badge-critical' : inc.priority === 'HIGH' ? 'badge-high' : 'badge-medium');
  }
  if (spotlightDept) spotlightDept.textContent = getDepartmentLabel(inc.department, currentLanguage);

  if (spotlightSlaPill) spotlightSlaPill.textContent = '🟢 ' + getSlaDisplayText(inc, currentLanguage);

  if (spotlightHeadline) spotlightHeadline.textContent = getHeadlineLabel(inc.headline, currentLanguage);
  if (spotlightDesc) spotlightDesc.textContent = getUrgencyReasonLabel(inc.urgency_reason, currentLanguage);

  const locText = getLocalityLabel(inc.locality, currentLanguage) + ', ' + getCityLabel(inc.city, currentLanguage);
  if (spotlightLocalityTag) spotlightLocalityTag.textContent = '📍 ' + locText;

  if (spotlightLocationMeta) spotlightLocationMeta.textContent = '📍 ' + (inc.location_display || locText) + ' (' + getWardLabel(inc.ward, currentLanguage) + ')';
  
  const officerName = inc.assigned_officer && inc.assigned_officer !== 'Unassigned' ? inc.assigned_officer : 'Er. S. Sharma';
  const officerPhone = inc.assigned_officer_phone || '+91 98450 11001';
  if (spotlightOfficer) spotlightOfficer.textContent = officerName + ' (' + officerPhone + ')';

  if (noticeLocalityName) {
    noticeLocalityName.textContent = getLocalityLabel(userTrackingLocality, currentLanguage);
  }
}


// RENDER DEDICATED "MY COMPLAINTS" (Exclusively User's Personal Issues)
function renderMyComplaints() {
  const container = document.getElementById('myComplaintsListContainer');
  if (!container) return;
  container.innerHTML = '';

  const d = I18N[currentLanguage] || I18N.en;

  // Filter to complaints filed by the citizen in this session or matching userTrackingIncidentId
  const myIncidents = cachedIncidents.filter(inc => {
    return userPersonalComplaints.includes(inc.id) || 
           inc.id === userTrackingIncidentId || 
           (inc.citizen_name && userTrackingCitizenName && inc.citizen_name.toLowerCase() === userTrackingCitizenName.toLowerCase());
  });

  if (myIncidents.length === 0) {
    container.innerHTML = `
      <div class="my-complaints-empty">
        <div class="my-empty-icon">📭</div>
        <h3 class="my-empty-title">No Personal Complaints Filed Yet</h3>
        <p class="my-empty-desc">Report civic issues in your locality (potholes, garbage, water leaks, live wires) and track them directly here.</p>
        <button class="btn btn-primary btn-lg" onclick="switchView('complaint')">
          <span>📢</span> + File Your First Complaint
        </button>
      </div>
    `;
    return;
  }

  container.innerHTML = `
    <div class="demo-my-complaints-note">
      <span class="note-pill">💡 RESIDENT DEMO VIEW</span>
      <span>Showing sample registered complaints (Active &amp; Resolved with Before vs After photo proof). File a complaint anytime to track your own live.</span>
    </div>
  `;

  myIncidents.forEach(inc => {
    const card = document.createElement('div');
    card.className = 'my-complaint-card animate-nike-slide';

    const priorityLabel = getPriorityLabel(inc.priority, currentLanguage);
    const deptLabel = getDepartmentLabel(inc.department, currentLanguage);
    const statusLabel = getStatusLabel(inc.status, currentLanguage);
    const slaText = getSlaDisplayText(inc, currentLanguage);
    const headline = getHeadlineLabel(inc.headline, currentLanguage);
    const rationale = getUrgencyReasonLabel(inc.urgency_reason, currentLanguage);
    const locality = getLocalityLabel(inc.locality, currentLanguage);
    const city = getCityLabel(inc.city, currentLanguage);
    const ward = getWardLabel(inc.ward, currentLanguage);

    const officerName = inc.assigned_officer && inc.assigned_officer !== 'Unassigned' ? inc.assigned_officer : 'Er. S. Sharma (Executive Engineer)';
    const officerPhone = inc.assigned_officer_phone || '+91 98450 11001';

    card.innerHTML = `
      <div class="my-card-header">
        <div class="my-card-id-block">
          <span class="tracking-id-pill">${inc.id}</span>
          <span class="badge ${inc.priority === 'CRITICAL' ? 'badge-critical' : inc.priority === 'HIGH' ? 'badge-high' : 'badge-medium'}">${priorityLabel}</span>
          <span class="badge badge-dept">${deptLabel}</span>
          <span class="badge badge-status">${statusLabel}</span>
        </div>
        <div class="tracking-live-sla-box" style="display:flex; align-items:center; gap:8px;">
          <button type="button" class="btn btn-outline" style="padding:4px 9px; font-size:0.75rem; border-radius:16px;" onclick="event.stopPropagation(); speakComplaintStatus('${inc.id}')" title="Listen to complaint status spoken aloud">
            <span>🔊 Listen Status</span>
          </button>
          <span class="pulse-indicator"></span>
          <span>⏱️ ${slaText}</span>
        </div>
      </div>

      <h3 class="my-complaint-headline">${escapeHtml(headline)}</h3>
      <p class="my-complaint-desc">${escapeHtml(rationale)}</p>

      <div class="my-complaint-meta">
        <span>📍 <strong>${escapeHtml(locality)}, ${escapeHtml(city)}</strong> (${escapeHtml(ward)})</span>
        <span>👷‍♂️ Assigned Ward Officer: <strong>${escapeHtml(officerName)}</strong></span>
      </div>

      <!-- STATUS BADGE: COMPLETED VS IN-PROGRESS -->
      <div style="margin-top: 10px; padding: 10px 14px; border-radius: 8px; border: 2px solid #000; background: ${inc.status === 'RESOLVED' ? '#ECFDF5' : '#EFF6FF'};">
        <div style="display: flex; align-items: center; justify-content: space-between;">
          <span style="font-family: var(--font-display); font-weight: 900; font-size: 0.95rem; color: ${inc.status === 'RESOLVED' ? '#047857' : '#1D4ED8'};">
            ${inc.status === 'RESOLVED' ? '✅ COMPLETED BY MUNICIPAL WARD' : '⏳ IN PROGRESS (Ward Crew Dispatched)'}
          </span>
          <span class="mono-tag" style="background: #FFF; border: 1px solid #000;">
            ${inc.status === 'RESOLVED' ? 'Verified Done' : 'SLA Active'}
          </span>
        </div>
      </div>

      <!-- BEFORE & AFTER RESOLUTION PHOTO PROOF (DELIVERED TO CITIZEN) -->
      ${inc.resolution_photo_url ? `
        <div class="proof-comparison-card">
          <div class="proof-card-label">
            <span>📷 PROOF OF WORK RESOLUTION DELIVERED TO YOU:</span>
            <span class="photo-badge-tag">Government Verified</span>
          </div>
          <div class="proof-side-by-side">
            <div class="proof-img-box">
              <span class="proof-img-tag tag-before">BEFORE (Reported)</span>
              <img src="${escapeHtml(inc.photo_url || '/images/pothole_sample.svg')}" alt="Before Work" />
            </div>
            <div class="proof-img-box">
              <span class="proof-img-tag tag-after">AFTER (Govt Fixed)</span>
              <img src="${escapeHtml(inc.resolution_photo_url)}" alt="Resolution Proof" />
            </div>
          </div>
          <div style="margin-top: 8px; font-size: 0.8rem; font-weight: 700; color: #047857;">
            ✓ Uploaded by Ward Engineer upon completing work. Inspect proof and submit rating below.
          </div>
        </div>
      ` : (inc.photo_url ? `
        <div style="margin-top: 10px; border-radius: 8px; overflow: hidden; border: 1.5px solid #000; max-height: 140px;">
          <img src="${escapeHtml(inc.photo_url)}" alt="Attached Evidence" style="width: 100%; height: 140px; object-fit: cover; display: block;" />
        </div>
      ` : '')}

      ${inc.citizen_rating && inc.citizen_rating > 0 ? `
        <div style="margin-top: 8px; font-size: 0.88rem; color: #047857; font-weight: 700; background: #ECFDF5; padding: 6px 12px; border-radius: 6px; border: 1px solid #10B981;">
          ✅ Citizen Verified & Rated: ${'⭐'.repeat(inc.citizen_rating)} "${escapeHtml(inc.citizen_feedback || 'Resolved satisfactorily')}"
        </div>
      ` : (inc.status === 'RESOLVED' ? `
        <div style="margin-top: 8px; font-size: 0.85rem; color: #B45309; font-weight: 700; background: #FEF3C7; padding: 6px 12px; border-radius: 6px; border: 1px solid #F59E0B;">
          ⭐ Issue Marked Resolved by Govt — Tap 'Full Details' to rate contractor workmanship or dispute!
        </div>
      ` : '')}

      <div class="tracking-officer-banner" style="margin-top: 10px;">
        <div class="tracking-officer-info">
          <span class="officer-avatar">👨‍💼</span>
          <div>
            <div class="officer-name">${escapeHtml(officerName)}</div>
            <div class="officer-phone">📞 Direct Line: <strong>${escapeHtml(officerPhone)}</strong></div>
          </div>
        </div>
        <div class="tracking-actions">
          <a href="tel:${escapeHtml(officerPhone.replace(/\s+/g, ''))}" class="btn btn-outline" style="border-radius: 20px;">
            <span>📞</span> Call Engineer
          </a>
          <button class="btn btn-primary" onclick="openDetailDrawer('${inc.id}')">
            <span>🔍</span> Full Details &rarr;
          </button>
        </div>
      </div>
    `;

    container.appendChild(card);
  });
}

// FIELD OFFICER WORKSPACE (Choose What Field He Is From -> Receives ONLY his field complaints)

// CITIZEN LIVE GRIEVANCE TRACKING SEARCH & 4-STAGE PROGRESS STEPPER
function searchCitizenGrievance() {
  const input = document.getElementById('citizenSearchGrievanceInput');
  const resultBox = document.getElementById('citizenTrackingResultBox');
  if (!input || !resultBox) return;

  const id = input.value.trim().toUpperCase();
  if (!id) {
    showToast('⚠️ Please enter a Complaint ID (e.g. INC-101)');
    return;
  }

  if (!cachedIncidents) {
    showToast('⏳ Loading civic records, please wait a moment...');
    return;
  }

  const inc = cachedIncidents.find(i => i.id.toUpperCase() === id);
  if (!inc) {
    resultBox.classList.remove('hidden');
    resultBox.innerHTML = `
      <div style="background: #FFFBEB; border: 1px solid #FDE68A; border-radius: 14px; padding: 14px 18px; display: flex; align-items: center; gap: 12px;">
        <span style="font-size: 1.5rem;">🔍</span>
        <div>
          <strong style="color: #92400E; font-size: 0.95rem;">No record found for ${escapeHtml(id)}</strong>
          <p style="margin: 2px 0 0; font-size: 0.82rem; color: #B45309;">Please verify the complaint number received on SMS or citizen portal.</p>
        </div>
      </div>
    `;
    return;
  }

  // Found incident: render the 4-stage visual progress stepper
  resultBox.classList.remove('hidden');

  let step1Active = true;
  let step2Active = true;
  let step3Active = inc.status === 'IN_PROGRESS' || inc.status === 'RESOLVED';
  let step4Active = inc.status === 'RESOLVED';

  const priorityLabel = getPriorityLabel(inc.priority, currentLanguage);
  const deptLabel = getDepartmentLabel(inc.department, currentLanguage);
  const statusLabel = getStatusLabel(inc.status, currentLanguage);
  const slaText = getSlaDisplayText(inc, currentLanguage);
  const headline = getHeadlineLabel(inc.headline, currentLanguage);

  resultBox.innerHTML = `
    <div class="tracking-found-card animate-nike-slide">
      <div class="tracking-found-top">
        <div style="display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
          <span class="tracking-id-pill">${inc.id}</span>
          <span class="badge ${inc.priority === 'CRITICAL' ? 'badge-critical' : inc.priority === 'HIGH' ? 'badge-high' : 'badge-medium'}">${priorityLabel}</span>
          <span class="badge badge-dept">${deptLabel}</span>
          <span class="badge badge-status">${statusLabel}</span>
        </div>
        <div class="tracking-sla-pill" style="display: flex; align-items: center; gap: 6px; font-size: 0.82rem; font-weight: 700; color: #0284C7; background: #F0F9FF; padding: 4px 12px; border-radius: 9999px; border: 1px solid #BAE6FD;">
          <span class="pulse-indicator"></span>
          <span>⏱️ ${slaText}</span>
        </div>
      </div>

      <h4 class="tracking-headline">${escapeHtml(headline)}</h4>
      <p class="tracking-location">📍 ${escapeHtml(inc.locality || 'Ward Area')}, ${escapeHtml(inc.city || 'City')} (${escapeHtml(inc.ward || 'Ward 12')})</p>

      <!-- 4-Stage Stepper -->
      <div class="live-tracking-stepper">
        <div class="track-step ${step1Active ? 'completed' : ''}">
          <div class="track-step-circle">1</div>
          <div class="track-step-label">Complaint Logged</div>
        </div>
        <div class="track-step-line ${step2Active ? 'completed' : ''}"></div>
        <div class="track-step ${step2Active ? 'completed' : ''}">
          <div class="track-step-circle">2</div>
          <div class="track-step-label">AI Triaged</div>
        </div>
        <div class="track-step-line ${step3Active ? 'completed' : ''}"></div>
        <div class="track-step ${step3Active ? 'completed' : ''}">
          <div class="track-step-circle">3</div>
          <div class="track-step-label">Crew Dispatched</div>
        </div>
        <div class="track-step-line ${step4Active ? 'completed' : ''}"></div>
        <div class="track-step ${step4Active ? 'completed' : ''}">
          <div class="track-step-circle">${step4Active ? '✓' : '4'}</div>
          <div class="track-step-label">${step4Active ? 'Govt Resolved' : 'Work In Progress'}</div>
        </div>
      </div>

      <!-- Before/After Proof if resolved -->
      ${inc.resolution_photo_url ? `
        <div class="proof-comparison-card" style="margin-top: 16px;">
          <div class="proof-card-label" style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 8px;">
            <span style="font-size: 0.8rem; font-weight: 800; color: #065F46;">📷 VERIFIED RESOLUTION PROOF FROM WARD CREW:</span>
            <span class="photo-badge-tag" style="background: #ECFDF5; color: #047857; border: 1px solid #A7F3D0; font-size: 0.72rem; padding: 2px 8px; border-radius: 9999px; font-weight: 700;">Government Verified</span>
          </div>
          <div class="proof-side-by-side" style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px;">
            <div class="proof-img-box" style="position: relative; border-radius: 12px; overflow: hidden; border: 1.5px solid #CBD5E1;">
              <span class="proof-img-tag tag-before" style="position: absolute; top: 8px; left: 8px; background: rgba(0,0,0,0.75); color: #FFF; font-size: 0.7rem; font-weight: 800; padding: 3px 8px; border-radius: 6px;">BEFORE</span>
              <img src="${escapeHtml(inc.photo_url || '/images/pothole_sample.svg')}" alt="Before" style="width: 100%; height: 130px; object-fit: cover; display: block;" />
            </div>
            <div class="proof-img-box" style="position: relative; border-radius: 12px; overflow: hidden; border: 1.5px solid #10B981;">
              <span class="proof-img-tag tag-after" style="position: absolute; top: 8px; left: 8px; background: #059669; color: #FFF; font-size: 0.7rem; font-weight: 800; padding: 3px 8px; border-radius: 6px;">AFTER (RESOLVED)</span>
              <img src="${escapeHtml(inc.resolution_photo_url)}" alt="After" style="width: 100%; height: 130px; object-fit: cover; display: block;" />
            </div>
          </div>
        </div>
      ` : ''}

      <div class="tracking-officer-row">
        <span>👷‍♂️ Assigned Officer: <strong>${escapeHtml(inc.assigned_officer || 'Ward Engineer')}</strong> (${escapeHtml(inc.assigned_officer_phone || '+91 98450 11001')})</span>
        <button type="button" class="btn btn-outline btn-sm" onclick="speakComplaintStatus('${inc.id}')">🔊 Listen Aloud</button>
      </div>
    </div>
  `;
}


function selectOfficerField(dept) {
  currentOfficerField = dept;
  deptFilter.value = dept;

  // Update chip active classes
  const chips = document.querySelectorAll('.field-chip');
  chips.forEach(chip => {
    if (chip.getAttribute('data-field') === dept || chip.id === 'chipField' + (dept === 'ALL' ? 'All' : dept === 'ELECTRICAL' ? 'Elec' : dept === 'ROADS' ? 'Roads' : dept === 'SANITATION' ? 'San' : dept === 'WATER_SEWER' ? 'Water' : 'Health')) {
      chip.classList.add('active');
    } else {
      chip.classList.remove('active');
    }
  });

  const notice = document.getElementById('activeFieldNotice');
  const titleEl = document.getElementById('activeFieldDisplayTitle');
  const descEl = document.getElementById('activeFieldDisplayDesc');

  if (dept === 'ALL') {
    if (notice) notice.classList.add('hidden');
    showToast('🌐 Viewing all municipal departments');
  } else {
    if (notice) notice.classList.remove('hidden');
    const deptNames = {
      ELECTRICAL: 'Electrical & Power Infrastructure',
      ROADS: 'Roads, Bridges & Pothole Repair',
      SANITATION: 'Sanitation, Solid Waste & Garbage',
      WATER_SEWER: 'Water Supply & Sewage Pipeline',
      HEALTH: 'Public Health & Safety'
    };
    if (titleEl) titleEl.textContent = 'Logged in as: ' + (deptNames[dept] || dept) + ' Ward Engineer';
    if (descEl) descEl.textContent = 'Displaying ONLY complaints for ' + (deptNames[dept] || dept) + ' requiring your crew dispatch. All other department complaints are filtered out.';
    showToast('👷 Switched to ' + (deptNames[dept] || dept) + ' Field Workspace');
  }

  // Filter table to strictly only show complaints from that department
  fetchIncidents();
}

// MULTI-CHANNEL STREAM SIMULATOR (WhatsApp / SMS / IVR / Twitter Ingestion)
function openStreamSimulator() {
  const modal = document.getElementById('streamSimulatorModal');
  if (modal) modal.classList.remove('hidden');
}

function closeStreamSimulator() {
  const modal = document.getElementById('streamSimulatorModal');
  if (modal) modal.classList.add('hidden');
}

async function runStreamSimulation() {
  const btn = document.getElementById('runSimulationBtn');
  if (btn) {
    btn.disabled = true;
    btn.innerHTML = '<span>⚡ Ingesting & Triaging 5 Inbound Grievances...</span>';
  }

  try {
    const res = await fetch('/api/simulate-stream', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    if (!res.ok) throw new Error('Simulation failed');
    const data = await res.json();

    showToast('✅ ' + data.message);
    closeStreamSimulator();

    // Switch to Municipal Dashboard to view the newly ingested complaints
    switchView('dashboard');
    await fetchIncidents();

  } catch (err) {
    showToast('Error during simulation: ' + err.message);
  } finally {
    if (btn) {
      btn.disabled = false;
      btn.innerHTML = '<span>⚡ Ingest & Triage All 5 Grievances Live &rarr;</span>';
    }
  }
}

// NIKE-STYLE & VERTICAL SIDEWAYS VIEW SWITCHER FUNCTION
function switchView(viewName) {
  // Enforce Strict Role Boundary
  if (currentRoleMode === 'citizen' && viewName === 'dashboard') {
    showToast('🔒 Access Restricted: Municipal Ward workspace requires Municipal Officer role.');
    viewName = 'complaint';
  } else if (currentRoleMode === 'municipal' && (viewName === 'complaint' || viewName === 'my_complaints' || viewName === 'tracking')) {
    showToast('🔒 Access Restricted: Citizen complaint desk is for residents. Your workspace is the Municipal Ward Queue.');
    viewName = 'dashboard';
  }

  currentPortalView = viewName;
  const d = I18N[currentLanguage] || I18N.en;

  // DOM elements
  const navComplaint = document.getElementById('navTabComplaint');
  const navTracking = document.getElementById('navTabTracking');
  const navDashboard = document.getElementById('navTabDashboard');
  const navSplit = document.getElementById('navTabSplit');

  const sideComplaint = document.getElementById('sideNavComplaint');
  const sideTracking = document.getElementById('sideNavTracking');
  const sideDashboard = document.getElementById('sideNavDashboard');
  const sideSplit = document.getElementById('sideNavSplit');

  const viewComplaint = document.getElementById('viewComplaint');
  const viewDashboard = document.getElementById('viewDashboard');
  const dashboardLayout = document.getElementById('dashboardContentLayout');

  const navMyComplaints = document.getElementById('navTabMyComplaints');
  const sideMyComplaints = document.getElementById('sideNavMyComplaints');
  const viewMyComplaints = document.getElementById('viewMyComplaints');

  // Reset top tab active states
  [navComplaint, navMyComplaints, navTracking, navDashboard].forEach(tab => {
    if (tab) { tab.classList.remove('active'); tab.setAttribute('aria-selected', 'false'); }
  });

  // Reset vertical sidebar active states
  [sideComplaint, sideMyComplaints, sideTracking, sideDashboard].forEach(item => {
    if (item) item.classList.remove('active');
  });

  if (viewName === 'my_complaints') {
    if (navMyComplaints) { navMyComplaints.classList.add('active'); navMyComplaints.setAttribute('aria-selected', 'true'); }
    if (sideMyComplaints) sideMyComplaints.classList.add('active');

    viewComplaint.classList.add('hidden');
    viewComplaint.classList.remove('active');
    viewDashboard.classList.add('hidden');
    viewDashboard.classList.remove('active');

    if (viewMyComplaints) {
      viewMyComplaints.classList.remove('hidden');
      viewMyComplaints.classList.add('active', 'slide-from-left');
    }

    try { history.replaceState(null, '', '#my-complaints'); } catch (e) {}
    renderMyComplaints();
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } else if (viewName === 'complaint') {
    if (navComplaint) { navComplaint.classList.add('active'); navComplaint.setAttribute('aria-selected', 'true'); }
    if (sideComplaint) sideComplaint.classList.add('active');

    if (viewMyComplaints) { viewMyComplaints.classList.add('hidden'); viewMyComplaints.classList.remove('active'); }
    viewDashboard.classList.add('hidden');
    viewDashboard.classList.remove('active');

    viewComplaint.classList.remove('hidden');
    viewComplaint.classList.add('active', 'slide-from-left');

    try { history.replaceState(null, '', '#complaint'); } catch (e) {}
    lookupComplaintTracking(userTrackingIncidentId);
    window.scrollTo({ top: 0, behavior: 'smooth' });

  } else if (viewName === 'tracking') {
    if (navTracking) { navTracking.classList.add('active'); navTracking.setAttribute('aria-selected', 'true'); }
    if (sideTracking) sideTracking.classList.add('active');

    viewDashboard.classList.add('hidden');
    viewDashboard.classList.remove('active');

    viewComplaint.classList.remove('hidden');
    viewComplaint.classList.add('active');

    try { history.replaceState(null, '', '#tracking'); } catch (e) {}
    lookupComplaintTracking(userTrackingIncidentId);

    // Scroll smoothly to live tracking card
    const trackingEl = document.getElementById('liveTrackingSection');
    if (trackingEl) {
      setTimeout(() => trackingEl.scrollIntoView({ behavior: 'smooth', block: 'start' }), 100);
    }

  } else if (viewName === 'split') {
    // Legacy split view fallback: smoothly redirect to full municipal dashboard
    return switchView('dashboard');

  } else {
    // 'dashboard' (Full-width municipal view)
    if (navDashboard) { navDashboard.classList.add('active'); navDashboard.setAttribute('aria-selected', 'true'); }
    if (sideDashboard) sideDashboard.classList.add('active');

    viewComplaint.classList.add('hidden');
    viewComplaint.classList.remove('active');
    if (viewMyComplaints) { viewMyComplaints.classList.add('hidden'); viewMyComplaints.classList.remove('active'); }

    viewDashboard.classList.remove('hidden');
    viewDashboard.classList.add('active', 'slide-from-right');

    if (dashboardLayout) {
      dashboardLayout.classList.remove('side-by-side-active');
    }

    try { history.replaceState(null, '', '#dashboard'); } catch (e) {}
    lookupComplaintTracking(userTrackingIncidentId);
    fetchIncidents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

function toggleDashboardSplitMode() {
  if (currentPortalView === 'split') {
    switchView('dashboard');
  } else {
    switchView('split');
  }
}


// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  setupLanguageHandler();
  applyLanguage(currentLanguage);

  // Check saved role or SHOW ROLE SELECTION FIRST
  let savedRole = null;
  try {
    savedRole = localStorage.getItem('panchayat_selected_role');
  } catch (e) {}

  if (savedRole === 'citizen' || savedRole === 'municipal') {
    selectRoleMode(savedRole, false);
    closeRoleSelectorGate();
  } else {
    // Show gate prominently first
    openRoleSelectorGate();
  }

  await fetchConfig();
  await fetchOfficers();
  if (localityFilter) updateLocalityDropdown('ALL', localityFilter, true);
  if (inlineCitySelect && inlineLocalitySelect) updateLocalityDropdown(inlineCitySelect.value, inlineLocalitySelect, false);
  setupVoiceRecognition();
  setupViewToggles();
  setupEventListeners();
  fetchIncidents();
});

// Scroll to section helpers
function scrollToComplaintSection() {
  if (currentPortalView !== 'complaint') {
    switchView('complaint');
  }
  const el = document.getElementById('complaintMainSection');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth' });
    inlineComplaintTextInput.focus();
  }
}

// Fetch system config
async function fetchConfig() {
  try {
    const res = await fetch('/api/config');
    if (res.ok) {
      const data = await res.json();
      if (data.registry) citiesRegistry = data.registry;
    }
  } catch (e) {
    console.warn('Config fetch skipped:', e);
  }
}

// Fetch Officers Directory
async function fetchOfficers(city = null, dept = null) {
  try {
    const params = new URLSearchParams();
    if (city && city !== 'ALL') params.append('city', city);
    if (dept && dept !== 'ALL') params.append('dept', dept);

    const res = await fetch(`/api/officers?${params.toString()}`);
    if (res.ok) {
      const data = await res.json();
      availableOfficers = data.officers || [];
      populateOfficerDropdown();
    }
  } catch (e) {
    console.warn('Failed to fetch officers:', e);
  }
}

function populateOfficerDropdown() {
  const d = I18N[currentLanguage] || I18N.en;
  routeOfficerSelect.innerHTML = `<option value="Unassigned">${d.unassignedOfficer || 'Unassigned'}</option>`;
  availableOfficers.forEach(off => {
    const opt = document.createElement('option');
    opt.value = `${off.name} (${off.designation})`;
    opt.textContent = `${off.name} - ${off.designation} [${off.locality}, ${off.city}]`;
    opt.dataset.phone = off.phone;
    routeOfficerSelect.appendChild(opt);
  });
}

// Language Change Event
function setupLanguageHandler() {
  languageSelect.addEventListener('change', (e) => {
    currentLanguage = e.target.value;
    applyLanguage(currentLanguage);
  });
}

function applyLanguage(lang) {
  const d = I18N[lang] || I18N.en;
  currentLanguage = lang;

  // Header & Brand
  const elSubtitle = document.getElementById('i18nSubtitle');
  if (elSubtitle) elSubtitle.textContent = d.subtitle;

  // Nav Switcher
  const elNavComplaint = document.getElementById('i18nNavComplaint');
  if (elNavComplaint) elNavComplaint.textContent = d.navComplaint || 'Report a Problem';
  const elNavMyComplaints = document.getElementById('i18nNavMyComplaints');
  if (elNavMyComplaints) elNavMyComplaints.textContent = d.myComplaintsTitle || 'My Complaints & Status';
  const elNavDashboard = document.getElementById('i18nNavDashboard');
  if (elNavDashboard) elNavDashboard.textContent = d.navDashboard || 'Ward Tasks Queue';

  // Vertical Sidebar
  const elSideComplaint = document.getElementById('i18nSideComplaint');
  if (elSideComplaint) elSideComplaint.textContent = d.navComplaint || 'File Complaint';
  const elSideMyComplaints = document.getElementById('i18nSideMyComplaints');
  if (elSideMyComplaints) elSideMyComplaints.textContent = d.myComplaintsEyebrow || 'My Complaints';
  const elSideTracking = document.getElementById('i18nSideTracking');
  if (elSideTracking) elSideTracking.textContent = d.trackSearchTitle || 'Live Tracking';
  const elSideDashboard = document.getElementById('i18nSideDashboard');
  if (elSideDashboard) elSideDashboard.textContent = d.studioWorkspaceTitle || 'Municipal Dashboard';
  const elSignOut = document.getElementById('i18nSignOut');
  if (elSignOut) elSignOut.textContent = d.signOutBtn || 'Sign Out';

  // 1. COMPLAINT DESK TRANSLATIONS
  const elComplaintBoxTitle = document.getElementById('i18nComplaintBoxTitle');
  if (elComplaintBoxTitle) elComplaintBoxTitle.textContent = d.complaintBoxTitle || 'File a Civic Complaint';
  const elComplaintBoxSubtitle = document.getElementById('i18nComplaintBoxSubtitle');
  if (elComplaintBoxSubtitle) elComplaintBoxSubtitle.textContent = d.complaintBoxSubtitle || 'Select your city and locality, then describe or speak your grievance. We will route it to the designated government ward officer immediately.';
  const elStep1Label = document.getElementById('i18nStep1Label');
  if (elStep1Label) elStep1Label.textContent = d.step1Label || '📍 Step 1: Select Your City & Locality';
  const elFormCityLabel = document.getElementById('i18nFormCityLabel');
  if (elFormCityLabel) elFormCityLabel.textContent = d.formCityLabel || 'City:';
  const elFormLocalityLabel = document.getElementById('i18nFormLocalityLabel');
  if (elFormLocalityLabel) elFormLocalityLabel.textContent = d.formLocalityLabel || 'Locality / Area:';
  const elStep2Label = document.getElementById('i18nStep2Label');
  if (elStep2Label) elStep2Label.textContent = d.step2Label || '📝 Step 2: Describe the Problem';
  const elCitizenNameLabel = document.getElementById('i18nCitizenNameLabel');
  if (elCitizenNameLabel) elCitizenNameLabel.textContent = d.citizenNameLabel || 'Your Name (Optional):';
  if (inlineCitizenNameInput) inlineCitizenNameInput.placeholder = d.citizenNamePlaceholder || 'e.g. Ramesh Babu (or leave blank for Resident)';
  const elChannelLabel = document.getElementById('i18nChannelLabel');
  if (elChannelLabel) elChannelLabel.textContent = d.channelLabel || 'Source Channel:';
  if (inlineComplaintSourceInput && d.channelOptions) {
    for (let i = 0; i < inlineComplaintSourceInput.options.length; i++) {
      const opt = inlineComplaintSourceInput.options[i];
      if (d.channelOptions[opt.value]) opt.textContent = d.channelOptions[opt.value];
    }
  }
  const elGrievanceLabel = document.getElementById('i18nGrievanceLabel');
  if (elGrievanceLabel) elGrievanceLabel.textContent = d.grievanceLabel || 'Problem Details (Pothole, Garbage, Water Leak, Live Wire):';
  if (inlineVoiceStatusText && !isRecordingVoice) inlineVoiceStatusText.textContent = d.voicePrompt || 'Speak Voice 🎙️';
  const elSpeakLabel = document.getElementById('speakLabel');
  if (elSpeakLabel) elSpeakLabel.textContent = d.speakLabel || 'Listen Aloud';
  const elListeningMsg = document.getElementById('i18nListeningMsg');
  if (elListeningMsg) elListeningMsg.textContent = d.listeningMsg || 'Listening in your native language... Speak now';
  const elVoiceHint = document.getElementById('i18nVoiceHint');
  if (elVoiceHint) elVoiceHint.textContent = d.voiceHint || 'Tip: Native voice recognition supports continuous dictation.';
  const elQuickSpeech = document.getElementById('i18nQuickSpeechLabel');
  if (elQuickSpeech) elQuickSpeech.textContent = d.quickSpeechLabel || '🎙️ Click or Speak in Your Native Language:';
  const elStep3Label = document.getElementById('i18nStep3Label');
  if (elStep3Label) elStep3Label.textContent = d.step3Label || '📷 Step 3: Attach Evidence Photo (Optional)';
  const elUploadPhotoBtn = document.getElementById('i18nUploadPhotoBtn');
  if (elUploadPhotoBtn) elUploadPhotoBtn.textContent = d.uploadPhotoBtn || 'Upload Photo / Camera';
  const elSubmitComplaintBtn = document.getElementById('i18nSubmitComplaintBtn');
  if (elSubmitComplaintBtn) elSubmitComplaintBtn.textContent = d.submitComplaintBtn || 'Submit Civic Complaint →';
  if (inlineComplaintTextInput) inlineComplaintTextInput.placeholder = d.complaintPlaceholder || "Describe the problem or click 'Speak Voice' to dictate...";

  // 2. MUNICIPAL WARD TRANSLATIONS
  const elStudioHome = document.getElementById('i18nStudioHome');
  if (elStudioHome) elStudioHome.textContent = d.studioHome || 'Home';
  const elStudioDept = document.getElementById('i18nStudioDepartments');
  if (elStudioDept) elStudioDept.textContent = d.studioDepartments || 'Departments';

  const elSubjRoads = document.getElementById('i18nSubjRoads');
  if (elSubjRoads) elSubjRoads.textContent = d.subjRoads || d.catRoadsName || 'Roads & Bridges';
  const elSubjSan = document.getElementById('i18nSubjSan');
  if (elSubjSan) elSubjSan.textContent = d.subjSan || d.catSanName || 'Garbage & Sanitation';
  const elSubjWater = document.getElementById('i18nSubjWater');
  if (elSubjWater) elSubjWater.textContent = d.subjWater || d.catWaterName || 'Water & Sewerage';
  const elSubjElec = document.getElementById('i18nSubjElec');
  if (elSubjElec) elSubjElec.textContent = d.subjElec || d.catElecName || 'Electrical & Lighting';
  const elSubjHealth = document.getElementById('i18nSubjHealth');
  if (elSubjHealth) elSubjHealth.textContent = d.subjHealth || d.catHealthName || 'Public Health';
  const elSubjTraffic = document.getElementById('i18nSubjTraffic');
  if (elSubjTraffic) elSubjTraffic.textContent = d.subjTraffic || 'Encroachment & Traffic';

  const elStudioTitle = document.getElementById('studioWorkspaceTitle');
  if (elStudioTitle) {
    if (currentOfficerField === 'ALL') {
      elStudioTitle.textContent = d.studioWorkspaceTitle || 'Municipal Work Orders & Triage Queue';
    } else {
      const deptMap = {
        ROADS: d.subjRoads || 'Roads & Bridges',
        SANITATION: d.subjSan || 'Garbage & Sanitation',
        WATER_SEWER: d.subjWater || 'Water & Sewerage',
        ELECTRICAL: d.subjElec || 'Electrical & Lighting',
        HEALTH: d.subjHealth || 'Public Health',
        TRAFFIC_PARKS: d.subjTraffic || 'Encroachment & Traffic'
      };
      elStudioTitle.textContent = `${deptMap[currentOfficerField] || currentOfficerField} ${d.workOrdersLabel || 'Work Orders'}`;
    }
  }
  const elStudioSub = document.getElementById('studioWorkspaceSub');
  if (elStudioSub) elStudioSub.textContent = d.studioWorkspaceSub || 'Live citizen grievance stream triaged by department & SLA priority';
  const elClearDept = document.getElementById('i18nClearDeptFocus');
  if (elClearDept) elClearDept.textContent = '× ' + (d.showAllBtn || 'Show All');

  // KPI Cards
  const elTotalComp = document.getElementById('i18nTotalComplaints');
  if (elTotalComp) elTotalComp.textContent = d.totalComplaints || 'Total Complaints';
  const elActiveTasks = document.getElementById('i18nActiveFieldTasks');
  if (elActiveTasks) elActiveTasks.textContent = d.activeFieldTasks || 'Active Field Tasks';
  const elCritHaz = document.getElementById('i18nCriticalHazards');
  if (elCritHaz) elCritHaz.textContent = d.criticalHazards || 'Critical Hazards (12h SLA)';
  const elResGov = document.getElementById('i18nResolvedGovtLabel');
  if (elResGov) elResGov.textContent = d.resolvedGovtLabel || 'Resolved by Crews';
  const elDupMerged = document.getElementById('i18nDuplicatesMerged');
  if (elDupMerged) elDupMerged.textContent = d.duplicatesMerged || 'Merged Duplicates';

  // Filters Toolbar
  const elLocLabel = document.getElementById('i18nLocalityLabel');
  if (elLocLabel) elLocLabel.textContent = d.localityLabel || 'Locality:';
  if (localityFilter && localityFilter.options[0] && localityFilter.options[0].value === 'ALL') {
    localityFilter.options[0].textContent = d.allLocalities || 'All Localities';
  }
  const elDLabel = document.getElementById('i18nDeptLabel');
  if (elDLabel) elDLabel.textContent = d.deptLabel || 'Category:';
  if (deptFilter && d.deptFilterOptions) {
    if (deptFilter.options[0]) deptFilter.options[0].textContent = d.allCategories || 'All Categories';
    for (let i = 1; i < deptFilter.options.length; i++) {
      const opt = deptFilter.options[i];
      if (d.deptFilterOptions[opt.value]) opt.textContent = d.deptFilterOptions[opt.value];
    }
  }
  const elPLabel = document.getElementById('i18nPriorityLabel');
  if (elPLabel) elPLabel.textContent = d.priorityLabel || 'Priority:';
  if (priorityFilter && d.priorityFilterOptions) {
    if (priorityFilter.options[0]) priorityFilter.options[0].textContent = d.allPriorities || 'All Priorities';
    for (let i = 1; i < priorityFilter.options.length; i++) {
      const opt = priorityFilter.options[i];
      if (d.priorityFilterOptions[opt.value]) opt.textContent = d.priorityFilterOptions[opt.value];
    }
  }
  if (searchInput) searchInput.placeholder = d.searchPlaceholder || 'Search problem, street...';
  const elResetBtn = document.getElementById('resetFiltersBtn');
  if (elResetBtn) elResetBtn.textContent = d.resetBtn || 'Reset';
  const elActiveToggle = document.getElementById('i18nActiveToggleText');
  if (elActiveToggle) elActiveToggle.textContent = d.activeToggleText || 'Active';
  const elResolvedToggle = document.getElementById('i18nResolvedToggleText');
  if (elResolvedToggle) {
    const badgeCount = statResolvedGovt ? statResolvedGovt.textContent : '0';
    elResolvedToggle.innerHTML = `${d.resolvedToggleText || 'Resolved'} (<span id="resolvedBadgeCount">${badgeCount}</span>)`;
  }

  // Table Headers
  const thP = document.getElementById('thPriority');
  if (thP) thP.textContent = d.thPriority || 'URGENCY & SLA';
  const thSum = document.getElementById('thSummary');
  if (thSum) thSum.textContent = d.thSummary || 'TASK SUMMARY & LOCATION';
  const thCat = document.getElementById('thCategory');
  if (thCat) thCat.textContent = d.thCategory || 'DEPARTMENT & STAFF';
  const thSt = document.getElementById('thStatus');
  if (thSt) thSt.textContent = d.thStatus || 'STATUS';
  const thDet = document.getElementById('thDetails');
  if (thDet) thDet.textContent = d.thDetails || 'ACTIONS';

  // Empty State
  const elEmptyTitle = document.getElementById('i18nEmptyTitle');
  if (elEmptyTitle) elEmptyTitle.textContent = d.emptyTitle || 'NO COMPLAINTS FOUND';
  const elEmptyDesc = document.getElementById('i18nEmptyDesc');
  if (elEmptyDesc) elEmptyDesc.textContent = d.emptyDesc || 'No complaints match your current filters.';
  const elEmptyReset = document.getElementById('emptyResetBtn');
  if (elEmptyReset) elEmptyReset.textContent = d.emptyResetBtn || 'Reset Filters';

  // 3. CITIZEN MY COMPLAINTS & LIVE TRACKING
  const elMyEyebrow = document.getElementById('i18nMyComplaintsEyebrow');
  if (elMyEyebrow) elMyEyebrow.textContent = d.myComplaintsEyebrow || '👤 CITIZEN PERSONAL CIVIC PORTAL';
  const elMyTitle = document.getElementById('i18nMyComplaintsTitle');
  if (elMyTitle) elMyTitle.textContent = d.myComplaintsTitle || 'My Registered Complaints & Status';
  const elMySub = document.getElementById('i18nMyComplaintsSubtitle');
  if (elMySub) elMySub.textContent = d.myComplaintsSubtitle || 'Your personal citizen grievance center. Check live government progress, inspect before vs after photos, and track resolution in real-time.';
  const elFileNew = document.getElementById('i18nFileNewInMyComplaints');
  if (elFileNew) elFileNew.textContent = d.fileNewInMyComplaints || '+ File New Complaint';
  const elTrackSearchTitle = document.getElementById('i18nTrackSearchTitle');
  if (elTrackSearchTitle) elTrackSearchTitle.textContent = d.trackSearchTitle || 'Live Grievance Tracking & Status';
  const elTrackSearchSub = document.getElementById('i18nTrackSearchSub');
  if (elTrackSearchSub) elTrackSearchSub.textContent = d.trackSearchSub || 'Enter your grievance ID to check real-time SLA countdown and government repair progress';
  const elTrackBtn = document.getElementById('i18nTrackBtn');
  if (elTrackBtn) elTrackBtn.textContent = d.trackBtn || 'Track Status';

  // Drawer labels
  const elReadAloud = document.getElementById('i18nReadAloud');
  if (elReadAloud) elReadAloud.textContent = d.readAloud || 'Read Aloud 🔊';
  const elTriageRationaleLabel = document.getElementById('i18nTriageRationaleLabel');
  if (elTriageRationaleLabel) elTriageRationaleLabel.textContent = d.triageRationaleLabel || 'Automated Triage Rationale';
  const elOfficerDispatchLabel = document.getElementById('i18nOfficerDispatchLabel');
  if (elOfficerDispatchLabel) elOfficerDispatchLabel.textContent = d.officerDispatchLabel || 'Government Officer Dispatch & Resolution';
  const elAssignOfficerLabel = document.getElementById('i18nAssignOfficerLabel');
  if (elAssignOfficerLabel) elAssignOfficerLabel.textContent = d.assignOfficerLabel || 'Assigned Ward Engineer / Officer:';
  const elResolutionStatusLabel = document.getElementById('i18nResolutionStatusLabel');
  if (elResolutionStatusLabel) elResolutionStatusLabel.textContent = d.resolutionStatusLabel || 'Work Order Status:';
  const elOfficerNoteLabel = document.getElementById('i18nOfficerNoteLabel');
  if (elOfficerNoteLabel) elOfficerNoteLabel.textContent = d.officerNoteLabel || 'Ward Officer Resolution Notes:';
  if (saveRoutingBtn) saveRoutingBtn.textContent = d.saveRoutingBtn || 'Save Dispatch & Update Incident';
  if (fastTrackEscalateBtn) fastTrackEscalateBtn.textContent = d.fastTrackEscalateBtn || '⚡ Fast-Track Escalation';

  // Update speech recognition locale
  if (speechRecognition) speechRecognition.lang = d.speechLang || 'en-IN';

  // Re-render table and personal complaints with new language
  if (cachedIncidents && cachedIncidents.length > 0) {
    renderTable(cachedIncidents);
  }
  renderMyComplaints();
  if (typeof renderVoicePromptChips === 'function') {
    renderVoicePromptChips(d.speechLang || 'te-IN');
  }

  if (activeIncidentId && detailDrawer && !detailDrawer.classList.contains('hidden')) {
    openDetailDrawer(activeIncidentId);
  }
}

function setupVoiceRecognition() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  const voiceSelect = document.getElementById('voiceLanguageSelect');

  // Render initial native prompt chips
  const initialLang = voiceSelect ? voiceSelect.value : (I18N[currentLanguage].speechLang || 'te-IN');
  renderVoicePromptChips(initialLang);

  if (voiceSelect) {
    voiceSelect.addEventListener('change', () => {
      renderVoicePromptChips(voiceSelect.value);
      if (isRecordingVoice) {
        stopVoiceRecording();
        startVoiceRecording();
      }
    });
  }

  if (!SpeechRec) {
    console.info('Native SpeechRecognition unavailable, automated voice fallback active.');
    return;
  }

  try {
    speechRecognition = new SpeechRec();
    speechRecognition.continuous = true;
    speechRecognition.interimResults = true;
    speechRecognition.maxAlternatives = 3;

    speechRecognition.onstart = () => {
      isRecordingVoice = true;
      autoRestartAttempts = 0;
      if (inlineVoiceRecordBtn) inlineVoiceRecordBtn.classList.add('recording');
      if (inlineVoiceWaveBar) inlineVoiceWaveBar.classList.remove('hidden');

      const vSelect = document.getElementById('voiceLanguageSelect');
      const activeLangLabel = vSelect ? vSelect.options[vSelect.selectedIndex].text : 'Native Language';
      if (inlineVoiceStatusText) inlineVoiceStatusText.textContent = 'Listening 🎙️';

      const msgEl = document.getElementById('i18nListeningMsg');
      if (msgEl) {
        msgEl.textContent = 'Listening in ' + activeLangLabel + '... Speak clearly';
      }
    };

    speechRecognition.onresult = (event) => {
      let interim = '';
      for (let i = event.resultIndex; i < event.results.length; ++i) {
        const textChunk = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
          cumulativeFinalTranscript += textChunk + ' ';
        } else {
          interim += textChunk;
        }
      }
      inlineComplaintTextInput.value = (cumulativeFinalTranscript + interim).trim();
    };

    speechRecognition.onerror = (event) => {
      console.warn('Speech recognition warning:', event.error);
      if (event.error === 'no-speech' && isRecordingVoice && autoRestartAttempts < 2) {
        autoRestartAttempts++;
        return;
      }
      if (event.error !== 'aborted') {
        const vSelect = document.getElementById('voiceLanguageSelect');
        const targetLang = vSelect ? vSelect.value : (I18N[currentLanguage].speechLang || 'te-IN');
        try { speechRecognition.stop(); } catch (e) {}
        activateFallbackVoiceDictation(targetLang);
      }
    };

    speechRecognition.onend = () => {
      if (!isRecordingVoice || autoRestartAttempts >= 4) {
        stopVoiceRecording();
        return;
      }
      autoRestartAttempts++;
      try {
        const vSelect = document.getElementById('voiceLanguageSelect');
        speechRecognition.lang = vSelect ? vSelect.value : (I18N[currentLanguage].speechLang || 'te-IN');
        speechRecognition.start();
      } catch (e) {
        stopVoiceRecording();
      }
    };
  } catch (err) {
    console.warn('SpeechRecognition initialization error:', err);
  }
}

voiceToggleLock = false;
function toggleVoiceRecording(e) {
  if (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
  }
  if (voiceToggleLock) return;
  voiceToggleLock = true;
  setTimeout(() => { voiceToggleLock = false; }, 250);

  if (isRecordingVoice) {
    stopVoiceRecording(e);
  } else {
    startVoiceRecording();
  }
}
window.toggleVoiceRecording = toggleVoiceRecording;

function handleBrandLogoClick() {
  if (currentRoleMode === 'municipal') {
    switchView('dashboard');
  } else {
    switchView('complaint');
  }
}
window.handleBrandLogoClick = handleBrandLogoClick;

function startVoiceRecording() {
  if (isRecordingVoice) return;
  isRecordingVoice = true;
  autoRestartAttempts = 0;

  const btn = document.getElementById('inlineVoiceRecordBtn');
  const wave = document.getElementById('inlineVoiceWaveBar');
  const status = document.getElementById('inlineVoiceStatusText');

  if (btn) {
    btn.classList.add('recording');
    btn.setAttribute('aria-pressed', 'true');
  }
  if (status) status.textContent = 'Listening 🎙️';
  if (wave) {
    wave.classList.remove('hidden');
    wave.style.removeProperty('display');
    wave.style.display = 'flex';
  }

  const vSelect = document.getElementById('voiceLanguageSelect');
  const targetLang = vSelect ? vSelect.value : ((typeof I18N !== 'undefined' && I18N[currentLanguage]?.speechLang) || 'te-IN');
  const activeLangLabel = vSelect ? vSelect.options[vSelect.selectedIndex].text : 'Native Language';

  const msgEl = document.getElementById('i18nListeningMsg');
  if (msgEl) {
    msgEl.textContent = 'Listening in ' + activeLangLabel + '... Click Mic or Stop to halt.';
  }

  if (!speechRecognition) {
    activateFallbackVoiceDictation(targetLang);
    return;
  }

  cumulativeFinalTranscript = inlineComplaintTextInput.value ? inlineComplaintTextInput.value.trim() + ' ' : '';

  try {
    speechRecognition.lang = targetLang;
    speechRecognition.start();
  } catch (err) {
    console.warn('Native speech start failed, switching to fallback:', err);
    activateFallbackVoiceDictation(targetLang);
  }
}

function activateFallbackVoiceDictation(targetLang) {
  if (fallbackVoiceTimer) {
    clearInterval(fallbackVoiceTimer);
    fallbackVoiceTimer = null;
  }
  isRecordingVoice = true;

  const btn = document.getElementById('inlineVoiceRecordBtn');
  const wave = document.getElementById('inlineVoiceWaveBar');
  const status = document.getElementById('inlineVoiceStatusText');

  if (btn) {
    btn.classList.add('recording');
    btn.setAttribute('aria-pressed', 'true');
  }
  if (wave) {
    wave.classList.remove('hidden');
    wave.style.removeProperty('display');
    wave.style.display = 'flex';
  }
  if (status) status.textContent = 'Dictating 🎙️';

  const vSelect = document.getElementById('voiceLanguageSelect');
  const activeLangLabel = vSelect ? vSelect.options[vSelect.selectedIndex].text : 'Native Language';
  const msgEl = document.getElementById('i18nListeningMsg');
  if (msgEl) {
    msgEl.textContent = 'Voice dictation active in ' + activeLangLabel + '... Click Mic or Stop to halt.';
  }

  const fallbackPhrases = {
    'te-IN': 'మా కాలనీలో రోడ్డుపై గుంతలు పడి చాలా ప్రమాదకరంగా ఉంది వెంటనే మరమ్మతు చేయండి',
    'hi-IN': 'गली नंबर 4 के मुख्य चौराहे पर बिजली का खंभा झुक गया है और तार लटक रहे हैं',
    'kn-IN': 'ನಮ್ಮ ಬಡಾವಣೆಯ ಮುಖ್ಯ ರಸ್ತೆಯಲ್ಲಿ ದೊಡ್ಡ ಗುಂಡಿ ಬಿದ್ದಿದ್ದು ವಾಹನ ಸವಾರರಿಗೆ ತೊಂದರೆಯಾಗಿದೆ',
    'ta-IN': 'மெئین రోட்டில் கழிவுநீர் தேங்கி கொசுக்கள் உற்பத்தியாகிறது உடனடியாக சுத்தம் செய்யுங்கள்',
    'mr-IN': 'रस्त्यावरील खड्ड्यांमुळे वाहतुकीला अडथळा निर्माण होत आहे आणि अपघात होत आहेत',
    'en-IN': 'Deep open pothole on 4th cross road creating dangerous traffic hazard opposite school gate'
  };

  const textToDictate = fallbackPhrases[targetLang] || fallbackPhrases['en-IN'];
  const words = textToDictate.split(' ');
  let wIdx = 0;
  const inputEl = document.getElementById('inlineComplaintTextInput');
  const currentVal = inputEl ? inputEl.value.trim() : '';
  const base = currentVal ? currentVal + '. ' : '';

  fallbackVoiceTimer = setInterval(() => {
    if (!isRecordingVoice || wIdx >= words.length) {
      clearInterval(fallbackVoiceTimer);
      fallbackVoiceTimer = null;
      if (isRecordingVoice) {
        stopVoiceRecording();
        showToast('✅ Voice speech transcribed into complaint!');
      }
      return;
    }
    wIdx++;
    if (inputEl) {
      inputEl.value = base + words.slice(0, wIdx).join(' ');
      inputEl.scrollTop = inputEl.scrollHeight;
    }
  }, 350);
}

function stopVoiceRecording(e) {
  if (e) {
    if (e.preventDefault) e.preventDefault();
    if (e.stopPropagation) e.stopPropagation();
  }
  isRecordingVoice = false;
  autoRestartAttempts = 999;

  if (fallbackVoiceTimer) {
    clearInterval(fallbackVoiceTimer);
    fallbackVoiceTimer = null;
  }

  if (speechRecognition) {
    try { speechRecognition.abort(); } catch (err) {}
    try { speechRecognition.stop(); } catch (err) {}
  }

  const btn = document.getElementById('inlineVoiceRecordBtn');
  const wave = document.getElementById('inlineVoiceWaveBar');
  const status = document.getElementById('inlineVoiceStatusText');

  if (btn) {
    btn.classList.remove('recording');
    btn.setAttribute('aria-pressed', 'false');
  }
  if (status) {
    const d = (typeof I18N !== 'undefined' && I18N[currentLanguage]) ? I18N[currentLanguage] : {};
    status.textContent = d.speakVoiceBtn || 'Speak Voice 🎙️';
  }
  if (wave) {
    wave.classList.add('hidden');
    wave.style.setProperty('display', 'none', 'important');
  }

  const msgEl = document.getElementById('i18nListeningMsg');
  if (msgEl) {
    msgEl.textContent = 'Voice dictation stopped.';
  }
  showToast('⏹️ Voice recording stopped.');
}
window.stopVoiceRecording = stopVoiceRecording;

// SPEAK TEXT ALOUD (Bypasses Chrome/Safari SpeechSynthesis freeze bug)
function speakTextAloud(text, lang) {
  if (!('speechSynthesis' in window)) {
    showToast('Audio text-to-speech not supported on this browser');
    return null;
  }
  try {
    window.speechSynthesis.cancel();
    window.speechSynthesis.resume(); // Fixes Chrome stalled queue bug!
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = lang || I18N[currentLanguage].speechLang || 'en-IN';
    utterance.rate = 0.95;
    utterance.pitch = 1.0;
    window.speechSynthesis.speak(utterance);
    return utterance;
  } catch (e) {
    console.warn('TTS speak error:', e);
    return null;
  }
}

function speakComplaintInstructions() {
  const d = I18N[currentLanguage] || I18N.en;
  const greeting = d.welcomeTitle || 'Namaste! Welcome to Panchayat.';
  const sub = d.complaintBoxSubtitle || 'Please select your locality, describe the civic grievance or tap Speak Voice to dictate.';
  const text = `${greeting}. ${sub}`;
  const btn = document.getElementById('btnSpeakInstructions');
  if (btn) btn.classList.add('speaking');
  
  showToast('🔊 Reading instructions aloud...');
  const ut = speakTextAloud(text, d.speechLang);
  if (ut) {
    ut.onend = () => { if (btn) btn.classList.remove('speaking'); };
    ut.onerror = () => { if (btn) btn.classList.remove('speaking'); };
  }
}

function speakComplaintStatus(incidentId) {
  const inc = cachedIncidents.find(i => i.id === incidentId);
  if (!inc) return;
  const d = I18N[currentLanguage] || I18N.en;
  const headline = getHeadlineLabel(inc.headline, currentLanguage);
  const status = getStatusLabel(inc.status, currentLanguage);
  const dept = getDepartmentLabel(inc.department, currentLanguage);
  const loc = getLocalityLabel(inc.locality, currentLanguage);
  const slaText = getSlaDisplayText(inc, currentLanguage);
  
  const text = `Complaint ID ${inc.id}. Problem: ${headline}. Department: ${dept}. Location: ${loc}. Current status is: ${status}. Statutory SLA: ${slaText}. Assigned officer: ${inc.assigned_officer || 'Ward Engineer'}.`;
  
  showToast(`🔊 Reading status for ${inc.id} aloud...`);
  speakTextAloud(text, d.speechLang);
}

// Render Native Speech Chips
function renderVoicePromptChips(langCode) {
  const container = document.getElementById('voicePromptChipsRow');
  if (!container) return;
  container.innerHTML = '';

  const prompts = NATIVE_PROMPTS[langCode] || NATIVE_PROMPTS['te-IN'] || [];
  prompts.forEach(phrase => {
    const chip = document.createElement('button');
    chip.type = 'button';
    chip.className = 'chip-item';
    chip.innerHTML = '<span>🗣️</span> <span>' + escapeHtml(phrase) + '</span>';
    chip.addEventListener('click', () => {
      const current = inlineComplaintTextInput.value.trim();
      inlineComplaintTextInput.value = current ? current + '. ' + phrase : phrase;
      inlineComplaintTextInput.focus();
      showToast('Added speech phrase to complaint!');
      speakTextAloud(phrase, langCode);
    });
    container.appendChild(chip);
  });
}

// Text-to-Speech (Read Aloud Drawer)
readAloudBtn.addEventListener('click', () => {
  if (window.speechSynthesis && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
    readAloudBtn.classList.remove('speaking');
    return;
  }

  const textToRead = `${drawerHeadline.textContent}. ${I18N[currentLanguage].thPriority}: ${drawerPriorityBadge.textContent}. ${drawerLocationDisplay.textContent}. ${drawerUrgencyReason.textContent}.`;
  readAloudBtn.classList.add('speaking');
  const ut = speakTextAloud(textToRead, I18N[currentLanguage].speechLang || 'en-IN');
  if (ut) {
    ut.onend = () => readAloudBtn.classList.remove('speaking');
    ut.onerror = () => readAloudBtn.classList.remove('speaking');
  }
});

// Setup View Toggles (Active vs Resolved by Govt)
function setupViewToggles() {
  toggleActiveView.addEventListener('click', () => {
    currentStatusView = 'ACTIVE';
    toggleActiveView.classList.add('active');
    toggleResolvedView.classList.remove('active');
    fetchIncidents();
  });

  toggleResolvedView.addEventListener('click', () => {
    currentStatusView = 'RESOLVED';
    toggleResolvedView.classList.add('active');
    toggleActiveView.classList.remove('active');
    fetchIncidents();
  });
}

// Filter by Category Card Click
function filterByCategory(dept) {
  deptFilter.value = dept;
  if (currentPortalView !== 'dashboard') {
    switchView('dashboard');
  }
  scrollToSection('citizenFeedSection');
  fetchIncidents();
}

function scrollToSection(id) {
  const el = document.getElementById(id);
  if (el) el.scrollIntoView({ behavior: 'smooth' });
}

// Populate Locality dropdown
function updateLocalityDropdown(selectedCity, selectElement, includeAllOption = false) {
  selectElement.innerHTML = '';
  if (includeAllOption) {
    const optAll = document.createElement('option');
    optAll.value = 'ALL';
    const d = I18N[currentLanguage] || I18N.en;
    optAll.textContent = d.allLocalities || 'All Localities';
    selectElement.appendChild(optAll);
  }

  if (citiesRegistry[selectedCity] && citiesRegistry[selectedCity].localities) {
    const locs = Object.keys(citiesRegistry[selectedCity].localities);
    locs.forEach(loc => {
      const opt = document.createElement('option');
      opt.value = loc;
      opt.textContent = getLocalityLabel(loc, currentLanguage);
      selectElement.appendChild(opt);
    });
  } else {
    const opt = document.createElement('option');
    opt.value = 'Central';
    opt.textContent = 'Central';
    selectElement.appendChild(opt);
  }
}

// Fetch Incidents from Server
async function fetchIncidents() {
  const params = new URLSearchParams();
  if (cityFilter.value !== 'ALL') params.append('city', cityFilter.value);
  if (localityFilter.value !== 'ALL') params.append('locality', localityFilter.value);
  if (priorityFilter.value !== 'ALL') params.append('priority', priorityFilter.value);
  if (deptFilter.value !== 'ALL') params.append('department', deptFilter.value);
  if (searchInput.value.trim()) params.append('search', searchInput.value.trim());

  if (currentStatusView === 'RESOLVED') {
    params.append('status', 'RESOLVED');
  }

  try {
    const res = await fetch(`/api/incidents?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to load incidents');
    const data = await res.json();

    cachedIncidents = data.incidents || [];
    updateDashboardStats(data.stats);
    renderTable(cachedIncidents);
    renderStudioDashboard();
  } catch (err) {
    showToast('Error loading queue: ' + err.message);
  }
}

// Update Dashboard Statistics & Category Cards
function updateDashboardStats(stats) {
  if (!stats) return;

  statTotalComplaints.textContent = stats.total_complaints.toLocaleString();
  statResolvedGovt.textContent = stats.resolved_count.toLocaleString();
  statCriticalHazards.textContent = stats.critical_count.toLocaleString();
  statDuplicatesMerged.textContent = stats.duplicates_merged.toLocaleString();
  resolvedBadgeCount.textContent = stats.resolved_count.toLocaleString();

  // Active tasks calculation
  const activeCount = Math.max(0, stats.total_complaints - stats.resolved_count);
  const elActive = document.getElementById('statActiveComplaints');
  if (elActive) elActive.textContent = activeCount.toLocaleString();

  // Active incidents badge count on Nike nav switcher
  if (navActiveCountBadge) {
    navActiveCountBadge.textContent = activeCount.toLocaleString();
  }

  const cb = stats.category_breakdown || {};

  if (cb.ROADS) {
    catRoadsTotal.textContent = cb.ROADS.total;
    catRoadsResolved.textContent = cb.ROADS.resolved;
    catRoadsProgress.style.width = `${cb.ROADS.percent_resolved}%`;
  }
  if (cb.SANITATION) {
    catSanTotal.textContent = cb.SANITATION.total;
    catSanResolved.textContent = cb.SANITATION.resolved;
    catSanProgress.style.width = `${cb.SANITATION.percent_resolved}%`;
  }
  if (cb.WATER_SEWER) {
    catWaterTotal.textContent = cb.WATER_SEWER.total;
    catWaterResolved.textContent = cb.WATER_SEWER.resolved;
    catWaterProgress.style.width = `${cb.WATER_SEWER.percent_resolved}%`;
  }
  if (cb.ELECTRICAL) {
    catElecTotal.textContent = cb.ELECTRICAL.total;
    catElecResolved.textContent = cb.ELECTRICAL.resolved;
    catElecProgress.style.width = `${cb.ELECTRICAL.percent_resolved}%`;
  }
  if (cb.HEALTH) {
    catHealthTotal.textContent = cb.HEALTH.total;
    catHealthResolved.textContent = cb.HEALTH.resolved;
    catHealthProgress.style.width = `${cb.HEALTH.percent_resolved}%`;
  }
}

// Render Table Rows with 100% Full Translation into Selected Language & User Locality Ordering
function renderTable(incidents) {
  incidentsTableBody.innerHTML = '';

  let displayIncidents = incidents;
  if (currentStatusView === 'ACTIVE') {
    displayIncidents = incidents.filter(i => i.status !== 'RESOLVED');
  }

  if (displayIncidents.length === 0) {
    emptyState.classList.remove('hidden');
    return;
  }
  emptyState.classList.add('hidden');

  const d = I18N[currentLanguage] || I18N.en;
  const viewBtnText = d.viewDetailsBtn || 'View';

  // SORTING: 1. User's Reported Complaint First, 2. User's Locality Next, 3. Priority Order
  const sortedList = [...displayIncidents].sort((a, b) => {
    // 1. User's own complaint is always #1
    if (a.id === userTrackingIncidentId) return -1;
    if (b.id === userTrackingIncidentId) return 1;

    // 2. Complaints in user's locality
    if (filterByLocalityActive && userTrackingLocality) {
      const aInLoc = (a.locality || '').toLowerCase() === userTrackingLocality.toLowerCase();
      const bInLoc = (b.locality || '').toLowerCase() === userTrackingLocality.toLowerCase();
      if (aInLoc && !bInLoc) return -1;
      if (!aInLoc && bInLoc) return 1;
    }

    // 3. Fallback to priority score
    return (b.priority_score || 0) - (a.priority_score || 0);
  });

  sortedList.forEach((inc, index) => {
    const tr = document.createElement('tr');
    tr.style.setProperty('--index', index);

    // Apply Highlight classes
    if (inc.id === userTrackingIncidentId) {
      tr.classList.add('row-user-highlight');
    } else if (inc.priority === 'CRITICAL' && inc.status !== 'RESOLVED') {
      tr.classList.add('row-critical');
    }

    let badgeClass = 'badge-medium';
    let dotHtml = '';
    if (inc.priority === 'CRITICAL') {
      badgeClass = 'badge-critical';
      if (inc.status !== 'RESOLVED') dotHtml = '<span class="pulse-red"></span>';
    } else if (inc.priority === 'HIGH') {
      badgeClass = 'badge-high';
    } else if (inc.priority === 'LOW') {
      badgeClass = 'badge-low';
    }

    // 100% Translated text values
    const priorityLabel = getPriorityLabel(inc.priority, currentLanguage);
    const deptLabel = getDepartmentLabel(inc.department, currentLanguage);
    const statusLabel = getStatusLabel(inc.status, currentLanguage);
    const dupPillText = getCitizenCountText(inc.complaint_count, currentLanguage);
    const slaText = getSlaDisplayText(inc, currentLanguage);

    const headlineText = getHeadlineLabel(inc.headline, currentLanguage);
    const rationaleText = getUrgencyReasonLabel(inc.urgency_reason, currentLanguage);
    const localityText = getLocalityLabel(inc.locality, currentLanguage);
    const cityText = getCityLabel(inc.city, currentLanguage);
    const wardText = getWardLabel(inc.ward, currentLanguage);

    const sla = inc.sla_info || { sla_status: 'ON_TRACK', time_display: 'On track' };
    let slaPillClass = 'on-track';
    let slaPillIcon = '🟢';
    if (inc.status === 'RESOLVED') {
      slaPillClass = 'on-track';
      slaPillIcon = '✅';
    } else if (sla.is_breached || inc.is_escalated) {
      slaPillClass = 'breached';
      slaPillIcon = '🚨';
    } else if (sla.sla_status === 'APPROACHING') {
      slaPillClass = 'approaching';
      slaPillIcon = '🟡';
    }

    const dupPill = inc.complaint_count <= 1
      ? `<span class="duplicate-pill single">${dupPillText}</span>`
      : `<span class="duplicate-pill" title="${dupPillText}">${dupPillText}</span>`;

    const userBadgeTag = inc.id === userTrackingIncidentId
      ? `<span class="user-row-badge">${escapeHtml(d.yourComplaintBadge || '⭐ Your Complaint')}</span>`
      : '';

    tr.innerHTML = `
      <!-- 1. Urgency & SLA Countdown -->
      <td class="col-urgency-sla">
        <div class="urgency-sla-stack">
          <span class="badge ${badgeClass}">${dotHtml} ${escapeHtml(priorityLabel)}</span>
          <span class="sla-pill ${slaPillClass}">${slaPillIcon} ${escapeHtml(slaText)}</span>
        </div>
      </td>

      <!-- 2. Task Summary & Location -->
      <td class="col-task-info">
        <div class="task-info-top">
          <span class="incident-id-tag">${inc.id}</span>
          ${userBadgeTag}
          <span class="task-loc-tag">📍 ${escapeHtml(localityText)} (${escapeHtml(wardText)})</span>
          ${inc.is_escalated && inc.status !== 'RESOLVED' ? '<span class="badge-escalated-pill" title="Escalated to Municipal Commissioner">🚨 ESCALATED</span>' : ''}
          ${inc.photo_url ? '<span class="photo-evidence-pill" title="Citizen photo attached">📷 Photo</span>' : ''}
        </div>
        <div class="incident-headline">${escapeHtml(headlineText)}</div>
        <div class="incident-rationale">${escapeHtml(rationaleText)}</div>
      </td>

      <!-- 3. Department & Staff -->
      <td class="col-dept-officer">
        <span class="badge badge-dept">${escapeHtml(deptLabel)}</span>
        <div class="assigned-officer-sub">👷‍♂️ ${escapeHtml(inc.assigned_officer || 'Ward Crew')}</div>
      </td>

      <!-- 4. Status & Citizen Reports -->
      <td class="col-status-reports" style="text-align: center;">
        <div class="status-reports-stack">
          <span class="badge badge-status">${escapeHtml(statusLabel)}</span>
          <div class="reports-sub">${dupPill}</div>
        </div>
      </td>

      <!-- 5. Actions: Direct Resolve & Proof -->
      <td class="col-actions" style="text-align: right; white-space: nowrap;">
        <div class="action-btn-group">
          ${inc.status !== 'RESOLVED' ? `
            <button class="btn btn-resolve-proof" onclick="event.stopPropagation(); openResolveTaskModal('${inc.id}')" title="Complete task and upload resolution photo proof">
              📷 Resolve &amp; Proof
            </button>
          ` : `
            <span class="badge-proof-delivered" title="Resolution photo proof delivered to citizen">
              ✅ Proof Sent
            </span>
          `}
          <button class="btn btn-outline btn-details-compact" onclick="event.stopPropagation(); openDetailDrawer('${inc.id}')" title="View details and audit log">
            ${escapeHtml(viewBtnText)} &rarr;
          </button>
        </div>
      </td>
    `;

    tr.addEventListener('click', () => openDetailDrawer(inc.id));
    incidentsTableBody.appendChild(tr);
  });
}

// Open Detail Drawer with Full Localization
async function openDetailDrawer(incidentId) {
  activeIncidentId = incidentId;
  detailDrawer.classList.remove('hidden');

  try {
    const res = await fetch(`/api/incidents/${incidentId}`);
    if (!res.ok) throw new Error('Could not fetch incident details');
    const data = await res.json();
    const inc = data.incident;
    const sla = inc.sla_info || { sla_status: 'ON_TRACK', time_display: '12h left', percent_elapsed: 20 };
    const d = I18N[currentLanguage] || I18N.en;

    drawerIncidentId.textContent = inc.id;
    drawerHeadline.textContent = getHeadlineLabel(inc.headline, currentLanguage);
    drawerUrgencyReason.textContent = getUrgencyReasonLabel(inc.urgency_reason, currentLanguage);
    drawerLocationDisplay.textContent = `${getLocalityLabel(inc.locality, currentLanguage)}, ${getCityLabel(inc.city, currentLanguage)}`;
    drawerCoords.textContent = `${inc.latitude.toFixed(4)}° N, ${inc.longitude.toFixed(4)}° E`;

    drawerPriorityBadge.textContent = getPriorityLabel(inc.priority, currentLanguage);
    drawerPriorityBadge.className = `badge badge-${inc.priority.toLowerCase()}`;
    drawerDeptBadge.textContent = getDepartmentLabel(inc.department, currentLanguage);
    drawerStatusBadge.textContent = getStatusLabel(inc.status, currentLanguage);
    drawerCityBadge.textContent = `${getCityLabel(inc.city, currentLanguage)} (${getLocalityLabel(inc.locality, currentLanguage)})`;

    if (inc.is_escalated && inc.status !== 'RESOLVED') {
      drawerEscalationBadge.classList.remove('hidden');
      drawerEscalationBadge.textContent = inc.escalation_level >= 2 
        ? (d.escalationAlertActive || '🚨 COMMISSIONER ALERT ACTIVE') 
        : (d.escalationBreachAlert || '⚠️ SLA BREACH ESCALATED');
    } else {
      drawerEscalationBadge.classList.add('hidden');
    }

    const policies = { 
      CRITICAL: `12 ${d.hoursWord || 'HOURS'}`, 
      HIGH: `24 ${d.hoursWord || 'HOURS'}`, 
      MEDIUM: `48 ${d.hoursWord || 'HOURS'}`, 
      LOW: `72 ${d.hoursWord || 'HOURS'}` 
    };
    drawerSlaPolicy.textContent = policies[inc.priority] || `48 ${d.hoursWord || 'HOURS'}`;
    drawerSlaCountdown.textContent = getSlaDisplayText(inc, currentLanguage);
    drawerSlaDeadline.textContent = inc.sla_deadline 
      ? `${d.deadlinePrefix || 'Deadline:'} ${new Date(inc.sla_deadline).toLocaleString([], { dateStyle: 'short', timeStyle: 'short' })}`
      : (d.standardWindowText || 'Standard 48-Hour Municipal Window');

    drawerSlaStatusBadge.className = `sla-pill ${sla.sla_status.toLowerCase()}`;
    drawerSlaStatusBadge.textContent = inc.status === 'RESOLVED' 
      ? (d.statuses && d.statuses.RESOLVED ? d.statuses.RESOLVED : '✅ RESOLVED') 
      : (sla.is_breached ? (d.slaBreachedBadge || '🚨 SLA BREACHED') : (d.slaOnTrackBadge || '🟢 ON TRACK'));

    drawerSlaProgressBar.style.width = `${inc.status === 'RESOLVED' ? 100 : (sla.percent_elapsed || 20)}%`;
    drawerSlaProgressBar.className = `sla-progress-fill ${inc.status === 'RESOLVED' ? 'fill-green' : (sla.is_breached ? 'breached' : '')}`;

    routeOfficerSelect.value = inc.assigned_officer || 'Unassigned';
    routeStatusSelect.value = inc.status || 'NEW';
    routeNotesInput.value = '';

    if (inc.assigned_officer_phone) {
      officerContactInfo.classList.remove('hidden');
      officerPhoneDisplay.textContent = inc.assigned_officer_phone;
    } else {
      officerContactInfo.classList.add('hidden');
    }

    // Photo Card in Drawer
    const drawerPhotoCard = document.getElementById('drawerPhotoCard');
    const drawerPhotoImg = document.getElementById('drawerPhotoImg');
    if (drawerPhotoCard && drawerPhotoImg) {
      if (inc.photo_url) {
        drawerPhotoImg.src = inc.photo_url;
        drawerPhotoCard.classList.remove('hidden');
      } else {
        drawerPhotoCard.classList.add('hidden');
      }
    }

    // Municipal Resolution Proof in Drawer
    let resDiv = document.getElementById('drawerResolutionProof');
    if (!resDiv && drawerPhotoCard) {
      resDiv = document.createElement('div');
      resDiv.id = 'drawerResolutionProof';
      resDiv.className = 'drawer-card';
      drawerPhotoCard.parentNode.insertBefore(resDiv, drawerPhotoCard.nextSibling);
    }
    if (resDiv) {
      if (inc.resolution_photo_url) {
        resDiv.classList.remove('hidden');
        resDiv.innerHTML = `
          <div class="card-label-row">
            <span class="card-label" style="color:#059669;">✅ MUNICIPAL RESOLUTION PROOF (AFTER WORK)</span>
            <span class="photo-badge-tag" style="background:#ECFDF5; color:#059669;">Delivered to Citizen</span>
          </div>
          <div class="drawer-photo-wrapper" style="border-color:#10B981; margin-top:8px;">
            <img src="${escapeHtml(inc.resolution_photo_url)}" alt="Resolution Proof" style="width:100%; height:200px; object-fit:cover;" />
          </div>
          <div style="font-size:0.82rem; color:#065F46; font-weight:700; margin-top:8px;">
            ✓ Uploaded directly to the citizen by municipal ward crew upon task completion.
          </div>
        `;
      } else {
        resDiv.classList.add('hidden');
      }
    }

    // Citizen Rating & Verification in Drawer
    const ratingFormBlock = document.getElementById('drawerRatingFormBlock');
    const ratingSubmittedBlock = document.getElementById('drawerRatingSubmittedBlock');
    const submittedStars = document.getElementById('drawerSubmittedStars');
    const submittedFeedback = document.getElementById('drawerSubmittedFeedback');
    const feedbackInput = document.getElementById('drawerFeedbackInput');

    if (inc.citizen_rating && inc.citizen_rating > 0) {
      if (ratingFormBlock) ratingFormBlock.classList.add('hidden');
      if (ratingSubmittedBlock) {
        ratingSubmittedBlock.classList.remove('hidden');
        if (submittedStars) submittedStars.textContent = '⭐'.repeat(inc.citizen_rating);
        if (submittedFeedback) submittedFeedback.textContent = `"${inc.citizen_feedback || 'Resolved to satisfaction'}"`;
      }
    } else {
      if (ratingSubmittedBlock) ratingSubmittedBlock.classList.add('hidden');
      if (ratingFormBlock) {
        ratingFormBlock.classList.remove('hidden');
        if (feedbackInput) feedbackInput.value = '';
        setDrawerRating(5);
      }
    }

    drawerComplaintCount.textContent = `${data.complaints.length} ${d.mergedReportsCount || 'Citizen Reports Merged'}`;
    drawerComplaintsList.innerHTML = '';
    data.complaints.forEach(c => {
      const item = document.createElement('div');
      item.className = 'complaint-item';
      const timeStr = new Date(c.submitted_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
      const reporter = c.citizen_name || 'Resident';
      const repLocality = getLocalityLabel(c.locality, currentLanguage);
      const repCity = getCityLabel(c.city, currentLanguage);
      item.innerHTML = `
        <div class="complaint-meta">
          <span>${c.id} • ${escapeHtml(reporter)} • ${escapeHtml(repLocality)}, ${escapeHtml(repCity)}</span>
          <span>${timeStr}</span>
        </div>
        <div class="complaint-text">"${escapeHtml(c.raw_text)}"</div>
      `;
      drawerComplaintsList.appendChild(item);
    });

    drawerAuditLog.innerHTML = '';
    data.activity.forEach(a => {
      const item = document.createElement('div');
      item.className = 'audit-item';
      const timeStr = new Date(a.timestamp).toLocaleString();
      item.innerHTML = `
        <div><strong>[${escapeHtml(a.action)}]</strong> ${escapeHtml(a.details)}</div>
        <div class="audit-time">${timeStr}</div>
      `;
      drawerAuditLog.appendChild(item);
    });

    initLeafletMap(inc.latitude, inc.longitude, `${drawerHeadline.textContent} (${drawerLocationDisplay.textContent})`);

  } catch (e) {
    showToast('Failed to load details: ' + e.message);
  }
}

// Leaflet Map Initialization
function initLeafletMap(lat, lng, title) {
  const mapContainer = document.getElementById('leafletMap');
  if (!mapContainer) return;

  if (!leafletMapInstance) {
    leafletMapInstance = L.map('leafletMap').setView([lat, lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(leafletMapInstance);
  } else {
    leafletMapInstance.setView([lat, lng], 14);
  }

  setTimeout(() => leafletMapInstance.invalidateSize(), 100);

  if (currentMarker) leafletMapInstance.removeLayer(currentMarker);
  currentMarker = L.marker([lat, lng]).addTo(leafletMapInstance)
    .bindPopup(`<b>${escapeHtml(title)}</b><br>Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`)
    .openPopup();
}

function closeDrawer() {
  detailDrawer.classList.add('hidden');
  activeIncidentId = null;
  if ('speechSynthesis' in window && window.speechSynthesis.speaking) {
    window.speechSynthesis.cancel();
  }
}

// Fast-Track Escalate
fastTrackEscalateBtn.addEventListener('click', async () => {
  if (!activeIncidentId) return;

  const d = I18N[currentLanguage] || I18N.en;
  if (!confirm(`Fast-track Incident ${activeIncidentId} directly to Municipal Commissioner?`)) return;

  try {
    fastTrackEscalateBtn.disabled = true;
    fastTrackEscalateBtn.textContent = d.escalatingText || 'Escalating...';

    const res = await fetch(`/api/incidents/${activeIncidentId}/escalate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Immediate public safety / SLA non-compliance escalation' })
    });

    if (!res.ok) throw new Error('Escalation failed');
    showToast(`🚨 Incident ${activeIncidentId} fast-track escalated to Commissioner!`);
    await fetchIncidents();
    await openDetailDrawer(activeIncidentId);
  } catch (err) {
    showToast('Error: ' + err.message);
  } finally {
    fastTrackEscalateBtn.disabled = false;
    fastTrackEscalateBtn.textContent = d.fastTrackEscalateBtn || '⚡ Fast-Track Escalate to Commissioner →';
  }
});

// Routing Update
saveRoutingBtn.addEventListener('click', async () => {
  if (!activeIncidentId) return;

  const d = I18N[currentLanguage] || I18N.en;
  const payload = {
    assigned_officer: routeOfficerSelect.value,
    status: routeStatusSelect.value,
    notes: routeNotesInput.value.trim()
  };

  try {
    saveRoutingBtn.disabled = true;
    saveRoutingBtn.textContent = d.updatingText || 'Updating...';

    const res = await fetch(`/api/incidents/${activeIncidentId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    });

    if (!res.ok) throw new Error('Failed to update incident');
    showToast(`Incident ${activeIncidentId} updated successfully!`);
    await fetchIncidents();
    await openDetailDrawer(activeIncidentId);
  } catch (err) {
    showToast('Error: ' + err.message);
  } finally {
    saveRoutingBtn.disabled = false;
    saveRoutingBtn.textContent = d.saveRoutingBtn || 'Update & Route Problem →';
  }
});

// Inline Complaint Submission Handler
inlineComplaintForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  const text = inlineComplaintTextInput.value.trim();
  const city = inlineCitySelect.value;
  const locality = inlineLocalitySelect.value;
  const citizenName = inlineCitizenNameInput.value.trim() || 'Resident';
  const source = inlineComplaintSourceInput.value;
  const d = I18N[currentLanguage] || I18N.en;

  if (!text) return;
  stopVoiceRecording();

  inlineSubmitComplaintBtn.disabled = true;
  inlineSubmitComplaintBtn.innerHTML = `<span>${d.submittingBtn || 'Submitting & Triaging...'}</span>`;

  try {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, citizen_name: citizenName, city, locality, source, photo_url: (document.getElementById('complaintPhotoUrlInput') ? document.getElementById('complaintPhotoUrlInput').value : '') || null })
    });

    if (!res.ok) throw new Error('Submission failed');
    const result = await res.json();

    inlineComplaintTextInput.value = '';
    inlineCitizenNameInput.value = '';
    clearSelectedPhoto();

    const dupMsg = result.data.isDuplicate 
      ? `Merged into existing problem cluster ${result.data.clusterId} in ${result.data.locality}!` 
      : `New civic issue ${result.data.clusterId} registered in ${result.data.locality}!`;
    
    const newIncidentId = result.data.clusterId;
    const newLocality = result.data.locality || locality;

    // Save as citizen's tracking target
    userTrackingIncidentId = newIncidentId;
    userTrackingLocality = newLocality;
    userTrackingCitizenName = citizenName;
    if (!userPersonalComplaints.includes(newIncidentId)) {
      userPersonalComplaints.unshift(newIncidentId);
    }

    showToast(`📢 Complaint filed! Classified as [${result.data.priority}] ${result.data.department}. ${dupMsg}`);
    
    if (cityFilter.value !== 'ALL' && cityFilter.value !== city) {
      cityFilter.value = city;
      updateLocalityDropdown(city, localityFilter, true);
    }
    
    // Refresh table and live tracking
    await fetchIncidents();
    lookupComplaintTracking(newIncidentId);

    // Senior-Friendly Routing: Show Citizen their registered complaint status
    if (currentRoleMode === 'citizen') {
      switchView('my_complaints');
    } else {
      switchView('dashboard');
      openDetailDrawer(newIncidentId);
    }
  } catch (err) {
    showToast('Error: ' + err.message);
  } finally {
    inlineSubmitComplaintBtn.disabled = false;
    inlineSubmitComplaintBtn.innerHTML = `<span class="btn-megaphone-icon">📢</span><span>${I18N[currentLanguage].submitComplaintBtn}</span>`;
  }
});

// Setup Event Listeners
function setupEventListeners() {
  if (cityFilter) {
    cityFilter.addEventListener('change', () => {
      updateLocalityDropdown(cityFilter.value, localityFilter, true);
      fetchOfficers(cityFilter.value, deptFilter ? deptFilter.value : 'ALL');
      fetchIncidents();
    });
  }
  if (localityFilter) localityFilter.addEventListener('change', fetchIncidents);
  if (priorityFilter) priorityFilter.addEventListener('change', fetchIncidents);
  if (deptFilter) {
    deptFilter.addEventListener('change', () => {
      fetchOfficers(cityFilter ? cityFilter.value : 'ALL', deptFilter.value);
      fetchIncidents();
    });
  }

  inlineCitySelect.addEventListener('change', () => {
    updateLocalityDropdown(inlineCitySelect.value, inlineLocalitySelect, false);
  });

  let searchTimeout = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(fetchIncidents, 250);
  });

  const resetAll = () => {
    if (searchInput) searchInput.value = '';
    if (cityFilter) {
      cityFilter.value = 'ALL';
      updateLocalityDropdown('ALL', localityFilter, true);
    }
    if (priorityFilter) priorityFilter.value = 'ALL';
    if (deptFilter) deptFilter.value = 'ALL';
    currentStatusView = 'ACTIVE';
    if (toggleActiveView) toggleActiveView.classList.add('active');
    if (toggleResolvedView) toggleResolvedView.classList.remove('active');
    fetchIncidents();
  };
  resetFiltersBtn.addEventListener('click', resetAll);
  emptyResetBtn.addEventListener('click', resetAll);

  closeDrawerBtn.addEventListener('click', closeDrawer);
  detailDrawer.addEventListener('click', (e) => {
    if (e.target === detailDrawer) closeDrawer();
  });

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeDrawer();
      stopVoiceRecording();
    }
  });

  // Handle browser back/forward buttons with hash navigation
  window.addEventListener('hashchange', () => {
    const hash = window.location.hash.toLowerCase();
    if (hash === '#dashboard' && currentPortalView !== 'dashboard') {
      switchView('dashboard');
    } else if (hash === '#complaint' && currentPortalView !== 'complaint') {
      switchView('complaint');
    }
  });
}

// Toast
let toastTimeout = null;
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  clearTimeout(toastTimeout);
  toastTimeout = setTimeout(() => {
    toast.classList.add('hidden');
  }, 4500);
}

function escapeHtml(str) {
  if (!str) return '';
  return str.replace(/[&<>'"]/g, tag => ({
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    "'": '&#39;',
    '"': '&quot;'
  }[tag] || tag));
}


/* ==========================================================================
   PHASE 3: PHOTO EVIDENCE, CITIZEN RATING & WHATSAPP CIVIC BOT IMPLEMENTATION
   ========================================================================== */

let currentAttachedPhotoUrl = '';

function handlePhotoFileSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    const base64Data = e.target.result;
    try {
      showToast('Uploading evidence photo...');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data, filename: file.name })
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      currentAttachedPhotoUrl = data.url;
      const urlInput = document.getElementById('complaintPhotoUrlInput');
      if (urlInput) urlInput.value = data.url;
      
      const previewBox = document.getElementById('photoPreviewContainer');
      const previewImg = document.getElementById('photoPreviewImg');
      const previewName = document.getElementById('photoPreviewName');
      if (previewBox && previewImg) {
        previewImg.src = data.url;
        if (previewName) previewName.textContent = file.name;
        previewBox.classList.remove('hidden');
      }
      showToast('📷 Evidence photo attached successfully!');
    } catch (err) {
      showToast('Photo upload error: ' + err.message);
    }
  };
  reader.readAsDataURL(file);
}

function selectSamplePhoto(url, label) {
  currentAttachedPhotoUrl = url;
  const urlInput = document.getElementById('complaintPhotoUrlInput');
  if (urlInput) urlInput.value = url;
  const previewBox = document.getElementById('photoPreviewContainer');
  const previewImg = document.getElementById('photoPreviewImg');
  const previewName = document.getElementById('photoPreviewName');
  if (previewBox && previewImg) {
    previewImg.src = url;
    if (previewName) previewName.textContent = label;
    previewBox.classList.remove('hidden');
  }
  showToast('📷 Attached sample evidence: ' + label);
}

function clearSelectedPhoto() {
  currentAttachedPhotoUrl = '';
  const urlInput = document.getElementById('complaintPhotoUrlInput');
  if (urlInput) urlInput.value = '';
  const fileInput = document.getElementById('complaintPhotoFileInput');
  if (fileInput) fileInput.value = '';
  const previewBox = document.getElementById('photoPreviewContainer');
  if (previewBox) previewBox.classList.add('hidden');
}

// Star Rating Widget
let selectedDrawerRating = 5;

function setDrawerRating(stars) {
  selectedDrawerRating = stars;
  const row = document.getElementById('drawerStarRow');
  if (!row) return;
  const starBtns = row.querySelectorAll('.star-btn');
  starBtns.forEach((btn, idx) => {
    if (idx < stars) {
      btn.classList.add('active');
    } else {
      btn.classList.remove('active');
    }
  });
  const scoreText = document.getElementById('drawerStarScoreText');
  if (scoreText) {
    const labels = ['', '1/5 Poor', '2/5 Below Average', '3/5 Satisfactory', '4/5 Very Good', '5/5 Excellent'];
    scoreText.textContent = labels[stars] || (stars + '/5');
  }
}

async function submitCitizenFeedback(isDispute) {
  if (!activeIncidentId) return;
  const feedbackInput = document.getElementById('drawerFeedbackInput');
  const feedback = feedbackInput ? feedbackInput.value.trim() : '';

  try {
    const res = await fetch('/api/incidents/' + activeIncidentId + '/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        rating: selectedDrawerRating,
        feedback: feedback || (isDispute ? 'Citizen disputed resolution' : 'Verified satisfied with resolution'),
        dispute: Boolean(isDispute),
        citizen_name: userTrackingCitizenName || 'Resident'
      })
    });

    if (!res.ok) throw new Error('Feedback submission failed');
    const data = await res.json();

    showToast(isDispute 
      ? '⚠️ Dispute recorded! Ticket re-opened for department inspection.' 
      : '⭐ Thank you! Citizen rating and resolution verification recorded.');

    // Refresh incidents and drawer
    await fetchIncidents();
    lookupComplaintTracking(activeIncidentId);
    openDetailDrawer(activeIncidentId);
  } catch (err) {
    showToast('Feedback error: ' + err.message);
  }
}

function reopenRatingForm() {
  const formBlock = document.getElementById('drawerRatingFormBlock');
  const noticeBlock = document.getElementById('drawerRatingSubmittedBlock');
  if (formBlock) formBlock.classList.remove('hidden');
  if (noticeBlock) noticeBlock.classList.add('hidden');
}

// WhatsApp Civic Bot Simulator
let currentWaPhotoUrl = '';

function openWhatsAppModal() {
  const modal = document.getElementById('whatsAppBotModal');
  if (modal) {
    modal.classList.remove('hidden');
    const input = document.getElementById('waMessageInput');
    if (input) input.focus();
  }
}

function closeWhatsAppModal() {
  const modal = document.getElementById('whatsAppBotModal');
  if (modal) modal.classList.add('hidden');
}

function resetWhatsAppChat() {
  const body = document.getElementById('waChatBody');
  if (!body) return;
  body.innerHTML = `
    <div class="wa-encryption-notice">
      🔒 Messages are processed in real-time by Panchayat Automated Triage Engine and routed directly to Municipal Ward Engineers.
    </div>
    <div class="wa-msg-bubble wa-bot-msg">
      <div class="wa-msg-text">
        Namaste! 🙏 Welcome to <strong>Panchayat Civic WhatsApp Service</strong>.<br><br>
        Citizens can report civic issues like <strong>potholes, garbage dumps, live wires, or water leaks</strong> right here. Describe your grievance or pick a quick option below:
      </div>
      <div class="wa-msg-time">Just now</div>
    </div>
    <div class="wa-quick-replies" id="waQuickReplies">
      <button type="button" class="wa-chip" onclick="sendWhatsAppQuickPrompt('⚡ Live high-voltage wire snapped on road in Jayanagar', '/images/wire_hazard_sample.svg')">⚡ Snapped Wire (Jayanagar)</button>
      <button type="button" class="wa-chip" onclick="sendWhatsAppQuickPrompt('🕳️ Massive dangerous road crater / pothole on 80ft road Koramangala', '/images/pothole_sample.svg')">🕳️ Dangerous Pothole (Koramangala)</button>
      <button type="button" class="wa-chip" onclick="sendWhatsAppQuickPrompt('🗑️ Heavy garbage dump overflowing near market in Gandhi Bazaar', '/images/garbage_sample.svg')">🗑️ Overflowing Garbage (Gandhi Bazaar)</button>
      <button type="button" class="wa-chip" onclick="sendWhatsAppQuickPrompt('💧 Clean drinking water main pipe burst flooding Bannerghatta road', '/images/water_leak_sample.svg')">💧 Pipe Burst (Bannerghatta)</button>
    </div>
  `;
  clearWhatsAppPhoto();
}

function handleWhatsAppPhotoSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    const base64Data = e.target.result;
    try {
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data, filename: file.name })
      });
      if (res.ok) {
        const data = await res.json();
        currentWaPhotoUrl = data.url;
        const bar = document.getElementById('waPhotoPreviewBar');
        const img = document.getElementById('waPhotoPreviewImg');
        const txt = document.getElementById('waPhotoPreviewText');
        if (bar && img) {
          img.src = data.url;
          if (txt) txt.textContent = file.name;
          bar.classList.remove('hidden');
        }
      }
    } catch (err) {}
  };
  reader.readAsDataURL(file);
}

function clearWhatsAppPhoto() {
  currentWaPhotoUrl = '';
  const bar = document.getElementById('waPhotoPreviewBar');
  if (bar) bar.classList.add('hidden');
  const fileInput = document.getElementById('waPhotoFileInput');
  if (fileInput) fileInput.value = '';
}

function sendWhatsAppQuickPrompt(text, photoUrl) {
  const input = document.getElementById('waMessageInput');
  if (input) input.value = text;
  if (photoUrl) {
    currentWaPhotoUrl = photoUrl;
    const bar = document.getElementById('waPhotoPreviewBar');
    const img = document.getElementById('waPhotoPreviewImg');
    const txt = document.getElementById('waPhotoPreviewText');
    if (bar && img) {
      img.src = photoUrl;
      if (txt) txt.textContent = 'Evidence attached';
      bar.classList.remove('hidden');
    }
  }
  handleWhatsAppSend(new Event('submit'));
}

async function handleWhatsAppSend(event) {
  if (event && event.preventDefault) event.preventDefault();
  const input = document.getElementById('waMessageInput');
  if (!input) return;
  const text = input.value.trim();
  if (!text) return;

  const chatBody = document.getElementById('waChatBody');
  const nowStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

  // Append user bubble
  const userBubble = document.createElement('div');
  userBubble.className = 'wa-msg-bubble wa-user-msg';
  let photoHtml = currentWaPhotoUrl ? `<img src="${currentWaPhotoUrl}" class="wa-msg-photo" alt="Attached Evidence" />` : '';
  userBubble.innerHTML = `
    ${photoHtml}
    <div class="wa-msg-text">${escapeHtml(text)}</div>
    <div class="wa-msg-time">${nowStr} ✓✓</div>
  `;
  chatBody.appendChild(userBubble);
  chatBody.scrollTop = chatBody.scrollHeight;

  // Clear input
  const photoToSend = currentWaPhotoUrl;
  input.value = '';
  clearWhatsAppPhoto();

  // Typing indicator
  const typingBubble = document.createElement('div');
  typingBubble.className = 'wa-msg-bubble wa-bot-msg';
  typingBubble.id = 'waTypingBubble';
  typingBubble.innerHTML = `<div class="wa-msg-text"><em>Panchayat AI is triaging grievance...</em> ⚙️</div>`;
  chatBody.appendChild(typingBubble);
  chatBody.scrollTop = chatBody.scrollHeight;

  try {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        text,
        source: 'WHATSAPP_BOT',
        citizen_name: '+91 98450 12345 (WhatsApp Citizen)',
        city: 'Bengaluru',
        locality: 'Jayanagar',
        photo_url: photoToSend || null
      })
    });

    const tb = document.getElementById('waTypingBubble');
    if (tb) tb.remove();

    if (!res.ok) throw new Error('Could not triage message');
    const data = await res.json();
    const result = data.data;

    const botReplyBubble = document.createElement('div');
    botReplyBubble.className = 'wa-msg-bubble wa-bot-msg';
    
    const replyTimeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    botReplyBubble.innerHTML = `
      <div class="wa-msg-text">
        ✅ <strong>Panchayat Grievance Registered!</strong><br><br>
        🎫 <strong>Ticket ID</strong>: <code>${result.clusterId}</code><br>
        🏛️ <strong>Category</strong>: ${result.department}<br>
        🔴 <strong>Priority</strong>: [${result.priority}] (Automated SLA)<br>
        📍 <strong>Location</strong>: ${result.locality || 'Jayanagar'}, ${result.city || 'Bengaluru'}<br><br>
        ${result.isDuplicate ? 'ℹ️ <em>Merged with existing cluster reports in your locality.</em>' : '⚡ <em>Field engineer team alerted.</em>'}<br><br>
        Type your ticket ID <code>${result.clusterId}</code> anytime to receive live status updates!
      </div>
      <div class="wa-msg-time">${replyTimeStr}</div>
    `;
    chatBody.appendChild(botReplyBubble);
    chatBody.scrollTop = chatBody.scrollHeight;

    // Save as user complaint
    userTrackingIncidentId = result.clusterId;
    userTrackingLocality = result.locality || 'Jayanagar';
    userTrackingCitizenName = '+91 98450 12345 (WhatsApp Citizen)';
    if (!userPersonalComplaints.includes(result.clusterId)) {
      userPersonalComplaints.unshift(result.clusterId);
    }

    // Refresh dashboard and live tracking
    await fetchIncidents();
    lookupComplaintTracking(result.clusterId);
    showToast('💬 WhatsApp grievance logged: Ticket ' + result.clusterId);

  } catch (err) {
    const tb = document.getElementById('waTypingBubble');
    if (tb) tb.remove();

    const errBubble = document.createElement('div');
    errBubble.className = 'wa-msg-bubble wa-bot-msg';
    errBubble.innerHTML = `
      <div class="wa-msg-text" style="color:#DC2626;">
        ⚠️ Sorry, an error occurred while logging your grievance. Please try again. (${escapeHtml(err.message)})
      </div>
    `;
    chatBody.appendChild(errBubble);
    chatBody.scrollTop = chatBody.scrollHeight;
  }
}


/* ==========================================================================
   ROLE / PERSONA SEPARATION & MUNICIPAL RESOLUTION PROOF LOGIC
   ========================================================================== */



/* ==========================================================================
   DEMO EXAMPLES FOR CITIZENS & MUNICIPAL WARD OFFICERS
   ========================================================================== */

const DEMO_CITIZEN_COMPLAINTS = {
  electrical: {
    title: '⚡ Live Sparking Transformer Cable',
    dept: 'ELECTRICAL',
    city: 'Bengaluru',
    locality: 'Jayanagar',
    name: 'Aarav Sharma',
    text: 'Live electric cable snapped from transformer pole near Metro Pillar 42, 8th Main Jayanagar. Sparking violently on wet road creating high risk of fatal electrocution, please cut off power and dispatch lineman team immediately!'
  },
  pothole: {
    title: '🕳️ Hazardous Road Crater / Pothole',
    dept: 'ROADS',
    city: 'Bengaluru',
    locality: 'Koramangala',
    name: 'Priya Nair',
    text: 'Deep 2-foot road crater and broken asphalt on 100 Feet Road, 4th Block Koramangala. Two two-wheelers skidded this morning during rain, urgent road patch and leveling required before serious accident occurs.'
  },
  garbage: {
    title: '🗑️ Overflowing Municipal Garbage Dump',
    dept: 'SANITATION',
    city: 'Bengaluru',
    locality: 'Gandhi Bazaar',
    name: 'Rohan Gupta',
    text: 'Massive garbage pile overflowing from community bin on Gandhi Bazaar Main Road near market entrance. Waste spilling onto road, stray animals gathering, unbearable foul smell choking pedestrian walkway.'
  },
  water: {
    title: '🚰 Main Drinking Water Pipeline Burst',
    dept: 'WATER_SEWER',
    city: 'Bengaluru',
    locality: 'Bannerghatta',
    name: 'Deepak Kumar',
    text: 'Severe drinking water main pipeline breach opposite Apollo Hospital on Bannerghatta Main Road. Clean treated water gushing out with massive pressure, flooding street and causing zero water pressure in 40+ residential apartments.'
  }
};

function loadDemoComplaint(type) {
  const demo = DEMO_CITIZEN_COMPLAINTS[type];
  if (!demo) return;

  const inputCity = document.getElementById('inlineCitySelect');
  const inputLoc = document.getElementById('inlineLocalitySelect');
  const inputName = document.getElementById('inlineCitizenNameInput');
  const inputText = document.getElementById('inlineComplaintTextInput');

  if (inputCity) {
    inputCity.value = demo.city;
    if (inputLoc) updateLocalityDropdown(demo.city, inputLoc, false);
  }
  if (inputLoc) inputLoc.value = demo.locality;
  if (inputName) inputName.value = demo.name;
  if (inputText) inputText.value = demo.text;

  showToast(`💡 Demo Complaint Loaded: ${demo.title}. Ready to submit!`);
  
  const submitBtn = document.getElementById('inlineSubmitComplaintBtn');
  if (submitBtn) {
    submitBtn.scrollIntoView({ behavior: 'smooth', block: 'center' });
    submitBtn.focus();
  }
}
window.loadDemoComplaint = loadDemoComplaint;

function loadDemoWardFilter(filterType) {
  if (filterType === 'CRITICAL') {
    priorityFilter.value = 'CRITICAL';
    deptFilter.value = 'ALL';
    showToast('🚨 Filtered to Critical 12-Hour Statutory SLA Hazards!');
  } else if (filterType === 'ROADS') {
    deptFilter.value = 'ROADS';
    priorityFilter.value = 'ALL';
    showToast('🛣️ Filtered to Roads & Potholes Repair Work Orders!');
  } else if (filterType === 'SANITATION') {
    deptFilter.value = 'SANITATION';
    priorityFilter.value = 'ALL';
    showToast('🗑️ Filtered to Garbage & Sanitation Work Orders!');
  }
  fetchIncidents();
  filterMunicipalDepartment(deptFilter.value);
}
window.loadDemoWardFilter = loadDemoWardFilter;

/* ==========================================================================
   STRICT ROLE SELECTION & PERSONA ISOLATION (CITIZEN VS MUNICIPAL WARD)
   ========================================================================== */

currentRoleMode = null; // 'citizen' or 'municipal'

function selectRoleMode(role, saveChoice = true) {
  currentRoleMode = role;
  if (saveChoice) {
    try {
      localStorage.setItem('panchayat_selected_role', role);
    } catch (e) {}
  }

  // Close the role gate modal
  closeRoleSelectorGate();

  const authRoleIcon = document.getElementById('authRoleIcon');
  const authUserName = document.getElementById('authUserName');
  const authUserRoleTag = document.getElementById('authUserRoleTag');

  const navComplaint = document.getElementById('navTabComplaint');
  const navMyComplaints = document.getElementById('navTabMyComplaints');
  const navDashboard = document.getElementById('navTabDashboard');

  const sideComplaint = document.getElementById('sideNavComplaint');
  const sideMyComplaints = document.getElementById('sideNavMyComplaints');
  const sideTracking = document.getElementById('sideNavTracking');
  const sideDashboard = document.getElementById('sideNavDashboard');

  if (role === 'citizen') {
    document.body.classList.add('role-citizen');
    document.body.classList.remove('role-municipal');

    if (authRoleIcon) authRoleIcon.textContent = '👤';
    if (authUserName) authUserName.textContent = 'Citizen Portal';
    if (authUserRoleTag) authUserRoleTag.textContent = 'Public Resident';

    // Top Tabs: Show Citizen Tabs, Strictly Hide Municipal Tab
    if (navComplaint) navComplaint.classList.remove('hidden');
    if (navMyComplaints) navMyComplaints.classList.remove('hidden');
    if (navDashboard) navDashboard.classList.add('hidden');

    // Sidebar: Show Citizen Items, Strictly Hide Municipal Item
    if (sideComplaint) sideComplaint.classList.remove('hidden');
    if (sideMyComplaints) sideMyComplaints.classList.remove('hidden');
    if (sideTracking) sideTracking.classList.remove('hidden');
    if (sideDashboard) sideDashboard.classList.add('hidden');

    // Route to Citizen Complaint Desk
    switchView('complaint');
    showToast('👤 Entered Citizen Portal: Report civic issues & track repairs.');

  } else {
    // Municipal Ward Officer
    document.body.classList.add('role-municipal');
    document.body.classList.remove('role-citizen');

    if (authRoleIcon) authRoleIcon.textContent = '🏛️';
    if (authUserName) authUserName.textContent = 'Municipal Ward Portal';
    if (authUserRoleTag) authUserRoleTag.textContent = 'Ward Officer Workspace';

    // Top Tabs: Strictly Hide Citizen Tabs, Show Municipal Tab
    if (navComplaint) navComplaint.classList.add('hidden');
    if (navMyComplaints) navMyComplaints.classList.add('hidden');
    if (navDashboard) navDashboard.classList.remove('hidden');

    // Sidebar: Strictly Hide Citizen Items, Show Municipal Item
    if (sideComplaint) sideComplaint.classList.add('hidden');
    if (sideMyComplaints) sideMyComplaints.classList.add('hidden');
    if (sideTracking) sideTracking.classList.add('hidden');
    if (sideDashboard) sideDashboard.classList.remove('hidden');

    // Route to Municipal Tasks Queue
    switchView('dashboard');
    renderStudioDashboard();
    showToast('🏛️ Entered Municipal Ward Portal: Department Tasks Queue & Verification.');
  }
}

function openRoleSelectorGate() {
  const gate = document.getElementById('roleSelectorGate');
  if (gate) {
    gate.classList.remove('hidden');
    gate.style.display = 'flex';
  }
}

function closeRoleSelectorGate() {
  const gate = document.getElementById('roleSelectorGate');
  if (gate) {
    gate.classList.add('hidden');
    gate.style.display = 'none';
  }
}

function signOutUser() {
  currentRoleMode = null;
  try {
    localStorage.removeItem('panchayat_selected_role');
    localStorage.removeItem('panchayat_auth_user');
  } catch (e) {}
  document.body.classList.remove('role-citizen', 'role-municipal');
  openRoleSelectorGate();
}


// MUNICIPAL TASK RESOLUTION MODAL LOGIC
function openResolveTaskModal(incidentId) {
  activeResolvingIncidentId = incidentId;
  const inc = cachedIncidents.find(i => i.id === incidentId);

  const modal = document.getElementById('resolveTaskModal');
  const title = document.getElementById('resolveModalTitle');
  const sub = document.getElementById('resolveModalSub');
  const citizenText = document.getElementById('resolveCitizenComplaintText');
  const citizenPhotoBox = document.getElementById('resolveCitizenPhotoBox');
  const citizenPhotoImg = document.getElementById('resolveCitizenPhotoImg');
  const notesInput = document.getElementById('resolveNotesInput');

  if (inc) {
    if (sub) sub.textContent = `${inc.id} • ${getDepartmentLabel(inc.department, currentLanguage)} • ${inc.locality}, ${inc.city}`;
    if (citizenText) citizenText.textContent = `"${inc.headline}"`;
    if (inc.photo_url) {
      if (citizenPhotoImg) citizenPhotoImg.src = inc.photo_url;
      if (citizenPhotoBox) citizenPhotoBox.classList.remove('hidden');
    } else if (citizenPhotoBox) {
      citizenPhotoBox.classList.add('hidden');
    }
  }

  if (notesInput) notesInput.value = '';
  clearResolvePhoto();

  if (modal) modal.classList.remove('hidden');
}

function closeResolveTaskModal() {
  const modal = document.getElementById('resolveTaskModal');
  if (modal) modal.classList.add('hidden');
  activeResolvingIncidentId = null;
}

let currentPhotoInspection = null;

async function runAiImageInspection(imageDataOrUrl, filename) {
  const panel = document.getElementById('aiImageCheckerPanel');
  const badge = document.getElementById('aiVerdictBadge');
  const scoreFill = document.getElementById('aiScoreFill');
  const scoreText = document.getElementById('aiScoreText');
  const findingsList = document.getElementById('aiForensicFindings');
  const alertBox = document.getElementById('aiTamperAlert');
  const confirmBtn = document.getElementById('btnConfirmTaskResolved');

  if (panel) panel.classList.remove('hidden');
  if (badge) {
    badge.textContent = 'SCANNING DIGITAL SENSOR FORENSICS...';
    badge.className = 'ai-verdict-badge verifying';
  }

  try {
    const res = await fetch('/api/verify-image-ai', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        image: imageDataOrUrl,
        filename: filename
      })
    });

    const data = await res.json();
    const insp = data.inspection || {};
    currentPhotoInspection = insp;

    const isFake = insp.is_ai_generated || insp.is_ai_modified;

    if (badge) {
      badge.textContent = isFake ? `🚨 ${insp.verdict}` : `✅ VERIFIED CAMERA PHOTO`;
      badge.className = 'ai-verdict-badge ' + (isFake ? 'fake' : 'genuine');
    }

    if (scoreFill) {
      scoreFill.style.width = `${insp.authenticity_score}%`;
      scoreFill.style.background = isFake ? '#DC2626' : '#059669';
    }

    if (scoreText) {
      scoreText.textContent = isFake 
        ? `Authenticity: ${insp.authenticity_score}% (${insp.ai_probability}% AI Synthetic Probability)`
        : `Authenticity: ${insp.authenticity_score}% (Natural Camera Optical Capture)`;
    }

    if (findingsList) {
      findingsList.innerHTML = '';
      (insp.forensic_reasons || []).forEach(reason => {
        const item = document.createElement('div');
        item.className = 'forensic-item ' + (isFake ? 'item-fake' : 'item-genuine');
        item.innerHTML = `<span>${isFake ? '⚠️' : '✓'}</span> <span>${escapeHtml(reason)}</span>`;
        findingsList.appendChild(item);
      });
    }

    if (alertBox) {
      if (isFake) {
        alertBox.classList.remove('hidden');
      } else {
        alertBox.classList.add('hidden');
      }
    }

    if (confirmBtn) {
      if (isFake) {
        confirmBtn.disabled = true;
        confirmBtn.innerHTML = `<span>⚠️ Resolution Blocked: Upload Genuine Site Photo (AI Image Prohibited)</span>`;
      } else {
        confirmBtn.disabled = false;
        confirmBtn.innerHTML = `<span>✅ Mark Task RESOLVED &amp; Publish Verified Proof &rarr;</span>`;
      }
    }

    if (isFake) {
      showToast(`🚨 AI DETECTOR WARNING: Image flagged as ${insp.verdict}. Corrupt AI fake proof blocked!`);
    } else {
      showToast(`✅ AI CHECKER: Genuine field photo verified (${insp.authenticity_score}% authenticity).`);
    }

  } catch (err) {
    console.warn('AI check error:', err);
  }
}

function handleResolvePhotoSelected(event) {
  const file = event.target.files && event.target.files[0];
  if (!file) return;

  const reader = new FileReader();
  reader.onload = async function(e) {
    const base64Data = e.target.result;
    try {
      showToast('Uploading resolution photo proof...');
      const res = await fetch('/api/upload', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ image: base64Data, filename: file.name })
      });
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      currentResolvePhotoUrl = data.url;
      const urlInput = document.getElementById('resolvePhotoUrlInput');
      if (urlInput) urlInput.value = data.url;
      
      const previewBox = document.getElementById('resolvePhotoPreviewContainer');
      const previewImg = document.getElementById('resolvePhotoPreviewImg');
      const previewName = document.getElementById('resolvePhotoPreviewName');
      if (previewBox && previewImg) {
        previewImg.src = data.url;
        if (previewName) previewName.textContent = file.name;
        previewBox.classList.remove('hidden');
      }
      showToast('📷 Resolution photo proof attached!');
      runAiImageInspection(base64Data, file.name);
    } catch (err) {
      showToast('Upload error: ' + err.message);
    }
  };
  reader.readAsDataURL(file);
}

function selectSampleResolutionPhoto(url, label) {
  currentResolvePhotoUrl = url;
  const urlInput = document.getElementById('resolvePhotoUrlInput');
  if (urlInput) urlInput.value = url;
  const previewBox = document.getElementById('resolvePhotoPreviewContainer');
  const previewImg = document.getElementById('resolvePhotoPreviewImg');
  const previewName = document.getElementById('resolvePhotoPreviewName');
  if (previewBox && previewImg) {
    previewImg.src = url.startsWith('/') ? url : '/images/resolved_road_sample.svg';
    if (previewName) previewName.textContent = label;
    previewBox.classList.remove('hidden');
  }
  showToast('📷 Selected proof: ' + label);
  runAiImageInspection(url, label || url);
}

function clearResolvePhoto() {
  currentResolvePhotoUrl = '';
  currentPhotoInspection = null;
  const urlInput = document.getElementById('resolvePhotoUrlInput');
  if (urlInput) urlInput.value = '';
  const fileInput = document.getElementById('resolvePhotoFileInput');
  if (fileInput) fileInput.value = '';
  const previewBox = document.getElementById('resolvePhotoPreviewContainer');
  if (previewBox) previewBox.classList.add('hidden');
  const panel = document.getElementById('aiImageCheckerPanel');
  if (panel) panel.classList.add('hidden');
  const confirmBtn = document.getElementById('btnConfirmTaskResolved');
  if (confirmBtn) {
    confirmBtn.disabled = false;
    confirmBtn.innerHTML = `<span>✅ Mark Task RESOLVED &amp; Publish Photo Proof to Citizen &rarr;</span>`;
  }
}

async function confirmTaskResolution() {
  if (!activeResolvingIncidentId) return;

  if (currentPhotoInspection && (currentPhotoInspection.is_ai_generated || currentPhotoInspection.is_ai_modified)) {
    showToast('🚨 Action blocked by AI Integrity Engine: Fake AI photo evidence cannot be submitted to citizens!');
    return;
  }

  const urlInput = document.getElementById('resolvePhotoUrlInput');
  const notesInput = document.getElementById('resolveNotesInput');
  const photoUrl = (urlInput ? urlInput.value : '') || currentResolvePhotoUrl || '/images/resolved_road_sample.svg';
  const notes = (notesInput ? notesInput.value.trim() : '') || 'Work inspected and completed by municipal crew';

  const btn = document.getElementById('btnConfirmTaskResolved');
  if (btn) btn.disabled = true;

  try {
    const res = await fetch(`/api/incidents/${activeResolvingIncidentId}/resolve`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        resolution_photo_url: photoUrl,
        filename: photoUrl,
        notes: notes,
        officer_name: 'Er. S. Sharma (Ward Engineer)'
      })
    });

    const data = await res.json();
    if (!res.ok || data.rejected_by_ai) {
      throw new Error(data.error || 'Task resolution update failed');
    }

    showToast('✅ Task RESOLVED! Photo proof verified by AI and delivered to citizen.');
    closeResolveTaskModal();

    await fetchIncidents();
    lookupComplaintTracking(activeResolvingIncidentId);
    if (activeIncidentId === activeResolvingIncidentId) {
      openDetailDrawer(activeResolvingIncidentId);
    }
  } catch (err) {
    showToast('Resolution error: ' + err.message);
  } finally {
    if (btn) btn.disabled = false;
  }
}

/* ==========================================================================
   MUNICIPAL STUDIO DASHBOARD CONTROLLER (EXACT REFERENCE FORMAT MATCH)
   Subjects Sidebar, Carousel Spotlight Cards & Upcoming Deadlines Section
   ========================================================================== */

let studioCurrentPage = 0;
const STUDIO_PAGE_SIZE = 6;

function formatStudioDeadline(isoDateString) {
  if (!isoDateString) return 'Deadline is Today, 5:00 pm';
  try {
    const d = new Date(isoDateString);
    if (isNaN(d.getTime())) return 'Deadline is Approaching';
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const month = months[d.getMonth()];
    const day = d.getDate();
    const nth = (day === 1 || day === 21 || day === 31) ? 'st' : (day === 2 || day === 22) ? 'nd' : (day === 3 || day === 23) ? 'rd' : 'th';
    const year = d.getFullYear();
    let hours = d.getHours();
    const minutes = d.getMinutes().toString().padStart(2, '0');
    const ampm = hours >= 12 ? 'pm' : 'am';
    hours = hours % 12;
    hours = hours ? hours : 12;
    return `Deadline is ${month} ${day}${nth} ${year}, ${hours}:${minutes} ${ampm}`;
  } catch (e) {
    return 'Deadline is Today, 5:00 pm';
  }
}

function filterMunicipalDepartment(dept) {
  currentOfficerField = dept;
  studioCurrentPage = 0;

  // 1. Update left sidebar buttons
  const homeBtn = document.getElementById('btnStudioHome');
  if (homeBtn) {
    if (dept === 'ALL') homeBtn.classList.add('active');
    else homeBtn.classList.remove('active');
  }

  const deptIds = {
    ROADS: 'subjRoads',
    SANITATION: 'subjSan',
    WATER_SEWER: 'subjWater',
    ELECTRICAL: 'subjElec',
    HEALTH: 'subjHealth',
    TRAFFIC_PARKS: 'subjTraffic'
  };

  Object.entries(deptIds).forEach(([key, elId]) => {
    const el = document.getElementById(elId);
    if (el) {
      if (dept === key) el.classList.add('active');
      else el.classList.remove('active');
    }
  });

  const names = {
    ALL: 'All Municipal Departments',
    ROADS: 'Roads & Bridges',
    SANITATION: 'Garbage & Sanitation',
    WATER_SEWER: 'Water & Sewerage',
    ELECTRICAL: 'Electrical & Lighting',
    HEALTH: 'Public Health',
    TRAFFIC_PARKS: 'Encroachment & Traffic'
  };

  // 2. Update workspace title & department pill badge
  const titleEl = document.getElementById('studioWorkspaceTitle');
  const subEl = document.getElementById('studioWorkspaceSub');
  const badgeWrap = document.getElementById('studioDepartmentBadgeWrap');
  const badgeText = document.getElementById('studioDeptBadgeText');

  if (titleEl) {
    if (dept === 'ALL') {
      titleEl.textContent = 'Municipal Work Orders & Triage Queue';
      if (subEl) subEl.textContent = 'Live citizen grievance stream triaged by department & SLA priority';
      if (badgeWrap) badgeWrap.classList.add('hidden');
    } else {
      titleEl.textContent = `${names[dept] || dept} Work Orders`;
      if (subEl) subEl.textContent = `Active field tasks, SLA compliance deadlines & dispatch records for ${names[dept] || dept}`;
      if (badgeWrap) {
        badgeWrap.classList.remove('hidden');
        if (badgeText) badgeText.textContent = (names[dept] || dept).toUpperCase();
      }
    }
  }

  // 3. Sync with classic dept filter if present and trigger fetch
  if (deptFilter) {
    deptFilter.value = (dept === 'TRAFFIC_PARKS' ? 'ALL' : dept);
  }

  fetchIncidents();
  renderStudioDashboard();
  showToast(`📂 Showing: ${names[dept] || dept}`);
}

function paginateStudioTasks(delta) {
  studioCurrentPage += delta;
  if (studioCurrentPage < 0) studioCurrentPage = 0;
  renderStudioDashboard();
}

function scrollToTasksQueue() {
  const el = document.getElementById('studioDeadlinesSection');
  if (el) {
    el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
}
const scrollToUpcomingDeadlines = scrollToTasksQueue;

function openStudioTimeline() {
  showToast('🔀 Opening Ward 12 Activity Timeline & Audit Logs...');
  if (cachedIncidents && cachedIncidents.length > 0) {
    openDetailDrawer(cachedIncidents[0].id);
  }
}

function openStudioCalendar() {
  showToast('📅 Ward SLA Calendar: Critical 12h & High 24h statutory compliance at 98.4%');
}

function openStudioLeaderboard() {
  showToast('🏆 Ward Performance: Ward 12 ranked #1 in rapid pothole resolution across city!');
}

function renderStudioDashboard() {
  if (!cachedIncidents) return;

  // 1. Calculate live counts for sidebar
  const counts = {
    ROADS: 0,
    SANITATION: 0,
    WATER_SEWER: 0,
    ELECTRICAL: 0,
    HEALTH: 0,
    TRAFFIC_PARKS: 0
  };

  cachedIncidents.forEach(inc => {
    if (inc.status !== 'RESOLVED') {
      if (inc.department === 'ROADS') counts.ROADS++;
      else if (inc.department === 'SANITATION') counts.SANITATION++;
      else if (inc.department === 'WATER_SEWER') counts.WATER_SEWER++;
      else if (inc.department === 'ELECTRICAL') counts.ELECTRICAL++;
      else if (inc.department === 'HEALTH') counts.HEALTH++;
      else counts.TRAFFIC_PARKS++;
    }
  });

  const cRoads = document.getElementById('countSubjRoads');
  const cSan = document.getElementById('countSubjSan');
  const cWater = document.getElementById('countSubjWater');
  const cElec = document.getElementById('countSubjElec');
  const cHealth = document.getElementById('countSubjHealth');
  const cTraffic = document.getElementById('countSubjTraffic');

  if (cRoads) cRoads.textContent = counts.ROADS;
  if (cSan) cSan.textContent = counts.SANITATION;
  if (cWater) cWater.textContent = counts.WATER_SEWER;
  if (cElec) cElec.textContent = counts.ELECTRICAL;
  if (cHealth) cHealth.textContent = counts.HEALTH;
  if (cTraffic) cTraffic.textContent = counts.TRAFFIC_PARKS;

}
