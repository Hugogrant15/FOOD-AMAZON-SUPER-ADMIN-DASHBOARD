// auth.js
// Include this on every protected page (dashboard.html, orders.html, etc.)

(function () {
  const SESSION_EXPIRED_PATH = "auth.html";

  // ✅ Check if user is authenticated
  function isAuthenticated() {
    // Support both token names (old: "key", new: "token")
    const token = localStorage.getItem("token") || localStorage.getItem("key");
    // Basic validation (not full JWT verification)
    return Boolean(token && token.length > 10);
  }

  // ✅ Redirect to session expired page
  function redirectToSessionExpired() {
    window.location.replace(SESSION_EXPIRED_PATH);
  }

  // ✅ Run main auth check
  function checkAuth() {
    if (!isAuthenticated()) {
      redirectToSessionExpired();
    }
  }

  // Run immediately
  checkAuth();

  // Handle back/forward navigation caching
  window.addEventListener("pageshow", () => checkAuth());

  // Optional: prevent cached history returning user to protected pages
  window.addEventListener("load", () => {
    try {
      history.replaceState(null, document.title, location.href);
    } catch (e) {
      /* ignore */
    }
  });

  // Expose for debugging or manual rechecks
  window.__auth = { isAuthenticated, checkAuth, redirectToSessionExpired };
})();
