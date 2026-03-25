// js/main.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, getDocs, doc, getDoc, query, where, orderBy, addDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-storage.js";

// Firebase Config
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
const db = getFirestore(app);
const storage = getStorage(app); 

// === SPA ROUTING ===
const navLinks = document.querySelectorAll('.nav-links a');
const views = document.querySelectorAll('.view-section');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Update active nav state
        navLinks.forEach(l => l.classList.remove('active'));
        link.classList.add('active');
        
        // Toggle view visibility
        const targetId = link.getAttribute('data-target');
        views.forEach(v => v.classList.remove('active'));
        document.getElementById(targetId).classList.add('active');

        // Scroll to top of content area on view change
        document.querySelector('main.content').scrollTo(0, 0);
    });
});

// === DATA FETCHING ===

// 1. Fetch Global Settings
async function loadSettings() {
    try {
        const docSnap = await getDoc(doc(db, "settings", "global"));
        if (docSnap.exists()) {
            const settings = docSnap.data();
            
            // Apply Floating Header
            if (settings.floatingHeader && settings.floatingHeader.trim() !== "") {
                const headerEl = document.getElementById('floating-header');
                headerEl.textContent = settings.floatingHeader;
                headerEl.style.display = 'block';
            }
            
            // Apply About Text
            if (settings.aboutText) {
                document.getElementById('about-content').textContent = settings.aboutText;
            }

            // Apply Custom Logo if provided
            if (settings.logoUrl && settings.logoUrl.trim() !== "") {
                document.getElementById('site-logo').src = settings.logoUrl;
                document.getElementById('hero-logo').src = settings.logoUrl;
            }
        }
    } catch (error) {
        console.error("Error loading settings:", error);
    }
}

// 2. Fetch Published Tours
async function loadTours() {
    const listContainer = document.getElementById('tour-list');
    try {
        const q = query(collection(db, "events"), where("isPublished", "==", true), orderBy("date", "asc"));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            listContainer.innerHTML = '<p style="color: #888;">No upcoming dates currently. The void is quiet.</p>';
            return;
        }

        listContainer.innerHTML = ''; // Clear placeholder
        snapshot.forEach(docSnap => {
            const event = docSnap.data();
            // Parse Firestore timestamp or Date string
            const dateObj = event.date.toDate ? event.date.toDate() : new Date(event.date);
            const dateString = dateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });

            const li = document.createElement('li');
            li.className = 'event-item';
            
            let venueHtml = event.venue;
            if (event.ticketLink) {
                venueHtml = `<a href="${event.ticketLink}" target="_blank" rel="noopener noreferrer">${event.venue}</a>`;
            }

            li.innerHTML = `
                <div class="event-date">${dateString}</div>
                <div class="event-venue">${venueHtml}</div>
                <div class="event-location">${event.city}, ${event.state}</div>
            `;
            listContainer.appendChild(li);
        });
    } catch (error) {
        console.error("Error loading tours:", error);
        listContainer.innerHTML = '<p style="color: #ff4444;">Failed to load the itinerary.</p>';
    }
}

// 3. Fetch Published Merch
async function loadMerch() {
    const gridContainer = document.getElementById('merch-list');
    try {
        const q = query(collection(db, "merch"), where("isPublished", "==", true));
        const snapshot = await getDocs(q);
        
        if (snapshot.empty) {
            gridContainer.innerHTML = '<p style="color: #888; grid-column: 1 / -1;">No artifacts currently available.</p>';
            return;
        }

        gridContainer.innerHTML = ''; // Clear placeholder
        snapshot.forEach(docSnap => {
            const item = docSnap.data();
            
            const div = document.createElement('div');
            div.className = 'merch-card';
            div.innerHTML = `
                <img src="${item.photoUrl}" alt="${item.name}" onerror="this.src='https://via.placeholder.com/300x300?text=No+Image'">
                <h3>${item.name}</h3>
                <div class="price">${item.price}</div>
                <p>${item.description}</p>
                <a href="${item.stripeLink}" target="_blank" rel="noopener noreferrer" class="btn-buy">Acquire</a>
            `;
            gridContainer.appendChild(div);
        });
    } catch (error) {
        console.error("Error loading merch:", error);
        gridContainer.innerHTML = '<p style="color: #ff4444; grid-column: 1 / -1;">Failed to load the armory.</p>';
    }
}

// === CONTACT FORM HANDLING ===
const contactForm = document.getElementById('contact-form');

if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const submitBtn = document.getElementById('contact-submit-btn');
        const statusText = document.getElementById('contact-status');
        const fileInput = document.getElementById('contact-file');
        
        const name = document.getElementById('contact-name').value;
        const email = document.getElementById('contact-email').value;
        const message = document.getElementById('contact-message').value;
        const file = fileInput.files[0];

        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
        statusText.style.color = 'var(--accent-green)';
        statusText.textContent = 'Initiating transfer...';

        try {
            let fileUrl = null;

            // 1. Upload File if one was selected
            if (file) {
                // Check size client-side first (100MB)
                if (file.size > 100 * 1024 * 1024) {
                    throw new Error("File is too large. Maximum size is 100MB.");
                }

                statusText.textContent = 'Uploading file... do not close page.';
                const uniqueFileName = `${Date.now()}_${file.name}`;
                const storageRef = ref(storage, `contact_uploads/${uniqueFileName}`);
                const uploadTask = await uploadBytesResumable(storageRef, file);
                fileUrl = await getDownloadURL(uploadTask.ref);
            }

            // 2. Save Message Data to Firestore
            statusText.textContent = 'Securing message...';
            await addDoc(collection(db, "messages"), {
                name: name,
                email: email,
                message: message,
                fileUrl: fileUrl, // Will be null if no file attached
                timestamp: serverTimestamp(),
                read: false
            });

            // Success
            statusText.textContent = 'Message sent to the void successfully.';
            contactForm.reset();

        } catch (error) {
            console.error("Submission Error:", error);
            statusText.style.color = '#ff4444';
            statusText.textContent = error.message || 'Failed to send message. Try again later.';
        } finally {
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
            setTimeout(() => { statusText.textContent = ''; }, 5000);
        }
    });
}

// Initialize all data streams
loadSettings();
loadTours();
loadMerch();
