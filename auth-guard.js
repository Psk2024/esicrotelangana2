/* =========================================================
   AUTH GUARD
   Include this on every page that requires sign-in, AFTER
   firebase-config.js and the Firebase SDK <script> tags, and
   BEFORE the page's own data-fetching scripts (units.js,
   home.js, script.js). It:
     1. Keeps the page hidden until we know whether the user
        is signed in (avoids a flash of PII before redirect).
     2. Redirects to login.html if not signed in.
     3. Wires up any element with id="signOutBtn".
   ========================================================= */

/* The <html> tag starts with class="auth-checking" in the HTML
   itself (not added here), so the page is hidden from the very
   first paint - no flash of employee data before we know
   whether the visitor is signed in. */

firebase.initializeApp(firebaseConfig);
const auth = firebase.auth();

auth.onAuthStateChanged(user => {
  if (!user) {
    const here = window.location.pathname.split("/").pop() + window.location.search;
    window.location.replace(`login.html?redirect=${encodeURIComponent(here)}`);
    return;
  }
  document.documentElement.classList.remove("auth-checking");
  document.documentElement.classList.add("auth-ready");
  document.dispatchEvent(new CustomEvent("authReady", { detail: { user } }));

  const signOutBtn = document.getElementById("signOutBtn");
  if (signOutBtn) {
    signOutBtn.addEventListener("click", () => auth.signOut());
  }
});
