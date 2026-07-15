/* =========================================================
   FIREBASE CONFIG
   Fill this in with your own Firebase project's config,
   found at: Firebase Console -> Project Settings -> General
   -> "Your apps" -> SDK setup and configuration.

   Steps to set this up:
   1. Go to https://console.firebase.google.com and create a
      project (or reuse an existing one).
   2. Project Settings -> General -> "Add app" -> Web (</>) if
      you don't have a web app registered yet. Copy the config
      object it gives you into firebaseConfig below.
   3. Authentication -> Sign-in method -> enable "Email/Password".
   4. Authentication -> Users -> "Add user" -> create a login
      (email + password) for each person who should have access.
      There's no self-signup on this site by design - you add
      users manually from the console.
   ========================================================= */
const firebaseConfig = {
  apiKey: "PASTE_YOUR_FIREBASE_API_KEY_HERE",
  authDomain: "PASTE_YOUR_PROJECT.firebaseapp.com",
  projectId: "PASTE_YOUR_PROJECT_ID",
  appId: "PASTE_YOUR_APP_ID"
};
