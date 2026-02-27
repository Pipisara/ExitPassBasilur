// ─────────────────────────────────────────────────────────────────
// ui.js — Shared UI Utilities
// ─────────────────────────────────────────────────────────────────

const UI = (() => {

  // ── Toast Notifications ───────────────────────────────────────
  function toast(message, type = "info", duration = 3500) {
    let container = document.getElementById("toast-container");
    if (!container) {
      container = document.createElement("div");
      container.id = "toast-container";
      document.body.appendChild(container);
    }

    const icons = { success: "✓", error: "✕", info: "ℹ", warning: "⚠" };
    const el = document.createElement("div");
    el.className = `toast toast--${type}`;
    el.innerHTML = `<span>${icons[type] || "ℹ"}</span><span>${message}</span>`;
    container.appendChild(el);

    setTimeout(() => {
      el.style.animation = "toast-in 0.3s ease reverse both";
      setTimeout(() => el.remove(), 300);
    }, duration);
  }

  // ── Button Loading State ───────────────────────────────────────
  function setButtonLoading(btn, loading, originalText) {
    if (loading) {
      btn.disabled = true;
      btn.dataset.originalText = btn.innerHTML;
      btn.innerHTML = `<span class="spinner"></span> Processing…`;
    } else {
      btn.disabled = false;
      btn.innerHTML = originalText || btn.dataset.originalText || "Submit";
    }
  }

  // ── Status Badge HTML ──────────────────────────────────────────
  function statusBadge(status) {
    const map = {
      PENDING: ["pending", "Pending"],
      APPROVED: ["approved", "Approved"],
      REJECTED: ["rejected", "Rejected"],
      EXPIRED: ["expired", "Expired"],
      EXITED: ["exited", "Exited"],
      RETURNED: ["returned", "Returned"],
      NOT_EXITED: ["not_exited", "Not Exited"],
    };
    const [cls, label] = map[status] || ["pending", status];
    return `<span class="badge badge--${cls}">${label}</span>`;
  }

  // ── Format datetime ────────────────────────────────────────────
  function formatDateTime(str) {
    if (!str) return "—";
    try {
      const d = new Date(str);
      return d.toLocaleString("en-US", {
        month: "short", day: "numeric",
        hour: "2-digit", minute: "2-digit",
      });
    } catch { return str; }
  }

  function formatDate(str) {
    if (!str) return "—";
    try {
      return new Date(str).toLocaleDateString("en-US", {
        year: "numeric", month: "short", day: "numeric",
      });
    } catch { return str; }
  }

  // ── Show / Hide elements ────────────────────────────────────────
  function show(el) { if (el) el.classList.remove("hidden"); }
  function hide(el) { if (el) el.classList.add("hidden"); }

  // ── Render topbar user info ────────────────────────────────────
  function renderTopbarUser(session) {
    const nameEl = document.getElementById("user-name");
    const roleEl = document.getElementById("user-role");
    const deptEl = document.getElementById("user-dept");
    if (nameEl) nameEl.textContent = session.name || session.user_id;
    if (roleEl) {
      roleEl.textContent = session.role.toUpperCase();
      roleEl.className = `topbar__role-badge role--${session.role}`;
    }
    if (deptEl) deptEl.textContent = session.department || "";
  }

  // ── Logout handler ─────────────────────────────────────────────
  function bindLogout() {
    const btn = document.getElementById("logout-btn");
    if (btn) {
      btn.addEventListener("click", () => {
        Auth.clearSession();
        window.location.href = "index.html";
      });
    }
  }

  // ── Confirm modal ──────────────────────────────────────────────
  function confirm(title, message) {
    return new Promise((resolve) => {
      const backdrop = document.createElement("div");
      backdrop.className = "modal-backdrop";
      backdrop.innerHTML = `
        <div class="modal">
          <div class="modal__header">
            <h3 class="card__title">${title}</h3>
          </div>
          <div class="modal__body">
            <p style="color:var(--text-secondary);font-size:14px;">${message}</p>
          </div>
          <div class="modal__footer">
            <button class="btn btn--ghost" id="modal-cancel">Cancel</button>
            <button class="btn btn--primary" id="modal-confirm">Confirm</button>
          </div>
        </div>
      `;
      document.body.appendChild(backdrop);
      document.getElementById("modal-cancel").onclick = () => { backdrop.remove(); resolve(false); };
      document.getElementById("modal-confirm").onclick = () => { backdrop.remove(); resolve(true); };
      backdrop.addEventListener("click", (e) => { if (e.target === backdrop) { backdrop.remove(); resolve(false); } });
    });
  }

  // ── Generate QR Code (via QRCode.js) ──────────────────────────
  function generateQR(containerId, url) {
    const el = document.getElementById(containerId);
    if (!el || typeof QRCode === "undefined") return;
    el.innerHTML = "";
    new QRCode(el, {
      text: url,
      width: 200,
      height: 200,
      colorDark: "#000000",
      colorLight: "#ffffff",
      correctLevel: QRCode.CorrectLevel.M,
    });
  }

  // ── Time remaining text ───────────────────────────────────────
  function timeRemaining(exitTo) {
    const now = new Date();
    const end = new Date(exitTo);
    const diff = end - now;
    if (diff <= 0) return { text: "Expired", expired: true };
    const mins = Math.floor(diff / 60000);
    const hours = Math.floor(mins / 60);
    if (hours > 0) return { text: `${hours}h ${mins % 60}m remaining`, expired: false };
    return { text: `${mins}m remaining`, expired: false };
  }

  return {
    toast,
    setButtonLoading,
    statusBadge,
    formatDateTime,
    formatDate,
    show,
    hide,
    renderTopbarUser,
    bindLogout,
    confirm,
    generateQR,
    timeRemaining,
  };
})();

window.UI = UI;
