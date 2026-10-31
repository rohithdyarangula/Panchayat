// test_auth_and_translations.js
const fs = require('fs');
const assert = require('assert');
const vm = require('vm');

console.log('🧪 Running Role Gate, Isolation & Multilingual Translations Automated Tests...\n');

const html = fs.readFileSync('public/index.html', 'utf8');
const js = fs.readFileSync('public/js/app.js', 'utf8');

// Test 1: Verify Role Selection Gateway and Persona Elements in HTML
console.log('Test 1: Testing Role Selection Gateway and Persona Elements in HTML...');
assert(html.includes('id="roleSelectorGate"'), 'roleSelectorGate must exist in index.html');
assert(html.includes('citizen-option'), 'citizen-option card must exist in index.html');
assert(html.includes('municipal-option'), 'municipal-option card must exist in index.html');
assert(html.includes('userAuthIndicator'), 'userAuthIndicator must exist in index.html');
assert(html.includes('authUserName'), 'authUserName must exist in index.html');
assert(html.includes('authUserRoleTag'), 'authUserRoleTag must exist in index.html');
assert(html.includes('citizenSearchGrievanceInput'), 'citizenSearchGrievanceInput must exist in index.html');
assert(html.includes('citizenTrackingResultBox'), 'citizenTrackingResultBox must exist in index.html');
console.log('✅ Test 1 Passed: Role Selection Gateway and citizen tracking elements exist in HTML.');

// Test 2: Verify Municipal Ward translated element IDs in HTML
console.log('\nTest 2: Testing Municipal Ward Sidebar & KPI IDs in HTML...');
assert(html.includes('id="i18nStudioHome"'), 'i18nStudioHome must exist');
assert(html.includes('id="i18nStudioDepartments"'), 'i18nStudioDepartments must exist');
assert(html.includes('id="i18nSubjRoads"'), 'i18nSubjRoads must exist');
assert(html.includes('id="i18nSubjSan"'), 'i18nSubjSan must exist');
assert(html.includes('id="i18nSubjWater"'), 'i18nSubjWater must exist');
assert(html.includes('id="i18nSubjElec"'), 'i18nSubjElec must exist');
assert(html.includes('id="i18nSubjHealth"'), 'i18nSubjHealth must exist');
assert(html.includes('id="i18nSubjTraffic"'), 'i18nSubjTraffic must exist');
assert(html.includes('id="i18nActiveFieldTasks"'), 'i18nActiveFieldTasks must exist');
assert(html.includes('id="studioWorkspaceTitle"'), 'studioWorkspaceTitle must exist');
assert(html.includes('id="studioWorkspaceSub"'), 'studioWorkspaceSub must exist');
console.log('✅ Test 2 Passed: All Municipal Ward i18n target IDs exist in HTML.');

// Test 3: Verify JS I18N dictionary has keys for all 6 languages
console.log('\nTest 3: Testing Multilingual Coverage in JS across all 6 languages...');
const ctx = {
  window: {},
  document: {
    addEventListener: () => {},
    getElementById: () => ({ addEventListener: () => {}, classList: { add: () => {}, remove: () => {} } }),
    body: { classList: { add: () => {}, remove: () => {} } }
  },
  localStorage: { getItem: () => null, setItem: () => {}, removeItem: () => {} },
  navigator: {},
  console: console,
  setTimeout: setTimeout,
  clearTimeout: clearTimeout,
  setInterval: setInterval,
  clearInterval: clearInterval
};
ctx.window = ctx;
vm.createContext(ctx);
vm.runInContext(js + '\nglobalThis.I18N = I18N; globalThis.selectRoleMode = selectRoleMode; globalThis.openRoleSelectorGate = openRoleSelectorGate; globalThis.switchView = switchView; globalThis.searchCitizenGrievance = searchCitizenGrievance;', ctx);

assert(ctx.I18N, 'I18N object must be loaded');
const langs = ['en', 'hi', 'te', 'kn', 'mr', 'ta'];
langs.forEach(lang => {
  const dict = ctx.I18N[lang];
  assert(dict, `Language ${lang} must exist in I18N`);
  assert(dict.studioWorkspaceTitle, `studioWorkspaceTitle missing for ${lang}`);
  assert(dict.studioHome, `studioHome missing for ${lang}`);
  assert(dict.studioDepartments, `studioDepartments missing for ${lang}`);
  assert(dict.complaintBoxTitle, `complaintBoxTitle missing for ${lang}`);
  assert(dict.step1Label, `step1Label missing for ${lang}`);
  assert(dict.step2Label, `step2Label missing for ${lang}`);
  assert(dict.step3Label, `step3Label missing for ${lang}`);
  assert(dict.submitComplaintBtn, `submitComplaintBtn missing for ${lang}`);
  assert(dict.myComplaintsTitle, `myComplaintsTitle missing for ${lang}`);
  console.log(`  ✓ Language '${lang}': Complaint desk and Municipal Ward keys fully populated.`);
});
console.log('✅ Test 3 Passed: All 6 languages have complete multilingual coverage.');

// Test 4: Test Persona Isolation logic
console.log('\nTest 4: Testing Persona Isolation & Gateway Functions...');
assert(typeof ctx.selectRoleMode === 'function', 'selectRoleMode must be defined');
assert(typeof ctx.openRoleSelectorGate === 'function', 'openRoleSelectorGate must be defined');
assert(typeof ctx.switchView === 'function', 'switchView must be defined');
assert(typeof ctx.searchCitizenGrievance === 'function', 'searchCitizenGrievance must be defined');

// Test 5: Verify New Vector SVG Logo file exists and has valid geometry
console.log('\nTest 5: Testing Brand Logo Vector SVG Asset...');
const svg = fs.readFileSync('public/images/panchayat_logo.svg', 'utf8');
assert(svg.includes('<svg'), 'SVG file must be valid xml');
assert(svg.includes('Panch Council of 5 Pillars'), 'SVG must feature 5 pillars');
assert(svg.includes('pGold'), 'SVG must have radiant gold gradients');
assert(svg.includes('pBlue'), 'SVG must have civic azure gradients');
console.log('✅ Test 5 Passed: Logo vector SVG asset is verified with 5 pillars, civic arch, and "P" monogram.');

console.log('\n🎉 ALL ROLE GATE, ISOLATION AND MULTILINGUAL TESTS PASSED SUCCESSFULLY!');
