// js/auth.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, signInWithEmailAndPassword } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";

// Paste your Firebase Config here (same as the one in events.js)
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "robes-of-black.firebaseapp.com",
    projectId: "robes-of-black",
    storageBucket: "robes-of-black.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const auth = getAuth(app);

// Grab UI elements
const loginForm = document.getElementById('login-form');
const emailInput = document.getElementById('email');
const passwordInput = document.getElementById('password');
const errorMessage = document.getElementById('error-message');

// Handle Form Submission
loginForm.addEventListener('submit', async (e) => {
    e.preventDefault(); // Prevent page reload
    
    const email = emailInput.value;
    const password = passwordInput.value;
    const submitBtn = loginForm.querySelector('button');
    
    // UI feedback while loading
    submitBtn.textContent = 'Authenticating...';
    submitBtn.disabled = true;
    errorMessage.textContent = '';

    try {
        // Attempt to sign in
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Success! Redirect to the actual dashboard
        console.log("Logged in as:", user.email);
        window.location.href = 'dashboard.html'; 
        
    } catch (error) {
        console.error("Login failed:", error.code);
        
        // Handle specific Firebase errors for better UX
        if (error.code === 'auth/invalid-credential') {
            errorMessage.textContent = 'Invalid email or password.';
        } else if (error.code === 'auth/too-many-requests') {
            errorMessage.textContent = 'Too many failed attempts. Try again later.';
        } else {
            errorMessage.textContent = 'Failed to connect to authentication server.';
        }
        
        // Reset button
        submitBtn.textContent = 'Access Portal';
        submitBtn.disabled = false;
    }
});
