// ─────────────────────────────────────────────────────────────────
// auth.js — Authentication & Session Management
// ─────────────────────────────────────────────────────────────────

const Auth = (() => {
  const SESSION_KEY = "ep_session";

  /** Save session after login */
  function saveSession(data) {
    const session = {
      user_id:    data.user_id,
      name:       data.name,
      email:      data.email,
      department: data.department,
      role:       data.role,          // "employee" | "approver" | "guard" | "admin"
      loggedInAt: Date.now(),
    };
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    return session;
  }

  /** Get current session or null */
  function getSession() {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session = JSON.parse(raw);

      // Check timeout if configured
      const timeout = APP_CONFIG.SESSION_TIMEOUT_MINS;
      if (timeout > 0) {
        const elapsed = (Date.now() - session.loggedInAt) / 60000;
        if (elapsed > timeout) {
          clearSession();
          return null;
        }
      }
      return session;
    } catch {
      return null;
    }
  }

  /** Clear session (logout) */
  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  /** Require auth. If not authed, redirect to login. Returns session or redirects. */
  function requireAuth(allowedRoles = []) {
    const session = getSession();
    if (!session) {
      window.location.href = "index.html";
      return null;
    }
    if (allowedRoles.length > 0 && !allowedRoles.includes(session.role)) {
      // Redirect to appropriate dashboard
      redirectByRole(session.role);
      return null;
    }
    return session;
  }

  /** Redirect user to correct page based on their role */
  function redirectByRole(role) {
    const routes = {
      employee: "request.html",
      approver: "approve.html",
      guard:    "guard.html",
      admin:    "approve.html",  // admin sees approver panel by default
    };
    window.location.href = routes[role] || "index.html";
  }

  return { saveSession, getSession, clearSession, requireAuth, redirectByRole };
})();

window.Auth = Auth;
