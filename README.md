# SENTRIQ: Safety AI for Fatality Elimination

> **SIH 2026 – Problem Statement 26165 – Oil India Limited**  
> *AI/NLP-based SIF (Serious Injury & Fatality) Precursor Intelligence Platform for Oil & Gas HSE Operations*

---

## 1. Project Overview

**Sentriq** transforms unstructured, qualitative frontline safety reports, near-miss observations, and audit narratives into explainable, proactive SIF (Serious Injury & Fatality) risk intelligence.

In high-hazard upstream oil and gas operations (drilling rigs, workover installations, production manifolds), catastrophic incidents are consistently preceded by low-severity or near-miss observations that contained **unrecognized high-energy potential and degraded barrier defenses**.

Sentriq bridges the gap between field observations and proactive barrier management:

```
UNSTRUCTURED SAFETY REPORT
        ↓
AI/NLP ANALYSIS
        ↓
SIF PRECURSOR DETECTION
        ↓
IOGP LIFE-SAVING RULE MAPPING
        ↓
FAILED BARRIER IDENTIFICATION
        ↓
EXPLAINABLE AI (XAI)
        ↓
BOWTIE "WHAT COULD HAPPEN?"
        ↓
RISK HEATMAP
        ↓
WORKER SAFETY BRIEFING
        ↓
CROSS-RIG FLEET IMMUNITY ALERT
```

> **Central Motto:** *"From unstructured safety reports to explainable, proactive SIF risk intelligence."*

---

## 2. System Architecture

```
                ┌──────────────────────────┐
                │ Worker / HSE Officer     │
                │ Text / Voice / Web       │
                └────────────┬─────────────┘
                             ↓
                ┌──────────────────────────┐
                │ Report Ingestion Layer   │
                └────────────┬─────────────┘
                             ↓
                ┌──────────────────────────┐
                │ Sentriq AI/NLP Engine    │
                │ SIF + IOGP + NER         │
                └────────────┬─────────────┘
                             ↓
        ┌────────────────────┼────────────────────┐
        ↓                    ↓                    ↓
      XAI                 Bowtie             Pattern Mining
  (SHAP-style)       (Threat-Consequence)     (Swarm Vector)
        ↓                    ↓                    ↓
        └────────────────────┼────────────────────┘
                             ↓
                ┌──────────────────────────┐
                │ HSE Intelligence Layer   │
                └────────────┬─────────────┘
                             ↓
        ┌────────────────────┼────────────────────┐
        ↓                    ↓                    ↓
    Dashboard          Worker Cards        Fleet Immunity
  (Spatial Heatmap)    (Multilingual)        (Cross-Site)
        ↓                    ↓                    ↓
       HSE              Frontline            Cross-Site
      Action             Safety              Alerts
```

---

## 3. Key Capabilities

1. **Unstructured Narrative Ingestion**:
   - Supports free-text safety reports, near misses, unsafe acts, and unsafe conditions.
   - Batch CSV file ingestion for historical audits.
   - Frontline Worker Voice Input supporting English, Hindi (हिन्दी), and Assamese (অসমীয়া) dialect normalization into structured HSE records.

2. **SIF Precursor Classification**:
   - Determines SIF Potential (`YES` / `NO` / `POTENTIAL`) and Risk Level (`CRITICAL`, `HIGH`, `MEDIUM`, `LOW`).
   - Grounded in high-energy release mechanisms (pressure, gravity, electrical, toxic gas, ignition sources).

3. **IOGP 9 Life-Saving Rules Mapping**:
   - Standardized mapping to IOGP Report 459 (Energy Isolation, Bypassing Safety Controls, Confined Space, Line of Fire, Working at Height, Hot Work, Safe Mechanical Lifting, Driving, Work Authorization).

4. **Triad Barrier Breakdown**:
   - Classifies defense failures into **Hardware/Engineered**, **Procedural/Permit**, and **Human/Administrative** controls.

5. **Explainable AI (XAI)**:
   - SHAP-style visual phrase attribution highlighting Critical Triggers (Red), Risk Context (Orange), and Operational Context (Blue) directly on the original narrative.

6. **Interactive Bowtie Simulator**:
   - Synthesizes Threats → Preventive Barriers → Top Event → Mitigating Barriers → Consequences.
   - Dynamic *"What Could Happen?"* scenario synthesis and *"How to Break the Chain"* preventive interventions.
   - Interactive barrier toggling for "what-if" risk mitigation modeling.

