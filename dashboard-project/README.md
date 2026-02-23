# Real-Time Dashboard

A modern, real-time data visualization dashboard built with React, TypeScript, and FastAPI.

## Features

- 📊 Real-time chart updates via WebSocket
- 🎨 Beautiful UI with Tailwind CSS
- 🌓 Dark/Light theme toggle
- 📈 Multiple chart types (Bar, Line, Pie)
- 🔄 Auto-refresh functionality
- ⚡ Fast and responsive

## Project Structure

```
dashboard-project/
├── src/
│   ├── components/
│   │   └── ChartRenderer.tsx    # Chart rendering component
│   ├── Dashboard.tsx             # Main dashboard component
│   ├── main.tsx                  # React entry point
│   ├── types.ts                  # TypeScript type definitions
│   └── index.css                 # Global styles
├── main.py                       # FastAPI backend server
├── requirements.txt              # Python dependencies
├── package.json                  # Node dependencies
├── index.html                    # HTML entry point
└── vite.config.ts               # Vite configuration
```

## Setup Instructions

### Backend Setup

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Start the FastAPI server:
```bash
python main.py
```

The API will be available at `http://localhost:8000`

### Frontend Setup

1. Install Node dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

The dashboard will open automatically at `http://localhost:5173`

## Integration with Streamlit App

To use this dashboard with your Streamlit application:

1. Import the dashboard module in your `app.py`:
```python
import subprocess
import webbrowser
from dashboard_project.main import set_data
```

2. Set the data you want to visualize:
```python
# After cleaning your data
from dashboard_project.main import set_data
set_data(cleaned_df)
```

3. Launch the dashboard:
```python
# Start backend
subprocess.Popen(["python", "dashboard-project/main.py"])

# Start frontend
subprocess.Popen(["npm", "run", "dev"], cwd="dashboard-project")

# Open in browser
webbrowser.open("http://localhost:5173")
```

## API Endpoints

- `GET /` - Health check
- `GET /api/charts` - Get current chart data
- `WebSocket /ws/realtime` - Real-time updates

## Technologies Used

- **Frontend**: React 18, TypeScript, Vite, Tailwind CSS
- **Backend**: FastAPI, Uvicorn, WebSockets
- **Data**: Pandas, NumPy

## Development

Build for production:
```bash
npm run build
```

Preview production build:
```bash
npm run preview
```

## License

MIT
