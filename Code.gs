// ═══════════════════════════════════════════════════════════════════
// ExitPass — Google Apps Script Backend (Code.gs)
// Deploy as: Execute as Me · Access: Anyone
// ═══════════════════════════════════════════════════════════════════
//
// SETUP STEPS:
//   1. Open script.google.com → New Project → name it "ExitPassBackend"
//   2. In script editor, paste this entire file as Code.gs
//   3. Replace SPREADSHEET_ID below with your Google Sheet's ID
//   4. Deploy → New Deployment → Web App
//      · Execute as: Me
//      · Who has access: Anyone  (or Anyone within organization)
//   5. Copy the deployment URL into js/config.js → API_URL
//
// SPREADSHEET SHEETS REQUIRED:
//   Sheet 1: USERS        (columns: user_id, name, department, role, email)
//   Sheet 2: EXIT_PASSES  (columns listed in PASS_COLUMNS below)
//
// ═══════════════════════════════════════════════════════════════════

// ── CONFIG ────────────────────────────────────────────────────────
const SPREADSHEET_ID = "1TDOTqE_U3o8Yx15RPVYKMt2eGihKp2R9TuMoFYXSLTM";  // ← Replace this
const ALLOWED_ORIGINS = ["*"];  // Restrict to your GitHub Pages URL if desired

// Column definitions (1-indexed for getRange)
const USER_COLS = {
  user_id:    1,
  name:       2,
  department: 3,
  role:       4,
  email:      5,
};

const PASS_COLS = {
  pass_id:         1,
  user_id:         2,
  reason:          3,
  request_time:    4,
  exit_from:       5,
  exit_to:         6,
  approval_status: 7,
  approved_by:     8,
  approval_time:   9,
  movement_status: 10,
  exit_time:       11,
  return_time:     12,
  guard_name:      13,
};

