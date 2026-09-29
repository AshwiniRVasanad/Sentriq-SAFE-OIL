import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { reportsRepo } from './src/data/reportsRepository';
import {
  analyzeReportWithAI,
  generateCAPAForReport,
  normalizeVoiceInput,
  isGeminiConnected,
  explainReport,
  generateRuleBasedBowtie,
  generateRuleBasedWorkerCard,
} from './src/services/aiService';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json({ limit: '10mb' }));

// Health & Status
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    appName: 'SENTRIQ',
    system: 'Safety Intelligence for Fatality Elimination',
    sihProblemStatement: 'SIH 2026 - Problem Statement 26165 - Oil India Limited',
    geminiConnected: isGeminiConnected(),
    environment: 'Demo & Prototyping Environment',
    timestamp: new Date().toISOString(),
  });
});

// Dashboard Summary KPIs & Trends
app.get('/api/dashboard/summary', (req, res) => {
  try {
    const summary = reportsRepo.getDashboardSummary();
    res.json(summary);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch summary' });
  }
});

// Reports - List & Filter
app.get('/api/reports', (req, res) => {
  try {
    let reports = reportsRepo.getAll();
    const { site, rig, sif, risk, iogp, search } = req.query;

    if (site) {
      reports = reports.filter((r) => r.site.toLowerCase().includes(String(site).toLowerCase()));
    }
    if (rig) {
      reports = reports.filter((r) => r.rig_id.toLowerCase().includes(String(rig).toLowerCase()));
    }
    if (sif) {
      reports = reports.filter((r) => r.sif_potential === String(sif));
    }
    if (risk) {
      reports = reports.filter((r) => r.risk_level === String(risk));
    }
    if (iogp) {
      reports = reports.filter(
        (r) =>
          r.iogp_primary.toLowerCase().includes(String(iogp).toLowerCase()) ||
          (r.iogp_secondary && r.iogp_secondary.toLowerCase().includes(String(iogp).toLowerCase()))
      );
    }
    if (search) {
      const q = String(search).toLowerCase();
      reports = reports.filter(
        (r) =>
          r.raw_text.toLowerCase().includes(q) ||
          r.report_id.toLowerCase().includes(q) ||
          r.equipment.toLowerCase().includes(q) ||
          r.energy_source.toLowerCase().includes(q)
      );
    }

    res.json(reports);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to fetch reports' });
  }
});

// Report - Get by ID
app.get('/api/reports/:id', (req, res) => {
  const report = reportsRepo.getById(req.params.id);
  if (!report) {
    return res.status(404).json({ error: 'Report not found' });
  }
  res.json(report);
});

// Report - Ingest & Analyze
app.post('/api/reports/analyze', async (req, res) => {
  try {
    const { raw_text, site, rig_id, location, activity, report_type, reporter_type } = req.body;
    if (!raw_text || typeof raw_text !== 'string' || !raw_text.trim()) {
      return res.status(400).json({ error: 'raw_text is required' });
    }

    const analyzed = await analyzeReportWithAI(raw_text, {
      site,
      rig_id,
      location,
      activity,
      report_type,
      reporter_type,
    });

    res.json(analyzed);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Analysis failed' });
  }
});

// Batch CSV Ingestion
app.post('/api/reports/batch', async (req, res) => {
  try {
    const { reports } = req.body;
    if (!Array.isArray(reports)) {
      return res.status(400).json({ error: 'Expected array of reports' });
    }

    const ingested: any[] = [];
    for (const item of reports) {
      if (item.raw_text) {
        const analyzed = await analyzeReportWithAI(item.raw_text, {
          site: item.site,
          rig_id: item.rig_id,
          location: item.location,
          activity: item.activity,
          report_type: item.report_type,
          reporter_type: item.reporter_type,
        });
        ingested.push(analyzed);
      }
    }

    res.json({ count: ingested.length, reports: ingested });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Batch upload failed' });
  }
});

// Human-in-the-Loop Safety Gate: Approve / Verify / Decline Stop-Work
app.post('/api/reports/:id/verify', (req, res) => {
  try {
    const { status, action } = req.body;
    const report = reportsRepo.getById(req.params.id);
    if (!report) {
      return res.status(404).json({ error: 'Report not found' });
    }

    const updated = reportsRepo.updateStatus(
      req.params.id,
      status || 'VERIFIED',
      action === 'approve'
        ? 'Approved'
        : action === 'decline'
        ? 'Declined'
        : 'Awaiting authorized HSE verification'
    );

    res.json(updated);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Verification update failed' });
  }
});

// Bowtie Generator
app.post('/api/bowtie/generate', (req, res) => {
  try {
    const { raw_text, iogp_primary, energy_source } = req.body;
    const bowtie = generateRuleBasedBowtie(
      raw_text || '',
      iogp_primary || 'Energy Isolation',
      energy_source || 'Pressurized Hydrocarbon'
    );
    res.json(bowtie);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Bowtie generation failed' });
  }
});

