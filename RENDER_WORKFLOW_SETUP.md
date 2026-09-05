# FLOWMIND AI — Real Render Workflows Setup & Architecture Guide

## Phase 7: Real Render Workflows Execution Engine

This document provides complete instructions for configuring, deploying, running, and verifying real workflow executions on **Render Workflows** (`@renderinc/sdk/workflows`) within FLOWMIND AI.

---

## 1. End-to-End Architecture

```
FLOWMIND AI Client (React 19 / Vite / Tailwind)
       │
       ▼ [POST /api/render/execute]
FLOWMIND Node Server / Dev Middleware
       │
       ▼ [Render Workflows SDK: createWorkflowsClient / startTask / runTask]
Render Platform API & Task Engine (https://api.render.com/v1)
       │
       ▼ [Durable Background Task Execution]
Customer Complaint Workflow Pipeline:
  [1. analyzePriority] ──▶ [2. Priority == HIGH?]
                                │
                      ┌─────────┴─────────┐
                   (YES)                (NO)
                      │                   │
              [notifyManager]      [Bypass Alert]
                      └─────────┬─────────┘
                                │
                    [3. createSupportTicket]
                                │
                    [4. draftResponse]
                                │
                    [5. humanApproval Checkpoint]
                                │
                    [6. completeComplaintWorkflow]
       │
       ▼ [Execution Telemetry & State Updates]
Supabase PostgreSQL (`public.workflow_executions` table)
       │
       ▼ [Live Telemetry Stream]
FLOWMIND AI Execution Logs Page (`/executions`)
```

---

## 2. Security Architecture

- **Zero Secret Leakage**: The browser client **never** receives or handles `RENDER_API_KEY`.
- **Environment Isolation**:
  - `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY` are safe for public browser bundles.
  - `RENDER_API_KEY`, `RENDER_WORKFLOW_SLUG`, `GEMINI_API_KEY` are strictly server-only environment variables.
- **Honest Demo-Mode Fallback**:
  If `RENDER_API_KEY` is not provided, the UI displays:
  > *"Render execution is not configured. Please set RENDER_API_KEY in your server environment variables."*
  FLOWMIND AI will never fabricate a false "success" without real engine confirmation.

---

## 3. Required Environment Variables

Configure these variables in your root `.env` file (local development) or in the Render Dashboard under **Environment**:

| Variable | Scope | Description | Example |
| :--- | :--- | :--- | :--- |
| `VITE_SUPABASE_URL` | Client & Server | Supabase project endpoint | `https://xxxx.supabase.co` |
| `VITE_SUPABASE_ANON_KEY` | Client & Server | Supabase public anonymous key | `sb_publishable_...` |
| `RENDER_API_KEY` | **Server Only** | Render platform API key | `rnd_abc123456789...` |
| `RENDER_WORKFLOW_SLUG` | **Server Only** | Workflow slug registered on Render | `flowmind-workflows` |
| `RENDER_TASKS_URL` | **Server Only** | Render tasks endpoint | `https://api.render.com/v1` |
| `GEMINI_API_KEY` | **Server Only** | Google Gemini API key for Copilot | `AQ.xxx...` |
| `PORT` | **Server Only** | Node server listening port | `3000` |

---

## 4. How to Obtain Render API Credentials