// ── ENTRY POINT ───────────────────────────────────────────────────
function doPost(e) {
  const headers = {
    "Access-Control-Allow-Origin":  "*",
    "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
    "Content-Type": "application/json",
  };

  try {
    const body    = JSON.parse(e.postData.contents);
    const action  = body.action;
    let result;

    switch (action) {
      case "loginUser":           result = loginUser(body);           break;
      case "createExitPass":      result = createExitPass(body);      break;
      case "getMyPasses":         result = getMyPasses(body);         break;
      case "getPendingPasses":    result = getPendingPasses(body);    break;
      case "getAllPasses":        result = getAllPasses(body);         break;
      case "approvePass":         result = approvePass(body);         break;
      case "verifyPass":          result = verifyPass(body);          break;
      case "updateMovementStatus":result = updateMovementStatus(body);break;
      case "getGuardLog":         result = getGuardLog(body);         break;
      case "getStats":            result = getStats(body);            break;
      default:
        result = { success: false, error: "Unknown action: " + action };
    }

    return ContentService
      .createTextOutput(JSON.stringify(result))
      .setMimeType(ContentService.MimeType.JSON);

  } catch (err) {
    return ContentService
      .createTextOutput(JSON.stringify({ success: false, error: err.message }))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// Handle OPTIONS preflight (CORS)
function doGet(e) {
  return ContentService
    .createTextOutput(JSON.stringify({ success: true, message: "ExitPass API running" }))
    .setMimeType(ContentService.MimeType.JSON);
}

// ── HELPERS ───────────────────────────────────────────────────────
function getSheet(name) {
  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  return ss.getSheetByName(name);
}

function getAllRows(sheet) {
  const data = sheet.getDataRange().getValues();
  if (data.length <= 1) return [];  // Only header or empty
  return data.slice(1);  // Skip header row
}

function generatePassId() {
  const timestamp = Date.now().toString().slice(-6);
  const rand      = Math.floor(Math.random() * 1000).toString().padStart(3, "0");
  return "EP-" + timestamp + rand;
}

function formatDateTime(date) {
  if (!date || date === "") return "";
  const d = new Date(date);
  if (isNaN(d)) return String(date);
  return d.toISOString();
}

function now() {
  return new Date().toISOString();
}

function parseDate(str) {
  if (!str) return null;
  const d = new Date(str);
  return isNaN(d) ? null : d;
}

// ── 1. LOGIN USER ─────────────────────────────────────────────────
function loginUser(body) {
  const userId = (body.user_id || "").toString().trim();
  if (!userId) return { success: false, error: "Employee Number is required." };

  const sheet = getSheet("USERS");
  const rows  = getAllRows(sheet);

  const row = rows.find(r => (r[USER_COLS.user_id - 1] || "").toString().trim().toUpperCase() === userId.toUpperCase());
  if (!row) return { success: false, error: "User not found. Contact your administrator." };

  return {
    success:    true,
    user_id:    row[USER_COLS.user_id    - 1],
    name:       row[USER_COLS.name       - 1],
    email:      row[USER_COLS.email      - 1],
    department: row[USER_COLS.department - 1],
    role:       (row[USER_COLS.role      - 1] || "employee").toLowerCase(),
  };
}

// ── 2. CREATE EXIT PASS ───────────────────────────────────────────
function createExitPass(body) {
  const { user_id, reason, exit_from, exit_to } = body;
  if (!user_id || !reason || !exit_from || !exit_to) {
    return { success: false, error: "Missing required fields." };
  }

  const exitFromDate = parseDate(exit_from);
  const exitToDate   = parseDate(exit_to);

  if (!exitFromDate || !exitToDate) {
    return { success: false, error: "Invalid date format." };
  }
  if (exitToDate <= exitFromDate) {
    return { success: false, error: "Return time must be after exit time." };
  }

  const sheet   = getSheet("EXIT_PASSES");
  const pass_id = generatePassId();

  const row = new Array(Object.keys(PASS_COLS).length).fill("");
  row[PASS_COLS.pass_id         - 1] = pass_id;
  row[PASS_COLS.user_id         - 1] = user_id;
  row[PASS_COLS.reason          - 1] = reason;
  row[PASS_COLS.request_time    - 1] = now();
  row[PASS_COLS.exit_from       - 1] = exit_from;
  row[PASS_COLS.exit_to         - 1] = exit_to;
  row[PASS_COLS.approval_status - 1] = "PENDING";
  row[PASS_COLS.movement_status - 1] = "NOT_EXITED";

  sheet.appendRow(row);

  return { success: true, pass_id };
}

// ── 3. GET MY PASSES ──────────────────────────────────────────────
function getMyPasses(body) {
  const { user_id } = body;
  if (!user_id) return { success: false, error: "user_id required." };

  const passSheet = getSheet("EXIT_PASSES");
  const userSheet = getSheet("USERS");
  const passRows  = getAllRows(passSheet);

  const myRows = passRows
    .filter(r => r[PASS_COLS.user_id - 1] === user_id)
    .reverse()  // Most recent first
    .map(r => formatPassRow(r));

  return { success: true, passes: myRows };
}

// ── 4. GET PENDING PASSES ─────────────────────────────────────────
function getPendingPasses(body) {
  const passSheet = getSheet("EXIT_PASSES");
  const userSheet = getSheet("USERS");
  const passRows  = getAllRows(passSheet);
  const userMap   = buildUserMap(userSheet);

  const pending = passRows
    .filter(r => r[PASS_COLS.approval_status - 1] === "PENDING")
    .map(r => formatPassRow(r, userMap))
    .sort((a, b) => new Date(a.request_time) - new Date(b.request_time));

  return { success: true, passes: pending };
}

// ── 5. GET ALL PASSES ─────────────────────────────────────────────
function getAllPasses(body) {
  const limit     = body.limit || 100;
  const passSheet = getSheet("EXIT_PASSES");
  const userSheet = getSheet("USERS");
  const passRows  = getAllRows(passSheet);
  const userMap   = buildUserMap(userSheet);

  const passes = passRows
    .slice(-limit)
    .reverse()
    .map(r => formatPassRow(r, userMap));

  return { success: true, passes };
}

// ── 6. APPROVE PASS ───────────────────────────────────────────────
function approvePass(body) {
  const { pass_id, status, approver_name } = body;
  if (!pass_id || !status) return { success: false, error: "pass_id and status required." };
  if (!["APPROVED", "REJECTED"].includes(status)) {
    return { success: false, error: "Invalid status. Use APPROVED or REJECTED." };
  }

  const sheet = getSheet("EXIT_PASSES");
  const rows  = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    if (rows[i][PASS_COLS.pass_id - 1] === pass_id) {
      if (rows[i][PASS_COLS.approval_status - 1] !== "PENDING") {
        return { success: false, error: "This pass has already been processed." };
      }
      sheet.getRange(i + 1, PASS_COLS.approval_status).setValue(status);
      sheet.getRange(i + 1, PASS_COLS.approved_by).setValue(approver_name || "System");
      sheet.getRange(i + 1, PASS_COLS.approval_time).setValue(now());
      return { success: true, pass_id, status };
    }
  }

  return { success: false, error: "Pass not found." };
}

// ── 7. VERIFY PASS ────────────────────────────────────────────────
function verifyPass(body) {
  const { pass_id } = body;
  if (!pass_id) return { success: false, error: "pass_id required." };

  const passSheet = getSheet("EXIT_PASSES");
  const userSheet = getSheet("USERS");
  const userMap   = buildUserMap(userSheet);
  const rows      = passSheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row[PASS_COLS.pass_id - 1] === pass_id) {

      // ── Expiry Check ──────────────────────────────────────────
      const exitTo   = parseDate(row[PASS_COLS.exit_to - 1]);
      const movement = row[PASS_COLS.movement_status - 1];
      const approval = row[PASS_COLS.approval_status - 1];

      if (approval === "APPROVED" && movement === "NOT_EXITED" && exitTo && new Date() > exitTo) {
        // Auto-expire
        passSheet.getRange(i + 1, PASS_COLS.movement_status).setValue("EXPIRED");
        row[PASS_COLS.movement_status - 1] = "EXPIRED";
      }

      const pass = formatPassRow(row, userMap);
      return { success: true, pass };
    }
  }

  return { success: false, error: "Pass not found in the system." };
}

