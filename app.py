from fastapi import FastAPI, UploadFile, File, HTTPException, Body, Response
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse, StreamingResponse
import pandas as pd
import numpy as np
import io
import json
import os
from typing import Dict, Any, Optional, List
from datetime import datetime

# Import existing modules
from data_cleaner import DataCleaner
from transformation_pipeline import TransformationPipeline
from advanced_stats import AdvancedStatistics
from insights_generator import InsightsGenerator
from chatbot_v2 import LLaMAChat
from pdf_report import PDFReportGenerator
from data_versioning import DataVersioning
from utils import FileHandler

app = FastAPI(title="AutoDash AI API", version="3.0.0")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Orchestrator State
class GlobalState:
    def __init__(self):
        self.df: Optional[pd.DataFrame] = None
        self.cleaned_df: Optional[pd.DataFrame] = None
        self.cleaning_report: Dict[str, Any] = {}
        self.insights: Dict[str, Any] = {}
        self.stats: Dict[str, Any] = {}
        self.pipeline = TransformationPipeline()
        self.versioning = DataVersioning()
        self.chatbot: Optional[LLaMAChat] = None
        try:
            self.chatbot = LLaMAChat()
        except Exception as e:
            print(f"Chatbot initialization deferred: {e}")

state = GlobalState()

# ── Serialization helper ────────────────────────────────────────────────────
def _serialize(obj):
    if isinstance(obj, (np.integer, np.int64)):
        return int(obj)
    if isinstance(obj, (np.floating, np.float64)):
        if np.isinf(obj) or np.isnan(obj):
            return None
        return float(obj)
    if isinstance(obj, np.ndarray):
        return obj.tolist()
    if isinstance(obj, tuple):
        return list(obj)
    if isinstance(obj, bool):
        return bool(obj)
    return str(obj)

def _clean_json(data):
    import json as _json
    return _json.loads(_json.dumps(data, default=_serialize))

# ── ✅ NEW HELPER: Build full dataset preview payload ───────────────────────
def _build_preview(df: pd.DataFrame, label: str = "dataset") -> dict:
    """
    Returns full dataset as JSON for frontend table rendering.
    Also includes columns list and shape so frontend can build headers.
    Capped at 2000 rows max to protect browser performance.
    """
    MAX_ROWS = 2000
    total_rows = len(df)
    preview_df = df.head(MAX_ROWS).fillna("")

    return {
        "label": label,
        "columns": list(df.columns),
        "dtypes": {col: str(dtype) for col, dtype in df.dtypes.items()},
        "shape": {"rows": total_rows, "columns": len(df.columns)},
        "rows": _clean_json(preview_df.to_dict(orient="records")),
        "truncated": total_rows > MAX_ROWS,
        "showing": min(total_rows, MAX_ROWS),
    }

# ─────────────────────────────────────────────
#  HEALTH CHECK
# ─────────────────────────────────────────────
@app.get("/")
async def health_check():
    return {
        "status": "online",
        "engine": "AutoDash AI Orchestrator",
        "version": "3.0.0",
        "timestamp": datetime.now().isoformat()
    }

# ─────────────────────────────────────────────
#  UPLOAD endpoints
# ─────────────────────────────────────────────
@app.post("/upload_data")
async def sync_data(payload: Dict[str, Any] = Body(...)):
    try:
        data = payload.get("data")
        if not data:
            raise HTTPException(status_code=400, detail="Missing data in payload")
        df = pd.DataFrame(data)
        return await process_dataframe(df, "JSON_Sync")
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": f"Sync failed: {str(e)}"})

