// public/js/app.js
// PANCHAYAT - Civic Intelligence & SLA Escalation Platform Client
// Complete I18N Translation Engine (Telugu, Hindi, Kannada, Marathi, Tamil, English)
// Nike-Style Kinetic Slide Navigation, Live Complaint Tracking, & Locality Priority Highlighting

let leafletMapInstance = null;
let currentMarker = null;
let activeIncidentId = null;
let citiesRegistry = {};
let speechRecognition = null;
let isRecordingVoice = false;
let currentLanguage = 'en';
let currentStatusView = 'ACTIVE';
let currentPortalView = 'complaint'; // 'complaint' or 'dashboard'
let availableOfficers = [];
let cachedIncidents = [];

// USER'S PERSONAL CIVIC TRACKING STATE (Pinned & Highlighted First)
let userTrackingIncidentId = 'INC-101';
let userTrackingLocality = 'Jayanagar';
let filterByLocalityActive = true;

// COMPREHENSIVE I18N DICTIONARY FOR ALL LANGUAGES
const I18N = {
  en: {
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
    channels: {
      CITIZEN_PORTAL: 'Citizen Web Portal',
      VOICE_CALL_IVR: 'Voice IVR Helpline',
      WHATSAPP_BOT: 'WhatsApp Civic Bot'
    },
    grievanceLabel: 'Problem Details (Pothole, Garbage, Water Leak, Live Wire):',
    speakVoiceBtn: 'Speak Voice 🎙️',
    listeningMsg: 'Listening... Speak in your selected language',
    voiceHint: 'Tip: Supports voice dictation in English, Hindi, Kannada, Marathi, Telugu, Tamil!',
    complaintTextPlaceholder: "Describe the problem or click 'Speak Voice' to dictate (e.g. 'Huge garbage dump overflowing near market gate on 5th main')...",
    submitComplaintBtn: 'Submit Civic Complaint →',
    submittingBtn: 'Submitting & Triaging...',

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

    // Categories
    categoriesTitle: 'Civic Problem Classification & Government Resolution',
    categoriesSubtitle: 'Live incident breakdown triaged by urgency and resolution progress across municipal departments.',
    catGarbage: 'Garbage & Sanitation',
    catRoads: 'Roads & Potholes',
    catWater: 'Water Supply & Sewage',
    catElectric: 'Electrical & Streetlights',
    catHealth: 'Public Health & Hazards',
    catResolvedPrefix: 'Resolved by Govt:',

    // Queue / Table
    feedTitle: 'Live Civic Complaints Queue',
    activeTab: 'Active Issues (Urgent)',
    resolvedTab: 'Resolved by Government',
    cityFilterLabel: 'City:',
    localityFilterLabel: 'Locality:',
    priorityFilterLabel: 'Priority:',
    deptFilterLabel: 'Department:',
    allOption: 'All',
    searchPlaceholder: 'Search by complaint ID, issue description, or landmark...',
    resetFilters: 'Reset',
    colPriority: 'Priority',
    colId: 'ID',
    colHeadline: 'Headline & AI Triage Rationale',
    colDept: 'Department',
    colLocation: 'Location / Ward',
    colSla: 'Resolution SLA',
    colReports: 'Citizens',
    colStatus: 'Status',
    colAction: 'Action',
    emptyTitle: 'No complaints match your filters',
    emptyDesc: 'Try adjusting your search criteria or switch city/locality.',
    emptyResetBtn: 'Clear All Filters',

    // Badges & Statuses
    priorities: {
      CRITICAL: 'CRITICAL',
      HIGH: 'HIGH',
      MEDIUM: 'MEDIUM',
      LOW: 'LOW'
    },
    departments: {
      ELECTRICAL: '⚡ Electrical',
      WATER_SEWER: '💧 Water / Sewage',
      ROADS: '🛣️ Roads & Potholes',
      SANITATION: '🗑️ Sanitation',
      HEALTH: '🏥 Public Health'
    },
    statuses: {
      NEW: 'NEW',
      TRIAGED: 'TRIAGED',
      IN_PROGRESS: 'IN PROGRESS',
      RESOLVED: '✅ RESOLVED'
    },
    viewDetailsBtn: 'View',
    citizenSingle: '1 Citizen',
    citizenPlural: 'Citizens',
    resolvedByGovt: 'Resolved by Govt',
    onTrack: 'On track',
    breached: 'Breached',
    approaching: 'Approaching',
    timeRemainingSuffix: 'remaining',
    timeOverdueSuffix: 'overdue',

    // Drawer / Modal
    readAloud: 'Read Aloud (Voice)',
    slaMonitorTitle: 'Resolution SLA Countdown',
    hoursWord: 'hours',
    slaOnTrackBadge: '🟢 On Track',
    slaWarningBadge: '🟡 SLA Warning',
    slaBreachedBadge: '🔴 SLA Breached',
    slaEscalatedBadge: '🚨 Escalated to Commissioner',
    deadlinePrefix: 'Deadline:',
    standardWindowText: 'Standard municipal resolution SLA window',
    fastTrackEscalateBtn: '⚡ Fast-Track Escalate to Commissioner →',
    escalatingText: 'Escalating...',
    escalationAlertActive: '🚨 Commissioner SLA Breach Escalation Active',
    escalationBreachAlert: '⚠️ Resolution SLA Deadline Exceeded',
    triageRationaleLabel: 'AI Triage Rationale',
    resolvedLocationLabel: 'Identified Ward & Landmark (OpenStreetMap)',
    mergedReportsLabel: 'Merged Citizen Complaints',
    mergedReportsCount: 'complaints grouped',
    officerDispatchLabel: 'Ward Officer Dispatch & Resolution',
    assignOfficerLabel: 'Assigned Ward Engineer:',
    unassignedOfficer: 'Unassigned',
    contactLabel: 'Contact:',
    resolutionStatusLabel: 'Resolution Status:',
    drawerStatusOptions: {
      NEW: 'NEW (Citizen Reported)',
      TRIAGED: 'TRIAGED (AI Prioritized)',
      IN_PROGRESS: 'IN PROGRESS (Crew Dispatched)',
      RESOLVED: '✅ RESOLVED (Completed by Govt)'
    },
    officerNoteLabel: 'Official Work Log / Note:',
    officerNotePlaceholder: 'e.g. Repair crew dispatched with asphalt mixer at 10:45 AM...',
    saveRoutingBtn: 'Update & Route Problem →',
    updatingText: 'Updating...',
    auditLogLabel: 'Activity Audit Log',
    speechLang: 'en-US'
  },

  te: {
    subtitle: 'పౌర సమస్యల పరిష్కార & ప్రభుత్వ SLA వేగవంత వ్యవస్థ',
    complaintBtn: 'ఫిర్యాదు',
    welcomeBadge: '🏛️ మున్సిపల్ పౌర సేవల పోర్టల్',
    welcomeTitle: 'పంచాయత్ పోర్టల్‌కు స్వాగతం',
    welcomeDesc: 'మీ నగరంలో రోడ్డు గుంతలు, పేరుకుపోయిన చెత్త, నీటి లీకేజీలు లేదా విద్యుత్ ప్రమాదాలను నమోదు చేయండి. మా ఏఐ వ్యవస్థ వెంటనే వాటిని వర్గీకరించి, వార్డు అధికారులకు కేటాయించి నిర్ణీత గడువులో పరిష్కరిస్తుంది.',
    heroComplaintBtn: '+ ఫిర్యాదు చేయండి',
    exploreCategoriesBtn: 'సమస్యల వర్గాలు చూడండి ↓',
    totalComplaints: 'మొత్తం పౌర ఫిర్యాదులు',
    resolvedGovtLabel: '✅ ప్రభుత్వ పరిష్కారాలు',
    criticalHazards: 'తీవ్ర సమస్యలు (12 గంటల SLA)',
    duplicatesMerged: 'కలసిన ఒకేరకమైన ఫిర్యాదులు',

    // Nav & Separate Dashboard
    navComplaint: 'ఫిర్యాదు చేయండి',
    navDashboard: 'మున్సిపల్ డ్యాష్‌బోర్డ్',
    dashEyebrow: '🏛️ ప్రభుత్వ పరిపాలన & SLA వ్యవస్థ',
    dashTitle: 'మున్సిపల్ పౌర సమస్యల పరిష్కార డ్యాష్‌బోర్డ్',
    dashSubtitle: 'నిజ-సమయ సమస్యల వర్గీకరణ, ఆటోమేటిక్ SLA సమయపరిమితి లెక్కింపు, కమిషనర్ ఎస్కలేషన్.',
    backToComplaintBtn: '← కొత్త ఫిర్యాదు చేయండి',
    goToDashboardBtn: 'మున్సిపల్ డ్యాష్‌బోర్డ్ చూడండి →',
    bannerTitle: 'మీరు మున్సిపల్ అధికారి లేదా వార్డు ఇంజనీరా?',
    bannerSubtitle: 'ప్రత్యక్ష వర్గీకరణ, పరిష్కార సమయ పరిమితి మరియు అధికారుల వివరాలను డ్యాష్‌బోర్డ్‌లో చూడండి.',
    bannerBtn: 'మున్సిపల్ డ్యాష్‌బోర్డ్ తెరవండి →',

    // Complaint Box
    complaintBoxTitle: 'పౌర ఫిర్యాదు నమోదు చేయండి',
    complaintBoxSubtitle: 'మీ నగరం మరియు ప్రాంతాన్ని ఎంచుకుని, మీ సమస్యను వివరించండి లేదా మాట్లాడండి. మేము దానిని వెంటనే సంబంధిత ప్రభుత్వ అధికారికి పంపుతాము.',
    step1Label: '📍 దశ 1: మీ నగరం & ప్రాంతాన్ని ఎంచుకోండి',
    formCityLabel: 'నగరం:',
    formLocalityLabel: 'ప్రాంతం / నివాసం:',
    step2Label: '📝 దశ 2: సమస్యను వివరించండి',
    citizenNameLabel: 'మీ పేరు (ఐచ్ఛికం):',
    citizenNamePlaceholder: 'ఉదా: రమేష్ బాబు (లేదా పౌరుడు అని వదిలేయండి)',
    channelLabel: 'ఫిర్యాదు మార్గం:',
    channels: {
      CITIZEN_PORTAL: 'పౌర వెబ్ పోర్టల్',
      VOICE_CALL_IVR: 'వాయిస్ కాల్ హెల్ప్‌లైన్',
      WHATSAPP_BOT: 'వాట్సాప్ సివిక్ బాట్'
    },
    grievanceLabel: 'సమస్య వివరాలు (గుంతలు, చెత్త, నీటి లీకేజీ, విద్యుత్ వైర్):',
    speakVoiceBtn: 'వాయిస్‌తో చెప్పండి 🎙️',
    listeningMsg: 'వినబడుతోంది... మీ భాషలో మాట్లాడండి',
    voiceHint: 'సూచన: తెలుగు, ఇంగ్లీష్, హిందీ, కన్నడ, మరాఠీ, తమిళ్‌లో మాట్లాడవచ్చు!',
    complaintTextPlaceholder: "సమస్యను టైప్ చేయండి లేదా 'వాయిస్‌తో చెప్పండి' క్లిక్ చేసి మాట్లాడండి (ఉదా: '5వ మెయిన్ వద్ద చెత్త కుప్ప పేరుకుపోయింది')...",
    submitComplaintBtn: 'ఫిర్యాదును సమర్పించండి →',
    submittingBtn: 'నమోదవుతోంది & వర్గీకరించబడుతోంది...',

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

    // Categories
    categoriesTitle: 'పౌర సమస్యల వర్గీకరణ & ప్రభుత్వ పరిష్కారం',
    categoriesSubtitle: 'మున్సిపల్ శాఖల వారీగా సమస్యల విభజన మరియు పరిష్కార శాతం.',
    catGarbage: 'చెత్త & పారిశుధ్యం',
    catRoads: 'రోడ్లు & గుంతలు',
    catWater: 'నీటి సరఫరా & మురుగునీరు',
    catElectric: 'విద్యుత్ & వీధి దీపాలు',
    catHealth: 'ప్రజారోగ్యం & అత్యవసరం',
    catResolvedPrefix: 'పరిష్కరించినవి:',

    // Queue / Table
    feedTitle: 'పౌరుల సమస్యల జాబితా',
    activeTab: 'పరిష్కరించాల్సిన సమస్యలు',
    resolvedTab: 'ప్రభుత్వం పరిష్కరించినవి',
    cityFilterLabel: 'నగరం:',
    localityFilterLabel: 'ప్రాంతం:',
    priorityFilterLabel: 'ప్రాధాన్యత:',
    deptFilterLabel: 'శాఖ:',
    allOption: 'అన్నీ',
    searchPlaceholder: 'ఐడీ, సమస్య లేదా ప్రాంతం ద్వారా వెతకండి...',
    resetFilters: 'రీసెట్',
    colPriority: 'ప్రాధాన్యత',
    colId: 'సమస్య ఐడీ',
    colHeadline: 'సమస్య సారాంశం & ఏఐ విశ్లేషణ',
    colDept: 'వర్గం',
    colLocation: 'ప్రాంతం / నివాసం',
    colSla: 'సమయ పరిమితి (SLA)',
    colReports: 'పౌరులు',
    colStatus: 'స్థితి',
    colAction: 'వివరాలు',
    emptyTitle: 'ఎలాంటి సమస్యలు కనుగొనబడలేదు',
    emptyDesc: 'శోధన పదాన్ని మార్చి చూడండి లేదా ఫిల్టర్లను తొలగించండి.',
    emptyResetBtn: 'ఫిల్టర్లను తొలగించండి',

    // Badges & Statuses
    priorities: {
      CRITICAL: 'తీవ్రమైనది',
      HIGH: 'అధికం',
      MEDIUM: 'మధ్యస్థం',
      LOW: 'సాధారణం'
    },
    departments: {
      ELECTRICAL: '⚡ విద్యుత్',
      WATER_SEWER: '💧 నీరు / మురుగు',
      ROADS: '🛣️ రోడ్లు',
      SANITATION: '🗑️ పారిశుధ్యం',
      HEALTH: '🏥 ప్రజారోగ్యం'
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
    resolvedByGovt: 'ప్రభుత్వంచే పరిష్కారం',
    onTrack: 'సమయానికి',
    breached: 'గడువు దాటింది',
    approaching: 'సమయం ముగుస్తుంది',
    timeRemainingSuffix: 'మిగిలి ఉంది',
    timeOverdueSuffix: 'ఆలస్యం',

    // Drawer / Modal
    readAloud: 'వినండి (వాయిస్)',
    slaMonitorTitle: 'పరిష్కార సమయ పరిమితి (SLA నియమం:',
    hoursWord: 'గంటలు',
    slaOnTrackBadge: '🟢 సమయానికి ఉంది',
    slaWarningBadge: '🟡 హెచ్చరిక',
    slaBreachedBadge: '🔴 గడువు దాటింది',
    slaEscalatedBadge: '🚨 కమిషనర్‌కు పంపబడింది',
    deadlinePrefix: 'గడువు తేదీ:',
    standardWindowText: 'నిర్ణీత 48 గంటల మున్సిపల్ పరిష్కార వ్యవధి',
    fastTrackEscalateBtn: '⚡ నేరుగా కమిషనర్‌కు పంపండి →',
    escalatingText: 'పంపుతున్నాము...',
    escalationAlertActive: '🚨 కమిషనర్ స్థాయి అత్యవసర హెచ్చరిక అమల్లో ఉంది',
    escalationBreachAlert: '⚠️ సమయ పరిమితి దాటిన అత్యవసర సమస్య',
    triageRationaleLabel: 'ఏఐ ప్రాధాన్యతా విశ్లేషణ',
    resolvedLocationLabel: 'గుర్తించిన ప్రాంతం (ఓపెన్‌స్ట్రీట్‌మ్యాప్)',
    mergedReportsLabel: 'కలిపిన పౌర ఫిర్యాదులు',
    mergedReportsCount: 'ఫిర్యాదులు జతచేయబడ్డాయి',
    officerDispatchLabel: 'వార్డు అధికారి కేటాయింపు & పరిష్కారం',
    assignOfficerLabel: 'కేటాయించిన ఇంజనీర్:',
    unassignedOfficer: 'కేటాయించలేదు',
    contactLabel: 'సంప్రదించండి:',
    resolutionStatusLabel: 'పరిష్కార స్థితి:',
    drawerStatusOptions: {
      NEW: 'కొత్తది (పౌరుల నమోదు)',
      TRIAGED: 'ధృవీకరించబడింది (ఏఐ ద్వారా)',
      IN_PROGRESS: 'పరిష్కారంలో ఉంది (బృందం బయలుదేరింది)',
      RESOLVED: '✅ పరిష్కరించబడింది (ప్రభుత్వం ద్వారా)'
    },
    officerNoteLabel: 'అధికారిక లాగ్ / నోట్:',
    officerNotePlaceholder: 'ఉదా: సిబ్బంది మరమ్మతు పనుల కోసం ఉదయం 10:45 కు వెళ్లారు...',
    saveRoutingBtn: 'అప్‌డేట్ చేసి రూట్ చేయండి →',
    updatingText: 'అప్‌డేట్ అవుతోంది...',
    auditLogLabel: 'నిర్వహణ చరిత్ర',
    speechLang: 'te-IN'
  },

  hi: {
    subtitle: 'नागरिक आसूचना एवं सरकारी समाधान प्रणाली',
    complaintBtn: 'शिकायत',
    welcomeBadge: '🏛️ नगर पालिका जन शिकायत एवं समाधान पोर्टल',
    welcomeTitle: 'पंचायत पोर्टल में आपका स्वागत है',
    welcomeDesc: 'सड़क के गड्ढे, कचरा, पानी रिसाव या बिजली की समस्या दर्ज करें। हमारी प्रणाली तुरंत इसे वार्ड अधिकारी को प्रेषित कर निश्चित समय में हल करती है।',
    heroComplaintBtn: '+ शिकायत दर्ज करें',
    exploreCategoriesBtn: 'शिकायत श्रेणियां देखें ↓',
    totalComplaints: 'कुल नागरिक शिकायतें',
    resolvedGovtLabel: '✅ सरकार द्वारा समाधान',
    criticalHazards: 'गंभीर खतरे (12 घंटे SLA)',
    duplicatesMerged: 'समान शिकायतें मर्ज',

    navComplaint: 'शिकायत दर्ज करें',
    navDashboard: 'नगरपालिका डैशबोर्ड',
    dashEyebrow: '🏛️ सरकारी प्रशासनिक एवं SLA ट्रैकिंग प्रणाली',
    dashTitle: 'नगर पालिका नागरिक शिकायत निवारण डैशबोर्ड',
    dashSubtitle: 'वास्तविक समय शिकायत वर्गीकरण, स्वचालित समय सीमा ट्रैकिंग व आयुक्त एस्केलेशन।',
    backToComplaintBtn: '← नई शिकायत दर्ज करें',
    goToDashboardBtn: 'नगर पालिका डैशबोर्ड खोलें →',
    bannerTitle: 'क्या आप नगरपालिका अधिकारी या वार्ड इंजीनियर हैं?',
    bannerSubtitle: 'लाइव वर्गीकरण, समाधान समय सीमा और वार्ड अधिकारियों का आवंटन डैशबोर्ड पर देखें।',
    bannerBtn: 'नगर पालिका डैशबोर्ड खोलें →',

    complaintBoxTitle: 'नागरिक शिकायत दर्ज करें',
    complaintBoxSubtitle: 'अपना शहर और क्षेत्र चुनें, फिर समस्या लिखें या बोलें। हम इसे तुरंत संबंधित वार्ड अधिकारी को भेजेंगे।',
    step1Label: '📍 चरण 1: अपना शहर और क्षेत्र चुनें',
    formCityLabel: 'शहर:',
    formLocalityLabel: 'क्षेत्र / मोहल्ला:',
    step2Label: '📝 चरण 2: समस्या का विवरण दें',
    citizenNameLabel: 'आपका नाम (वैकल्पिक):',
    citizenNamePlaceholder: 'उदा. रमेश बाबू (या खाली छोड़ें)',
    channelLabel: 'माध्यम:',
    channels: {
      CITIZEN_PORTAL: 'नागरिक वेब पोर्टल',
      VOICE_CALL_IVR: 'वॉइस हेल्पलाइन',
      WHATSAPP_BOT: 'व्हाट्सएप बॉट'
    },
    grievanceLabel: 'समस्या का विवरण (गड्ढा, कचरा, पानी रिसाव, खुला तार):',
    speakVoiceBtn: 'बोलकर बताएं 🎙️',
    listeningMsg: 'सुन रहे हैं... अपनी भाषा में बोलें',
    voiceHint: 'सुझाव: हिंदी, अंग्रेजी, तेलुगु, कन्नड़, मराठी, तमिल में बोल सकते हैं!',
    complaintTextPlaceholder: "समस्या लिखें या 'बोलकर बताएं' पर क्लिक करें...",
    submitComplaintBtn: 'शिकायत दर्ज करें →',
    submittingBtn: 'दर्ज हो रही है...',

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

    spotlightBadge: 'आपकी दर्ज शिकायत (प्राथमिकता ट्रैकिंग)',
    spotlightBtn: 'विवरण व प्रबंधन देखें →',
    localityNoticePrefix: 'आपकी शिकायत सबसे पहले दिखाई जा रही है, उसके बाद आपके क्षेत्र की समस्याएं',
    viewAllLocalitiesBtn: '🌐 सभी क्षेत्र देखें',
    focusLocalityBtn: '📍 मेरा क्षेत्र देखें',
    yourComplaintBadge: '⭐ आपकी शिकायत',

    categoriesTitle: 'नागरिक समस्या वर्गीकरण एवं समाधान',
    categoriesSubtitle: 'विभिन्न नगर निगम विभागों द्वारा समस्याओं का समाधान।',
    catGarbage: 'कचरा व स्वच्छता',
    catRoads: 'सड़क व गड्ढे',
    catWater: 'जल आपूर्ति व सीवर',
    catElectric: 'बिजली व स्ट्रीट लाइट',
    catHealth: 'स्वास्थ्य व खतरे',
    catResolvedPrefix: 'हल किए गए:',

    feedTitle: 'नागरिक समस्याओं की सूची',
    activeTab: 'सक्रिय समस्याएं (लंबित)',
    resolvedTab: 'सरकार द्वारा हल की गई',
    cityFilterLabel: 'शहर:',
    localityFilterLabel: 'क्षेत्र:',
    priorityFilterLabel: 'प्राथमिकता:',
    deptFilterLabel: 'विभाग:',
    allOption: 'सभी',
    searchPlaceholder: 'आईडी, समस्या या क्षेत्र से खोजें...',
    resetFilters: 'रीसेट',
    colPriority: 'प्राथमिकता',
    colId: 'शिकायत आईडी',
    colHeadline: 'समस्या विवरण व एआई विश्लेषण',
    colDept: 'विभाग',
    colLocation: 'स्थान / वार्ड',
    colSla: 'समाधान समय सीमा',
    colReports: 'नागरिक',
    colStatus: 'स्थिति',
    colAction: 'विवरण',
    emptyTitle: 'कोई शिकायत नहीं मिली',
    emptyDesc: 'कृपया खोज बदलें या फिल्टर हटाएं।',
    emptyResetBtn: 'सभी फिल्टर हटाएं',

    priorities: {
      CRITICAL: 'अत्यंत गंभीर',
      HIGH: 'उच्च',
      MEDIUM: 'मध्यम',
      LOW: 'सामान्य'
    },
    departments: {
      ELECTRICAL: '⚡ विद्युत',
      WATER_SEWER: '💧 जल / सीवर',
      ROADS: '🛣️ सड़कें',
      SANITATION: '🗑️ स्वच्छता',
      HEALTH: '🏥 जन स्वास्थ्य'
    },
    statuses: {
      NEW: 'नई',
      TRIAGED: 'सत्यापित',
      IN_PROGRESS: 'प्रगति पर',
      RESOLVED: '✅ निस्तारित'
    },
    viewDetailsBtn: 'देखें',
    citizenSingle: '1 नागरिक',
    citizenPlural: 'नागरिक',
    resolvedByGovt: 'सरकार द्वारा निस्तारित',
    onTrack: 'समय पर',
    breached: 'समय समाप्त',
    approaching: 'अंतिम चरण',
    timeRemainingSuffix: 'शेष',
    timeOverdueSuffix: 'विलंबित',

    readAloud: 'सुनें (वॉइस)',
    slaMonitorTitle: 'समाधान समय सीमा (नियम:',
    hoursWord: 'घंटे',
    slaOnTrackBadge: '🟢 समय पर',
    slaWarningBadge: '🟡 चेतावनी',
    slaBreachedBadge: '🔴 समय सीमा समाप्त',
    slaEscalatedBadge: '🚨 आयुक्त को प्रेषित',
    deadlinePrefix: 'अंतिम समय:',
    standardWindowText: 'मानक 48 घंटे की नगर निगम समाधान समय सीमा',
    fastTrackEscalateBtn: '⚡ सीधे आयुक्त को प्रेषित करें →',
    escalatingText: 'भेजा जा रहा है...',
    escalationAlertActive: '🚨 आयुक्त स्तर का एस्केलेशन सक्रिय',
    escalationBreachAlert: '⚠️ समाधान समय सीमा समाप्त',
    triageRationaleLabel: 'एआई वर्गीकरण विश्लेषण',
    resolvedLocationLabel: 'चिह्नित वार्ड व पता (OpenStreetMap)',
    mergedReportsLabel: 'मर्ज की गई नागरिक शिकायतें',
    mergedReportsCount: 'शिकायतें जोड़ी गईं',
    officerDispatchLabel: 'अधिकारी आवंटन व समाधान',
    assignOfficerLabel: 'नियुक्त इंजीनियर:',
    unassignedOfficer: 'अनअसाइन्ड',
    contactLabel: 'संपर्क:',
    resolutionStatusLabel: 'समाधान स्थिति:',
    drawerStatusOptions: {
      NEW: 'नई (नागरिक द्वारा दर्ज)',
      TRIAGED: 'सत्यापित (एआई द्वारा)',
      IN_PROGRESS: 'प्रगति पर (दल रवाना)',
      RESOLVED: '✅ निस्तारित (सरकार द्वारा)'
    },
    officerNoteLabel: 'आधिकारिक लॉग / टिप्पणी:',
    officerNotePlaceholder: 'उदा. मरम्मत दल 10:45 पर रवाना हुआ...',
    saveRoutingBtn: 'अपडेट व प्रेषित करें →',
    updatingText: 'अपडेट हो रहा है...',
    auditLogLabel: 'कार्यवाही इतिहास',
    speechLang: 'hi-IN'
  },

  kn: {
    subtitle: 'ನಾಗರಿಕ ಸಮಸ್ಯೆ ಪರಿಹಾರ ಹಾಗೂ ಸರ್ಕಾರದ SLA ವೇಗವರ್ಧಕ ವ್ಯವಸ್ಥೆ',
    complaintBtn: 'ದೂರು',
    welcomeBadge: '🏛️ ಪುರಸಭೆ ನಾಗರಿಕ ಸೇವಾ ಪೋರ್ಟಲ್',
    welcomeTitle: 'ಪಂಚಾಯತ್ ಪೋರ್ಟಲ್‌ಗೆ ಸುಸ್ವಾಗತ',
    welcomeDesc: 'ನಿಮ್ಮ ನಗರದಲ್ಲಿ ರಸ್ತೆ ಗುಂಡಿ, ಕಸ, ನೀರಿನ ಸೋರಿಕೆ ಅಥವಾ ವಿದ್ಯುತ್ ಸಮಸ್ಯೆಗಳನ್ನು ದಾಖಲಿಸಿ. ನಮ್ಮ ವ್ಯವಸ್ಥೆಯು ತಕ್ಷಣ ಪರಿಶೀಲಿಸಿ ವಾರ್ಡ್ ಎಂಜಿನಿಯರ್‌ಗೆ ರವಾನಿಸುತ್ತದೆ.',
    heroComplaintBtn: '+ ದೂರು ದಾಖಲಿಸಿ',
    exploreCategoriesBtn: 'ಸಮಸ್ಯೆ ವರ್ಗಗಳನ್ನು ನೋಡಿ ↓',
    totalComplaints: 'ಒಟ್ಟು ನಾಗರಿಕ ದೂರುಗಳು',
    resolvedGovtLabel: '✅ ಸರ್ಕಾರದ ಪರಿಹಾರಗಳು',
    criticalHazards: 'ತುರ್ತು ಅಪಾಯಗಳು (12 ಗಂಟೆ SLA)',
    duplicatesMerged: 'ಒಂದೇ ರೀತಿಯ ದೂರುಗಳು ವಿಲೀನ',

    navComplaint: 'ದೂರು ದಾಖಲಿಸಿ',
    navDashboard: 'ಪುರಸಭೆ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    dashEyebrow: '🏛️ ಸರ್ಕಾರಿ ಆಡಳಿತ ಹಾಗೂ SLA ವ್ಯವಸ್ಥೆ',
    dashTitle: 'ಪುರಸಭೆ ನಾಗರಿಕ ದೂರು ಪರಿಹಾರ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್',
    dashSubtitle: 'ನೈಜ-ಸಮಯ ಸಮಸ್ಯೆ ವಿಂಗಡಣೆ, ಸ್ವಯಂಚಾಲಿತ SLA ಸಮಯ ಗಣನೆ, ಆಯುಕ್ತರ ಎಸ್ಕೆಲೇಶನ್.',
    backToComplaintBtn: '← ಹೊಸ ದೂರು ದಾಖಲಿಸಿ',
    goToDashboardBtn: 'ಪುರಸಭೆ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ →',
    bannerTitle: 'ನೀವು ಪುರಸಭೆ ಅಧಿಕಾರಿ ಅಥವಾ ವಾರ್ಡ್ ಎಂಜಿನಿಯರ್ ಆಗಿದ್ದೀರಾ?',
    bannerSubtitle: 'ವರ್ಗೀಕರಣ, ಪರಿಹಾರ ಸಮಯ ಹಾಗೂ ಅಧಿಕಾರಿಗಳ ನಿಯೋಜನೆಯನ್ನು ಡ್ಯಾಶ್‌ಬೋರ್ಡ್‌ನಲ್ಲಿ ವೀಕ್ಷಿಸಿ.',
    bannerBtn: 'ಪುರಸಭೆ ಡ್ಯಾಶ್‌ಬೋರ್ಡ್ ತೆರೆಯಿರಿ →',

    complaintBoxTitle: 'ನಾಗರಿಕ ದೂರು ದಾಖಲಿಸಿ',
    complaintBoxSubtitle: 'ನಿಮ್ಮ ನಗರ ಮತ್ತು ಪ್ರದೇಶವನ್ನು ಆಯ್ಕೆಮಾಡಿ, ನಿಮ್ಮ ಸಮಸ್ಯೆಯನ್ನು ಬರೆಯಿರಿ ಅಥವಾ ಮಾತನಾಡಿ.',
    step1Label: '📍 ಹಂತ 1: ನಿಮ್ಮ ನಗರ ಮತ್ತು ಪ್ರದೇಶವನ್ನು ಆಯ್ಕೆಮಾಡಿ',
    formCityLabel: 'ನಗರ:',
    formLocalityLabel: 'ಪ್ರದೇಶ / ಬಡಾವಣೆ:',
    step2Label: '📝 ಹಂತ 2: ಸಮಸ್ಯೆಯನ್ನು ವಿವರಿಸಿ',
    citizenNameLabel: 'ನಿಮ್ಮ ಹೆಸರು (ಐಚ್ಛಿಕ):',
    citizenNamePlaceholder: 'ಉದಾ: ರಮೇಶ್ ಬಾಬು',
    channelLabel: 'ಮೂಲ:',
    channels: {
      CITIZEN_PORTAL: 'ನಾಗರಿಕ ವೆಬ್ ಪೋರ್ಟಲ್',
      VOICE_CALL_IVR: 'ಧ್ವನಿ ಸಹಾಯವಾಣಿ',
      WHATSAPP_BOT: 'ವಾಟ್ಸಾಪ್ ಬಾಟ್'
    },
    grievanceLabel: 'ಸಮಸ್ಯೆಯ ವಿವರ (ರಸ್ತೆ ಗುಂಡಿ, ಕಸ, ನೀರಿನ ಸೋರಿಕೆ, ವಿದ್ಯುತ್ ತಂತಿ):',
    speakVoiceBtn: 'ಧ್ವನಿ ಮೂಲಕ ತಿಳಿಸಿ 🎙️',
    listeningMsg: 'ಆಲಿಸಲಾಗುತ್ತಿದೆ... ನಿಮ್ಮ ಭಾಷೆಯಲ್ಲಿ ಮಾತನಾಡಿ',
    voiceHint: 'ಸೂಚನೆ: ಕನ್ನಡ, ಇಂಗ್ಲಿಷ್, ಹಿಂದಿ, ತೆಲುಗು, ಮರಾಠಿ, ತಮಿಳಿನಲ್ಲಿ ಮಾತನಾಡಬಹುದು!',
    complaintTextPlaceholder: "ಸಮಸ್ಯೆಯನ್ನು ವಿವರಿಸಿ ಅಥವಾ 'ಧ್ವನಿ ಮೂಲಕ ತಿಳಿಸಿ' ಕ್ಲಿಕ್ ಮಾಡಿ...",
    submitComplaintBtn: 'ದೂರನ್ನು ಸಲ್ಲಿಸಿ →',
    submittingBtn: 'ದಾಖಲಾಗುತ್ತಿದೆ...',

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

    spotlightBadge: 'ನಿಮ್ಮ ದೂರು (ಆದ್ಯತೆಯ ಟ್ರ್ಯಾಕಿಂಗ್)',
    spotlightBtn: 'ಪೂರ್ಣ ವಿವರ ವೀಕ್ಷಿಸಿ →',
    localityNoticePrefix: 'ನಿಮ್ಮ ದೂರು ಮೊದಲು ತೋರಿಸಲಾಗುತ್ತಿದೆ, ನಂತರ ನಿಮ್ಮ ಪ್ರದೇಶದ ಸಮಸ್ಯೆಗಳು',
    viewAllLocalitiesBtn: '🌐 ಎಲ್ಲಾ ಪ್ರದೇಶಗಳನ್ನು ನೋಡಿ',
    focusLocalityBtn: '📍 ನನ್ನ ಪ್ರದೇಶ ನೋಡಿ',
    yourComplaintBadge: '⭐ ನಿಮ್ಮ ದೂರು',

    categoriesTitle: 'ನಾಗರಿಕ ಸಮಸ್ಯೆ ವರ್ಗೀಕರಣ ಮತ್ತು ಸರ್ಕಾರದ ಪರಿಹಾರ',
    categoriesSubtitle: 'ಪುರಸಭೆಯ ವಿವಿಧ ಇಲಾಖೆಗಳಿಂದ ಸಮಸ್ಯೆಗಳ ಪರಿಹಾರ ಸ್ಥಿತಿ.',
    catGarbage: 'ಕಸ ಹಾಗೂ ನೈರ್ಮಲ್ಯ',
    catRoads: 'ರಸ್ತೆ ಮತ್ತು ಗುಂಡಿಗಳು',
    catWater: 'ನೀರು ಸರಬರಾಜು ಮತ್ತು ಒಳಚರಂಡಿ',
    catElectric: 'ವಿದ್ಯುತ್ ಮತ್ತು ಬೀದಿ ದೀಪಗಳು',
    catHealth: 'ಸಾರ್ವಜನಿಕ ಆರೋಗ್ಯ',
    catResolvedPrefix: 'ಪರಿಹರಿಸಲಾಗಿದೆ:',

    feedTitle: 'ನಾಗರಿಕರ ಸಮಸ್ಯೆಗಳ ಪಟ್ಟಿ',
    activeTab: 'ಸಕ್ರಿಯ ಸಮಸ್ಯೆಗಳು',
    resolvedTab: 'ಸರ್ಕಾರದಿಂದ ಪರಿಹರಿಸಲಾಗಿದೆ',
    cityFilterLabel: 'ನಗರ:',
    localityFilterLabel: 'ಪ್ರದೇಶ:',
    priorityFilterLabel: 'ಆದ್ಯತೆ:',
    deptFilterLabel: 'ಇಲಾಖೆ:',
    allOption: 'ಎಲ್ಲವೂ',
    searchPlaceholder: 'ದೂರು ಐಡಿ ಅಥವಾ ಪ್ರದೇಶದ ಮೂಲಕ ಹುಡುಕಿ...',
    resetFilters: 'ಮರುಹೊಂದಿಸಿ',
    colPriority: 'ಆದ್ಯತೆ',
    colId: 'ದೂರು ಐಡಿ',
    colHeadline: 'ಸಮಸ್ಯೆಯ ವಿವರಣೆ ಹಾಗೂ ವಿಶ್ಲೇಷಣೆ',
    colDept: 'ಇಲಾಖೆ',
    colLocation: 'ಸ್ಥಳ / ವಾರ್ಡ್',
    colSla: 'ಪರಿಹಾರ ಸಮಯ (SLA)',
    colReports: 'ನಾಗರಿಕರು',
    colStatus: 'ಸ್ಥಿತಿ',
    colAction: 'ವಿವರಗಳು',
    emptyTitle: 'ಯಾವುದೇ ದೂರುಗಳು ಕಂಡುಬಂದಿಲ್ಲ',
    emptyDesc: 'ದಯವಿಟ್ಟು ಹುಡುಕಾಟವನ್ನು ಬದಲಾಯಿಸಿ ಅಥವಾ ಫಿಲ್ಟರ್ ತೆರವುಗೊಳಿಸಿ.',
    emptyResetBtn: 'ಫಿಲ್ಟರ್‌ಗಳನ್ನು ತೆರವುಗೊಳಿಸಿ',

    priorities: {
      CRITICAL: 'ತುರ್ತು',
      HIGH: 'ಹೆಚ್ಚು',
      MEDIUM: 'ಮಧ್ಯಮ',
      LOW: 'ಸಾಮಾನ್ಯ'
    },
    departments: {
      ELECTRICAL: '⚡ ವಿದ್ಯುತ್',
      WATER_SEWER: '💧 ನೀರು / ಒಳಚರಂಡಿ',
      ROADS: '🛣️ ರಸ್ತೆಗಳು',
      SANITATION: '🗑️ ನೈರ್ಮಲ್ಯ',
      HEALTH: '🏥 ಸಾರ್ವಜನಿಕ ಆರೋಗ್ಯ'
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
    onTrack: 'ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿ',
    breached: 'ಸಮಯ ಮೀರಿದೆ',
    approaching: 'ಅಂತಿಮ ಹಂತ',
    timeRemainingSuffix: 'ಬಾಕಿ',
    timeOverdueSuffix: 'ಮೀರಿದೆ',

    readAloud: 'ಕೇಳಿ (ಧ್ವನಿ)',
    slaMonitorTitle: 'ಪರಿಹಾರ ಸಮಯ ಮಿತಿ (ನಿಯಮ:',
    hoursWord: 'ಗಂಟೆಗಳು',
    slaOnTrackBadge: '🟢 ಸಮಯಕ್ಕೆ ಸರಿಯಾಗಿದೆ',
    slaWarningBadge: '🟡 ಎಚ್ಚರಿಕೆ',
    slaBreachedBadge: '🔴 ಗಡುವು ಮೀರಿದೆ',
    slaEscalatedBadge: '🚨 ಆಯುಕ್ತರಿಗೆ ರವಾನಿಸಲಾಗಿದೆ',
    deadlinePrefix: 'ಗಡುವು ದಿನಾಂಕ:',
    standardWindowText: 'ನಿಗದಿತ 48 ಗಂಟೆಗಳ ಪುರಸಭೆ ಪರಿಹಾರ ಅವಧಿ',
    fastTrackEscalateBtn: '⚡ ನೇರವಾಗಿ ಆಯುಕ್ತರಿಗೆ ಕಳುಹಿಸಿ →',
    escalatingText: 'ರವಾನಿಸಲಾಗುತ್ತಿದೆ...',
    escalationAlertActive: '🚨 ಆಯುಕ್ತರ ಮಟ್ಟದ ತುರ್ತು ಎಚ್ಚರಿಕೆ ಜಾರಿಯಲ್ಲಿದೆ',
    escalationBreachAlert: '⚠️ ಪರಿಹಾರದ ಗಡುವು ಮೀರಿದೆ',
    triageRationaleLabel: 'ವಿಶ್ಲೇಷಣೆ ವರದಿ',
    resolvedLocationLabel: 'ಗುರುತಿಸಲಾದ ವಿಳಾಸ (OpenStreetMap)',
    mergedReportsLabel: 'ಒಟ್ಟುಗೂಡಿಸಲಾದ ದೂರುಗಳು',
    mergedReportsCount: 'ದೂರುಗಳು ವಿಲೀನಗೊಂಡಿವೆ',
    officerDispatchLabel: 'ಅಧಿಕಾರಿ ನಿಯೋಜನೆ ಮತ್ತು ಪರಿಹಾರ',
    assignOfficerLabel: 'ನಿಯೋಜಿತ ಎಂಜಿನಿಯರ್:',
    unassignedOfficer: 'ನಿಯೋಜಿಸಲಾಗಿಲ್ಲ',
    contactLabel: 'ಸಂಪರ್ಕ:',
    resolutionStatusLabel: 'ಪರಿಹಾರದ ಸ್ಥಿತಿ:',
    drawerStatusOptions: {
      NEW: 'ಹೊಸದು (ನಾಗರಿಕರಿಂದ ದಾಖಲು)',
      TRIAGED: 'ಪರಿಶೀಲಿಸಲಾಗಿದೆ (ಎಐ ಮೂಲಕ)',
      IN_PROGRESS: 'ಪ್ರಗತಿಯಲ್ಲಿದೆ (ತಂಡ ನಿಯೋಜಿಸಲಾಗಿದೆ)',
      RESOLVED: '✅ ಪರಿಹರಿಸಲಾಗಿದೆ (ಸರ್ಕಾರದಿಂದ)'
    },
    officerNoteLabel: 'ಅಧಿಕೃತ ಟಿಪ್ಪಣಿ:',
    officerNotePlaceholder: 'ಉದಾ: ದುರಸ್ತಿ ತಂಡವು 10:45 ಕ್ಕೆ ಸ್ಥಳಕ್ಕೆ ತೆರಳಿದೆ...',
    saveRoutingBtn: 'ನವೀಕರಿಸಿ ಮತ್ತು ರವಾನಿಸಿ →',
    updatingText: 'ನವೀಕರಿಸಲಾಗುತ್ತಿದೆ...',
    auditLogLabel: 'ಕಾರ್ಯನಿರ್ವಹಣಾ ಇತಿಹಾಸ',
    speechLang: 'kn-IN'
  },

  mr: {
    subtitle: 'नागरी तक्रार निवारण व शासकीय SLA प्रणाली',
    complaintBtn: 'तक्रार',
    welcomeBadge: '🏛️ महानगरपालिका नागरी सेवा पोर्टल',
    welcomeTitle: 'पंचायत पोर्टलवर आपले स्वागत आहे',
    welcomeDesc: 'रस्त्यावरील खड्डे, कचरा, पाण्याची गळती किंवा विजेच्या समस्या नोंदवा. आमची प्रणाली त्वरित तपासणी करून संबंधित वॉर्ड अभियंत्याकडे वर्ग करते.',
    heroComplaintBtn: '+ तक्रार नोंदवा',
    exploreCategoriesBtn: 'तक्रार वर्ग पहा ↓',
    totalComplaints: 'एकूण नागरी तक्रारी',
    resolvedGovtLabel: '✅ शासनाकडून निवारण',
    criticalHazards: 'गंभीर समस्या (12 तास SLA)',
    duplicatesMerged: 'एकत्रित तक्रारी',

    navComplaint: 'तक्रार नोंदवा',
    navDashboard: 'महापालिका डॅशबोर्ड',
    dashEyebrow: '🏛️ शासकीय प्रशासन व SLA ट्रॅकिंग प्रणाली',
    dashTitle: 'महानगरपालिका नागरी तक्रार निवारण डॅशबोर्ड',
    dashSubtitle: 'थेट तक्रार वर्गीकरण, स्वयंचलित कालावधी ट्रॅकिंग आणि आयुक्त स्तरावरील एस्केलेशन.',
    backToComplaintBtn: '← नवीन तक्रार नोंदवा',
    goToDashboardBtn: 'महापालिका डॅशबोर्ड उघडा →',
    bannerTitle: 'आपण महापालिका अधिकारी किंवा वॉर्ड अभियंता आहात का?',
    bannerSubtitle: 'थेट वर्गीकरण, निवारण वेळ आणि अधिकारी नियुक्ती डॅशबोर्डवर पहा.',
    bannerBtn: 'महापालिका डॅशबोर्ड उघडा →',

    complaintBoxTitle: 'नागरी तक्रार नोंदवा',
    complaintBoxSubtitle: 'आपले शहर व परिसर निवडा, नंतर समस्या लिहा किंवा बोला. आम्ही त्वरित वॉर्ड अधिकाऱ्याकडे पाठवू.',
    step1Label: '📍 पायरी 1: आपले शहर आणि परिसर निवडा',
    formCityLabel: 'शहर:',
    formLocalityLabel: 'परिसर / वॉर्ड:',
    step2Label: '📝 पायरी 2: समस्येचे वर्णन करा',
    citizenNameLabel: 'आपले नाव (पर्यायी):',
    citizenNamePlaceholder: 'उदा. रमेश बाबू',
    channelLabel: 'माध्यम:',
    channels: {
      CITIZEN_PORTAL: 'नागरी वेब पोर्टल',
      VOICE_CALL_IVR: 'व्हॉइस हेल्पलाइन',
      WHATSAPP_BOT: 'व्हॉट्सॲप बॉट'
    },
    grievanceLabel: 'समस्येचा तपशील (खड्डा, कचरा, पाण्याची गळती, विजेची तार):',
    speakVoiceBtn: 'बोलून सांगा 🎙️',
    listeningMsg: 'ऐकत आहे... आपल्या भाषेत बोला',
    voiceHint: 'टीप: मराठी, इंग्रजी, हिंदी, तेलगू, कन्नड, तमिळमध्ये बोलू शकता!',
    complaintTextPlaceholder: "समस्या लिहा किंवा 'बोलून सांगा' वर क्लिक करा...",
    submitComplaintBtn: 'तक्रार सादर करा →',
    submittingBtn: 'नोंदणी होत आहे...',

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

    spotlightBadge: 'तुमची नोंदवलेली तक्रार (प्राधान्य ट्रॅकिंग)',
    spotlightBtn: 'तपशील व व्यवस्थापन पहा →',
    localityNoticePrefix: 'तुमची तक्रार प्रथम दाखवली जात आहे, नंतर तुमच्या परिसरातील समस्या',
    viewAllLocalitiesBtn: '🌐 सर्व परिसर पहा',
    focusLocalityBtn: '📍 माझा परिसर पहा',
    yourComplaintBadge: '⭐ तुमची तक्रार',

    categoriesTitle: 'नागरी समस्या वर्गीकरण आणि सरकारी निवारण',
    categoriesSubtitle: 'महापालिका विभागांनुसार समस्या निवारणाची स्थिती.',
    catGarbage: 'कचरा व स्वच्छता',
    catRoads: 'रस्ते व खड्डे',
    catWater: 'पाणीपुरवठा व मलनिःसारण',
    catElectric: 'वीज व पथदिवे',
    catHealth: 'सार्वजनिक आरोग्य',
    catResolvedPrefix: 'निवारण झाले:',

    feedTitle: 'नागरी समस्यांची यादी',
    activeTab: 'सक्रिय समस्या',
    resolvedTab: 'शासनाकडून निवारण झालेल्या',
    cityFilterLabel: 'शहर:',
    localityFilterLabel: 'परिसर:',
    priorityFilterLabel: 'प्राधान्य:',
    deptFilterLabel: 'विभाग:',
    allOption: 'सर्व',
    searchPlaceholder: 'तक्रार आयडी किंवा परिसरातून शोधा...',
    resetFilters: 'रीसेट',
    colPriority: 'प्राधान्य',
    colId: 'तक्रार आयडी',
    colHeadline: 'समस्या तपशील व विश्लेषण',
    colDept: 'विभाग',
    colLocation: 'स्थान / वॉर्ड',
    colSla: 'निवारण मुदत (SLA)',
    colReports: 'नागरिक',
    colStatus: 'स्थिती',
    colAction: 'तपशील',
    emptyTitle: 'कोणतीही तक्रार आढळली नाही',
    emptyDesc: 'कृपया शोध बदला किंवा फिल्टर हटवा.',
    emptyResetBtn: 'फिल्टर हटवा',

    priorities: {
      CRITICAL: 'अति तातडीची',
      HIGH: 'उच्च',
      MEDIUM: 'मध्यम',
      LOW: 'सामान्य'
    },
    departments: {
      ELECTRICAL: '⚡ विद्युत',
      WATER_SEWER: '💧 पाणी / ड्रेनेज',
      ROADS: '🛣️ रस्ते',
      SANITATION: '🗑️ स्वच्छता',
      HEALTH: '🏥 सार्वजनिक आरोग्य'
    },
    statuses: {
      NEW: 'नवीन',
      TRIAGED: 'तपासलेली',
      IN_PROGRESS: 'प्रगतीपथावर',
      RESOLVED: '✅ निवारण झाले'
    },
    viewDetailsBtn: 'पहा',
    citizenSingle: '1 नागरिक',
    citizenPlural: 'नागरिक',
    resolvedByGovt: 'शासनाकडून निवारण',
    onTrack: 'वेळेत',
    breached: 'वेळ संपली',
    approaching: 'अंतिम टप्पा',
    timeRemainingSuffix: 'शिल्लक',
    timeOverdueSuffix: 'उशीर',

    readAloud: 'ऐका (व्हॉइस)',
    slaMonitorTitle: 'निवारण कालावधी मुदत (नियम:',
    hoursWord: 'तास',
    slaOnTrackBadge: '🟢 वेळेत आहे',
    slaWarningBadge: '🟡 चेतावणी',
    slaBreachedBadge: '🔴 मुदत संपली',
    slaEscalatedBadge: '🚨 आयुक्तांकडे वर्ग',
    deadlinePrefix: 'अंतिम तारीख:',
    standardWindowText: 'मानक 48 तासांची महापालिका मुदत',
    fastTrackEscalateBtn: '⚡ थेट आयुक्तांकडे वर्ग करा →',
    escalatingText: 'वर्ग होत आहे...',
    escalationAlertActive: '🚨 आयुक्त स्तरावरील तातडीची सूचना सक्रिय',
    escalationBreachAlert: '⚠️ निवारणाची मुदत संपली',
    triageRationaleLabel: 'विश्लेषण अहवाल',
    resolvedLocationLabel: 'निश्चित पत्ता (OpenStreetMap)',
    mergedReportsLabel: 'एकत्रित केलेल्या तक्रारी',
    mergedReportsCount: 'तक्रारी जोडल्या गेल्या',
    officerDispatchLabel: 'अधिकारी नियुक्ती व निवारण',
    assignOfficerLabel: 'नियुक्त अभियंता:',
    unassignedOfficer: 'अनियुक्त',
    contactLabel: 'संपर्क:',
    resolutionStatusLabel: 'निवारण स्थिती:',
    drawerStatusOptions: {
      NEW: 'नवीन (नागरिकांची नोंद)',
      TRIAGED: 'तपासलेली (एआय द्वारे)',
      IN_PROGRESS: 'प्रगतीपथावर (पथक रवाना)',
      RESOLVED: '✅ निवारण झाले (शासनाकडून)'
    },
    officerNoteLabel: 'अधिकृत नोंद:',
    officerNotePlaceholder: 'उदा. दुरुस्ती पथक सकाळी 10:45 वाजता रवाना झाले...',
    saveRoutingBtn: 'अपडेट व वर्ग करा →',
    updatingText: 'अपडेट होत आहे...',
    auditLogLabel: 'कार्यवाही इतिहास',
    speechLang: 'mr-IN'
  },

  ta: {
    subtitle: 'குடிமக்கள் புகார் தீர்வு மற்றும் அரசு SLA அமைப்பு',
    complaintBtn: 'புகார்',
    welcomeBadge: '🏛️ நகராட்சி குடிமக்கள் குறைதீர்ப்பு தளம்',
    welcomeTitle: 'பஞ்சாயத்து தளத்திற்கு உங்களை வரவேற்கிறோம்',
    welcomeDesc: 'சாலை குழிகள், குப்பை, குடிநீர் கசிவு அல்லது மின்சார ஆபத்துக்களை பதிவு செய்யுங்கள். எங்கள் அமைப்பு அவற்றை உடனடியாக சரிபார்த்து வார்டு அதிகாரிகளுக்கு அனுப்பி தீர்வு காணும்.',
    heroComplaintBtn: '+ புகார் பதிவு செய்க',
    exploreCategoriesBtn: 'புகார் பிரிவுகளைக் காண்க ↓',
    totalComplaints: 'மொத்த புகார்கள்',
    resolvedGovtLabel: '✅ அரசால் தீர்க்கப்பட்டவை',
    criticalHazards: 'அவசர ஆபத்துகள் (12 மணி SLA)',
    duplicatesMerged: 'இணைக்கப்பட்ட புகார்கள்',

    navComplaint: 'புகார் பதிவு செய்க',
    navDashboard: 'நகராட்சி டாஷ்போர்டு',
    dashEyebrow: '🏛️ அரசு நிர்வாகம் மற்றும் SLA கண்காணிப்பு அமைப்பு',
    dashTitle: 'நகராட்சி குடிமக்கள் குறைதீர்ப்பு டாஷ்போர்டு',
    dashSubtitle: 'நேரலை புகார் வகைப்பாடு, தானியங்கி காலக்கெடு கண்காணிப்பு மற்றும் ஆணையர் எஸ்கலேஷன்.',
    backToComplaintBtn: '← புதிய புகார் பதிவு செய்க',
    goToDashboardBtn: 'நகராட்சி டாஷ்போர்டை திறக்கவும் →',
    bannerTitle: 'நீங்கள் நகராட்சி அதிகாரியா அல்லது வார்டு பொறியாளரா?',
    bannerSubtitle: 'நேரலை வகைப்பாடு, தீர்வு காலக்கெடு மற்றும் அதிகாரிகள் ஒதுக்கீட்டை டாஷ்போர்டில் காண்க.',
    bannerBtn: 'நகராட்சி டாஷ்போர்டை திறக்கவும் →',

    complaintBoxTitle: 'குடிமக்கள் புகார் பதிவு செய்க',
    complaintBoxSubtitle: 'உங்கள் நகரம் மற்றும் பகுதியைத் தேர்ந்தெடுத்து, புகாரை எழுதவும் அல்லது குரல் மூலம் கூறவும்.',
    step1Label: '📍 படி 1: உங்கள் நகரம் மற்றும் பகுதியைத் தேர்ந்தெடுக்கவும்',
    formCityLabel: 'நகரம்:',
    formLocalityLabel: 'பகுதி / குடியிருப்பு:',
    step2Label: '📝 படி 2: புகாரை விவரிக்கவும்',
    citizenNameLabel: 'உங்கள் பெயர் (விருப்பமானது):',
    citizenNamePlaceholder: 'எ.கா: ரமேஷ் பாபு',
    channelLabel: 'சேனல்:',
    channels: {
      CITIZEN_PORTAL: 'குடிமக்கள் வலைத்தளம்',
      VOICE_CALL_IVR: 'தொலைபேசி உதவி எண்',
      WHATSAPP_BOT: 'வாட்ஸ்அப் பாட்'
    },
    grievanceLabel: 'புகார் விவரங்கள் (சாலை குழி, குப்பை, நீர் கசிவு, மின்கம்பி):',
    speakVoiceBtn: 'குரல் மூலம் பேசுங்கள் 🎙️',
    listeningMsg: 'கேட்கிறது... உங்கள் மொழியில் பேசுங்கள்',
    voiceHint: 'குறிப்பு: தமிழ், ஆங்கிலம், இந்தி, தெலுங்கு, கன்னடம், மராத்தியில் பேசலாம்!',
    complaintTextPlaceholder: "புகாரை எழுதவும் அல்லது 'குரல் மூலம் பேசுங்கள்' என்பதை அழுத்தவும்...",
    submitComplaintBtn: 'புகாரை சமர்ப்பிக்கவும் →',
    submittingBtn: 'பதிவாகிறது...',

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

    spotlightBadge: 'நீங்கள் பதிவுசெய்த புகார் (முன்னுரிமை கண்காணிப்பு)',
    spotlightBtn: 'முழு விவரம் பார்க்க →',
    localityNoticePrefix: 'உங்கள் புகார் முதலில் காட்டப்படுகிறது, பிறகு உங்கள் பகுதியின் புகார்கள்',
    viewAllLocalitiesBtn: '🌐 அனைத்து பகுதிகளையும் காண்க',
    focusLocalityBtn: '📍 எனது பகுதியை பார்க்க',
    yourComplaintBadge: '⭐ உங்கள் புகார்',

    categoriesTitle: 'குடிமக்கள் புகார் வகைப்பாடு மற்றும் அரசின் தீர்வு',
    categoriesSubtitle: 'நகராட்சி துறைகள் வாரியாக புகார்கள் தீர்வு நிலை.',
    catGarbage: 'குப்பை மற்றும் துப்புரவு',
    catRoads: 'சாலைகள் மற்றும் குழிகள்',
    catWater: 'குடிநீர் மற்றும் கழிவுநீர்',
    catElectric: 'மின்சாரம் மற்றும் தெருவிளக்குகள்',
    catHealth: 'பொது சுகாதாரம்',
    catResolvedPrefix: 'தீர்க்கப்பட்டது:',

    feedTitle: 'குடிமக்கள் புகார்கள் பட்டியல்',
    activeTab: 'நடவடிக்கையிலுள்ள புகார்கள்',
    resolvedTab: 'அரசால் தீர்க்கப்பட்டவை',
    cityFilterLabel: 'நகரம்:',
    localityFilterLabel: 'பகுதி:',
    priorityFilterLabel: 'முன்னுரிமை:',
    deptFilterLabel: 'துறை:',
    allOption: 'அனைத்தும்',
    searchPlaceholder: 'புகார் ஐடி அல்லது பகுதி மூலம் தேடவும்...',
    resetFilters: 'மீட்டமை',
    colPriority: 'முன்னுரிமை',
    colId: 'புகார் ஐடி',
    colHeadline: 'புகார் தலைப்பு மற்றும் ஆய்வு',
    colDept: 'துறை',
    colLocation: 'இடம் / வார்டு',
    colSla: 'தீர்வு காலக்கெடு (SLA)',
    colReports: 'குடிமக்கள்',
    colStatus: 'நிலை',
    colAction: 'விவரம்',
    emptyTitle: 'புகார்கள் எதுவும் கிடைக்கவில்லை',
    emptyDesc: 'தயவுசெய்து தேடலை மாற்றவும் அல்லது வடிகட்டிகளை அழிக்கவும்.',
    emptyResetBtn: 'அனைத்து வடிகட்டிகளையும் அழிக்கவும்',

    priorities: {
      CRITICAL: 'அவசரம்',
      HIGH: 'உயர்',
      MEDIUM: 'நடுத்தர',
      LOW: 'குறைவு'
    },
    departments: {
      ELECTRICAL: '⚡ மின்சாரம்',
      WATER_SEWER: '💧 குடிநீர் / கழிவுநீர்',
      ROADS: '🛣️ சாலைகள்',
      SANITATION: '🗑️ துப்புரவு',
      HEALTH: '🏥 பொது சுகாதாரம்'
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
    resolvedLocationLabel: 'அடையாள முகவரி (OpenStreetMap)',
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

// HEADLINES TRANSLATION LOOKUP (100% Covers Telugu, Hindi, Kannada, Marathi, Tamil)
const I18N_HEADLINES = {
  te: {
    'Uncovered / damaged manhole posing hazard': 'మూత లేని ప్రమాదకరమైన మ్యాన్‌హోల్ / పాదచారులకు ముప్పు',
    'Hazardous road crater / severe pothole damage': 'ప్రమాదకరమైన రోడ్డు గుంత / వాహనాల రాకపోకలకు ఆటంకం',
    'Water main leak / pipe rupture causing waterlogging': 'ప్రధాన పైప్‌లైన్ పగిలి నీటి లీకేజీ / రోడ్డుపై నీరు నిల్వ',
    'Live wire / Electrical hazard reported on roadway': 'రోడ్డుపై తెగిపడిన విద్యుత్ తీగ / తీవ్ర ప్రమాదం',
    'Heavy garbage accumulation & overflowing waste': 'భారీగా పేరుకుపోయిన చెత్త కుప్ప / దుర్వాసన',
    'Severe waterlogging and clogged storm drain outside Andheri West Railway Station': 'రైల్వే స్టేషన్ బయట నిలిచిన నీరు / మురుగు కాల్వ పూడిక',
    'Massive garbage pile near Bandra West Linking Road market blocking pedestrian walkway': 'మార్కెట్ సమీపంలో భారీ చెత్త కుప్ప / నడవడానికి దారి లేక ఇబ్బంది',
    'Streetlight pole fixed with energy-saving LED luminaire on 4th cross residential road': 'వీధి దీపం స్తంభానికి కొత్త ఎల్‌ఈడీ లైట్ అమర్చబడింది'
  },
  hi: {
    'Uncovered / damaged manhole posing hazard': 'खुला / क्षतिग्रस्त मैनहोल दुर्घटना का खतरा',
    'Hazardous road crater / severe pothole damage': 'खतरनाक गहरा गड्ढा / सड़क क्षतिग्रस्त',
    'Water main leak / pipe rupture causing waterlogging': 'मुख्य पाइपलाइन फटने से जलभराव और बर्बादी',
    'Live wire / Electrical hazard reported on roadway': 'सड़क पर टूटा हुआ बिजली का तार / गंभीर खतरा',
    'Heavy garbage accumulation & overflowing waste': 'कचरे का भारी ढेर व दुर्गंध से भारी परेशानी',
    'Severe waterlogging and clogged storm drain outside Andheri West Railway Station': 'रेलवे स्टेशन के बाहर जलभराव और नाली जाम',
    'Massive garbage pile near Bandra West Linking Road market blocking pedestrian walkway': 'मार्केट के पास कचरे का ढेर पैदल रास्ता बाधित',
    'Streetlight pole fixed with energy-saving LED luminaire on 4th cross residential road': 'स्ट्रीट लाइट पोल पर नई एलईडी लाइट लगाई गई'
  },
  kn: {
    'Uncovered / damaged manhole posing hazard': 'ಮುಚ್ಚಳವಿಲ್ಲದ ಅಪಾಯಕಾರಿ ಮ್ಯಾನ್‌ಹೋಲ್',
    'Hazardous road crater / severe pothole damage': 'ಅಪಾಯಕಾರಿ ದೊಡ್ಡ ರಸ್ತೆ ಗುಂಡಿ',
    'Water main leak / pipe rupture causing waterlogging': 'ಮುಖ್ಯ ಪೈಪ್ ಒಡೆದು ನೀರು ಪೋಲು / ರಸ್ತೆ ಜಲಾವೃತ',
    'Live wire / Electrical hazard reported on roadway': 'ರಸ್ತೆಯಲ್ಲಿ ತುಂಡಾದ ವಿದ್ಯುತ್ ತಂತಿ / ತುರ್ತು ಅಪಾಯ',
    'Heavy garbage accumulation & overflowing waste': 'ಕಸದ ರಾಶಿ ತುಂಬಿ ತುಳುಕುತ್ತಿದೆ / ದುರ್ವಾಸನೆ',
    'Severe waterlogging and clogged storm drain outside Andheri West Railway Station': 'ರೈಲ್ವೆ ನಿಲ್ದಾಣದ ಹೊರಗೆ ನೀರು ನಿಂತಿದೆ / ರಾಜಕಾಲುವೆ ಬ್ಲಾಕ್',
    'Massive garbage pile near Bandra West Linking Road market blocking pedestrian walkway': 'ಮಾರುಕಟ್ಟೆ ಬಳಿ ಬೃಹತ್ ಕಸದ ರಾಶಿ / ಪಾದಚಾರಿಗಳಿಗೆ ತೊಂದರೆ',
    'Streetlight pole fixed with energy-saving LED luminaire on 4th cross residential road': 'ಬೀದಿ ದೀಪದ ಕಂಬಕ್ಕೆ ಹೊಸ ಎಲ್ಇಡಿ ಅಳವಡಿಸಲಾಗಿದೆ'
  },
  mr: {
    'Uncovered / damaged manhole posing hazard': 'उघडे / तुटलेले मॅनहोल अपघाताचा धोका',
    'Hazardous road crater / severe pothole damage': 'धोकादायक खोल खड्डा / वाहनांचा अपघात धोका',
    'Water main leak / pipe rupture causing waterlogging': 'मुख्य पाईप फुटल्याने पाणी साचले',
    'Live wire / Electrical hazard reported on roadway': 'रस्त्यावर तुटलेली विजेची तार / गंभीर धोका',
    'Heavy garbage accumulation & overflowing waste': 'कचऱ्याचा मोठा ढीग व दुर्गंधी',
    'Severe waterlogging and clogged storm drain outside Andheri West Railway Station': 'रेल्वे स्थानकाबाहेर पाणी साचले व गटार तुंबले',
    'Massive garbage pile near Bandra West Linking Road market blocking pedestrian walkway': 'मार्केट जवळ कचऱ्याचा ढीग रस्ता बंद',
    'Streetlight pole fixed with energy-saving LED luminaire on 4th cross residential road': 'पथदिव्याच्या खांबावर नवीन एलईडी दिवा बसवला'
  },
  ta: {
    'Uncovered / damaged manhole posing hazard': 'மூடப்படாத ஆபத்தான மேன்ஹோல்',
    'Hazardous road crater / severe pothole damage': 'ஆபத்தான சாலை குழி / வாகன விபத்து அபாயம்',
    'Water main leak / pipe rupture causing waterlogging': 'பிரதான குழாய் உடைந்து தண்ணீர் தேக்கம்',
    'Live wire / Electrical hazard reported on roadway': 'சாலையில் அறுந்த மின்கம்பி / அவசர ஆபத்து',
    'Heavy garbage accumulation & overflowing waste': 'அதிக குப்பை குவியல் மற்றும் சுகாதார சீர்கேடு',
    'Severe waterlogging and clogged storm drain outside Andheri West Railway Station': 'ரயில் நிலையம் வெளியே தண்ணீர் தேக்கம் / வடிகால் அடைப்பு',
    'Massive garbage pile near Bandra West Linking Road market blocking pedestrian walkway': 'சந்தை அருகே குப்பைக் குவியல் பாதசாரிகள் அவதி',
    'Streetlight pole fixed with energy-saving LED luminaire on 4th cross residential road': 'தெருவிளக்கு கம்பத்தில் புதிய எல்இடி பொருத்தப்பட்டது'
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
    'Standard civic service disruption requiring scheduled repair.': 'ನಿಗದಿತ ದುರಸ್ತಿ ಅಗತ್ಯವಿರುವ ಸಾಮಾನ್ಯ ನಾಗರಿಕ ಸೇವಾ ಅಡಚಣೆ.'
  },
  mr: {
    'Immediate public safety or life-hazard detected requiring emergency dispatch.': 'तातडीची सार्वजनिक सुरक्षा किंवा जीवितास धोका, आपत्कालीन पथक त्वरित आवश्यक.',
    'High-impact civic failure disrupting public health or traffic artery.': 'सार्वजनिक आरोग्य किंवा वाहतूक विस्कळीत करणारी मोठी समस्या.',
    'Low-impact maintenance item with minimal safety risk.': 'कमी धोका असलेली सामान्य देखभाल समस्या.',
    'Standard civic service disruption requiring scheduled repair.': 'वेळेत दुरुस्ती आवश्यक असलेली नियमित नागरी समस्या.'
  },
  ta: {
    'Immediate public safety or life-hazard detected requiring emergency dispatch.': 'பொது பாதுகாப்பு அல்லது உயிருக்கு உடனடி ஆபத்து, அவசர படை தேவை.',
    'High-impact civic failure disrupting public health or traffic artery.': 'பொது சுகாதாரம் அல்லது போக்குவரத்தை கடுமையாக பாதிக்கும் பிரச்சனை.',
    'Low-impact maintenance item with minimal safety risk.': 'குறைந்த ஆபத்து கொண்ட எளிய பராமரிப்பு பிரச்சனை.',
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
    'Whitefield': 'వైట్‌ఫీల్డ్',
    'Indiranagar': 'ఇందిరానగర్',
    'Malleshwaram': 'మల్లేశ్వరం',
    'Hitec City': 'హైటెక్ సిటీ',
    'Andheri West': 'అంధేరీ వెస్ట్',
    'Bandra West': 'బాంద్రా వెస్ట్',
    'Connaught Place': 'కన్నాట్ ప్లేస్',
    'Bengaluru': 'బెంగళూరు',
    'Mumbai': 'ముంబై',
    'Delhi': 'ఢిల్లీ',
    'Hyderabad': 'హైదరాబాద్',
    'Pune': 'పుణె'
  },
  hi: {
    'Jayanagar': 'जयनगर',
    'Koramangala': 'कोरामंगला',
    'Bannerghatta': 'बन्नेरघट्टा',
    'Gandhi Bazaar': 'गांधी बाजार',
    'Majestic / Central': 'मैजेस्टिक / सेंट्रल',
    'Whitefield': 'व्हाइटफील्ड',
    'Indiranagar': 'इंदिरानगर',
    'Malleshwaram': 'मल्लेश्वरम',
    'Hitec City': 'हाईटेक सिटी',
    'Andheri West': 'अंधेरी वेस्ट',
    'Bandra West': 'बांद्रा वेस्ट',
    'Connaught Place': 'कनॉट प्लेस',
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
    'Whitefield': 'ವೈಟ್‌ಫೀಲ್ಡ್',
    'Indiranagar': 'ಇಂದಿರಾನಗರ',
    'Malleshwaram': 'ಮಲ್ಲೇಶ್ವರಂ',
    'Hitec City': 'ಹೈಟೆಕ್ ಸಿಟಿ',
    'Andheri West': 'ಅಂಧೇರಿ ಪಶ್ಚಿಮ',
    'Bandra West': 'ಬಾಂದ್ರಾ ಪಶ್ಚಿಮ',
    'Connaught Place': 'ಕನ್ನಾಟ್ ಪ್ಲೇಸ್',
    'Bengaluru': 'ಬೆಂಗಳೂರು',
    'Mumbai': 'ಮುಂಬೈ',
    'Delhi': 'ದೆಹಲಿ',
    'Hyderabad': 'ಹೈದರಾಬಾದ್',
    'Pune': 'ಪುಣೆ'
  },
  mr: {
    'Jayanagar': 'जयनगर',
    'Koramangala': 'कोरामंगला',
    'Bannerghatta': 'बन्नेरघट्टा',
    'Gandhi Bazaar': 'गांधी बाजार',
    'Majestic / Central': 'मॅजेस्टिक / सेंट्रल',
    'Whitefield': 'व्हाईटफिल्ड',
    'Indiranagar': 'इंदिरानगर',
    'Malleshwaram': 'मल्लेश्वरम',
    'Hitec City': 'हायटेक सिटी',
    'Andheri West': 'अंधेरी पश्चिम',
    'Bandra West': 'वांद्रे पश्चिम',
    'Connaught Place': 'कॅनॉट प्लेस',
    'Bengaluru': 'बंगळुरू',
    'Mumbai': 'मुंबई',
    'Delhi': 'दिल्ली',
    'Hyderabad': 'हैद्राबाद',
    'Pune': 'पुणे'
  },
  ta: {
    'Jayanagar': 'ஜெயநகர்',
    'Koramangala': 'கோரமங்களா',
    'Bannerghatta': 'பன்னேருகட்டா',
    'Gandhi Bazaar': 'காந்தி பஜார்',
    'Majestic / Central': 'மெஜஸ்டிக் / சென்ட்ரல்',
    'Whitefield': 'ஒயிட்பீல்டு',
    'Indiranagar': 'இந்திராநகர்',
    'Malleshwaram': 'மல்லேஸ்வரம்',
    'Hitec City': 'ஹைடெக் சிட்டி',
    'Andheri West': 'அந்தேரி மேற்கு',
    'Bandra West': 'பாந்த்ரா மேற்கு',
    'Connaught Place': 'கன்னாட் பிளேஸ்',
    'Bengaluru': 'பெங்களூரு',
    'Mumbai': 'மும்பை',
    'Delhi': 'டெல்லி',
    'Hyderabad': 'ஹைதராபாத்',
    'Pune': 'புனே'
  }
};

// Robust Translation Helpers with Keyword Fallbacks
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
  return count + ' ' + (dict.citizenPlural || 'Citizens');
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

// Categories
const catGarbageCount = document.getElementById('catGarbageCount');
const catGarbageProgress = document.getElementById('catGarbageProgress');
const catRoadsCount = document.getElementById('catRoadsCount');
const catRoadsProgress = document.getElementById('catRoadsProgress');
const catWaterCount = document.getElementById('catWaterCount');
const catWaterProgress = document.getElementById('catWaterProgress');
const catElectricCount = document.getElementById('catElectricCount');
const catElectricProgress = document.getElementById('catElectricProgress');
const catHealthCount = document.getElementById('catHealthCount');
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

// Live Tracking Elements
const trackInputId = document.getElementById('trackInputId');
const trackDisplayId = document.getElementById('trackDisplayId');
const trackDisplayPriority = document.getElementById('trackDisplayPriority');
const trackDisplayDept = document.getElementById('trackDisplayDept');
const trackSlaClock = document.getElementById('trackSlaClock');
const trackDisplayHeadline = document.getElementById('trackDisplayHeadline');
const trackDisplayLocation = document.getElementById('trackDisplayLocation');
const trackOfficerDisplay = document.getElementById('trackOfficerDisplay');
const trackPhoneDisplay = document.getElementById('trackPhoneDisplay');
const trackCallLink = document.getElementById('trackCallLink');

// Stepper Stages
const step1Stage = document.getElementById('step1Stage');
const step2Stage = document.getElementById('step2Stage');
const step3Stage = document.getElementById('step3Stage');
const step4Stage = document.getElementById('step4Stage');
const stepLine1 = document.getElementById('stepLine1');
const stepLine2 = document.getElementById('stepLine2');
const stepLine3 = document.getElementById('stepLine3');

// Spotlight Elements on Dashboard
const userComplaintSpotlight = document.getElementById('userComplaintSpotlight');
const spotlightLocalityTag = document.getElementById('spotlightLocalityTag');
const spotlightId = document.getElementById('spotlightId');
const spotlightPriority = document.getElementById('spotlightPriority');
const spotlightDept = document.getElementById('spotlightDept');
const spotlightSlaPill = document.getElementById('spotlightSlaPill');
const spotlightHeadline = document.getElementById('spotlightHeadline');
const spotlightDesc = document.getElementById('spotlightDesc');
const spotlightLocationMeta = document.getElementById('spotlightLocationMeta');
const spotlightOfficer = document.getElementById('spotlightOfficer');
const localityFilteredNotice = document.getElementById('localityFilteredNotice');
const noticeLocalityName = document.getElementById('noticeLocalityName');

// Drawer Elements
const incidentDrawer = document.getElementById('incidentDrawer');
const drawerOverlay = document.getElementById('drawerOverlay');
const closeDrawerBtn = document.getElementById('closeDrawerBtn');
const drawerIncidentId = document.getElementById('drawerIncidentId');
const drawerPriorityBadge = document.getElementById('drawerPriorityBadge');
const drawerDeptBadge = document.getElementById('drawerDeptBadge');
const drawerHeadline = document.getElementById('drawerHeadline');
const drawerTriageReason = document.getElementById('drawerTriageReason');
const drawerResolvedAddress = document.getElementById('drawerResolvedAddress');
const drawerWardTag = document.getElementById('drawerWardTag');
const drawerMapCoordinates = document.getElementById('drawerMapCoordinates');
const drawerDuplicateCount = document.getElementById('drawerDuplicateCount');
const drawerDuplicatesList = document.getElementById('drawerDuplicatesList');
const drawerSlaCountdown = document.getElementById('drawerSlaCountdown');
const drawerSlaStatusBadge = document.getElementById('drawerSlaStatusBadge');
const drawerSlaDeadline = document.getElementById('drawerSlaDeadline');
const drawerSlaTargetRule = document.getElementById('drawerSlaTargetRule');
const drawerEscalationWarning = document.getElementById('drawerEscalationWarning');
const drawerEscalateBtn = document.getElementById('drawerEscalateBtn');
const drawerAuditTimeline = document.getElementById('drawerAuditTimeline');

// Officer Routing & Status Drawer Form
const routingOfficerForm = document.getElementById('routingOfficerForm');
const routeOfficerSelect = document.getElementById('routeOfficerSelect');
const routeOfficerPhone = document.getElementById('routeOfficerPhone');
const routeStatusSelect = document.getElementById('routeStatusSelect');
const routeNoteInput = document.getElementById('routeNoteInput');
const saveRoutingBtn = document.getElementById('saveRoutingBtn');

// Voice Speech Synthesis
const speechSynth = window.speechSynthesis;
let currentUtterance = null;
const voiceTriageBtn = document.getElementById('voiceTriageBtn');

// Toast
const toast = document.getElementById('toast');

// Nike Kinetic View Switcher
function switchView(targetView) {
  if (targetView === 'dashboard') {
    currentPortalView = 'dashboard';
    navTabComplaint.classList.remove('active');
    navTabDashboard.classList.add('active');

    viewComplaint.classList.add('hidden');
    viewComplaint.classList.remove('active', 'slide-from-left');

    viewDashboard.classList.remove('hidden');
    viewDashboard.classList.add('active', 'slide-from-right');

    try { history.replaceState(null, '', '#dashboard'); } catch (e) {}

    fetchIncidents();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  } else {
    currentPortalView = 'complaint';
    navTabDashboard.classList.remove('active');
    navTabComplaint.classList.add('active');

    viewDashboard.classList.add('hidden');
    viewDashboard.classList.remove('active', 'slide-from-right');

    viewComplaint.classList.remove('hidden');
    viewComplaint.classList.add('active', 'slide-from-left');

    try { history.replaceState(null, '', '#complaint'); } catch (e) {}

    lookupComplaintTracking(userTrackingIncidentId);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }
}

// Direct jump from tracking card to dashboard spotlight
function openComplaintOnDashboard() {
  switchView('dashboard');
  setTimeout(() => {
    if (userComplaintSpotlight) {
      userComplaintSpotlight.scrollIntoView({ behavior: 'smooth', block: 'center' });
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

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', async () => {
  await fetchConfig();
  await fetchOfficers();
  updateLocalityDropdown(cityFilter.value, localityFilter, true);
  updateLocalityDropdown(inlineCitySelect.value, inlineLocalitySelect, false);
  setupVoiceRecognition();
  setupLanguageHandler();
  setupViewToggles();
  applyLanguage(currentLanguage);

  // Check URL hash for direct separate dashboard access
  const hash = window.location.hash.toLowerCase();
  const path = window.location.pathname.toLowerCase();
  if (hash === '#dashboard' || path === '/dashboard') {
    switchView('dashboard');
  } else {
    fetchIncidents().then(() => {
      lookupComplaintTracking(userTrackingIncidentId);
    });
  }

  setupEventListeners();
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

    const res = await fetch('/api/officers?' + params.toString());
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
  routeOfficerSelect.innerHTML = '<option value="Unassigned">' + (d.unassignedOfficer || 'Unassigned') + '</option>';
  availableOfficers.forEach(off => {
    const opt = document.createElement('option');
    opt.value = off.name + ' (' + off.designation + ')';
    opt.textContent = off.name + ' - ' + off.designation + ' [' + off.locality + ', ' + off.city + ']';
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

  // Nike View Switcher
  const elNavComplaint = document.getElementById('i18nNavComplaint');
  if (elNavComplaint) elNavComplaint.textContent = d.navComplaint;
  const elNavDashboard = document.getElementById('i18nNavDashboard');
  if (elNavDashboard) elNavDashboard.textContent = d.navDashboard;

  // Separate Dashboard Header
  const elDashEyebrow = document.getElementById('i18nDashEyebrow');
  if (elDashEyebrow) elDashEyebrow.textContent = d.dashEyebrow;
  const elDashTitle = document.getElementById('i18nDashTitle');
  if (elDashTitle) elDashTitle.textContent = d.dashTitle;
  const elDashSubtitle = document.getElementById('i18nDashSubtitle');
  if (elDashSubtitle) elDashSubtitle.textContent = d.dashSubtitle;
  const elBackToComplaintBtn = document.getElementById('i18nBackToComplaintBtn');
  if (elBackToComplaintBtn) elBackToComplaintBtn.textContent = d.backToComplaintBtn;

  // Promo Banner
  const elBannerTitle = document.getElementById('i18nBannerTitle');
  if (elBannerTitle) elBannerTitle.textContent = d.bannerTitle;
  const elBannerSubtitle = document.getElementById('i18nBannerSubtitle');
  if (elBannerSubtitle) elBannerSubtitle.textContent = d.bannerSubtitle;
  const elBannerBtn = document.getElementById('i18nBannerBtn');
  if (elBannerBtn) elBannerBtn.textContent = d.bannerBtn;

  // Welcome Hero Section
  const elWelcomeBadge = document.getElementById('i18nWelcomeBadge');
  if (elWelcomeBadge) elWelcomeBadge.textContent = d.welcomeBadge;
  const elWelcomeTitle = document.getElementById('i18nWelcomeTitle');
  if (elWelcomeTitle) elWelcomeTitle.textContent = d.welcomeTitle;
  const elWelcomeDesc = document.getElementById('i18nWelcomeDesc');
  if (elWelcomeDesc) elWelcomeDesc.textContent = d.welcomeDesc;
  const elHeroComplaintBtn = document.getElementById('i18nHeroComplaintBtn');
  if (elHeroComplaintBtn) elHeroComplaintBtn.textContent = d.heroComplaintBtn;
  const elGoToDashboardBtn = document.getElementById('i18nGoToDashboardBtn');
  if (elGoToDashboardBtn) elGoToDashboardBtn.textContent = d.goToDashboardBtn;

  // Complaint Box Form
  const elComplaintBoxTitle = document.getElementById('i18nComplaintBoxTitle');
  if (elComplaintBoxTitle) elComplaintBoxTitle.textContent = d.complaintBoxTitle;
  const elComplaintBoxSubtitle = document.getElementById('i18nComplaintBoxSubtitle');
  if (elComplaintBoxSubtitle) elComplaintBoxSubtitle.textContent = d.complaintBoxSubtitle;
  const elStep1Label = document.getElementById('i18nStep1Label');
  if (elStep1Label) elStep1Label.textContent = d.step1Label;
  const elFormCityLabel = document.getElementById('i18nFormCityLabel');
  if (elFormCityLabel) elFormCityLabel.textContent = d.formCityLabel;
  const elFormLocalityLabel = document.getElementById('i18nFormLocalityLabel');
  if (elFormLocalityLabel) elFormLocalityLabel.textContent = d.formLocalityLabel;
  const elStep2Label = document.getElementById('i18nStep2Label');
  if (elStep2Label) elStep2Label.textContent = d.step2Label;
  const elCitizenNameLabel = document.getElementById('i18nCitizenNameLabel');
  if (elCitizenNameLabel) elCitizenNameLabel.textContent = d.citizenNameLabel;
  if (inlineCitizenNameInput) inlineCitizenNameInput.placeholder = d.citizenNamePlaceholder;
  const elChannelLabel = document.getElementById('i18nChannelLabel');
  if (elChannelLabel) elChannelLabel.textContent = d.channelLabel;
  const elGrievanceLabel = document.getElementById('i18nGrievanceLabel');
  if (elGrievanceLabel) elGrievanceLabel.textContent = d.grievanceLabel;
  const elListeningMsg = document.getElementById('i18nListeningMsg');
  if (elListeningMsg) elListeningMsg.textContent = d.listeningMsg;
  const elVoiceHint = document.getElementById('i18nVoiceHint');
  if (elVoiceHint) elVoiceHint.textContent = d.voiceHint;
  if (inlineComplaintTextInput) inlineComplaintTextInput.placeholder = d.complaintTextPlaceholder;
  const elSubmitComplaintBtn = document.getElementById('i18nSubmitComplaintBtn');
  if (elSubmitComplaintBtn) elSubmitComplaintBtn.textContent = d.submitComplaintBtn;

  // Live Tracking Section
  const elTrackingEyebrow = document.getElementById('i18nTrackingEyebrow');
  if (elTrackingEyebrow) elTrackingEyebrow.textContent = d.trackingEyebrow;
  const elTrackingTitle = document.getElementById('i18nTrackingTitle');
  if (elTrackingTitle) elTrackingTitle.textContent = d.trackingTitle;
  const elTrackingSubtitle = document.getElementById('i18nTrackingSubtitle');
  if (elTrackingSubtitle) elTrackingSubtitle.textContent = d.trackingSubtitle;
  const elTrackBtn = document.getElementById('i18nTrackBtn');
  if (elTrackBtn) elTrackBtn.textContent = d.trackBtn;
  const elStepStage1 = document.getElementById('i18nStepStage1');
  if (elStepStage1) elStepStage1.textContent = d.stepStage1;
  const elStepStage2 = document.getElementById('i18nStepStage2');
  if (elStepStage2) elStepStage2.textContent = d.stepStage2;
  const elStepStage3 = document.getElementById('i18nStepStage3');
  if (elStepStage3) elStepStage3.textContent = d.stepStage3;
  const elStepStage4 = document.getElementById('i18nStepStage4');
  if (elStepStage4) elStepStage4.textContent = d.stepStage4;
  const elStep4Sub = document.getElementById('i18nStep4Sub');
  if (elStep4Sub) elStep4Sub.textContent = d.step4Sub;

  // Dashboard Spotlight & Locality Notice
  const elSpotlightBadge = document.getElementById('i18nSpotlightBadge');
  if (elSpotlightBadge) elSpotlightBadge.textContent = d.spotlightBadge;
  const elSpotlightBtn = document.getElementById('i18nSpotlightBtn');
  if (elSpotlightBtn) elSpotlightBtn.textContent = d.spotlightBtn;
  const elLocalityNotice = document.getElementById('i18nLocalityNotice');
  if (elLocalityNotice) {
    const locName = getLocalityLabel(userTrackingLocality, lang);
    elLocalityNotice.innerHTML = d.localityNoticePrefix + ' (<strong>' + locName + '</strong>).';
  }
  const elViewAllLocalitiesBtn = document.getElementById('i18nViewAllLocalitiesBtn');
  if (elViewAllLocalitiesBtn) {
    elViewAllLocalitiesBtn.textContent = filterByLocalityActive ? d.viewAllLocalitiesBtn : d.focusLocalityBtn;
  }

  // Categories Section
  const elCatTitle = document.getElementById('i18nCategoriesTitle');
  if (elCatTitle) elCatTitle.textContent = d.categoriesTitle;
  const elCatSubtitle = document.getElementById('i18nCategoriesSubtitle');
  if (elCatSubtitle) elCatSubtitle.textContent = d.categoriesSubtitle;
  const elCatGarbage = document.getElementById('i18nCatGarbage');
  if (elCatGarbage) elCatGarbage.textContent = d.catGarbage;
  const elCatRoads = document.getElementById('i18nCatRoads');
  if (elCatRoads) elCatRoads.textContent = d.catRoads;
  const elCatWater = document.getElementById('i18nCatWater');
  if (elCatWater) elCatWater.textContent = d.catWater;
  const elCatElectric = document.getElementById('i18nCatElectric');
  if (elCatElectric) elCatElectric.textContent = d.catElectric;
  const elCatHealth = document.getElementById('i18nCatHealth');
  if (elCatHealth) elCatHealth.textContent = d.catHealth;

  // Stat Labels
  const elStatTotal = document.getElementById('i18nStatTotal');
  if (elStatTotal) elStatTotal.textContent = d.totalComplaints;
  const elStatResolved = document.getElementById('i18nStatResolved');
  if (elStatResolved) elStatResolved.textContent = d.resolvedGovtLabel;
  const elStatCritical = document.getElementById('i18nStatCritical');
  if (elStatCritical) elStatCritical.textContent = d.criticalHazards;
  const elStatDuplicates = document.getElementById('i18nStatDuplicates');
  if (elStatDuplicates) elStatDuplicates.textContent = d.duplicatesMerged;

  // Feed & Table Headers
  const elFeedTitle = document.getElementById('i18nFeedTitle');
  if (elFeedTitle) elFeedTitle.textContent = d.feedTitle;
  const elToggleActive = document.getElementById('i18nToggleActive');
  if (elToggleActive) elToggleActive.textContent = d.activeTab;
  const elToggleResolved = document.getElementById('i18nToggleResolved');
  if (elToggleResolved) elToggleResolved.textContent = d.resolvedTab;

  const elColPriority = document.getElementById('i18nColPriority');
  if (elColPriority) elColPriority.textContent = d.colPriority;
  const elColId = document.getElementById('i18nColId');
  if (elColId) elColId.textContent = d.colId;
  const elColHeadline = document.getElementById('i18nColHeadline');
  if (elColHeadline) elColHeadline.textContent = d.colHeadline;
  const elColDept = document.getElementById('i18nColDept');
  if (elColDept) elColDept.textContent = d.colDept;
  const elColLocation = document.getElementById('i18nColLocation');
  if (elColLocation) elColLocation.textContent = d.colLocation;
  const elColSla = document.getElementById('i18nColSla');
  if (elColSla) elColSla.textContent = d.colSla;
  const elColReports = document.getElementById('i18nColReports');
  if (elColReports) elColReports.textContent = d.colReports;
  const elColStatus = document.getElementById('i18nColStatus');
  if (elColStatus) elColStatus.textContent = d.colStatus;
  const elColAction = document.getElementById('i18nColAction');
  if (elColAction) elColAction.textContent = d.colAction;

  // Refresh Table and Tracking displays
  lookupComplaintTracking(userTrackingIncidentId);
  renderTable(cachedIncidents);
}

// Live Tracking: Lookup and update
async function lookupComplaintTracking(targetId) {
  const id = (targetId || (trackInputId ? trackInputId.value.trim() : '') || userTrackingIncidentId).toUpperCase();
  if (!id) return;

  userTrackingIncidentId = id;
  if (trackInputId) trackInputId.value = id;

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
  if (!trackDisplayId) return;
  const d = I18N[currentLanguage] || I18N.en;

  trackDisplayId.textContent = inc.id;
  trackDisplayPriority.textContent = getPriorityLabel(inc.priority, currentLanguage);
  trackDisplayPriority.className = 'badge ' + (inc.priority === 'CRITICAL' ? 'badge-critical' : inc.priority === 'HIGH' ? 'badge-high' : 'badge-medium');

  trackDisplayDept.textContent = getDepartmentLabel(inc.department, currentLanguage);
  trackSlaClock.textContent = '⏱️ ' + getSlaDisplayText(inc, currentLanguage);

  trackDisplayHeadline.textContent = getHeadlineLabel(inc.headline, currentLanguage);
  trackDisplayLocation.textContent = '📍 ' + (inc.location_display || (getLocalityLabel(inc.locality, currentLanguage) + ', ' + getCityLabel(inc.city, currentLanguage)));

  // Stepper Stage Progress
  step1Stage.className = 'stepper-step completed';
  stepLine1.className = 'stepper-line completed';
  step2Stage.className = 'stepper-step completed';

  if (inc.status === 'RESOLVED') {
    stepLine2.className = 'stepper-line completed';
    step3Stage.className = 'stepper-step completed';
    stepLine3.className = 'stepper-line completed';
    step4Stage.className = 'stepper-step completed';
    const sub4 = document.getElementById('i18nStep4Sub');
    if (sub4) sub4.textContent = d.statuses.RESOLVED || 'Resolved';
  } else if (inc.status === 'IN_PROGRESS') {
    stepLine2.className = 'stepper-line completed';
    step3Stage.className = 'stepper-step completed';
    stepLine3.className = 'stepper-line active';
    step4Stage.className = 'stepper-step active';
    const sub4 = document.getElementById('i18nStep4Sub');
    if (sub4) sub4.textContent = d.step4Sub || 'In Progress';
  } else {
    // NEW or TRIAGED
    stepLine2.className = 'stepper-line active';
    step3Stage.className = 'stepper-step active';
    stepLine3.className = 'stepper-line';
    step4Stage.className = 'stepper-step';
  }

  // Assigned Officer info
  const officerName = inc.assigned_officer && inc.assigned_officer !== 'Unassigned' ? inc.assigned_officer : 'Er. S. Sharma (Executive Engineer)';
  const officerPhone = inc.assigned_officer_phone || '+91 98450 11001';

  trackOfficerDisplay.textContent = (d.assignedOfficerPrefix || 'Assigned Ward Engineer:') + ' ' + officerName;
  trackPhoneDisplay.textContent = officerPhone;
  trackCallLink.href = 'tel:' + officerPhone.replace(/\s+/g, '');
}

// Update Dashboard Spotlight UI
function updateSpotlightUI(inc) {
  if (!userComplaintSpotlight) return;
  const d = I18N[currentLanguage] || I18N.en;

  spotlightId.textContent = inc.id;
  spotlightPriority.textContent = getPriorityLabel(inc.priority, currentLanguage);
  spotlightPriority.className = 'badge ' + (inc.priority === 'CRITICAL' ? 'badge-critical' : inc.priority === 'HIGH' ? 'badge-high' : 'badge-medium');
  spotlightDept.textContent = getDepartmentLabel(inc.department, currentLanguage);

  const sla = inc.sla_info || { sla_status: 'ON_TRACK', time_display: 'On track' };
  spotlightSlaPill.textContent = '🟢 ' + getSlaDisplayText(inc, currentLanguage);

  spotlightHeadline.textContent = getHeadlineLabel(inc.headline, currentLanguage);
  spotlightDesc.textContent = getUrgencyReasonLabel(inc.urgency_reason, currentLanguage);

  const locText = getLocalityLabel(inc.locality, currentLanguage) + ', ' + getCityLabel(inc.city, currentLanguage);
  spotlightLocalityTag.textContent = '📍 ' + locText;

  spotlightLocationMeta.textContent = '📍 ' + (inc.location_display || locText) + ' (' + getWardLabel(inc.ward, currentLanguage) + ')';
  
  const officerName = inc.assigned_officer && inc.assigned_officer !== 'Unassigned' ? inc.assigned_officer : 'Er. S. Sharma';
  const officerPhone = inc.assigned_officer_phone || '+91 98450 11001';
  spotlightOfficer.textContent = officerName + ' (' + officerPhone + ')';

  if (noticeLocalityName) {
    noticeLocalityName.textContent = getLocalityLabel(userTrackingLocality, currentLanguage);
  }
}

// View Toggles (Active vs Resolved)
function setupViewToggles() {
  toggleActiveView.addEventListener('click', () => {
    currentStatusView = 'ACTIVE';
    toggleActiveView.classList.add('active');
    toggleResolvedView.classList.remove('active');
    renderTable(cachedIncidents);
  });

  toggleResolvedView.addEventListener('click', () => {
    currentStatusView = 'RESOLVED';
    toggleResolvedView.classList.add('active');
    toggleActiveView.classList.remove('active');
    renderTable(cachedIncidents);
  });
}

// Dynamic City / Locality Dropdown
function updateLocalityDropdown(selectedCity, targetElement, includeAll = false) {
  targetElement.innerHTML = '';
  const d = I18N[currentLanguage] || I18N.en;

  if (includeAll) {
    const allOpt = document.createElement('option');
    allOpt.value = 'ALL';
    allOpt.textContent = d.allOption || 'All Localities';
    targetElement.appendChild(allOpt);
  }

  const localities = (selectedCity !== 'ALL' && citiesRegistry[selectedCity])
    ? citiesRegistry[selectedCity].localities
    : ['Jayanagar', 'Koramangala', 'Bannerghatta', 'Gandhi Bazaar', 'Majestic / Central', 'Whitefield', 'Indiranagar', 'Malleshwaram'];

  localities.forEach(loc => {
    const opt = document.createElement('option');
    opt.value = loc;
    opt.textContent = getLocalityLabel(loc, currentLanguage);
    targetElement.appendChild(opt);
  });
}

// Voice Recognition
function setupVoiceRecognition() {
  const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
  if (!SpeechRec) {
    if (inlineVoiceRecordBtn) inlineVoiceRecordBtn.style.display = 'none';
    return;
  }

  speechRecognition = new SpeechRec();
  speechRecognition.continuous = false;
  speechRecognition.interimResults = true;

  speechRecognition.onstart = () => {
    isRecordingVoice = true;
    inlineVoiceRecordBtn.classList.add('recording');
    inlineVoiceWaveBar.classList.remove('hidden');
    inlineVoiceStatusText.textContent = 'Listening...';
  };

  speechRecognition.onresult = (event) => {
    let transcript = '';
    for (let i = event.resultIndex; i < event.results.length; ++i) {
      transcript += event.results[i][0].transcript;
    }
    inlineComplaintTextInput.value = transcript;
  };

  speechRecognition.onerror = (event) => {
    console.warn('Speech recognition error:', event.error);
    stopVoiceRecording();
  };

  speechRecognition.onend = () => {
    stopVoiceRecording();
  };

  if (inlineVoiceRecordBtn) {
    inlineVoiceRecordBtn.addEventListener('click', () => {
      if (isRecordingVoice) {
        stopVoiceRecording();
      } else {
        startVoiceRecording();
      }
    });
  }
}

function startVoiceRecording() {
  if (!speechRecognition) return;
  const d = I18N[currentLanguage] || I18N.en;
  speechRecognition.lang = d.speechLang || 'en-US';
  try {
    speechRecognition.start();
  } catch (e) {
    console.warn('Speech start skipped:', e);
  }
}

function stopVoiceRecording() {
  if (!speechRecognition) return;
  isRecordingVoice = false;
  if (inlineVoiceRecordBtn) {
    inlineVoiceRecordBtn.classList.remove('recording');
    inlineVoiceStatusText.textContent = I18N[currentLanguage].speakVoiceBtn;
  }
  if (inlineVoiceWaveBar) {
    inlineVoiceWaveBar.classList.add('hidden');
  }
  try {
    speechRecognition.stop();
  } catch (e) {}
}

// Fetch Incidents from Server
async function fetchIncidents() {
  try {
    const params = new URLSearchParams();
    if (cityFilter.value !== 'ALL') params.append('city', cityFilter.value);
    if (localityFilter.value !== 'ALL') params.append('locality', localityFilter.value);
    if (priorityFilter.value !== 'ALL') params.append('priority', priorityFilter.value);
    if (deptFilter.value !== 'ALL') params.append('department', deptFilter.value);
    if (searchInput.value.trim()) params.append('search', searchInput.value.trim());

    const res = await fetch('/api/incidents?' + params.toString());
    if (!res.ok) throw new Error('Failed to load civic incidents');

    const data = await res.json();
    cachedIncidents = data.incidents || [];

    updateDashboardStats(data.stats, cachedIncidents);
    renderTable(cachedIncidents);

    // Keep live tracking synced
    lookupComplaintTracking(userTrackingIncidentId);
  } catch (err) {
    console.error('fetchIncidents error:', err);
    showToast('Failed to load complaints. Retrying...');
  }
}

// Update Top Municipal Stats & Department Breakdown
function updateDashboardStats(stats, incidents) {
  if (!stats) return;

  statTotalComplaints.textContent = stats.total_complaints || 0;
  statResolvedGovt.textContent = stats.total_resolved || 0;
  statCriticalHazards.textContent = stats.active_critical || 0;
  statDuplicatesMerged.textContent = stats.total_duplicates || 0;

  if (navActiveCountBadge) {
    navActiveCountBadge.textContent = stats.active_critical || 0;
  }

  // Calculate category breakdown
  const cb = {
    SANITATION: { count: 0, resolved: 0, percent_resolved: 0 },
    ROADS: { count: 0, resolved: 0, percent_resolved: 0 },
    WATER_SEWER: { count: 0, resolved: 0, percent_resolved: 0 },
    ELECTRICAL: { count: 0, resolved: 0, percent_resolved: 0 },
    HEALTH: { count: 0, resolved: 0, percent_resolved: 0 }
  };

  incidents.forEach(inc => {
    const d = inc.department;
    if (cb[d]) {
      cb[d].count += 1;
      if (inc.status === 'RESOLVED') cb[d].resolved += 1;
    }
  });

  Object.keys(cb).forEach(k => {
    cb[k].percent_resolved = cb[k].count > 0 ? Math.round((cb[k].resolved / cb[k].count) * 100) : 0;
  });

  const d = I18N[currentLanguage] || I18N.en;
  const prefix = d.catResolvedPrefix || 'Resolved by Govt:';

  if (catGarbageCount) {
    catGarbageCount.textContent = prefix + ' ' + cb.SANITATION.resolved + '/' + cb.SANITATION.count + ' (' + cb.SANITATION.percent_resolved + '%)';
    catGarbageProgress.style.width = cb.SANITATION.percent_resolved + '%';
  }
  if (catRoadsCount) {
    catRoadsCount.textContent = prefix + ' ' + cb.ROADS.resolved + '/' + cb.ROADS.count + ' (' + cb.ROADS.percent_resolved + '%)';
    catRoadsProgress.style.width = cb.ROADS.percent_resolved + '%';
  }
  if (catWaterCount) {
    catWaterCount.textContent = prefix + ' ' + cb.WATER_SEWER.resolved + '/' + cb.WATER_SEWER.count + ' (' + cb.WATER_SEWER.percent_resolved + '%)';
    catWaterProgress.style.width = cb.WATER_SEWER.percent_resolved + '%';
  }
  if (catElectricCount) {
    catElectricCount.textContent = prefix + ' ' + cb.ELECTRICAL.resolved + '/' + cb.ELECTRICAL.count + ' (' + cb.ELECTRICAL.percent_resolved + '%)';
    catElectricProgress.style.width = cb.ELECTRICAL.percent_resolved + '%';
  }
  if (catHealthCount) {
    catHealthCount.textContent = prefix + ' ' + cb.HEALTH.resolved + '/' + cb.HEALTH.count + ' (' + cb.HEALTH.percent_resolved + '%)';
    catHealthProgress.style.width = cb.HEALTH.percent_resolved + '%';
  }
}

// Render Table Rows with User Problem Highlighting & Locality Grouping
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
      ? '<span class="duplicate-pill single">' + dupPillText + '</span>'
      : '<span class="duplicate-pill" title="' + dupPillText + '">' + dupPillText + '</span>';

    const userBadgeTag = inc.id === userTrackingIncidentId
      ? '<span class="user-row-badge">' + escapeHtml(d.yourComplaintBadge || '⭐ Your Complaint') + '</span>'
      : '';

    tr.innerHTML = `
      <td><span class="badge ${badgeClass}">${dotHtml} ${escapeHtml(priorityLabel)}</span></td>
      <td>
        <span class="incident-id-tag">${inc.id}</span>
        ${userBadgeTag}
        ${inc.is_escalated && inc.status !== 'RESOLVED' ? '<span title="Escalated" style="font-size:0.75rem;">🚨</span>' : ''}
      </td>
      <td>
        <div class="incident-headline">${escapeHtml(headlineText)}</div>
        <div class="incident-rationale">${escapeHtml(rationaleText)}</div>
      </td>
      <td><span class="badge badge-dept">${escapeHtml(deptLabel)}</span></td>
      <td>
        <div class="location-cell">
          <span class="location-landmark">${escapeHtml(localityText)}, ${escapeHtml(cityText)}</span>
          <span class="location-meta">${escapeHtml(wardText)}</span>
        </div>
      </td>
      <td>
        <span class="sla-pill ${slaPillClass}">${slaPillIcon} ${escapeHtml(slaText)}</span>
      </td>
      <td style="text-align: center;">${dupPill}</td>
      <td><span class="badge badge-status">${escapeHtml(statusLabel)}</span></td>
      <td style="text-align: right;">
        <button class="btn btn-primary" style="padding: 5px 12px; font-size: 0.78rem;" onclick="event.stopPropagation(); openDetailDrawer('${inc.id}')">
          ${escapeHtml(viewBtnText)} &rarr;
        </button>
      </td>
    `;

    tr.addEventListener('click', () => openDetailDrawer(inc.id));
    incidentsTableBody.appendChild(tr);
  });
}

// Drawer: Open Incident Details
async function openDetailDrawer(incidentId) {
  try {
    activeIncidentId = incidentId;
    const res = await fetch('/api/incidents/' + incidentId);
    if (!res.ok) throw new Error('Failed to load incident detail');

    const data = await res.json();
    const inc = data.incident;
    const auditLogs = data.audit_logs || [];
    const d = I18N[currentLanguage] || I18N.en;

    drawerIncidentId.textContent = inc.id;

    drawerPriorityBadge.textContent = getPriorityLabel(inc.priority, currentLanguage);
    drawerPriorityBadge.className = 'badge ' + (inc.priority === 'CRITICAL' ? 'badge-critical' : inc.priority === 'HIGH' ? 'badge-high' : 'badge-medium');

    drawerDeptBadge.textContent = getDepartmentLabel(inc.department, currentLanguage);

    drawerHeadline.textContent = getHeadlineLabel(inc.headline, currentLanguage);
    drawerTriageReason.textContent = getUrgencyReasonLabel(inc.urgency_reason, currentLanguage);

    const localityText = getLocalityLabel(inc.locality, currentLanguage);
    const cityText = getCityLabel(inc.city, currentLanguage);
    drawerResolvedAddress.textContent = (inc.location_display || localityText) + ', ' + cityText;
    drawerWardTag.textContent = getWardLabel(inc.ward, currentLanguage);
    drawerMapCoordinates.textContent = inc.latitude && inc.longitude ? inc.latitude.toFixed(4) + ', ' + inc.longitude.toFixed(4) : '';

    initOrUpdateLeafletMap(inc.latitude || 12.9250, inc.longitude || 77.5938, inc.headline);

    // Merged Complaints
    const complaints = inc.complaints || [];
    drawerDuplicateCount.textContent = complaints.length + ' ' + (d.mergedReportsCount || 'complaints grouped');
    drawerDuplicatesList.innerHTML = '';
    complaints.forEach((c, idx) => {
      const item = document.createElement('div');
      item.className = 'duplicate-item';
      item.innerHTML = `
        <div class="duplicate-item-top">
          <span class="duplicate-item-user">👤 ${escapeHtml(c.citizen_name || 'Resident')}</span>
          <span class="duplicate-item-time">${escapeHtml(c.source_channel || 'Citizen Portal')} • ${formatTimeAgo(c.created_at)}</span>
        </div>
        <div class="duplicate-item-text">"${escapeHtml(c.raw_text)}"</div>
      `;
      drawerDuplicatesList.appendChild(item);
    });

    // SLA Countdown & Escalation
    const sla = inc.sla_info || {};
    const slaRemaining = getSlaDisplayText(inc, currentLanguage);
    drawerSlaCountdown.textContent = slaRemaining;

    drawerSlaTargetRule.textContent = (sla.target_hours || 48) + ' ' + (d.hoursWord || 'hours');
    drawerSlaDeadline.textContent = sla.deadline_formatted || 'Within 48h';

    if (inc.status === 'RESOLVED') {
      drawerSlaStatusBadge.textContent = d.statuses.RESOLVED || 'Resolved';
      drawerSlaStatusBadge.className = 'badge badge-low';
      drawerEscalationWarning.classList.add('hidden');
      drawerEscalateBtn.classList.add('hidden');
    } else if (sla.is_breached || inc.is_escalated) {
      drawerSlaStatusBadge.textContent = inc.is_escalated ? (d.slaEscalatedBadge || '🚨 Escalated to Commissioner') : (d.slaBreachedBadge || '🔴 Breached');
      drawerSlaStatusBadge.className = 'badge badge-critical';
      drawerEscalationWarning.classList.remove('hidden');
      drawerEscalateBtn.classList.remove('hidden');
    } else {
      drawerSlaStatusBadge.textContent = d.slaOnTrackBadge || '🟢 On Track';
      drawerSlaStatusBadge.className = 'badge badge-low';
      drawerEscalationWarning.classList.add('hidden');
      drawerEscalateBtn.classList.remove('hidden');
    }

    // Set Routing form values
    if (inc.assigned_officer && inc.assigned_officer !== 'Unassigned') {
      const matched = Array.from(routeOfficerSelect.options).find(o => o.value.includes(inc.assigned_officer));
      if (matched) routeOfficerSelect.value = matched.value;
      routeOfficerPhone.textContent = inc.assigned_officer_phone || 'N/A';
    } else {
      routeOfficerSelect.value = 'Unassigned';
      routeOfficerPhone.textContent = 'None';
    }
    routeStatusSelect.value = inc.status;

    // Render Activity Audit Logs
    renderAuditTimeline(auditLogs);

    // Open Drawer
    drawerOverlay.classList.remove('hidden');
    incidentDrawer.classList.remove('hidden');
    document.body.style.overflow = 'hidden';

  } catch (err) {
    console.error('Error opening drawer:', err);
    showToast('Failed to open problem details');
  }
}

// Activity Audit Log
function renderAuditTimeline(logs) {
  drawerAuditTimeline.innerHTML = '';
  if (!logs || logs.length === 0) {
    drawerAuditTimeline.innerHTML = '<div style="color:#94A3B8; font-size:0.8rem;">No activity recorded yet.</div>';
    return;
  }

  logs.forEach(log => {
    const item = document.createElement('div');
    item.className = 'timeline-item';
    item.innerHTML = `
      <div class="timeline-dot"></div>
      <div class="timeline-content">
        <div class="timeline-title">${escapeHtml(log.action)}</div>
        <div class="timeline-meta">${escapeHtml(log.actor)} • ${formatTimeAgo(log.created_at)}</div>
        <div class="timeline-detail">${escapeHtml(log.details || '')}</div>
      </div>
    `;
    drawerAuditTimeline.appendChild(item);
  });
}

function closeDetailDrawer() {
  incidentDrawer.classList.add('hidden');
  drawerOverlay.classList.add('hidden');
  document.body.style.overflow = '';
  stopSpeechSynthesis();
}

// Leaflet Map
function initOrUpdateLeafletMap(lat, lng, title) {
  const mapContainer = document.getElementById('drawerLeafletMap');
  if (!mapContainer || typeof L === 'undefined') return;

  if (!leafletMapInstance) {
    leafletMapInstance = L.map('drawerLeafletMap', { zoomControl: true }).setView([lat, lng], 14);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '&copy; OpenStreetMap'
    }).addTo(leafletMapInstance);
  } else {
    leafletMapInstance.setView([lat, lng], 14);
    if (currentMarker) leafletMapInstance.removeLayer(currentMarker);
  }

  currentMarker = L.marker([lat, lng]).addTo(leafletMapInstance);
  currentMarker.bindPopup('<b>' + escapeHtml(title) + '</b>').openPopup();

  setTimeout(() => {
    if (leafletMapInstance) leafletMapInstance.invalidateSize();
  }, 250);
}

// Read Aloud Triage Rationale
voiceTriageBtn.addEventListener('click', () => {
  if (speechSynth.speaking) {
    stopSpeechSynthesis();
    return;
  }
  const text = drawerHeadline.textContent + '. ' + drawerTriageReason.textContent;
  speakText(text);
});

function speakText(text) {
  if (!speechSynth) return;
  stopSpeechSynthesis();

  currentUtterance = new SpeechSynthesisUtterance(text);
  const d = I18N[currentLanguage] || I18N.en;
  currentUtterance.lang = d.speechLang || 'en-US';
  currentUtterance.rate = 0.95;

  voiceTriageBtn.textContent = '⏹️ Stop Voice';
  currentUtterance.onend = () => {
    voiceTriageBtn.textContent = '🔊 Read Aloud';
  };
  currentUtterance.onerror = () => {
    voiceTriageBtn.textContent = '🔊 Read Aloud';
  };

  speechSynth.speak(currentUtterance);
}

function stopSpeechSynthesis() {
  if (speechSynth && speechSynth.speaking) {
    speechSynth.cancel();
  }
  if (voiceTriageBtn) voiceTriageBtn.textContent = '🔊 Read Aloud';
}

// Escalate to Commissioner
drawerEscalateBtn.addEventListener('click', async () => {
  if (!activeIncidentId) return;
  const d = I18N[currentLanguage] || I18N.en;
  drawerEscalateBtn.disabled = true;
  drawerEscalateBtn.textContent = d.escalatingText || 'Escalating...';

  try {
    const res = await fetch('/api/incidents/' + activeIncidentId + '/escalate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reason: 'Citizen / Ward Engineer Requested Fast-Track Escalation' })
    });

    if (!res.ok) throw new Error('Escalation failed');
    showToast('🚨 Problem escalated to Municipal Commissioner! Priority boosted.');
    await fetchIncidents();
    await openDetailDrawer(activeIncidentId);
  } catch (err) {
    showToast('Error: ' + err.message);
  } finally {
    drawerEscalateBtn.disabled = false;
    drawerEscalateBtn.textContent = d.fastTrackEscalateBtn || '⚡ Fast-Track Escalate to Commissioner →';
  }
});

// Officer Selection Phone Sync
routeOfficerSelect.addEventListener('change', () => {
  const selected = routeOfficerSelect.options[routeOfficerSelect.selectedIndex];
  routeOfficerPhone.textContent = selected.dataset.phone || 'None';
});

// Save Officer Routing and Status Update
routingOfficerForm.addEventListener('submit', async (e) => {
  e.preventDefault();
  if (!activeIncidentId) return;

  const d = I18N[currentLanguage] || I18N.en;
  saveRoutingBtn.disabled = true;
  saveRoutingBtn.textContent = d.updatingText || 'Updating...';

  const assignedOfficer = routeOfficerSelect.value;
  const selectedOpt = routeOfficerSelect.options[routeOfficerSelect.selectedIndex];
  const assignedPhone = selectedOpt.dataset.phone || '';
  const status = routeStatusSelect.value;
  const note = routeNoteInput.value.trim();

  try {
    const res = await fetch('/api/incidents/' + activeIncidentId + '/status', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        status,
        assigned_officer: assignedOfficer,
        assigned_officer_phone: assignedPhone,
        officer_note: note
      })
    });

    if (!res.ok) throw new Error('Failed to update routing');
    showToast('✅ Problem routing and status updated successfully!');
    routeNoteInput.value = '';

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
  inlineSubmitComplaintBtn.innerHTML = '<span>' + (d.submittingBtn || 'Submitting & Triaging...') + '</span>';

  try {
    const res = await fetch('/api/complaints', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ text, citizen_name: citizenName, city, locality, source })
    });

    if (!res.ok) throw new Error('Submission failed');
    const result = await res.json();

    inlineComplaintTextInput.value = '';
    inlineCitizenNameInput.value = '';

    const newIncidentId = result.data.clusterId;
    const newLocality = result.data.locality || locality;

    // Save as citizen's tracking target
    userTrackingIncidentId = newIncidentId;
    userTrackingLocality = newLocality;

    const dupMsg = result.data.isDuplicate 
      ? 'Merged into existing problem cluster ' + newIncidentId + ' in ' + newLocality + '!' 
      : 'New civic issue ' + newIncidentId + ' registered in ' + newLocality + '!';
    
    showToast('📢 Complaint filed! Classified as [' + result.data.priority + '] ' + result.data.department + '. ' + dupMsg);
    
    if (cityFilter.value !== 'ALL' && cityFilter.value !== city) {
      cityFilter.value = city;
      updateLocalityDropdown(city, localityFilter, true);
    }
    
    // Refresh table and live tracking
    await fetchIncidents();
    lookupComplaintTracking(newIncidentId);

    // Prompt user to view on separate dashboard
    setTimeout(() => {
      openComplaintOnDashboard();
    }, 1200);

  } catch (err) {
    showToast('Error: ' + err.message);
  } finally {
    inlineSubmitComplaintBtn.disabled = false;
    inlineSubmitComplaintBtn.innerHTML = '<span class="btn-megaphone-icon">📢</span><span>' + I18N[currentLanguage].submitComplaintBtn + '</span>';
  }
});

