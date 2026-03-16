<div align="center">

# 🎯 MaScan

### QR Attendance System for Student Organizations

*"Where showing up is mandatory, bro."*

**Built with Flask · Deployed on Azure · Designed for the real world**

🌐 [**www.mascan.me**](https://www.mascan.me) · [Live on Azure](https://mascan-qr.azurewebsites.net)

</div>

---

## 📌 What is MaScan?

MaScan is a **QR code-based attendance tracking system** built specifically for **student organizations**. It replaces the tedious process of manual attendance sheets with a fast, scannable, and exportable digital workflow.

Whether you're running an org meeting, a campus event, or tracking food distribution — MaScan handles it. Open the scanner on any phone, point it at a QR code, and the attendance is instantly recorded.

**Key idea:** One admin sets up events and manages the student database. Scanners (volunteers, officers) just open the web app on their phone and start scanning — no app install required.

---

## ✨ Features

### Core Functionality
| Feature | Description |
|---------|-------------|
| 📷 **QR Scanner** | Browser-based camera scanning — works on desktop and mobile, front/back camera toggle |
| 📋 **Event Management** | Create events with dates, descriptions, and time-slot categories (AM, PM, Food) |
| 👥 **Student Database** | Import students via CSV/XLSX upload or add them manually with auto-generated QR codes |
| 📊 **Attendance Tracking** | Real-time attendance recording with duplicate detection and audio feedback |
| 📄 **PDF Export** | One-click attendance reports per event, ready for submission |
| 🔍 **Search & Filter** | Real-time search across events, students, and QR records |
| 👤 **User Roles** | Admin (full control) and Scanner (scan-only) roles with secure login |

### Design & Experience
| Feature | Description |
|---------|-------------|
| 🌗 **Dark Mode** | Full dark theme toggle with persistent preference |
| 🍞 **Toast Notifications** | Modern slide-in notifications with progress bars and auto-dismiss |
| 📱 **Responsive Design** | Mobile-first layout that works on phones, tablets, and desktops |
| ✨ **Animations** | Page transitions, count-up stats, glassmorphism login, smooth hover effects |
| 🎨 **Branded UI** | Consistent color system (blue/purple gradient), Poppins + Inter typography |
| 🚫 **Error Pages** | Custom 404 and 500 pages with navigation back to the app |
| ⏳ **Loading States** | Spinners on every form submission, PDF export, and camera switch |

---

## 🚀 What's New in V2.0

MaScan V2.0 is a **complete rebuild**. The original V1 was built with [Flet](https://flet.dev/) (Python desktop UI). V2.0 is a full **Flask web application** — accessible from any browser on any device.

### Why the rewrite?
The Flet framework couldn't access mobile cameras through the browser, which defeated the purpose of a QR scanner meant for org events. Flask + vanilla JS gave us full control over the camera API, responsive design, and deployment flexibility.

### V1 → V2.0 Changelog

**🔧 Architecture**
- Flet desktop app → Flask web app with Jinja2 templates
- In-memory storage → SQLite database with persistent data
- Single-user → Multi-user with role-based authentication (bcrypt-hashed passwords)

**📷 Scanner**
- Desktop-only camera → Browser camera on any device (mobile + desktop)
- No camera switching → Front/back camera toggle with device enumeration
- Basic scan → Duplicate detection, audio beep, cooldown timer, visual feedback

**🎛️ New Modules**
- QR code generation + batch import (CSV/XLSX → individual QR images → ZIP download)
- Food attendance time-slot category
- Activity log tracking all system actions
- PDF attendance report export
- Manual user/student CRUD (no CSV required)

**🎨 UI/UX**
- Glassmorphism login with animated floating backgrounds
- Dashboard with stat cards, count-up animations, and quick actions
- Event cards with date badges, 3-dot menus, and section grouping (Today/Upcoming/Past)
- Toast notification system (bottom-right, progress bar, auto-dismiss)
- Real-time search bar on events page
- Page fade-in transitions on every navigation
- Custom branded 404/500 error pages
- Empty state illustrations with call-to-action buttons on every page

**🛡️ Reliability**
- Input validation on all forms (`required`, `maxlength`, `minlength`, `pattern`)
- Flash messages for every CRUD operation (create, edit, delete)
- Sanitized error messages (no raw stack traces shown to users)
- Graceful camera permission handling with browser-specific hints

---

## 🛠️ Tech Stack

| Layer | Technology |
|-------|-----------|
| **Backend** | Python 3.8+, Flask 3.0, Gunicorn |
| **Frontend** | Jinja2, Vanilla JS, CSS3 (custom properties + dark mode) |
| **Database** | SQLite3 (file-based, zero-config) |
| **Auth** | bcrypt password hashing, Flask-Session (filesystem) |
| **QR** | qrcode + Pillow (generation), jsQR (browser scanning) |
| **PDF** | ReportLab |
| **Icons** | Font Awesome 6.5 |
| **Fonts** | Google Fonts — Poppins (headings), Inter (body) |
| **Deployment** | Microsoft Azure App Service, Gunicorn WSGI |
| **Domain** | Namecheap (.me TLD via GitHub Student Pack) |

---

## 📦 Local Setup

### Prerequisites
- Python 3.8 or higher
- pip (comes with Python)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/cloudy-april/QR-Attendance-Checker---Flask-Version.git
cd QR-Attendance-Checker---Flask-Version

# 2. Create virtual environment
python -m venv .venv

# 3. Activate it
# Windows:
.\.venv\Scripts\Activate.ps1
# macOS/Linux:
source .venv/bin/activate

# 4. Install dependencies
pip install -r requirements.txt

# 5. Run the app
python app/app.py
```

Open **http://localhost:5000** in your browser.

### Default Login
| Field | Value |
|-------|-------|
| Username | `admin` |
| Password | `Admin@123` |

---

## 📁 Project Structure

```
QR-Attendance-Checker---Flask-Version/
├── app/
│   ├── app.py                      # Entry point — starts Flask server
│   ├── pyproject.toml               # Project metadata
│   ├── requirements.txt             # App-specific dependencies
│   └── src/
│       ├── flask_app.py             # App factory (create_app), blueprints, error handlers
│       ├── config/
│       │   └── constants.py         # App title, defaults, camera settings, colors
│       ├── database/
│       │   └── db_manager.py        # SQLite operations — all queries in one place
│       ├── routes/
│       │   ├── api_routes.py        # REST API (attendance submit, quick-mark, export)
│       │   ├── attendance_routes.py # Scanner page, attendance history
│       │   ├── auth_routes.py       # Login, logout, session management
│       │   ├── dashboard_routes.py  # Dashboard, activity log
│       │   ├── event_routes.py      # Event CRUD
│       │   ├── qr_management_routes.py  # QR generation, CSV import, batch download
│       │   └── user_routes.py       # User CRUD (admin only)
│       ├── utils/
│       │   ├── pdf_export.py        # ReportLab PDF generation
│       │   └── qr_scanner.py        # QR code image generation (Pillow + qrcode)
│       ├── static/
│       │   ├── css/style.css        # All styles — light/dark mode, responsive, animations
│       │   ├── js/main.js           # Theme toggle, hamburger menu, toast system
│       │   ├── js/modal.js          # Delete confirmation, alert modal, PDF export
│       │   ├── js/scanner.js        # Camera management, QR detection, attendance submit
│       │   └── images/              # Logo assets (MS_Logo_White.png, MS_Logo_Blue.ico)
│       └── templates/
│           ├── base.html            # Master layout — navbar, footer, modals, toast container
│           ├── login.html           # Glassmorphism login page
│           ├── dashboard.html       # Admin/scanner dashboard with stats
│           ├── dashboard_mobile.html
│           ├── scanner.html         # Desktop QR scanner (camera picker dropdown)
│           ├── scanner_mobile.html  # Mobile QR scanner (camera toggle button)
│           ├── activity_log.html
│           ├── attendance_history.html
│           ├── events/              # list, create, edit, view
│           ├── users/               # list, create, edit
│           ├── qr/manage.html       # QR generation, CSV upload, student list
│           └── errors/              # 404.html, 500.html
├── android-app/                     # Companion Android app (WebView wrapper)
├── requirements.txt                 # Top-level dependencies (same as app/)
├── wsgi.py                          # WSGI entry point for Azure/Gunicorn
├── startup.sh                       # Azure App Service startup script
├── Dockerfile                       # Container deployment option
├── runtime.txt                      # Python version for Azure
└── sample_students.csv              # Example CSV for testing QR import
```

---

## 💻 How to Use

### For Admins

1. **Login** → Use your admin credentials at the login page
2. **Create an Event** → Events → Create Event → fill in name, date, description
3. **Import Students** → QR Management → Upload CSV (School ID, Name, Course, Year, Section) → QR codes are auto-generated
4. **Print/Share QR Codes** → Download individual codes or batch ZIP → distribute to students
5. **Start Scanning** → Scanner → Select event + time slot → point camera at QR codes
6. **Export Report** → Event → View Details → Export PDF

### For Scanners (Volunteers/Officers)

1. **Login** → Use scanner credentials provided by admin
2. **Open Scanner** → Tap "Start Scanning" on dashboard
3. **Select Event** → Pick the active event and time slot
4. **Scan** → Point phone camera at student QR codes → attendance is recorded instantly
5. **Switch Camera** → Tap the camera switch button to toggle front/back

### CSV Format for Student Import

```csv
school_id,first_name,middle_initial,last_name,course,year,section
2024-0001,Juan,A,Dela Cruz,BSCS,3,A
2024-0002,Maria,B,Santos,BSIT,2,B
```

---

## 🔐 Security

| Aspect | Implementation |
|--------|---------------|
| **Passwords** | bcrypt hashing (never stored in plaintext) |
| **Sessions** | Flask-Session with filesystem backend, permanent sessions |
| **Access Control** | `@login_required` and `@admin_required` decorators on all routes |
| **Error Messages** | Sanitized — no raw exceptions or stack traces shown to users |
| **Input Validation** | Server-side + client-side HTML5 validation on all forms |
| **CORS** | Flask-CORS configured for API endpoints |

---

## 🌐 Deployment (Azure)

MaScan is deployed on **Microsoft Azure App Service** (Linux, Python 3.12).

### Quick Deploy

```powershell
# Build zip (excludes .git, __pycache__, .db, flask_session)
$src = "C:\Users\Fred\QR-Attendance-Checker---Flask-Version"
$dest = "C:\Users\Fred\mascan_slim.zip"
# ... (zip creation script)

# Deploy via Azure OneDeploy API
az webapp deploy --name mascan-qr --resource-group mascan-rg --src-path $dest --type zip
```

### Custom Domain

The app is accessible at **[www.mascan.me](https://www.mascan.me)** via a custom `.me` domain from Namecheap (free with GitHub Student Developer Pack), with DNS pointing to Azure App Service and Azure-managed SSL.

---

## 🐛 Troubleshooting

| Problem | Solution |
|---------|----------|
| Port already in use | `$env:PORT = 5001; python app/app.py` |
| Camera not working | Use HTTPS or localhost — cameras require a secure context |
| Camera won't switch | Make sure browser has permission for camera; try refreshing the page |
| Database reset needed | Delete `mascan_attendance.db` and restart the app |
| Virtual env issues | `deactivate` then re-activate: `.\.venv\Scripts\Activate.ps1` |
| Azure deploy fails | Run `az login` to refresh token, then retry deploy |

---

## 👥 Team

**MaScan** is developed as a Software Engineering course project.

---

## 📄 License

This project is open source and available under the [MIT License](LICENSE).

---

<div align="center">

**🎯 MaScan — QR Attendance System**

*Built with ❤️ for student organizations*

</div>
