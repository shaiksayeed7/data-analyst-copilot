# Data Analyst Copilot

An AI-powered full-stack web application that lets you upload a CSV or Excel file and interact with your data through natural language. Built with **Next.js**, **FastAPI**, **pandas**, **Plotly**, and the **OpenAI API**.

---

## Features

| Feature | Description |
|---|---|
| 📁 File Upload | Drag & drop CSV / Excel files |
| 🤖 AI Chat | Ask questions about your dataset in plain English |
| 📊 Auto-Charts | Bar, line, pie, scatter charts auto-generated with Plotly |
| 🔍 Data Cleaning | Auto-removes duplicates, fills nulls |
| 📈 Insights | AI-generated key trends, anomalies, and recommendations |
| 🗄️ SQL Generator | Convert natural language to SQL queries |
| 👔 CEO Mode | Executive-level summaries at the click of a button |
| 📄 PDF Export | Download AI insights as a formatted PDF report |

---

## Project Structure

```
data-analyst-copilot/
├── backend/                  # FastAPI Python backend
│   ├── main.py               # App entry point
│   ├── requirements.txt
│   ├── .env.example
│   ├── routers/
│   │   ├── upload.py         # File upload + session management
│   │   ├── chat.py           # AI chat + insights
│   │   ├── analysis.py       # Stats + custom charts
│   │   ├── sql_gen.py        # NL → SQL generator
│   │   └── pdf.py            # PDF export
│   ├── services/
│   │   ├── data_service.py   # pandas cleaning + analysis
│   │   ├── ai_service.py     # OpenAI integration
│   │   ├── viz_service.py    # Plotly chart generation
│   │   └── pdf_service.py    # ReportLab PDF builder
│   └── sample_data/
│       └── sample_sales.csv  # Sample dataset for testing
└── frontend/                 # Next.js 14 + Tailwind CSS frontend
    ├── src/
    │   ├── app/
    │   │   ├── layout.tsx
    │   │   ├── page.tsx      # Main app page
    │   │   └── globals.css
    │   ├── components/
    │   │   ├── FileUpload.tsx
    │   │   ├── ChatPanel.tsx
    │   │   ├── ChartDisplay.tsx
    │   │   └── DataPreview.tsx
    │   └── lib/
    │       └── api.ts        # Typed API client
    ├── package.json
    ├── tailwind.config.js
    └── .env.example
```

---

## Setup Instructions

### Prerequisites

- Node.js ≥ 18
- Python ≥ 3.10
- An [OpenAI API key](https://platform.openai.com/api-keys)

---

### 1. Backend Setup

```bash
cd backend

# Create and activate a virtual environment
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# Edit .env and add your OPENAI_API_KEY

# Start the server
uvicorn main:app --reload --port 8000
```

The API will be available at `http://localhost:8000`.
Interactive docs: `http://localhost:8000/docs`

---

### 2. Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Configure environment variables
cp .env.example .env.local
# NEXT_PUBLIC_API_URL=http://localhost:8000  (already set)

# Start the dev server
npm run dev
```

The app will be available at `http://localhost:3000`.

---

### 3. Environment Variables

**backend/.env**
```
OPENAI_API_KEY=sk-...
ALLOWED_ORIGINS=http://localhost:3000
```

**frontend/.env.local**
```
NEXT_PUBLIC_API_URL=http://localhost:8000
```

---

## Sample Dataset

A sample sales dataset is included at `backend/sample_data/sample_sales.csv` (510 rows, 10 columns including date, region, category, product, revenue, etc.) for quick testing.

---

## API Endpoints

| Method | Path | Description |
|---|---|---|
| `POST` | `/api/upload/` | Upload CSV/Excel file |
| `GET` | `/api/upload/session/{id}` | Get session metadata |
| `POST` | `/api/chat/message` | Send a chat message |
| `POST` | `/api/chat/insights` | Generate AI insights |
| `GET` | `/api/analysis/summary/{id}` | Get dataset summary |
| `GET` | `/api/analysis/preview/{id}` | Get data preview |
| `GET` | `/api/analysis/charts/{id}` | Get auto-generated charts |
| `POST` | `/api/analysis/chart` | Generate a custom chart |
| `POST` | `/api/sql/generate` | Convert NL to SQL |
| `POST` | `/api/pdf/download` | Download insights as PDF |

---

## Deployment

### Backend (Render / Railway)

1. Push code to GitHub
2. Create a new **Web Service** on [Render](https://render.com) or [Railway](https://railway.app)
3. Set the build command: `pip install -r requirements.txt`
4. Set the start command: `uvicorn main:app --host 0.0.0.0 --port $PORT`
5. Add environment variables: `OPENAI_API_KEY`, `ALLOWED_ORIGINS`

### Frontend (Vercel)

1. Import your GitHub repo to [Vercel](https://vercel.com)
2. Set root directory to `frontend`
3. Add environment variable: `NEXT_PUBLIC_API_URL=https://your-backend-url`
4. Deploy

---

## Tech Stack

- **Frontend**: Next.js 16, React 18, Tailwind CSS, Plotly, React Markdown
- **Backend**: FastAPI, uvicorn, pydantic
- **Data**: pandas, numpy, openpyxl
- **Visualization**: Plotly Express
- **AI**: OpenAI GPT-4o-mini
- **PDF**: ReportLab