7. **Multilingual Visual Toolbox Cards**:
   - Instant visual safety briefing cards formatted for frontline pre-shift toolbox talks.
   - English, Hindi, and Assamese translations with audio read-aloud support and PDF/text download.

8. **Cross-Rig Fleet Immunity Swarm**:
   - Searches active rig fleet operations across Duliajan, Digboi, Moran, Rajasthan, and Jorhat fields for similar operations and broadcasts precautionary warnings before repeat occurrences.

9. **Conditional Human-in-the-Loop Safety Gate**:
   - Strict governance: AI acts solely as decision support.
   - Automated Stop-Work recommendations await authorized human HSE supervisor verification.
   - Integrated CAPA (Corrective and Preventive Action) generator.

---

## 4. Technology Stack

- **Frontend**: React 19, TypeScript, Tailwind CSS v4, Lucide React, Recharts.
- **Backend**: Node.js, Express, TypeScript (`tsx`).
- **AI Models**: Google GenAI SDK (`@google/genai`) using `gemini-3.8-flash` with deterministic rule-based NLP fallback engine (Demo Mode).
- **Data**: In-memory repository with 60+ realistic synthetic Oil & Gas safety reports. Designed for seamless plug-in to PostgreSQL + `pgvector`.

---

## 5. Setup & Running Instructions

### Prerequisites
- Node.js 20+
- npm or yarn

### Installation
```bash
# Clone the repository
git clone https://github.com/your-org/sentriq.git
cd sentriq

# Install dependencies
npm install

# Start development server (serves Express backend and Vite frontend on port 3000)
npm run dev
```

The application runs on `http://localhost:3000`.

### Building for Production
```bash
npm run build
npm start
```

---

## 6. Environment Variables

Create a `.env` file in the root directory:

```env
# Optional: GEMINI_API_KEY enables live Gemini 3.8 Flash analysis.
# If omitted or empty, SENTRIQ operates automatically in high-fidelity DEMO MODE!
GEMINI_API_KEY=""

# Port configuration (default: 3000)
PORT=3000
```

---

## 7. Demo Mode & Signature Scenario

SENTRIQ is 100% usable without external API keys in **DEMO MODE**. Click the **[ ▶ Run Live Demo ]** button in the top navigation bar to launch the guided 10-step signature judging scenario:

> **Preloaded Scenario:**  
> *"During hot work in Zone 3, the gas detector was offline and the crew started work before LOTO verification. Supervisor was informed but work continued."*

**Expected Analysis:**
- **SIF Potential:** YES (CRITICAL RISK)
- **Primary IOGP Rule:** Energy Isolation
- **Secondary Rule:** Bypassing Safety Controls
- **Failed Barriers:** Stationary LEL gas detector offline (Hardware), LOTO verification omitted (Procedural), Supervisor allowed continuation (Human)
- **Top Event:** Loss of Containment & Uncontrolled Ignition in Hazardous Zone
- **Consequence:** Flash fire & vapor cloud explosion (VCE), multiple fatalities

---

## 8. REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | System status and Gemini connection state |
| `GET` | `/api/dashboard/summary` | Executive KPIs, 7-day trend, and barrier distributions |
| `GET` | `/api/reports` | Search and filter safety reports repository |
| `GET` | `/api/reports/:id` | Fetch detailed report dossier |
| `POST` | `/api/reports/analyze` | Ingest and analyze unstructured narrative |
| `POST` | `/api/reports/:id/verify`| Authorize or downgrade HSE Stop-Work recommendation |
| `POST` | `/api/bowtie/generate` | Generate dynamic Bowtie risk model |
| `POST` | `/api/cards/generate` | Generate multilingual worker safety card |
| `POST` | `/api/capa/generate` | Generate automated CAPA record |
| `GET` | `/api/fleet/similar` | Cross-rig similarity swarm search |
| `POST` | `/api/fleet/alert` | Transmit fleet immunity alert to sister assets |
| `POST` | `/api/voice/transcribe`| Normalize Hindi/Assamese/English worker voice memos |

---

## 9. Safety & Governance Notice

> **IMPORTANT DISCLAIMER:**  
> This application is a hackathon prototype developed for Smart India Hackathon 2026 (Problem Statement 26165 for Oil India Limited).  
> All operational reports, rig telemetry, and asset data are **synthetic/simulated demonstrations**. The platform provides decision-support risk intelligence and is **not connected to live Oil India Limited SCADA, DCS, or emergency shutdown physical actuators**.
