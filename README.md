# MaScan - QR Attendance Checker (Flask)

MaScan is a Flask web app for attendance tracking using QR codes. It supports event-based attendance, QR generation from CSV, scanning, attendance history, and PDF export.

## Features
- QR scanning for attendance check-in
- Bulk QR generation from CSV uploads
- Event management (create, edit, list, view)
- Attendance history and activity logs
- User authentication and role-based access
- PDF export of attendance records

## Tech Stack
- Python, Flask
- SQLite
- HTML/CSS/JavaScript
- OpenCV + pyzbar (QR scanning)
- ReportLab (PDF export)

## Project Structure
```text
QR-Attendance-Checker---Flask-Version/
|-- README.md
|-- sample_students.csv
|-- app/
|   |-- app.py
|   |-- requirements.txt
|   |-- src/
|   |   |-- flask_app.py
|   |   |-- routes/
|   |   |-- templates/
|   |   |-- static/
|   |   |-- database/
|   |   |-- utils/
```

## Prerequisites
- Python 3.10+
- pip
- Webcam (for live scanning)

## Setup and Run

### 1. Open project root
```powershell
cd "C:\Users\thebaynal\Documents\Code\Self-Projects\QR-Attendance-Checker---Flask-Version"
```

### 2. Create virtual environment
```powershell
python -m venv .venv
```

### 3. Activate virtual environment
Windows PowerShell:
```powershell
.\.venv\Scripts\Activate.ps1
```

macOS/Linux:
```bash
source .venv/bin/activate
```

### 4. Install dependencies
```powershell
pip install -r app/requirements.txt
```

### 5. Run the app
From project root:
```powershell
python app/app.py
```

The app runs at:
- http://127.0.0.1:5000
- http://localhost:5000

## Default Login
- Username: admin
- Password: Admin@123

## How to Use
1. Log in with the default admin account.
2. Create an event in Events.
3. Go to QR Management.
4. Upload a CSV file (see format below) to generate QR codes.
5. Open Scanner and select an event.
6. Scan generated QR codes to mark attendance.
7. View attendance history and export PDF reports.

## CSV Format for QR Generation
Use this header row:
```csv
School ID,Name,First Name,Last Name,Middle Initial,Year,Section,Course
```

A ready-to-use mock file is included:
- sample_students.csv

Example rows:
```csv
STU101,Alex Cruz,Alex,Cruz,M,1,A,BS Computer Science
STU102,Bianca Reyes,Bianca,Reyes,L,1,B,BS Information Technology
```

## Screenshots

### App Preview

#### Dashboard

![Dashboard](https://raw.githubusercontent.com/thebaynal/QR-Attendance-Checker---Flask-Version/main/docs/screenshots/dashboard.png)

#### Events Management

![Events](https://raw.githubusercontent.com/thebaynal/QR-Attendance-Checker---Flask-Version/main/docs/screenshots/events.png)

#### Login

![Login](https://raw.githubusercontent.com/thebaynal/QR-Attendance-Checker---Flask-Version/main/docs/screenshots/login.png)

#### QR Scanner

![QR Scanner](https://raw.githubusercontent.com/thebaynal/QR-Attendance-Checker---Flask-Version/main/docs/screenshots/qr_scan.png)

#### QR Management

![QR Management](https://raw.githubusercontent.com/thebaynal/QR-Attendance-Checker---Flask-Version/main/docs/screenshots/qr-management.png)


## Troubleshooting

### Port already in use
```powershell
$env:FLASK_RUN_PORT=5001
python app/app.py
```

### Dependency install fails (Windows)
```powershell
python -m pip install --upgrade pip
pip install -r app/requirements.txt
```

### Scanner not detecting QR
- Ensure webcam permission is allowed in browser.
- Improve lighting and keep QR within frame.
- Check camera is not used by another app.

### Reset local data
If needed, remove local DB/session files and rerun the app.

## Notes
- QR import supports required and optional columns; include School ID and Name at minimum.
- Keep your virtual environment activated while running the app.
