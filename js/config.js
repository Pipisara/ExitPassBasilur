// ─────────────────────────────────────────────────────────────────
// config.js — Exit Pass System Configuration
// ─────────────────────────────────────────────────────────────────
// ⚠️  IMPORTANT: Replace the values below with your actual values
//     before deploying to GitHub Pages.
// ─────────────────────────────────────────────────────────────────

const APP_CONFIG = {
  // Replace with your deployed Google Apps Script Web App URL
  API_URL: "https://script.google.com/macros/s/AKfycbwiUUKLA44awBS5lN5JVZxCfSLC06bXL6PEv9rCd66FbFR8kIaFG9t7j9SSW1AXllCY7Q/exec",

  // Replace with your GitHub username
  GITHUB_USER: "Pipisara",

  // Repository name (keep as-is if you use the same repo name)
  REPO_NAME: "exit-pass-system",

  // App metadata
  APP_NAME: "ExitPass",
  APP_TAGLINE: "Secure Exit Management System",
  ORG_NAME: "Your Organization",

  // Pass ID prefix (aesthetic choice)
  PASS_PREFIX: "EP",

  // Auto-logout after X minutes of inactivity (0 = disabled)
  SESSION_TIMEOUT_MINS: 60,
};

// Derived values (auto-computed — do not edit)
APP_CONFIG.BASE_URL = `https://${APP_CONFIG.GITHUB_USER}.github.io/${APP_CONFIG.REPO_NAME}`;
APP_CONFIG.VERIFY_URL = `${APP_CONFIG.BASE_URL}/verify.html`;

// Freeze to prevent accidental mutation
Object.freeze(APP_CONFIG);

// Make globally accessible
window.APP_CONFIG = APP_CONFIG;
