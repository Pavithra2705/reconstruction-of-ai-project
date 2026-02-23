import subprocess
import webbrowser
import time
import os
import sys
import requests
import json
from pathlib import Path

DASHBOARD_DIR = Path(__file__).parent / "dashboard-project"

class DashboardLauncher:
    def __init__(self):
        self.backend_process = None
        self.frontend_process = None
        
    def start_backend(self):
        """Start the FastAPI backend server"""
        try:
            # Point to the root app.py instead of the dashboard-project subfolder
            backend_script = Path(__file__).parent / "app.py"
            self.backend_process = subprocess.Popen(
                [sys.executable, str(backend_script)],
                cwd=str(Path(__file__).parent),
                stdout=None,
                stderr=None
            )
            print("✅ Backend server starting on http://127.0.0.1:8000")
            
            # Wait for backend to be ready
            retries = 10
            while retries > 0:
                try:
                    requests.get("http://127.0.0.1:8000/", timeout=1)
                    print("📡 Backend is ready!")
                    return True
                except:
                    retries -= 1
                    time.sleep(1)
            return False
        except Exception as e:
            print(f"❌ Error starting backend: {e}")
            return False
    
    def push_data(self, df):
        """Push dataframe to backend API"""
        if df is None:
            return False
        try:
            # Convert to list of dicts
            data_json = df.to_dict(orient='records')
            response = requests.post(
                "http://127.0.0.1:8000/upload_data", # Renaming to avoid conflict with file upload if needed, or just /upload
                json={"data": data_json},
                timeout=10
            )
            if response.status_code == 200:
                print("📤 Data synced to dashboard successfully")
                return True
            else:
                print(f"❌ Failed to sync data: {response.text}")
                return False
        except Exception as e:
            print(f"❌ Error pushing data: {e}")
            return False

    def start_frontend(self):
        """Start the Vite development server"""
        try:
            node_modules = DASHBOARD_DIR / "node_modules"
            if not node_modules.exists():
                print("📦 Installing frontend dependencies...")
                subprocess.run(["npm", "install"], cwd=str(DASHBOARD_DIR), shell=True)
            
            self.frontend_process = subprocess.Popen(
                ["npm", "run", "dev"],
                cwd=str(DASHBOARD_DIR),
                stdout=None,
                stderr=None,
                shell=True
            )
            print("✅ Frontend server starting on http://127.0.0.1:5173")
            time.sleep(5)
            return True
        except Exception as e:
            print(f"❌ Error starting frontend: {e}")
            return False
    
    def launch(self, df=None, open_browser=True):
        """Launch both backend and frontend and sync data"""
        print("🚀 Launching Auto Analyst AI Platform...")
        
        # Start backend first
        if not self.start_backend():
            return False
            
        # Push initial data
        if df is not None:
            self.push_data(df)
            
        # Start frontend
        if not self.start_frontend():
            self.stop()
            return False
        
        if open_browser:
            time.sleep(1)
            webbrowser.open("http://127.0.0.1:5173")
            
        return True
    
    def stop(self):
        """Stop both servers"""
        if self.backend_process:
            self.backend_process.terminate()
            print("🛑 Backend server stopped")
        
        if self.frontend_process:
            self.frontend_process.terminate()
            print("🛑 Frontend server stopped")

def launch_dashboard(df=None, open_browser=True):
    launcher = DashboardLauncher()
    launcher.launch(df, open_browser)
    return launcher
