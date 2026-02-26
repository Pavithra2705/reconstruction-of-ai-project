# AutoDash AI

Production-ready data analytics platform: upload CSV/Excel → auto clean, insights, and interactive dashboard.

## Architecture (unified)

- **Backend:** Single FastAPI app (`app.py`) on **http://localhost:8000**
- **Frontend:** Single Next.js app (`frontend/`) on **http://localhost:3000**
- **API contract:** All frontend calls use the base URL above (see `.env.example` in `frontend/`).

## API contract (main endpoints)

| Action        | Method & path    | Backend function      | Description                    |
|---------------|------------------|------------------------|--------------------------------|
| Upload        | POST /upload     | `upload_dataset()`     | CSV/Excel → clean + pipeline + insights |
| Visualize     | GET /dashboard   | `get_dashboard_data()` | KPIs, trend chart data, summary |
| Insights      | GET /insight, GET /insights | `get_ai_insights()` | AI summary, recommendations, anomalies |
| Chatbot       | POST /chat       | `chat_with_data()`    | AI chatbot (dataset-aware)     |
| Report        | GET /report      | `download_report()`   | PDF download                   |
| (internal)    | POST /upload_data| `sync_data()`         | JSON data sync from launcher   |

## Run locally

### Option 1: Batch script (Windows)

```bat
run_project.bat
```

- Starts backend on **http://127.0.0.1:8000**
- Starts Next.js on **http://localhost:3000**
- Open **http://localhost:3000** in the browser.

### Option 2: Manual

**Terminal 1 – Backend**

```bash
python -m uvicorn app:app --host 127.0.0.1 --port 8000 --reload
```

**Terminal 2 – Frontend**

```bash
cd frontend
cp .env.example .env   # optional: edit NEXT_PUBLIC_API_URL if needed
npm install
npm run dev
```

Then open **http://localhost:3000**. API docs: **http://127.0.0.1:8000/docs**.

### Frontend API URL

- Default: `http://localhost:8000` (in `frontend/lib/api.ts`).
- Override: set `NEXT_PUBLIC_API_URL` in `frontend/.env` (see `frontend/.env.example`).

## Project layout

```
├── app.py                 # FastAPI backend (upload, clean, dashboard, insights, chat, report)
├── dashboard_launcher.py   # Starts backend + Next.js frontend
├── run_project.bat        # Windows one-click run
├── data_cleaner.py        # Data cleaning
├── transformation_pipeline.py
├── advanced_stats.py
├── insights_generator.py
├── chatbot_v2.py
├── pdf_report.py
├── data_versioning.py
├── utils.py
├── requirements.txt
└── frontend/              # Next.js app (Upload, Clean, Insights, Visualize, Chat, Transform, Stats)
    ├── .env.example
    ├── lib/api.ts         # Shared API base URL
    └── app/               # Pages and routes
```

The old `dashboard-project/` (Vite app and duplicate backend) has been removed; use `frontend/` as the single UI.
