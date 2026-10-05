# Inventory Flow Engine

Inventory Flow Engine is a full-stack inventory management application built to upload inventory data, process stock health metrics, and visualize product risk levels in a simple dashboard.

The system combines:
- a React frontend for uploading files and displaying inventory KPIs
- a Flask backend for processing uploaded inventory data
- a Supabase database for persistent storage
- SQL schema definitions for inventory tracking and risk calculations

## Overview

This project helps organizations manage inventory by:
- uploading Excel or CSV inventory files
- validating and storing product-level stock data
- calculating available stock, runout time, and stockout risk
- flagging critical inventory actions such as reorder or expedite
- presenting summary cards and a detailed product table in the UI

## Features

- Upload inventory data from .xlsx, .xls, or .csv files
- Preview uploaded data before processing
- Store records in a database
- Calculate inventory metrics such as:
  - available stock
  - runout time (hours)
  - stockout risk
  - recommended action
- Display KPI summaries:
  - total products
  - low stock items
  - in-transit quantity
  - products at risk
- Manage inventory data through refresh and delete-all actions

## Tech Stack

- Frontend: React, JavaScript, CSS, HTML
- Backend: Python, Flask
- Data layer: Supabase + SQL
- File parsing: XLSX / Excel import
- Environment configuration: .env files

## Project Structure

```text
inventory-flow-engine/
├── backend/
│   ├── .env
│   ├── app.py
│   └── requirements.txt
├── database/
│   └── schema.sql
├── frontend/
│   ├── .env
│   ├── package.json
│   ├── node_modules/
│   └── src/
│       ├── components/
│       ├── services/
│       ├── App.css
│       ├── App.js
│       ├── index.css
│       └── index.js
├── README.md
└── .gitignore
```

## Backend

The backend is implemented in `backend/app.py` and exposes REST endpoints for inventory management.

### Core API behavior
- uploads inventory records
- processes product-level metrics
- retrieves all inventory records
- deletes the data set in bulk

### Default inventory calculation
The system calculates:
- `available_stock = current_inventory_count - committed_stock_count`
- `runout_time_hour` based on a default daily demand assumption
- `is_stockout_risk` when the expected runout time is within supplier lead time
- `action_required` using category thresholds such as:
  - stock healthy
  - approaching safety stock
  - reorder immediately
  - expedite order
  - overstocked

## Frontend

The frontend is a React application under `frontend/src` and provides:
- a drag-and-drop file upload area
- a data preview table
- summary KPI cards
- a detailed inventory table with risk badges
- delete confirmation flow

## Database

The project includes the database schema in `database/schema.sql`.

The schema creates:
- `inventory` table for main inventory records
- `inventory_temp` table for temporary uploaded/processed rows
- indexes for faster lookup by session, process state, and product ID
- row-level security policies

## Prerequisites

Before running the project, ensure you have:
- Python 3.x
- Node.js and npm
- access to a Supabase project
- environment variables configured for both backend and frontend

## Setup

### 1) Backend Setup

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
```

Create or update `backend/.env`:

```env
SUPABASE_URL=your_supabase_url
SUPABASE_KEY=your_supabase_key
TABLE_NAME=inventory
```

Start the backend:

```bash
python app.py
```

The Flask server runs on:

```text
http://localhost:5001
```

### 2) Frontend Setup

```bash
cd frontend
npm install
```

Create or update `frontend/.env`:

```env
REACT_APP_API_URL=http://localhost:5001
REACT_APP_SUPABASE_URL=your_supabase_url
REACT_APP_SUPABASE_KEY=your_supabase_key
REACT_APP_TABLE_NAME=inventory
```

Start the frontend:

```bash
npm start
```

The React app will run in the default development environment.

## API Endpoints

### GET /
Returns a health check response for the backend service.

### POST /upload
Uploads inventory rows from the frontend to the configured Supabase table.

### POST /process-inventory
Calculates risk and action metrics for all current items in the inventory table.

### GET /inventory
Returns all inventory data in a structured JSON response.

### POST /delete-all
Deletes all inventory records from the active table.

## Usage Flow

1. Start the backend server.
2. Start the frontend application.
3. Upload an Excel or CSV file containing inventory records.
4. Review the data preview and upload it.
5. Let the backend calculate metrics.
6. Inspect the KPI cards and detailed inventory table.

## Example Inventory Fields

The uploaded data is expected to include fields such as:

- `product_id`
- `current_inventory_count`
- `committed_stock_count`
- `in_transit_quantity`
- `supplier_lead_time_hours`
- `safety_stock_level`

## License

This repository does not currently include a license file. Add an appropriate license before publishing or distributing the project publicly.
