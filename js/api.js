// ─────────────────────────────────────────────────────────────────
// api.js — Backend API Communication Layer
// All calls go through doPost() on Google Apps Script
// ─────────────────────────────────────────────────────────────────

const API = (() => {

  /** Core POST request to Google Apps Script */
  async function call(payload) {
    const url = APP_CONFIG.API_URL;
    try {
      const res = await fetch(url, {
        method:  "POST",
        headers: { "Content-Type": "text/plain" },
        // GAS requires text/plain for CORS; we JSON-stringify the body
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      return data;
    } catch (err) {
      console.error("API Error:", err);
      return { success: false, error: err.message };
    }
  }

  // ── 1. Login User ─────────────────────────────────────────────
  async function loginUser(userId) {
    return call({ action: "loginUser", user_id: userId });
  }

  // ── 2. Create Exit Pass ───────────────────────────────────────
  async function createExitPass({ user_id, reason, exit_from, exit_to }) {
    return call({ action: "createExitPass", user_id, reason, exit_from, exit_to });
  }

  // ── 3. Get My Passes (for employee) ───────────────────────────
  async function getMyPasses(user_id) {
    return call({ action: "getMyPasses", user_id });
  }

  // ── 4. Get Pending Passes (for approver) ──────────────────────
  async function getPendingPasses() {
    return call({ action: "getPendingPasses" });
  }

  // ── 5. Get All Passes (for approver history) ──────────────────
  async function getAllPasses(limit = 50) {
    return call({ action: "getAllPasses", limit });
  }

  // ── 6. Approve or Reject Pass ─────────────────────────────────
  async function approvePass({ pass_id, status, approver_name }) {
    return call({ action: "approvePass", pass_id, status, approver_name });
  }

  // ── 7. Verify Pass (QR scan landing) ─────────────────────────
  async function verifyPass(pass_id) {
    return call({ action: "verifyPass", pass_id });
  }

  // ── 8. Update Movement Status (guard action) ──────────────────
  async function updateMovementStatus({ pass_id, movement, guard_name }) {
    return call({ action: "updateMovementStatus", pass_id, movement, guard_name });
  }

  // ── 9. Get Guard Log (recent movements) ───────────────────────
  async function getGuardLog(limit = 30) {
    return call({ action: "getGuardLog", limit });
  }

  // ── 10. Get Stats ─────────────────────────────────────────────
  async function getStats() {
    return call({ action: "getStats" });
  }

  return {
    loginUser,
    createExitPass,
    getMyPasses,
    getPendingPasses,
    getAllPasses,
    approvePass,
    verifyPass,
    updateMovementStatus,
    getGuardLog,
    getStats,
  };
})();

window.API = API;
