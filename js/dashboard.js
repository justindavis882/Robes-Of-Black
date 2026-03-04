// js/dashboard.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Paste your Firebase Config here
const firebaseConfig = {
  apiKey: "AIzaSyDvXK8gu7nkCVpCwv6urbcfDmE_8FWZv3A",
  authDomain: "robes-of-black.firebaseapp.com",
  projectId: "robes-of-black",
  storageBucket: "robes-of-black.firebasestorage.app",
  messagingSenderId: "725561844044",
  appId: "1:725561844044:web:8ac74e18ce8256cf486fe9",
  measurementId: "G-0VF3L2F7JD"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// The Auth Guard
onAuthStateChanged(auth, (user) => {
    if (user) {
        // User is signed in. 
        // 1. Reveal the page
        document.body.style.display = 'flex';
        
        // 2. Populate their email in the sidebar
        document.getElementById('user-email').textContent = user.email;
        
    } else {
        // User is NOT signed in.
        // Use location.replace so they can't use the back button to return here
        window.location.replace('portal.html');
    }
});

// Handle Logout
const logoutBtn = document.getElementById('logout-btn');
if (logoutBtn) {
    logoutBtn.addEventListener('click', async () => {
        try {
            await signOut(auth);
            // The onAuthStateChanged listener above will automatically catch 
            // the sign-out and redirect the user back to portal.html
        } catch (error) {
            console.error("Error signing out: ", error);
            alert("Failed to log out. Please try again.");
        }
    });
}
