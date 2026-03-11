# Cloud Expense Management Platform

A system that allows non-technical users to view and manage cloud expenses across multiple providers (e.g. AWS, Oracle, Google Cloud, Microsoft).

---

## Overview

### AI Dashboard

The main entry point is an **AI dashboard** (`/ai-dashboard`) that provides:

- **Data summaries**: Line graphs and analytics (e.g. weekly costs, service categories) driven by backend APIs (`/api/dashboard-data`, `/api/dashboard-graph`).
- **AI query**: Natural-language input for querying or exploring the data.
- **AI ticket recommendations**: Suggested tickets/recommendations based on cost anomalies.
- **Cloud usage table**: A large table of cloud usage (currently at **provider** level) with columns such as provider name, monthly usage (USD), monthly billed (USD), and difference. The table is backed by `/api/usage/monthly?provider=...` and related usage APIs.

### Service / Provider Detail and Policies

- **Intended flow**: Each row in the table (each provider/service) should be clickable, taking the user to a **single-provider (or single-service) overview page** with summaries and **policies** for that provider only.
- **Policies** are graph-structured programs that run conditional checks on cloud data. When conditions are met, they create **tickets** (stored or surfaced in the backend). Policies are built in a visual editor and executed by the backend VPL (Visual Programming Language) compute engine.

### Policy System

- **Execution**: Policies are run by the backend scheduler in `backend/VPL_Compute/scheduler.py`. It loads programs from the file system (`data/programs`, `data/new-programs`, `data/disable-programs`), converts them via `pass_program.py` to an executable DAG, and evaluates them with `compute_program.py` (using `graph.py` for DAG sort and `nodes.py` for node types: inputs, constants, arithmetic, comparisons, and the **ticket** output node).
- **Policy Viewer** (`frontend/src/pages/PolicyViewer.jsx`): Lists policies in three groups—**enabled**, **disabled**, and **processing**—with actions to edit, enable/disable, or delete. Data comes from `GET /api/policies/all`.
- **Policy Creator** (`frontend/src/pages/PolicyCreator.jsx`): Visual editor (React Flow) to build policies from blocks: **Inputs** (data from DB), **Operations** (constants, add/subtract/multiply/divide), **Decisions** (lt, gt, eq, and, or), and **Outputs** (only **Create Ticket**). Policies are saved via `POST /api/policies` (new) or `PUT /api/policies/:id` (update). They should be **scoped to a provider** and ideally reached only from the single-provider overview so the policy knows which provider it applies to.

### Backend

- **Flask** app in `backend/app.py`: Data and usage routes, policy CRUD (file-based storage), and AI endpoints.
- **VPL_Compute**: `scheduler.py` (orchestration), `compute_program.py` (run DAG), `pass_program.py` (JSON → executable program), `graph.py` (DAG utilities), `nodes.py` (node types including `TICKET`).
- **Database**: Usage and cost data queried via `database` and `interface` modules (e.g. `gold_standard_usage`, filters, group-by, time ranges).

---

## Incomplete Features

1. **Single-provider / single-service overview page**
   - No route exists for a dedicated provider (or service) detail page (e.g. `/service-viewer/:provider` or `/provider/:id`).
   - Backend has stub routes: `GET /api/overview` and `GET /api/overview/<provider>` both return `"TODO"`.

2. **Table row → provider overview navigation**
   - The cloud usage table does not link rows to a detail page. Rows are not clickable and there is no navigation to a provider-specific view.

3. **Policy Creator only from provider context**
   - Policy Creator is currently reachable from the global dashboard nav (“Policy Creation”) and from Policy Viewer (“Edit”). It is **not** restricted to being opened from a single-provider overview, and the created policy does not receive the current provider from the URL or context (e.g. no route like `/policy-editor?provider=AWS` or `/provider/AWS/policy/new`).

4. **Provider (and scope) in policy lifecycle**
   - Policies have a `Data Sources` object in the saved JSON (provider, billing_account, etc.) but it is not populated from the UI or from the page context when creating from a provider page. Provider-scoped listing (e.g. “policies for this provider”) is not implemented.

5. **Ticket persistence**
   - The `TICKET` node in `backend/VPL_Compute/nodes.py` only prints to the console (`print(self.receiver)`, `print(self.description)`). Tickets are not written to a database or ticket store; there is no backend ticket list or API for created tickets.

6. **Scheduler integration with the app**
   - The scheduler in `backend/VPL_Compute/scheduler.py` is a standalone script that polls file system folders. It is not run as part of the Flask app (e.g. background worker or cron), so policy execution depends on running this script separately.

7. **Blocks library** *(fixed)*
   - Extra output blocks (“Send Notification”, “Log Event”) were removed from the Policy Creator blocks library; the Outputs category now shows only **Create Ticket**.

8. **Port and CORS**
   - Backend runs on port 5001 in `app.py` (`port=5001`) while frontend often calls `localhost:5000`; ensure frontend and backend port configuration and CORS are aligned for your environment.

---

## Quick Reference

| Area              | Location |
|------------------|----------|
| Dashboard        | `frontend/src/pages/AIdashboard.jsx` |
| Cloud table      | `frontend/src/pages/ServiceViewer.jsx` + `Table`, `Row`, `TableBody` |
| Policy Viewer    | `frontend/src/pages/PolicyViewer.jsx` |
| Policy Creator   | `frontend/src/pages/PolicyCreator.jsx` + `PolicyCreator/*` (e.g. `BlocksLibraryPanel.jsx`) |
| Policy execution | `backend/VPL_Compute/scheduler.py`, `compute_program.py`, `pass_program.py`, `graph.py`, `nodes.py` |
| Policy API       | `backend/app.py` (`/api/policies`, `/api/policies/<id>`, etc.) |