1. Sign in to your [Render Dashboard](https://dashboard.render.com).
2. Click on your user avatar in the top right corner and navigate to **Account Settings**.
3. Select **API Keys** from the sidebar.
4. Click **Create API Key**, enter a descriptive name (e.g., `flowmind-hackathon`), and copy the generated token (`rnd_...`).
5. Open your local `.env` file and set:
   ```bash
   RENDER_API_KEY=rnd_your_actual_token_here
   RENDER_WORKFLOW_SLUG=flowmind-workflows
   ```

---

## 5. Running Locally

### Standard Development Mode
Run the Vite development server with backend API plugins enabled:
```bash
npm run dev
```
Open `http://localhost:5173`. The backend endpoints (`/api/render/*` and `/api/copilot`) are automatically handled by the Vite server middleware.

### Production Node Server Mode
Build the production bundle and launch the integrated Node.js server:
```bash
npm run build
npm start
```
Open `http://localhost:3000`. The server hosts compiled static assets from `dist/` and serves `/api/render/*` and `/api/copilot` requests.

### Local Render Workflows CLI (Optional)
If you have the Render CLI installed, you can run tasks locally:
```bash
render workflows dev -- npm run dev
```

---

## 6. How to Deploy to Render

### Option A: Render Web Service (All-in-one)
1. Push your repository to GitHub / GitLab.
2. In the Render Dashboard, click **New +** > **Web Service**.
3. Connect your repository.
4. Configure service parameters:
   - **Name**: `flowmind-ai`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`
5. Under **Environment Variables**, add:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_ANON_KEY`
   - `RENDER_API_KEY`
   - `RENDER_WORKFLOW_SLUG`
   - `GEMINI_API_KEY`
   - `NODE_ENV=production`
6. Click **Create Web Service**.

### Option B: Render Blueprint (`render.yaml`)
You can define your web service and workflow worker together:
```yaml
services:
  - type: web
    name: flowmind-ai
    env: node
    buildCommand: npm install && npm run build
    startCommand: npm start
    envVars:
      - key: RENDER_API_KEY
        sync: false
      - key: RENDER_WORKFLOW_SLUG
        value: flowmind-workflows
      - key: VITE_SUPABASE_URL
        sync: false
      - key: VITE_SUPABASE_ANON_KEY
        sync: false
      - key: GEMINI_API_KEY
        sync: false
```

---

## 7. How to Test the Customer Complaint Flow

1. Open **FLOWMIND AI** in your browser.
2. Navigate to **AI Copilot** (`/copilot`) or **Visual Builder** (`/workflows`).
3. Ensure the active workflow is the **Customer Complaint Demo Flow**:
   - Trigger: Customer Complaint Received
   - Node 1: Analyze Priority (NLP sentiment & urgency)
   - Node 2: Priority == HIGH? (Condition)
   - Node 3: Notify Manager (Slack escalation)
   - Node 4: Create Support Ticket (Zendesk Cloud)
   - Node 5: Draft Response (Empathetic AI draft)
   - Node 6: Human Approval Checkpoint
   - Node 7: Complete
4. Click **Simulate** to launch the safe sandbox simulator (`/simulation`).
5. Click **Run Simulation** and review each step executing in the dry-run sandbox.
6. When the human approval checkpoint appears, click **Approve Checkpoint**.
7. Once simulation concludes with **100% SUCCESS**, click the blue button:
   **"Execute on Render"**.
8. In the **Execute on Render Workflows** modal:
   - If `RENDER_API_KEY` is not configured, observe the clear warning:
     *"Render execution is not configured. Please set RENDER_API_KEY in server environment."*
   - Once your key is provided, click **Launch Render Workflow**.
   - Watch the state progress: **Connecting -> Queued -> Running Stages -> Succeeded**.
   - Inspect the real Render Task Run ID (`rn-exec-...`), latency, and expandable output payloads for all 6 stages.
9. Click **View in Execution Logs** or navigate to `/executions` to see the live record persisted in Supabase with the **Render Live** badge.

---

## 8. Troubleshooting

| Issue | Cause | Solution |
| :--- | :--- | :--- |
| **"Render execution is not configured"** | `RENDER_API_KEY` is missing, commented out, or contains placeholder text. | Add your real Render API token (`rnd_...`) to `.env` and restart the dev server. |
| **HTTP 401 Unauthorized** | The provided `RENDER_API_KEY` has expired or is invalid. | Generate a fresh API key in Render Dashboard > Account Settings > API Keys. |
| **Execution stuck on Queued** | Network connectivity issue or Render API rate limit. | Verify internet access and check Render platform status at [status.render.com](https://status.render.com). |
| **Supabase record not appearing** | User is not logged in or Supabase RLS policy rejected update. | Run migration `supabase/migrations/20260829_workflow_executions_render_update.sql` in Supabase SQL editor. |
