# 🎯 MaScan - QR Attendance System

A modern Flask-based web application for managing employee attendance using QR code scanning. MaScan streamlines the attendance tracking process with an intuitive interface, real-time event management, and comprehensive reporting.

**Tagline:** "Where showing up is mandatory, bro."

🌐 **Live Demo:** [mascan-qr.azurewebsites.net](https://mascan.me/)

---

## ✨ Features

- **QR Code Scanning**: Quick and easy employee check-in via QR code
- **QR Code Generation**: Import CSV files and automatically generate QR codes for bulk student/employee data
- **CSV Import**: Upload CSV files to populate student/employee database with automatic QR code generation
- **Employee Management**: Create, update, and manage employee records
- **Event Management**: Create and manage attendance events
- **Authentication**: Secure login system with role-based access
- **Dashboard**: Real-time attendance overview and analytics
- **Attendance History**: Detailed records of all attendance events
- **Activity Logs**: Track all system activities
- **PDF Export**: Generate attendance reports in PDF format
- **Responsive Design**: Mobile-friendly web interface
- **Dark Mode**: Full dark theme with one-click toggle
- **Real-time Search**: Instantly filter events and QR records

---

## 🚀 What's New in V2.0

MaScan V2.0 is a complete rebuild from the original Flet-based V1, migrated to **Flask** for better web compatibility, mobile camera support, and a modern UI.

### Framework Migration
- **Flet → Flask**: Full rewrite to a Python Flask web application with Jinja2 templates, enabling proper browser-based QR scanning and mobile support

### New Features
- **Mobile Camera QR Scanning**: Front/back camera switching via the browser — no native app needed
- **Food Attendance Category**: New time-slot category for tracking food/meal attendance at events
- **Manual User Management**: Add, edit, and delete users directly from the admin panel (no CSV required)
- **QR Code Generation & Batch Import**: Generate QR codes per student; bulk import via CSV/XLSX upload
- **PDF Export**: One-click PDF attendance reports with loading indicators

### UI/UX Improvements
- **Modern Toast Notifications**: Slide-in bottom-right toasts replace banner alerts — with progress bars and auto-dismiss
- **Glassmorphism Login**: Animated login page with floating gradient backgrounds
- **Dashboard Analytics**: Stat cards with count-up animations, live monitor status, and quick action buttons
- **Event Search**: Real-time search/filter across all events by name, description, or date
- **Page Transitions**: Smooth fade-in animations on every page load
- **Dark Mode**: Complete dark theme with CSS variables and localStorage persistence
- **Custom Error Pages**: Branded 404 and 500 error pages
- **Loading States**: Spinners on all form submissions, PDF exports, and camera switching

### Reliability & Code Quality
- **Input Validation**: All forms have `required`, `maxlength`, `minlength`, and `pattern` constraints
- **Graceful Error Handling**: User-friendly flash messages for all CRUD operations; sanitized error messages
- **Edge Case Handling**: Empty state designs with illustrations and call-to-action buttons on every page
- **Bug Fixes**: Fixed duplicate API routes, tuple comparison bug, null user crash, and camera switching reliability

### Deployment
- **Azure App Service**: Live deployment on Microsoft Azure with zip deploy pipeline
- **Production-Ready**: Debug mode disabled, proper error handlers, secure session management

---

## 🛠️ Prerequisites

- Python 3.8 or higher
- pip (Python package manager)
- SQLite3 (included with Python)

---

## 📦 Installation

### 1. Clone or Extract the Project
```bash
cd final-project
```

### 2. Create a Python Virtual Environment
```bash
python -m venv .venv
```

### 3. Activate the Virtual Environment

**On Windows:**
```bash
.\.venv\Scripts\Activate.ps1
```

**On macOS/Linux:**
```bash
source .venv/bin/activate
```

### 4. Install Dependencies
```bash
pip install -r requirements.txt
```

---

## 🚀 Running the Application

### Start the Flask Server
```bash
python app.py
```

The application will start on `http://localhost:5000`

**Output:**
```
╔══════════════════════════════════════════════════════════╗
║   🎯 MaScan - QR Attendance System                       ║
║   Flask Web Application                                  ║
╚══════════════════════════════════════════════════════════╝

Starting server...
- Debug Mode: True
- URL: http://localhost:5000
- Press CTRL+C to stop
```

### Default Credentials
- **Username:** `admin`
- **Password:** `Admin@123`

---

## 📁 Project Structure

```
final-project/
├── app.py                          # Application entry point
├── requirements.txt                # Python dependencies
├── pyproject.toml                 # Project configuration
├── flask_session/                 # Session storage
└── src/
    ├── flask_app.py               # Flask app factory
    ├── config/
    │   ├── constants.py           # App constants and configuration
    │   └── __init__.py
    ├── database/
    │   ├── db_manager.py          # Database operations
    │   └── __init__.py
    ├── routes/
    │   ├── api_routes.py          # API endpoints
    │   ├── attendance_routes.py    # Attendance management
    │   ├── auth_routes.py         # Authentication routes
    │   ├── dashboard_routes.py    # Dashboard views
    │   ├── event_routes.py        # Event management
    │   ├── user_routes.py         # User management
    │   └── __init__.py
    ├── utils/
    │   ├── qr_scanner.py          # QR code scanning utilities
    │   ├── pdf_export.py          # PDF report generation
    │   └── __init__.py
    ├── static/
    │   ├── css/
    │   │   └── style.css          # Stylesheet
    │   └── js/
    │       ├── main.js            # Main JavaScript
    │       └── scanner.js         # Scanner functionality
    └── templates/
        ├── base.html              # Base template
        ├── login.html             # Login page
        ├── scanner.html           # QR scanner page
        ├── dashboard.html         # Dashboard
        ├── activity_log.html      # Activity log
        ├── attendance_history.html # Attendance records
        ├── events/
        │   ├── create.html        # Create event
        │   ├── edit.html          # Edit event
        │   ├── list.html          # Event list
        │   └── view.html          # Event details
        └── users/
            ├── create.html        # Create user
            ├── edit.html          # Edit user
            └── list.html          # User list
```

---

## 🔧 Configuration

### Environment Variables

Create a `.env` file in the project root to override default settings:

```env
# Server Configuration
DEBUG=True
HOST=0.0.0.0
PORT=5000

# Database
DATABASE_PATH=mascan_attendance.db

# Session Configuration
SESSION_TYPE=filesystem
PERMANENT_SESSION_LIFETIME=3600
```

### Application Constants

Key configuration can be found in `src/config/constants.py`:

- **APP_TITLE**: Application display name
- **DEFAULT_USERNAME**: Admin username
- **DEFAULT_PASSWORD**: Admin password
- **DATABASE_NAME**: SQLite database file name
- **QR_SCAN_COOLDOWN**: Cooldown between scans (seconds)

---

## 💻 Usage

### 1. **Login**
   - Navigate to `http://localhost:5000`
   - Use default credentials (admin/admin123)

### 2. **Dashboard**
   - View attendance summary and overview
   - Access main features from navigation menu

### 3. **Import CSV & Generate QR Codes** (NEW!)
   - Go to Dashboard → QR Management (or use navbar)
   - Upload a CSV file with student/employee data
   - Required columns: School ID, Name
   - Optional columns: First Name, Last Name, Year, Section, Course
   - System automatically generates QR codes for all records
   - View, download, and manage generated QR codes
   - Download all QR codes as ZIP or individual codes
   - See [QR Code Management Guide](QR_CODE_MANAGEMENT.md) for detailed instructions

### 4. **Create Event**
   - Go to Events → Create Event
   - Set event name, date, and time
   - Generate QR codes for the event

### 5. **Scan Attendance**
   - Go to Scanner
   - Use webcam to scan employee QR codes
   - Real-time attendance recording

### 6. **Manage Users/Employees**
   - Users → List/Create for employee management
   - Edit or delete employee records

### 7. **View Reports**
   - Attendance History → Export as PDF
   - Generate attendance reports by event

---

## 📊 Key Routes

| Feature | Route | Description |
|---------|-------|-------------|
| Dashboard | `/dashboard` | Main dashboard view |
| Scanner | `/scan` | QR code scanner |
| QR Management | `/qr-management` | CSV import & QR code generation |
| Events | `/events` | Event management |
| Users | `/users` | User management |
| API | `/api/*` | RESTful API endpoints |
| Attendance | `/attendance` | Attendance records |
| Activity Log | `/activity-log` | System activity tracking |

---

## 🔐 Security

- Passwords are hashed using `bcrypt`
- Session management with Flask-Session
- CORS enabled for cross-origin requests
- Role-based access control for sensitive operations

---

## 📝 Dependencies

- **Framework**: Flask 3.0.0
- **Security**: bcrypt, Werkzeug
- **Database**: SQLite3
- **QR Code**: qrcode library
- **PDF Export**: ReportLab
- **Utilities**: python-dateutil, numpy

---

## 🐛 Troubleshooting

### Port Already in Use
```bash
# Change port via environment variable
$env:PORT = 5001
python app.py
```

### Virtual Environment Issues
```bash
# Deactivate and reactivate
deactivate
.\.venv\Scripts\Activate.ps1
```

### Database Issues
- Delete `mascan_attendance.db` to reset the database
- Recreate tables by restarting the application

---

## 📄 License

This project is open source and available under the MIT License.

---

## 👤 Support

For issues or questions, please refer to the project documentation or check the Activity Log for system events.

---

**Happy Scanning! 🎯**