// ── 8. UPDATE MOVEMENT STATUS ─────────────────────────────────────
function updateMovementStatus(body) {
  const { pass_id, movement, guard_name } = body;
  if (!pass_id || !movement) return { success: false, error: "pass_id and movement required." };
  if (!["EXITED", "RETURNED"].includes(movement)) {
    return { success: false, error: "Invalid movement. Use EXITED or RETURNED." };
  }

  const sheet = getSheet("EXIT_PASSES");
  const rows  = sheet.getDataRange().getValues();

  for (let i = 1; i < rows.length; i++) {
    const row = rows[i];
    if (row[PASS_COLS.pass_id - 1] === pass_id) {
      const currentMovement = row[PASS_COLS.movement_status - 1];
      const approval        = row[PASS_COLS.approval_status - 1];

      // Must be approved
      if (approval !== "APPROVED") {
        return { success: false, error: "This pass has not been approved." };
      }

      // Validate transitions
      const validTransitions = {
        EXITED:   ["NOT_EXITED"],
        RETURNED: ["EXITED"],
      };

      if (!validTransitions[movement].includes(currentMovement)) {
        return {
          success: false,
          error: `Cannot transition from ${currentMovement} to ${movement}.`,
        };
      }

      // Update
      sheet.getRange(i + 1, PASS_COLS.movement_status).setValue(movement);
      sheet.getRange(i + 1, PASS_COLS.guard_name).setValue(guard_name || "");

      if (movement === "EXITED") {
        sheet.getRange(i + 1, PASS_COLS.exit_time).setValue(now());
      } else if (movement === "RETURNED") {
        sheet.getRange(i + 1, PASS_COLS.return_time).setValue(now());
      }

      return { success: true, pass_id, movement };
    }
  }

  return { success: false, error: "Pass not found." };
}

// ── 9. GET GUARD LOG ──────────────────────────────────────────────
function getGuardLog(body) {
  const limit     = body.limit || 30;
  const passSheet = getSheet("EXIT_PASSES");
  const userSheet = getSheet("USERS");
  const userMap   = buildUserMap(userSheet);
  const rows      = getAllRows(passSheet);

  const moved = rows
    .filter(r => ["EXITED", "RETURNED"].includes(r[PASS_COLS.movement_status - 1]))
    .map(r => formatPassRow(r, userMap))
    .sort((a, b) => {
      const ta = new Date(a.exit_time || a.return_time || 0);
      const tb = new Date(b.exit_time || b.return_time || 0);
      return tb - ta;
    })
    .slice(0, limit);

  return { success: true, entries: moved };
}

// ── 10. GET STATS ─────────────────────────────────────────────────
function getStats(body) {
  const passSheet = getSheet("EXIT_PASSES");
  const rows      = getAllRows(passSheet);
  const today     = new Date();
  today.setHours(0, 0, 0, 0);

  let pending      = 0;
  let approvedToday = 0;
  let rejectedToday = 0;
  let currentlyOut  = 0;

  rows.forEach(r => {
    const ap  = r[PASS_COLS.approval_status - 1];
    const mv  = r[PASS_COLS.movement_status - 1];
    const apt = parseDate(r[PASS_COLS.approval_time - 1]);

    if (ap === "PENDING")   pending++;
    if (mv === "EXITED")    currentlyOut++;

    if (apt && apt >= today) {
      if (ap === "APPROVED") approvedToday++;
      if (ap === "REJECTED") rejectedToday++;
    }
  });

  return { success: true, pending, approvedToday, rejectedToday, currentlyOut };
}

// ── AUTO-EXPIRE TRIGGER ───────────────────────────────────────────
// Set this up as a time-driven trigger in Apps Script:
//   Triggers → Add Trigger → autoExpirePasses → Time-driven → Every 10 minutes
function autoExpirePasses() {
  const sheet = getSheet("EXIT_PASSES");
  const rows  = sheet.getDataRange().getValues();
  const now   = new Date();
  let expired = 0;

  for (let i = 1; i < rows.length; i++) {
    const approval = rows[i][PASS_COLS.approval_status - 1];
    const movement = rows[i][PASS_COLS.movement_status - 1];
    const exitTo   = parseDate(rows[i][PASS_COLS.exit_to - 1]);

    if (approval === "APPROVED" && movement === "NOT_EXITED" && exitTo && now > exitTo) {
      sheet.getRange(i + 1, PASS_COLS.movement_status).setValue("EXPIRED");
      expired++;
    }
  }

  Logger.log(`Auto-expire run: ${expired} passes expired.`);
}

