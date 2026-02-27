# 🔐 ExitPass — Digital QR-Based Exit Pass Management System

A complete, production-ready web application replacing paper-based exit approval workflows. Employees submit digital pass requests, managers approve/reject instantly, and security guards scan QR codes for real-time verification.

---

## 🏗 Architecture

| Layer    | Technology               |
|----------|--------------------------|
| Frontend | GitHub Pages (static)    |
| Backend  | Google Apps Script (API) |
| Database | Google Sheets            |
| QR Codes | qrcode.js (client-side)  |
| Scanner  | jsQR (camera-based)      |

---

## 📁 Project Structure

```
exit-pass-system/
├── index.html        ← Login page
├── request.html      ← Employee: submit & track passes
├── approve.html      ← Approver: review & approve requests
├── guard.html        ← Guard: QR scanner + movement log
├── verify.html       ← QR landing: verify + mark exit/return
├── Code.gs           ← Google Apps Script backend
├── css/
│   └── style.css
└── js/
    ├── config.js     ← ⚠️ Configure YOUR API URL here
    ├── auth.js
    ├── api.js
    ├── ui.js
```

---

## 🚀 Setup Guide

### Step 1 — Create Google Sheet

1. Go to [sheets.google.com](https://sheets.google.com) → Create new spreadsheet
2. Name it: **ExitPassDB**
3. Create two sheets (tabs):

**Sheet: `USERS`**
| A | B | C | D | E |
|---|---|---|---|---|
| user_id | name | department | role | email |
| U001 | John Smith | Engineering | employee | john@company.com |
| U002 | Sarah Lee | HR | approver | sarah@company.com |
| U003 | Mike Guard | Security | guard | mike@company.com |

Roles: `employee`, `approver`, `guard`, `admin`

**Sheet: `EXIT_PASSES`**
| pass_id | user_id | reason | request_time | exit_from | exit_to | approval_status | approved_by | approval_time | movement_status | exit_time | return_time | guard_name |
|---------|---------|--------|--------------|-----------|---------|-----------------|-------------|---------------|-----------------|-----------|-------------|------------|

> Just create the header row — the system fills data automatically.

4. Copy the **Spreadsheet ID** from the URL:
   `https://docs.google.com/spreadsheets/d/`**`THIS_IS_YOUR_ID`**`/edit`

---

### Step 2 — Set Up Google Apps Script Backend

1. Go to [script.google.com](https://script.google.com) → **New Project**
2. Name it: `ExitPassBackend`
3. Replace the default code with the contents of `Code.gs`
4. Replace `YOUR_SPREADSHEET_ID_HERE` with your Spreadsheet ID (line ~22)
5. Click **Save** (💾)

**Deploy as Web App:**
1. Click **Deploy** → **New Deployment**
2. Click the gear icon → **Web App**
3. Set:
   - Execute as: **Me**
   - Who has access: **Anyone** (or *Anyone within [your organization]*)
4. Click **Deploy** → Authorize permissions
5. Copy the **Web App URL** (looks like `https://script.google.com/macros/s/ABC.../exec`)

---

### Step 3 — Configure Frontend

Edit `js/config.js`:

```javascript
const APP_CONFIG = {
  API_URL:     "https://script.google.com/macros/s/YOUR_SCRIPT_ID/exec",
  GITHUB_USER: "yourusername",   // Your GitHub username
  REPO_NAME:   "exit-pass-system",
  ORG_NAME:    "Your Company",
};
```

---

### Step 4 — Deploy to GitHub Pages

1. Create a new GitHub repository named `exit-pass-system`
2. Push all files:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/YOURUSERNAME/exit-pass-system.git
   git push -u origin main
   ```
3. Go to **Settings** → **Pages** → Source: **main branch** → **/ (root)**
4. Your site will be live at:
   `https://YOURUSERNAME.github.io/exit-pass-system/`

---

### Step 5 — Set Up Auto-Expire Trigger (Optional but Recommended)

In Apps Script:
1. Click **Triggers** (clock icon)
2. **Add Trigger**
3. Function: `autoExpirePasses`
4. Event source: **Time-driven**
5. Type: **Minutes timer** → Every **10 minutes**

---

## 🔄 System Workflow

```
Employee submits request
        ↓
Approver receives notification → APPROVED / REJECTED
        ↓
Employee receives QR code (on Approved passes)
        ↓
Employee shows QR at gate
        ↓
Guard scans QR → verify.html validates:
  · Approval check
  · Expiry check
  · Mark as EXITED
        ↓
Employee returns → Guard scans again → Mark as RETURNED
```

---

## 🔗 QR Code Format

```
https://YOURUSERNAME.github.io/exit-pass-system/verify.html?id=EP-XXXXXX
```

---

## 👥 Role Access Matrix

| Feature               | Employee | Approver | Guard | Admin |
|-----------------------|----------|----------|-------|-------|
| Submit pass request   | ✅       | —        | —     | ✅    |
| View own passes       | ✅       | —        | —     | ✅    |
| Approve/reject passes | —        | ✅       | —     | ✅    |
| View all passes       | —        | ✅       | —     | ✅    |
| Scan QR / verify      | —        | —        | ✅    | ✅    |
| Mark exit/return      | —        | —        | ✅    | ✅    |

---

## 🔐 Security Notes

- QR codes contain **only the pass URL** — no sensitive data embedded
- All validation is **server-side** in Google Apps Script
- Google Sheets is never directly exposed to the frontend
- Every action is **timestamped and logged**
- Session stored in `localStorage` (no server sessions needed)

---

## 📊 Google Sheet — Column Reference

### USERS Sheet
| Col | Field | Values |
|-----|-------|--------|
| A | user_id | Unique ID (e.g., U001) - Used for login |
| B | name | Full name |
| C | department | Department name |
| D | role | employee / approver / guard / admin |
| E | email | Work email |

### EXIT_PASSES Sheet
| Col | Field | Notes |
|-----|-------|-------|
| A | pass_id | Auto-generated (EP-XXXXXX) |
| B | user_id | Links to USERS sheet |
| C | reason | Reason for exit |
| D | request_time | ISO timestamp |
| E | exit_from | Planned exit time |
| F | exit_to | Planned return time |
| G | approval_status | PENDING / APPROVED / REJECTED |
| H | approved_by | Approver's name |
| I | approval_time | When approved/rejected |
| J | movement_status | NOT_EXITED / EXITED / RETURNED / EXPIRED |
| K | exit_time | When guard marked EXITED |
| L | return_time | When guard marked RETURNED |
| M | guard_name | Guard who processed |

---

## 🛠 Troubleshooting

**"User not found" on login**
→ Check the Employee Number is in the USERS sheet (column A), exact match

**"CORS error" / API not responding**
→ Re-deploy the Apps Script (every code change needs a new deployment)
→ Make sure Access is set to **Anyone**

**QR code not scanning**
→ Allow camera permissions in browser
→ Try manual entry as fallback on guard.html

**Pass shows as Expired immediately**
→ Check exit_to time — it must be in the future when created
→ Check server timezone in Apps Script matches expectations

---

## 📄 License

MIT — Free to use and modify for organizational internal use.