// Setup Event Listeners
function setupEventListeners() {
  cityFilter.addEventListener('change', () => {
    updateLocalityDropdown(cityFilter.value, localityFilter, true);
    fetchOfficers(cityFilter.value, deptFilter.value);
    fetchIncidents();
  });
  localityFilter.addEventListener('change', fetchIncidents);
  priorityFilter.addEventListener('change', fetchIncidents);
  deptFilter.addEventListener('change', () => {
    fetchOfficers(cityFilter.value, deptFilter.value);
    fetchIncidents();
  });

  inlineCitySelect.addEventListener('change', () => {
    updateLocalityDropdown(inlineCitySelect.value, inlineLocalitySelect, false);
  });

  let searchTimeout = null;
  searchInput.addEventListener('input', () => {
    clearTimeout(searchTimeout);
    searchTimeout = setTimeout(fetchIncidents, 250);
  });

  const resetAll = () => {
    searchInput.value = '';
    cityFilter.value = 'ALL';
    updateLocalityDropdown('ALL', localityFilter, true);
    priorityFilter.value = 'ALL';
    deptFilter.value = 'ALL';
    fetchOfficers();
    fetchIncidents();
  };

  resetFiltersBtn.addEventListener('click', resetAll);
  emptyResetBtn.addEventListener('click', resetAll);

  closeDrawerBtn.addEventListener('click', closeDetailDrawer);
  drawerOverlay.addEventListener('click', closeDetailDrawer);

  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape' && !incidentDrawer.classList.contains('hidden')) {
      closeDetailDrawer();
    }
  });
}

// Utility: Show Toast
function showToast(msg) {
  toast.textContent = msg;
  toast.classList.remove('hidden');
  setTimeout(() => {
    toast.classList.add('hidden');
  }, 4500);
}

// Utility: Time Ago Formatter
function formatTimeAgo(dateStr) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diffSec = Math.floor((now - date) / 1000);
  if (diffSec < 60) return 'just now';
  const diffMin = Math.floor(diffSec / 60);
  if (diffMin < 60) return diffMin + 'm ago';
  const diffHours = Math.floor(diffMin / 60);
  if (diffHours < 24) return diffHours + 'h ago';
  const diffDays = Math.floor(diffHours / 24);
  return diffDays + 'd ago';
}

// Utility: HTML Escaping
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
`;

fs.writeFileSync(appJsPath, appCode, 'utf8');
console.log('Successfully generated complete public/js/app.js!');
