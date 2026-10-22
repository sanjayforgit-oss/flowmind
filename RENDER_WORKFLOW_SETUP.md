# FLOWMIND AI — Real Render Workflows Setup & Architecture Guide

## Real Render Workflows Execution & Orchestration Platform

This document provides complete instructions for configuring, deploying, running, and verifying real workflow executions on **Render Workflows** (`@renderinc/sdk/workflows`) within FLOWMIND AI.

---

## 1. End-to-End Architecture

```
FLOWMIND AI Visual Studio (React 19 / Vite / Tailwind / @xyflow/react)
       │
       ├─────────────────────────────────┐
       ▼ [POST /api/render/code]         ▼ [POST /api/render/execute]
Render Workflows AI Compiler      FLOWMIND Node Server / Dev Middleware
(Auto-generates @renderinc/sdk)          │
                                         ├─────────────────────────────────┐
                                         ▼ [Cloud Mode]                    ▼ [Local SDK Engine]
                          Render Cloud Tasks API (v1)           Direct Durable Task Execution
                          (@renderinc/sdk/workflows)            (Registered Render Tasks)
                                         │                                 │
                                         └────────────────┬────────────────┘
                                                          ▼
                                            Render Tasks Execution Pipeline:
                                            ├── Customer Complaint & SLA Escalation
                                            ├── Invoice Anomaly & CFO Sign-Off
                                            ├── Employee Onboarding & IT Provisioning
                                            └── Dynamic FlowMind Graph Orchestrator
                                                          │
                                         ┌────────────────┴────────────────┐
                                         ▼                                 ▼
                          [HITL Approval Checkpoint]            [Auto-Execution Stages]
                          (/api/render/approve)                 (Tasks with Retries/Timeouts)
                                         │                                 │
                                         └────────────────┬────────────────┘
                                                          ▼
                                            Supabase PostgreSQL Telemetry
                                            (`public.workflow_executions` table)
                                                          │
                                                          ▼
                                            Live Telemetry Stream (/executions)
```

---

## 2. Supported Render Workflows Pipelines

FLOWMIND AI comes with multi-domain business pipelines implemented in `@renderinc/sdk/workflows`:

### Pipeline 1: Customer Complaint & SLA Escalation
- **Slug**: `customer_complaint_workflow`
- **Stages**:
  1. `analyze_priority`: NLP sentiment & SLA urgency classification.
  2. `notify_manager`: Escalates HIGH priority incidents to Slack.
  3. `create_support_ticket`: Generates Zendesk SLA ticket.
  4. `draft_response`: Synthesizes empathetic response draft.
  5. `human_approval`: Management review gate.
  6. `complete_complaint_workflow`: Telemetry archive.

### Pipeline 2: Invoice Anomaly & CFO Payment Authorization
- **Slug**: `invoice_approval_workflow`
- **Stages**:
  1. `extract_invoice_details`: OCR invoice extraction.
  2. `detect_invoice_anomalies`: $5,000 threshold and fraud heuristic.
  3. `notify_finance_lead`: Alerts Finance channel on high-value invoices.
  4. `invoice_approval_gate`: Executive CFO sign-off.
  5. `schedule_erp_payment`: NetSuite / SAP batch scheduling.
  6. `complete_invoice_workflow`: GL posting.

### Pipeline 3: Employee Onboarding & Security Provisioning
- **Slug**: `employee_onboarding_workflow`
- **Stages**:
  1. `validate_employee_record`: Department role verification.
  2. `provision_identity_access`: Okta SSO & GitHub team grants.
  3. `dispatch_hardware_asset`: Asset tagging & FedEx tracking.
  4. `manager_onboarding_gate`: Hiring manager 30-day agenda approval.
  5. `complete_onboarding_workflow`: HRIS synchronization.

### Pipeline 4: Dynamic FlowMind Graph Orchestrator
- **Slug**: `dynamic_workflow_orchestrator`
- **Capability**: Compiles and executes *any* arbitrary visual graph designed in the FLOWMIND builder into durable Render task steps.

---

## 3. Render API Endpoints Reference

| Endpoint | Method | Description |
| :--- | :--- | :--- |
| `/api/render/status` | `GET` | Verifies Render Cloud and Local SDK Engine availability |
| `/api/render/tasks` | `GET` | Returns catalog of registered Render tasks and schemas |
| `/api/render/code` | `POST` | Compiles visual workflow into `@renderinc/sdk/workflows` TypeScript code |
| `/api/render/execute` | `POST` | Triggers workflow execution (Cloud or Local SDK Engine) |
| `/api/render/approve` | `POST` | Resumes workflow paused at a Human Approval checkpoint (HITL) |
| `/api/render/executions/:id` | `GET` | Retrieves live stage-level telemetry for a run |

---

## 4. Required Environment Variables

Configure these in `.env` (local development) or in Render Dashboard under **Environment**:

| Variable | Scope | Description |
| :--- | :--- | :--- |
| `RENDER_API_KEY` | Server Only | Render platform API key (`rnd_...`) |
| `RENDER_WORKFLOW_SLUG` | Server Only | Workflow slug (`flowmind-workflows`) |
| `RENDER_TASKS_URL` | Server Only | Render API endpoint (`https://api.render.com/v1`) |
| `VITE_SUPABASE_URL` | Client & Server | Supabase project URL |
| `VITE_SUPABASE_ANON_KEY` | Client & Server | Supabase public anon key |
| `GEMINI_API_KEY` | Server Only | Google Gemini API key for Copilot |
| `PORT` | Server Only | Server port (`3000`) |

---

## 5. Running the Project

### Development Mode
```bash
npm run dev
```
Open `http://localhost:5173`. Both frontend and backend API endpoints (`/api/render/*`) are active.

### Dedicated Render Workflow Worker
```bash
npm run worker
```
Starts the Render Workflows Task Server (`startTaskServer()`) and registers all workflow pipelines.

### Production Build & Server
```bash
npm run build
npm run start
```
Starts the unified Node.js production server on port 3000.

---

## 6. 1-Click Deployment to Render via `render.yaml`

1. Push your repository to GitHub.
2. Sign in to [Render Dashboard](https://dashboard.render.com).
3. Click **New +** and select **Blueprint**.
4. Select this repository. Render automatically reads `render.yaml` and provisions:
   - **flowmind-ai-platform**: Web Service (Node 20+)
   - **flowmind-workflows-worker**: Background Worker for Render Workflows compute
5. Enter your environment variables (`RENDER_API_KEY`, `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`, `GEMINI_API_KEY`) and click **Apply**.