async def process_dataframe(df: pd.DataFrame, source: str):
    try:
        state.df = df
        cleaner = DataCleaner()
        state.cleaned_df, state.cleaning_report = cleaner.clean_data(df)
        state.cleaned_df, _ = state.pipeline.apply_pipeline(state.cleaned_df)
        adv_stats = AdvancedStatistics()
        num_cols = state.cleaned_df.select_dtypes(include=[np.number]).columns.tolist()
        if num_cols:
            state.stats['summary'] = {
                col: adv_stats.perform_distribution_analysis(state.cleaned_df, col)
                for col in num_cols[:5]
            }
        insights_gen = InsightsGenerator()
        state.insights = insights_gen.generate_insights(state.cleaned_df)
        state.versioning.create_version(state.cleaned_df, f"Data sync from {source}")

        return {
            "status": "success",
            "message": "Dataset fully processed and optimized",
            "metadata": {
                "total_rows": len(state.cleaned_df),
                "total_columns": len(state.cleaned_df.columns),
                "missing_percentage": f"{state.insights['dataset_overview'].get('missing_percentage', 0):.2f}%",
                "dataset_status": "optimized",
                "source": source
            },
            # ── ✅ FULL DATASET PREVIEWS (raw + cleaned) ──────────────────
            "preview": {
                "raw":     _build_preview(df,              label="raw"),
                "cleaned": _build_preview(state.cleaned_df, label="cleaned"),
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Processing failed: {str(e)}")

@app.post("/upload")
async def upload_dataset(file: UploadFile = File(...)):
    try:
        contents = await file.read()
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(contents))
        elif file.filename.endswith(('.xlsx', '.xls')):
            df = pd.read_excel(io.BytesIO(contents))
        else:
            raise HTTPException(status_code=400, detail="Unsupported format")
        return await process_dataframe(df, file.filename)
    except Exception as e:
        return JSONResponse(status_code=500, content={"status": "error", "message": str(e)})

# ── ✅ NEW ENDPOINT: GET /preview/raw ─────────────────────────────────────
@app.get("/preview/raw")
async def get_raw_preview():
    """Returns the full raw (pre-cleaning) dataset for table display."""
    if state.df is None:
        raise HTTPException(status_code=400, detail="No dataset uploaded")
    return _build_preview(state.df, label="raw")

# ── ✅ NEW ENDPOINT: GET /preview/cleaned ─────────────────────────────────
@app.get("/preview/cleaned")
async def get_cleaned_preview():
    """Returns the full cleaned dataset for table display."""
    if state.cleaned_df is None:
        raise HTTPException(status_code=400, detail="No cleaned dataset available")
    return _build_preview(state.cleaned_df, label="cleaned")

# ─────────────────────────────────────────────
#  COLUMNS
# ─────────────────────────────────────────────
@app.get("/columns")
async def get_columns():
    if state.cleaned_df is None:
        raise HTTPException(status_code=400, detail="No dataset uploaded")
    return {
        "columns": state.cleaned_df.columns.tolist(),
        "dtypes": {col: str(dtype) for col, dtype in state.cleaned_df.dtypes.items()},
        "shape": {"rows": len(state.cleaned_df), "columns": len(state.cleaned_df.columns)},
        "numeric_columns": state.cleaned_df.select_dtypes(include=[np.number]).columns.tolist(),
        "categorical_columns": state.cleaned_df.select_dtypes(include=["object", "category"]).columns.tolist(),
    }

# ─────────────────────────────────────────────
#  CLEAN
# ─────────────────────────────────────────────
@app.get("/clean")
async def get_cleaning_report():
    if state.cleaned_df is None:
        raise HTTPException(status_code=400, detail="No dataset uploaded")
    return {
        "cleaning_report": _clean_json(state.cleaning_report),
        "before_shape": list(state.df.shape) if state.df is not None else None,
        "after_shape": list(state.cleaned_df.shape),
        "columns": state.cleaned_df.columns.tolist(),
        "dtypes": {col: str(dtype) for col, dtype in state.cleaned_df.dtypes.items()},
        # ── ✅ FULL DATASET PREVIEWS in clean report ──────────────────────
        "preview": {
            "before": _build_preview(state.df,              label="before_cleaning") if state.df is not None else None,
            "after":  _build_preview(state.cleaned_df,      label="after_cleaning"),
        }
    }

@app.post("/clean/run")
async def run_cleaning(payload: Dict[str, Any] = Body(...)):
    if state.df is None:
        raise HTTPException(status_code=400, detail="No dataset uploaded")
    try:
        cleaner = DataCleaner()
        state.cleaned_df, state.cleaning_report = cleaner.clean_data(
            state.df,
            remove_duplicates=payload.get("remove_duplicates", True),
            missing_strategy=payload.get("missing_strategy", "Auto"),
            detect_outliers=payload.get("detect_outliers", True),
            normalize=payload.get("normalize", False)
        )
        insights_gen = InsightsGenerator()
        state.insights = insights_gen.generate_insights(state.cleaned_df)
        return {
            "status": "success",
            "cleaning_report": _clean_json(state.cleaning_report),
            "after_shape": list(state.cleaned_df.shape),
            # ── ✅ FULL DATASET PREVIEWS after cleaning run ───────────────
            "preview": {
                "before": _build_preview(state.df,              label="before_cleaning"),
                "after":  _build_preview(state.cleaned_df,      label="after_cleaning"),
            }
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Cleaning failed: {str(e)}")

# ─────────────────────────────────────────────
#  DASHBOARD
# ─────────────────────────────────────────────
@app.get("/dashboard")
async def get_dashboard_data():
    """Returns KPIs, Metrics, and Summary Data"""
    if state.cleaned_df is None:
        raise HTTPException(status_code=400, detail="No dataset uploaded")
    num_cols = state.cleaned_df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = state.cleaned_df.select_dtypes(include=['object', 'category']).columns.tolist()
    main_metric = num_cols[0] if num_cols else "N/A"
    kpis = {
        "AVERAGE_UNIT_PRICE": f"{state.cleaned_df[main_metric].mean():,.2f}" if main_metric != "N/A" else "0.00",
        "TOTAL_BRAND_COUNT": str(state.cleaned_df[cat_cols[0]].nunique()) if cat_cols else "0",
        "MARKET_LEADER": str(state.cleaned_df[cat_cols[0]].mode().iloc[0]) if cat_cols else "N/A",
        "DATA_HEALTH": f"{(100 - state.insights['dataset_overview']['missing_percentage']):.1f}%"
    }
    trend_data = []
    if main_metric != "N/A":
        sample_indices = np.linspace(0, len(state.cleaned_df) - 1, 20, dtype=int)
        trend_data = [{"id": i, "value": float(v)} for i, v in enumerate(state.cleaned_df[main_metric].iloc[sample_indices].values)]
    category_data = []
    if cat_cols and num_cols:
        cat_grp = state.cleaned_df.groupby(cat_cols[0])[num_cols[0]].mean()
        category_data = [{"name": str(k), "value": round(float(v), 2)} for k, v in cat_grp.head(10).items()]
    charts = []
    if trend_data:
        charts.append({"type": "line", "title": "Trend", "xKey": "id", "yKey": "value", "data": trend_data})
    if category_data:
        charts.append({"type": "bar", "title": "Category", "xKey": "name", "yKey": "value", "data": category_data})
    return {
        "metrics": kpis,
        "trends": trend_data,
        "category_data": category_data,
        "charts": charts,
        "num_cols": num_cols,
        "cat_cols": cat_cols,
        "summary": _clean_json(state.insights.get('dataset_overview', {})),
        "quality": _clean_json(state.insights.get('data_quality', {}))
    }

# ─────────────────────────────────────────────
#  INSIGHTS
# ─────────────────────────────────────────────
@app.get("/insights")
async def get_ai_insights():
    if not state.insights:
        raise HTTPException(status_code=400, detail="Insights not generated")
    clean = _clean_json(state.insights)
    recs = clean.get('recommendations', [])
    return {
        "ai_summary": recs[0].get('message', 'Dataset analysis complete.') if recs else 'Dataset analysis complete.',
        "recommendations": recs,
        "anomalies": clean.get('outliers', {}),
        "correlations": clean.get('correlations', {}),
        "categorical_analysis": clean.get('categorical_analysis', {}),
        "distributions": clean.get('distributions', {}),
        "dataset_overview": clean.get('dataset_overview', {}),
    }

@app.get("/insight")
async def get_ai_insight_alias():
    return await get_ai_insights()

# ─────────────────────────────────────────────
#  ADVANCED STATS
# ─────────────────────────────────────────────
@app.get("/stats")
async def get_stats():
    if state.cleaned_df is None:
        raise HTTPException(status_code=400, detail="No dataset uploaded")
    adv = AdvancedStatistics()
    num_cols = state.cleaned_df.select_dtypes(include=[np.number]).columns.tolist()
    distributions = {col: adv.perform_distribution_analysis(state.cleaned_df, col) for col in num_cols[:10]}
    return {"distributions": _clean_json(distributions), "numeric_columns": num_cols}

@app.post("/stats/hypothesis")
async def run_hypothesis_test(payload: Dict[str, Any] = Body(...)):
    if state.cleaned_df is None:
        raise HTTPException(status_code=400, detail="No dataset uploaded")
    col1 = payload.get("col1")
    col2 = payload.get("col2")
    if not col1:
        raise HTTPException(status_code=400, detail="col1 is required")
    adv = AdvancedStatistics()
    results = adv.perform_hypothesis_tests(state.cleaned_df, col1, col2)
    return _clean_json(results)

@app.post("/stats/anomalies")
async def detect_anomalies(payload: Dict[str, Any] = Body(...)):
    if state.cleaned_df is None:
        raise HTTPException(status_code=400, detail="No dataset uploaded")
    method = payload.get("method", "isolation_forest")
    contamination = payload.get("contamination", 0.1)
    adv = AdvancedStatistics()
    results = adv.detect_anomalies(state.cleaned_df, method=method, contamination=contamination)
    return _clean_json(results)

# ─────────────────────────────────────────────
#  TRANSFORM
# ─────────────────────────────────────────────
@app.post("/transform")
async def apply_transform(payload: Dict[str, Any] = Body(...)):
    if state.cleaned_df is None:
        raise HTTPException(status_code=400, detail="No dataset uploaded")
    transform_type = payload.get("type")
    params = payload.get("params", {})
    if not transform_type:
        raise HTTPException(status_code=400, detail="transform type is required")
    try:
        state.pipeline.add_transformation(transform_type, params)
        state.cleaned_df, _ = state.pipeline.apply_pipeline(state.cleaned_df)
        return {
            "status": "success",
            "pipeline_steps": len(state.pipeline.transformations),
            "shape": list(state.cleaned_df.shape),
            "columns": state.cleaned_df.columns.tolist(),
            # ── ✅ FULL PREVIEW after transform ───────────────────────────
            "preview": _build_preview(state.cleaned_df, label="after_transform"),
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Transform failed: {str(e)}")

@app.get("/transform/history")
async def get_transform_history():
    return {
        "steps": state.pipeline.transformations,
        "total": len(state.pipeline.transformations),
        "summary": state.pipeline.get_pipeline_summary()
    }

@app.post("/transform/clear")
async def clear_transform_pipeline():
    if state.df is None:
        raise HTTPException(status_code=400, detail="No dataset uploaded")
    state.pipeline.clear_pipeline()
    cleaner = DataCleaner()
    state.cleaned_df, state.cleaning_report = cleaner.clean_data(state.df)
    return {
        "status": "success",
        "message": "Pipeline cleared and data reset to post-cleaning state",
        "shape": list(state.cleaned_df.shape),
        # ── ✅ FULL PREVIEW after pipeline reset ──────────────────────────
        "preview": _build_preview(state.cleaned_df, label="after_reset"),
    }

# ─────────────────────────────────────────────
#  CHAT  (✅ passes full df to chatbot)
# ─────────────────────────────────────────────
@app.post("/chat")
async def chat_with_data(payload: Dict[str, str] = Body(...)):
    """Context-aware AI Chatbot"""
    user_message = payload.get("message")
    if not user_message:
        raise HTTPException(status_code=400, detail="Missing message")
    if state.cleaned_df is None:
        return {"reply": "Please upload a dataset first so I can provide contextual answers."}
    if not state.chatbot:
        try:
            state.chatbot = LLaMAChat()
        except Exception as e:
            return {"reply": f"AI Engine is currently unavailable: {str(e)}"}

    df = state.cleaned_df  # always use cleaned version

    # ── ✅ UPGRADED CONTEXT: passes full df so chatbot executes real queries ─
    context = {
        "df":             df,                                               # ← full DataFrame
        "shape":          df.shape,
        "columns":        df.columns.tolist(),
        "dtypes":         {col: str(dtype) for col, dtype in df.dtypes.items()},
        "missing_values": df.isnull().sum().to_dict(),
        "summary":        state.insights.get('dataset_overview', {}),
        "sample_data":    _clean_json(df.head(5).fillna("").to_dict(orient='records')),
    }

    try:
        response = state.chatbot.generate_response(user_message, context)
        return {"reply": response}
    except Exception as e:
        return {"reply": f"I encountered an error while processing your request: {str(e)}"}

# ─────────────────────────────────────────────
#  REPORT
# ─────────────────────────────────────────────
@app.get("/report")
async def download_report():
    """Generates and streams a PDF report"""
    if state.cleaned_df is None:
        raise HTTPException(status_code=400, detail="No data available for report")
    try:
        report_gen = PDFReportGenerator()
        pdf_data = report_gen.generate_report(
            state.cleaned_df,
            cleaning_report=state.cleaning_report,
            insights=state.insights
        )
        return Response(
            content=pdf_data,
            media_type="application/pdf",
            headers={"Content-Disposition": f"attachment; filename=AutoDash_Report_{datetime.now().strftime('%Y%m%d')}.pdf"}
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Report generation failed: {str(e)}")

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)