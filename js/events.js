// js/events.js

// 1. Import the specific Firebase modules you need
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getFirestore, collection, query, where, orderBy, getDocs } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// 2. Your Firebase configuration (Grab this from your Firebase Console)
const firebaseConfig = {
  apiKey: "AIzaSyDvXK8gu7nkCVpCwv6urbcfDmE_8FWZv3A",
  authDomain: "robes-of-black.firebaseapp.com",
  projectId: "robes-of-black",
  storageBucket: "robes-of-black.firebasestorage.app",
  messagingSenderId: "725561844044",
  appId: "1:725561844044:web:8ac74e18ce8256cf486fe9",
  measurementId: "G-0VF3L2F7JD"
};

// 3. Initialize Firebase and Firestore
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

// 4. Function to fetch and display events
async function loadEvents() {
    const eventListContainer = document.querySelector('.event-list');
    
    try {
        // Query: Get events where isPublished is true, ordered by date
        const eventsRef = collection(db, "events");
        const q = query(
            eventsRef, 
            where("isPublished", "==", true),
            orderBy("date", "asc")
        );

        const querySnapshot = await getDocs(q);
        
        // Clear the placeholder HTML
        eventListContainer.innerHTML = '';

        if (querySnapshot.empty) {
            eventListContainer.innerHTML = '<p style="color: #888; text-align: center;">More dates coming soon.</p>';
            return;
        }

        // Loop through the data and build the HTML
        querySnapshot.forEach((doc) => {
            const event = doc.data();
            
            // Convert Firebase Timestamp to a readable date (e.g., Oct 31, 2026)
            const eventDate = event.date.toDate().toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
            });

            // Create the list item element
            const li = document.createElement('li');
            li.className = 'event-item';
            
            li.innerHTML = `
                <span class="event-date">${eventDate}</span>
                <span class="event-venue">${event.venue}</span>
                <span class="event-location">${event.city}, ${event.state}</span>
            `;

            // If there's a ticket link, wrap the venue in an anchor tag
            if (event.ticketLink) {
                li.querySelector('.event-venue').innerHTML = `<a href="${event.ticketLink}" target="_blank" style="color: var(--text-main); text-decoration: underline; text-decoration-color: var(--accent-purple);">${event.venue}</a>`;
            }

            eventListContainer.appendChild(li);
        });

    } catch (error) {
        console.error("Error loading events: ", error);
        eventListContainer.innerHTML = '<p style="color: #ff4444;">Failed to load shows. Please try again later.</p>';
    }
}

// 5. Run the function when the script loads
loadEvents();
