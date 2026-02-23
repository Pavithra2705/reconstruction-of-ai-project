from fastapi import FastAPI, WebSocket, WebSocketDisconnect, HTTPException, Body
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import pandas as pd
import numpy as np
import json
import asyncio
from datetime import datetime
from typing import List, Dict, Any, Optional
import os
import sys

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
from preprocessor import AutoPreprocessor

app = FastAPI(title="Auto Analyst AI Engine", version="2.0.0")

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # For development
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Shared State
class AppState:
    def __init__(self):
        self.df: Optional[pd.DataFrame] = None
        self.summary: Dict[str, Any] = {}
        self.insights: Dict[str, Any] = {}
        self.active_connections: List[WebSocket] = []

state = AppState()

@app.get("/")
async def root():
    return {"status": "online", "engine": "Auto Analyst AI", "version": "2.0.0"}

@app.post("/api/upload")
async def upload_data(data: Dict[str, Any] = Body(...)):
    """
    Ingest data from Streamlit, clean it, and prepare insights.
    """
    try:
        # Expected format: {"data": List[Dict], "name": str}
        json_data = data.get("data")
        if not json_data:
            raise HTTPException(status_code=400, detail="No data provided")
            
        df = pd.DataFrame(json_data)
        
        # 1. Auto Preprocessing
        clean_df, summary = AutoPreprocessor.process(df)
        state.df = clean_df
        state.summary = summary
        
        # 2. Extract Insights
        state.insights = AutoPreprocessor.get_insights(clean_df)
        
        # 3. Broadcast to UI
        await broadcast_update()
        
        return {
            "status": "success",
            "message": "Dataset processed and optimized",
            "summary": summary
        }
    except Exception as e:
        print(f"Upload error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/dashboard")
async def get_dashboard():
    """Returns data for the Intelligence Dashboard"""
    if state.df is None:
        return JSONResponse({"status": "no_data", "message": "Please upload a dataset first"})
        
    # Generate charts for the new UI
    charts = generate_premium_charts(state.df)
    
    return {
        "metrics": {
            "totalRows": len(state.df),
            "totalCols": len(state.df.columns),
            "missingValues": state.summary.get("actions", []).count("Imputed"), # Simplified count
            "efficiency": "98.5%" # Example static metric for aesthetic
        },
        "charts": charts,
        "summary": state.summary
    }

@app.get("/api/insights")
async def get_insights():
    if state.df is None:
         return JSONResponse({"status": "error", "message": "No data available"})
    return state.insights

@app.post("/api/chat")
async def chat_with_ai(message: Dict[str, str] = Body(...)):
    """Simple contextual chat simulation"""
    user_msg = message.get("message", "").lower()
    
    if state.df is None:
        return {"reply": "I'm ready to help, but I need you to upload a dataset first! Once you do, I can analyze trends and answer specific questions."}
        
    # Mock responses based on keywords
    if "summarize" in user_msg or "insights" in user_msg:
        return {"reply": f"Based on my analysis of {len(state.df)} records, {state.insights['summary']} I recommend focusing on the strong correlations detected between your key numeric variables."}
    
    if "predict" in user_msg or "future" in user_msg:
        return {"reply": "Looking at current trends, I anticipate a steady 5-8% growth in your primary metrics over the next quarter, provided the current correlations hold."}
        
    return {"reply": "That's an interesting question. Looking at this dataset, the patterns suggest that we should scrutinize the outliers detected in the numeric columns for more precision."}

# WebSocket for real-time UI updates
@app.websocket("/ws")
async def websocket_endpoint(websocket: WebSocket):
    await websocket.accept()
    state.active_connections.append(websocket)
    try:
        while True:
            await websocket.receive_text() # Keep alive
    except WebSocketDisconnect:
        state.active_connections.remove(websocket)

async def broadcast_update():
    if not state.active_connections:
        return
    message = json.dumps({"type": "data_updated", "timestamp": datetime.now().isoformat()})
    for connection in state.active_connections:
        try:
            await connection.send_text(message)
        except:
            pass

def generate_premium_charts(df: pd.DataFrame) -> List[Dict[str, Any]]:
    charts = []
    num_cols = df.select_dtypes(include=[np.number]).columns.tolist()
    cat_cols = df.select_dtypes(include=['object', 'category']).columns.tolist()
    
    # Hero Bar Chart
    if cat_cols and num_cols:
        col = cat_cols[0]
        data = df.groupby(col)[num_cols[0]].mean().head(6).reset_index()
        charts.append({
            "id": "hero_bar",
            "type": "bar",
            "title": f"Average {num_cols[0]} by {col}",
            "data": data.to_dict(orient='records'),
            "xKey": col,
            "yKey": num_cols[0]
        })
        
    # Trend Line
    if num_cols:
         charts.append({
            "id": "trend_line",
            "type": "area",
            "title": "Performance Trend Analysis",
            "data": [{"id": i, "value": float(v)} for i, v in enumerate(df[num_cols[0]].head(20).values)],
            "xKey": "id",
            "yKey": "value"
        })
         
    return charts

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="127.0.0.1", port=8000)
