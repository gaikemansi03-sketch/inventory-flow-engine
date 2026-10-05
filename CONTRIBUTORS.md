# Contributors & Task Allocation

This document outlines the core contributors to the **Inventory Flow Engine** project and provides a comprehensive breakdown of the architectural, engineering, and documentation responsibilities fulfilled by each team member.

---

## 👥 Core Contributors

| Name | Role | GitHub | Email |
| :--- | :--- | :--- | :--- |
| **Neel Belsare** | Full-Stack Architect & Core Developer | [@Neel-Belsare](https://github.com/Neel-Belsare) | `neelbelsaredpvn@gmail.com` |
| **Mansi Gaike** | Project Owner & Systems/Docs Lead | [@gaikemansi03-sketch](https://github.com/gaikemansi03-sketch) | `gaikemansi03@gmail.com` |

---

## 🛠️ Detailed Task Allocation & Contributions

### 1. Neel Belsare ([@Neel-Belsare](https://github.com/Neel-Belsare))
**Role:** Full-Stack Architect & Core Developer

* **System Scaffolding & Architecture**:
  * Designed the decoupled multi-tier architectural blueprint spanning client-side React UI, backend Flask microservice, and Supabase managed PostgreSQL database.
  * Formulated directory structure and modular boundaries across `/backend`, `/frontend`, `/database`, and `/docs`.
* **Analytical Calculation Engine (`backend/app.py`)**:
  * Implemented the operational metric pipeline `calculate_inventory_metrics()`:
    * Available usable stock formula ($Current - Committed$).
    * Hourly consumption rate and expected burn runout time calculations ($Available / Hourly\ Demand$).
    * Lead-time vulnerability analysis checking if runout time falls below supplier replenishment duration ($Runout \le Lead\ Time$).
    * Priority-tiered action recommendation engine (Immediate Action, Critical, Expedite, Caution, Healthy).
  * Implemented defensive data casting helpers (`safe_int`, `safe_float`) to prevent `NaN` and `NoneType` runtime exceptions.
* **REST API Service & Data Layer (`backend/app.py`, `database/schema.sql`)**:
  * Developed Flask REST endpoints: `/upload`, `/process-inventory`, `/inventory`, and `/delete-all`.
  * Integrated Supabase Python SDK for remote PostgreSQL synchronization and bulk updates.
  * Authored relational database schema (`database/schema.sql`) for both the persistent `inventory` table and session-isolated staging `inventory_temp` table.
  * Configured query indexes and PostgreSQL Row Level Security (RLS) policies.
* **React Frontend Dashboard (`frontend/src/`)**:
  * Built the main dashboard container (`App.js`, `App.css`) featuring real-time executive KPI cards (Total Products, Low Stock Items, In-Transit Quantity, and Products at Risk).
  * Designed visual status badges for risk levels and replenishment alerts.
  * Developed drag-and-drop file ingestion module (`FileUpload.js`, `FileUpload.css`) with in-browser spreadsheet parsing via `xlsx` (SheetJS) and live pre-upload data preview.
  * Implemented frontend service bridge (`supabase.js`) handling API requests, error handling, and toast feedback (`react-hot-toast`).
* **Visual Documentation & System Diagrams**:
  * Created Mermaid system architecture flowcharts and sequence diagrams.
  * Captured and compiled high-resolution application screenshots in `docs/screenshots/`.
  * Formulated mathematical LaTeX notation for inventory metric definitions.

---

### 2. Mansi Gaike ([@gaikemansi03-sketch](https://github.com/gaikemansi03-sketch))
**Role:** Project Owner, Specifications & Technical Documentation Lead

* **Repository Management & Project Governance**:
  * Created, configured, and maintained the central GitHub repository (`gaikemansi03-sketch/inventory-flow-engine`).
  * Managed Git repository access permissions, branching, and team integration.
* **Functional Requirements & Product Design**:
  * Defined business requirements and supply chain problem statements for inventory velocity tracking and risk identification.
  * Designed core feature taxonomy: multi-format spreadsheet ingestion, tabular metric preview, executive KPI aggregation, and emergency reorder alerting.
  * Formatted column schema standards (`product_id`, `current_inventory_count`, `committed_stock_count`, `in_transit_quantity`, `supplier_lead_time_hours`, `safety_stock_level`).
  * Defined alert severity tiers and user-facing action recommendations.
* **Technical Documentation & Onboarding Guides**:
  * Authored the initial project README foundation and comprehensive documentation expansions.
  * Drafted system setup guides for both backend Python virtual environment and frontend Node.js / React ecosystems.
  * Created comprehensive REST API endpoint references detailing request payloads, status codes, and JSON responses.
  * Authored sample CSV and Excel schema templates for standard user ingestion testing.
* **Testing, QA & Workflow Validation**:
  * Executed comprehensive verification of file upload parsing with `.xlsx`, `.xls`, and `.csv` files.
  * Validated metric calculation accuracy against edge cases (e.g. stockout situations, zero lead time, uncommitted inventory).
  * Tested frontend interactive UI elements including modal confirmations, data refresh routines, and empty/loading states.

---

## 🤝 Collaboration Workflow

The project was developed in close collaboration between **Neel Belsare** and **Mansi Gaike**, adopting an agile, iterative workflow:
1. **Requirements & Scope**: Mansi defined the product specifications, inventory tracking needs, and documentation structure.
2. **Implementation**: Neel engineered the core full-stack codebase, calculation engine, database models, and interactive React dashboard.
3. **Review & Documentation**: Both contributors reviewed the workflows, refined documentation, validated API endpoints, and integrated visual assets.