// Worker Card Generator
app.post('/api/cards/generate', (req, res) => {
  try {
    const { raw_text, iogp_primary, hazard, risk } = req.body;
    const card = generateRuleBasedWorkerCard(
      raw_text || '',
      iogp_primary || 'Energy Isolation',
      hazard || 'Hazardous Energy',
      risk || 'CRITICAL'
    );
    res.json(card);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Card generation failed' });
  }
});

// CAPA Generator
app.post('/api/capa/generate', (req, res) => {
  try {
    const { report_id } = req.body;
    let report = reportsRepo.getById(report_id);
    if (!report) {
      report = reportsRepo.getAll()[0];
    }
    const capa = generateCAPAForReport(report);
    res.json(capa);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'CAPA generation failed' });
  }
});

// CAPA list
app.get('/api/capas', (req, res) => {
  res.json(reportsRepo.getCapas());
});

// Risk Heatmap Data
app.get('/api/heatmap', (req, res) => {
  try {
    const reports = reportsRepo.getAll();
    const assets = [
      {
        site: 'Duliajan Field',
        zone: 'Upper Assam Basin',
        rigs: ['Rig OIL-14', 'Rig OIL-02', 'Workover Unit-08'],
        sifDensity: 'HIGH',
        activeHazards: ['Energy Isolation (Zone-3)', 'BOP Pressure Leaks', 'Scaffolding Guardrails'],
        sifRatio: 42,
        totalObservations: 412,
        activeAlerts: 4,
      },
      {
        site: 'Digboi Field',
        zone: 'Heritage Digboi Structure',
        rigs: ['Rig OIL-21', 'Rig OIL-11'],
        sifDensity: 'HIGH',
        activeHazards: ['Monkey Board 100% Tie-Off', 'Rotary Table Red-Zone', 'Forklift Blindspots'],
        sifRatio: 38,
        totalObservations: 295,
        activeAlerts: 3,
      },
      {
        site: 'Moran Field',
        zone: 'Moran Structural High',
        rigs: ['Rig OIL-07', 'Rig OIL-19'],
        sifDensity: 'CRITICAL',
        activeHazards: ['Mud Pump 4200 PSI Iron', 'Taped PVT Audio Alarms', 'Flare Pit Flash Ignitions'],
        sifRatio: 51,
        totalObservations: 340,
        activeAlerts: 5,
      },
      {
        site: 'Rajasthan Asset',
        zone: 'Jaisalmer / Baghewala Basin',
        rigs: ['Rig OIL-03', 'Rig OIL-05'],
        sifDensity: 'MEDIUM',
        activeHazards: ['H2S in Mud Cellars', 'Heavy Transport Speeding', 'Casing Winch Brakes'],
        sifRatio: 29,
        totalObservations: 148,
        activeAlerts: 2,
      },
      {
        site: 'Jorhat / Sibsagar',
        zone: 'South Bank Exploration Blocks',
        rigs: ['Rig OIL-09'],
        sifDensity: 'LOW',
        activeHazards: ['Excavation Shoring', 'Trip Hazard on Cable Trays'],
        sifRatio: 18,
        totalObservations: 53,
        activeAlerts: 1,
      },
    ];

    res.json(assets);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Heatmap query failed' });
  }
});

// Fleet Immunity Swarm Engine
app.get('/api/fleet/similar', (req, res) => {
  try {
    const { report_id, text, activity, equipment } = req.query;
    let queryReport: any = { raw_text: text, activity, equipment };
    if (report_id) {
      const existing = reportsRepo.getById(String(report_id));
      if (existing) queryReport = existing;
    }

    const matches = reportsRepo.findSimilarOperations(queryReport);
    res.json(matches);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Fleet search failed' });
  }
});

// Fleet Alert Broadcast
app.post('/api/fleet/alert', (req, res) => {
  try {
    const { precursor, sites, recommendedAction, severity } = req.body;
    res.json({
      alertId: `FLEET-ALERT-${Date.now().toString().slice(-5)}`,
      broadcastTimestamp: new Date().toISOString(),
      precursor: precursor || 'Energy Isolation Bypass on Pressurized Line',
      notifiedSites: sites || ['Duliajan', 'Digboi', 'Moran', 'Rajasthan'],
      status: 'TRANSMITTED_TO_ALL_RIG_TOOLPUSHERS',
      recommendedAction:
        recommendedAction || 'Execute mandatory zero-energy verification audit prior to next shift handover.',
      severity: severity || 'CRITICAL',
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Alert broadcast failed' });
  }
});

// Worker Voice Input Normalization
app.post('/api/voice/transcribe', async (req, res) => {
  try {
    const { transcript, language } = req.body;
    if (!transcript) {
      return res.status(400).json({ error: 'transcript is required' });
    }

    const result = await normalizeVoiceInput(transcript, language || 'en');
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Voice transcription failed' });
  }
});

// Serve frontend in dev via Vite middlewares, or static files in prod
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = process.env.PORT || 3000;
  app.listen(Number(PORT), '0.0.0.0', () => {
    console.log(`[SENTRIQ] Safety AI Platform running on http://0.0.0.0:${PORT}`);
    console.log(`[SENTRIQ] Gemini API Mode: ${isGeminiConnected() ? 'CONNECTED' : 'DEMO MODE (Rule-based NLP)'}`);
  });
}

startServer();