// ── UTILITY: Build user map ───────────────────────────────────────
function buildUserMap(userSheet) {
  const rows = getAllRows(userSheet);
  const map  = {};
  rows.forEach(r => {
    const uid = r[USER_COLS.user_id - 1];
    if (uid) {
      map[uid] = {
        name:       r[USER_COLS.name       - 1],
        department: r[USER_COLS.department - 1],
        role:       r[USER_COLS.role       - 1],
        email:      r[USER_COLS.email      - 1],
      };
    }
  });
  return map;
}

// ── UTILITY: Format a pass row to object ─────────────────────────
function formatPassRow(row, userMap) {
  const userId = row[PASS_COLS.user_id - 1];
  const user   = userMap ? userMap[userId] : null;

  return {
    pass_id:         row[PASS_COLS.pass_id         - 1],
    user_id:         userId,
    employee_name:   user ? user.name       : "",
    department:      user ? user.department : "",
    reason:          row[PASS_COLS.reason          - 1],
    request_time:    formatDateTime(row[PASS_COLS.request_time    - 1]),
    exit_from:       formatDateTime(row[PASS_COLS.exit_from       - 1]),
    exit_to:         formatDateTime(row[PASS_COLS.exit_to         - 1]),
    approval_status: row[PASS_COLS.approval_status - 1],
    approved_by:     row[PASS_COLS.approved_by     - 1],
    approval_time:   formatDateTime(row[PASS_COLS.approval_time   - 1]),
    movement_status: row[PASS_COLS.movement_status - 1],
    exit_time:       formatDateTime(row[PASS_COLS.exit_time       - 1]),
    return_time:     formatDateTime(row[PASS_COLS.return_time     - 1]),
    guard_name:      row[PASS_COLS.guard_name      - 1],
  };
}

// ── SETUP SCRIPT ──────────────────────────────────────────────────
// Run this function once from the Apps Script editor to create the sheets and columns
function setupDatabase() {
  if (SPREADSHEET_ID === "YOUR_SPREADSHEET_ID_HERE") {
    throw new Error("Please set your SPREADSHEET_ID at the top of the file before running setupDatabase.");
  }

  const ss = SpreadsheetApp.openById(SPREADSHEET_ID);
  
  // 1. Setup USERS sheet
  let usersSheet = ss.getSheetByName("USERS");
  if (!usersSheet) {
    usersSheet = ss.insertSheet("USERS");
  }
  const userHeaders = ["user_id", "name", "department", "role", "email"];
  usersSheet.getRange(1, 1, 1, userHeaders.length).setValues([userHeaders]);
  usersSheet.getRange(1, 1, 1, userHeaders.length).setFontWeight("bold");
  usersSheet.setFrozenRows(1);

  // Add dummy data if empty
  if (usersSheet.getLastRow() <= 1) {
    usersSheet.appendRow(["U001", "John Smith", "Engineering", "employee", "john@company.com"]);
    usersSheet.appendRow(["U002", "Sarah Lee", "HR", "approver", "sarah@company.com"]);
    usersSheet.appendRow(["U003", "Mike Guard", "Security", "guard", "mike@company.com"]);
    usersSheet.appendRow(["A001", "Admin System", "IT", "admin", "admin@company.com"]);
  }

  // 2. Setup EXIT_PASSES sheet
  let passesSheet = ss.getSheetByName("EXIT_PASSES");
  if (!passesSheet) {
    passesSheet = ss.insertSheet("EXIT_PASSES");
  }
  const passHeaders = [
    "pass_id", "user_id", "reason", "request_time", "exit_from", 
    "exit_to", "approval_status", "approved_by", "approval_time", 
    "movement_status", "exit_time", "return_time", "guard_name"
  ];
  passesSheet.getRange(1, 1, 1, passHeaders.length).setValues([passHeaders]);
  passesSheet.getRange(1, 1, 1, passHeaders.length).setFontWeight("bold");
  passesSheet.setFrozenRows(1);

  // 3. Optional: Remove default "Sheet1" if it exists
  const defaultSheet = ss.getSheetByName("Sheet1");
  if (defaultSheet && ss.getSheets().length > 1) {
    ss.deleteSheet(defaultSheet);
  }

  Logger.log("✅ Database setup complete! USERS and EXIT_PASSES sheets are ready.");
}
