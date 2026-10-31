# PANCHAYAT — Civic Intelligence & SLA Escalation Platform

> **Automated AI Civic Grievance Triage, Statutory SLA Countdown Timers & Municipal Resolution Proof Platform**  
> Solves the municipal bottleneck: replaces manual ticket reading and classification with real-time AI triage, deduplication clustering, role-separated workspaces (Citizen Portal vs Municipal Wards), and photo-verified task resolution.

---

## 🌟 Key Features Across Phases 1 to 3

### 1. 👥 Welcome Persona Selection Gate & Role Separation
* **Choice at the Start**:
  - **Citizen / Resident Portal**: File grievances, track registered complaint status, inspect completion photo proof from municipal crew, and view complaint history.
  - **Municipal Ward Officer Portal**: Access incoming triaged queue, filter by department (`ELECTRICAL`, `ROADS`, `SANITATION`, `WATER_SEWER`, `HEALTH`), dispatch crews, monitor 12h/24h SLAs, and upload resolution photo proof.
* **Header Role Switcher Pill**: Quick 1-click toggle `[ 👤 Citizen / User ] ⇄ [ 🏛️ Municipal Wards ]`.

### 2. 📷 Evidence & Resolution Photo Proof Workflow
* **Citizen Evidence Attachment**: Photo upload and camera support when reporting civic grievances.
* **Municipal Task Completion & Photo Proof**:
  - When municipal staff completes work, they click `📷 Resolve & Proof` to upload the finished work photo (e.g. freshly paved road, repaired insulated wire, cleared dumpster, sealed pipe flange).
  - The photo proof is delivered directly to the reporting citizen's dashboard.
* **Before vs. After Photo Comparison**: Citizens can view side-by-side visual proof of work before verifying and providing a 5-star contractor rating.
* **⚠️ Dispute & Re-Open**: Citizens can dispute incomplete work to re-open the ticket.

### 3. 💬 Interactive WhatsApp Civic Bot Simulator
* Floating bottom-right widget (`💬 WhatsApp Bot ● Online`) simulating WhatsApp complaint intake.
* Automated real-time AI triage responses with Ticket ID, department assignment, and SLA window.

### 4. 🌐 Native Multi-Language Support
* 100% synchronized translations across **Telugu**, **Hindi**, **Kannada**, **Marathi**, **Tamil**, and **English**.
* Continuous native voice dictation with automatic speech-to-text.

---

## 🏗️ 8-File Project Architecture

```
panchayat/
├── server.js                     # 1. Backend HTTP Server & REST API Gateway (Node native HTTP & SQLite)
├── engine.js                     # 2. AI Civic Intelligence, Geocoding, Deduplication & SLA Core
├── public/
│   ├── index.html                # 3. Frontend UI (Role Gate, Citizen Portal, Municipal Queue, WhatsApp Bot)
│   ├── css/style.css             # 4. Human-Crafted Soft Typography & Dynamic UI Design System
│   ├── js/app.js                 # 5. Client Controller, 6-Lang I18N, Voice Mic Dictation, & Role Switcher
│   └── images/panchayat_logo.svg # 6. Minimal Aesthetic Panchayat Brand Logo Asset
├── package.json                  # 7. Node.js Configuration, Manifest & Test Scripts
└── README.md                     # 8. Project Documentation & Gemma 4 License
```

---

## 🚀 Quick Start

### 1. Run the Server
```bash
node server.js
```
Open **[http://127.0.0.1:3000](http://127.0.0.1:3000)** in your browser.

### 2. Run Automated Test Suites
```bash
node tests/test_auth_and_translations.js
node tests/test_ai_image_checker.js
node tests/test_role_and_resolution.js
```

---

## 📄 License & Gemma 4 Open Source Attribution

This project is licensed under the **Apache License, Version 2.0**:
* **License Reference**: [http://www.apache.org/licenses/](http://www.apache.org/licenses/)
* **Gemma 4 License & Open Model Terms**: This platform integrates open civic models and operates in full compliance with the Apache 2.0 open-source software license.

```
Copyright 2026 Panchayat Contributors

Licensed under the Apache License, Version 2.0 (the "License");
you may not use this file except in compliance with the License.
You may obtain a copy of the License at

    http://www.apache.org/licenses/LICENSE-2.0

Unless required by applicable law or agreed to in writing, software
distributed under the License is distributed on an "AS IS" BASIS,
WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
See the License for the specific language governing permissions and
limitations under the License.
```
