"""
AutoDash AI Launcher: starts backend (FastAPI on :8000) and frontend (Next.js on :3000).
Uses single backend (root app.py) and single frontend (frontend/).
"""
import subprocess
import webbrowser
import time
import sys
import requests
from pathlib import Path

BACKEND_URL = "http://127.0.0.1:8000"
FRONTEND_DIR = Path(__file__).parent / "frontend"


class DashboardLauncher:
    def __init__(self):
        self.backend_process = None
        self.frontend_process = None

    def start_backend(self):
        """Start the FastAPI backend server (root app.py) on port 8000."""
        try:
            backend_script = Path(__file__).parent / "app.py"
            self.backend_process = subprocess.Popen(
                [sys.executable, str(backend_script)],
                cwd=str(Path(__file__).parent),
                stdout=None,
                stderr=None,
            )
            print("✅ Backend starting on", BACKEND_URL)
            for _ in range(15):
                try:
                    requests.get(f"{BACKEND_URL}/", timeout=1)
                    print("📡 Backend is ready!")
                    return True
                except Exception:
                    time.sleep(1)
            return False
        except Exception as e:
            print(f"❌ Error starting backend: {e}")
            return False

    def push_data(self, df):
        """Push dataframe to backend via POST /upload_data (sync_data)."""
        if df is None:
            return False
        try:
            data_json = df.to_dict(orient="records")
            r = requests.post(
                f"{BACKEND_URL}/upload_data",
                json={"data": data_json},
                timeout=10,
            )
            if r.status_code == 200:
                print("📤 Data synced to backend successfully")
                return True
            print(f"❌ Sync failed: {r.text}")
            return False
        except Exception as e:
            print(f"❌ Error pushing data: {e}")
            return False

    def start_frontend(self):
        """Start Next.js dev server (frontend/) on port 3000."""
        try:
            if not (FRONTEND_DIR / "node_modules").exists():
                print("📦 Installing frontend dependencies...")
                subprocess.run(
                    ["npm", "install"],
                    cwd=str(FRONTEND_DIR),
                    shell=True,
                )
            self.frontend_process = subprocess.Popen(
                ["npm", "run", "dev"],
                cwd=str(FRONTEND_DIR),
                stdout=None,
                stderr=None,
                shell=True,
            )
            print("✅ Frontend starting on http://localhost:3000")
            time.sleep(5)
            return True
        except Exception as e:
            print(f"❌ Error starting frontend: {e}")
            return False

    def launch(self, df=None, open_browser=True):
        """Start backend, optionally sync data, start frontend, open browser."""
        print("🚀 Launching AutoDash AI...")
        if not self.start_backend():
            return False
        if df is not None:
            self.push_data(df)
        if not self.start_frontend():
            self.stop()
            return False
        if open_browser:
            time.sleep(1)
            webbrowser.open("http://localhost:3000")
        return True

    def stop(self):
        """Stop backend and frontend processes."""
        if self.backend_process:
            self.backend_process.terminate()
            print("🛑 Backend stopped")
        if self.frontend_process:
            self.frontend_process.terminate()
            print("🛑 Frontend stopped")


def launch_dashboard(df=None, open_browser=True):
    launcher = DashboardLauncher()
    launcher.launch(df, open_browser)
    return launcher
