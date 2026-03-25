// js/dashboard.js

import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getAuth, onAuthStateChanged, signOut } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-auth.js";
import { getFirestore, collection, addDoc, getDocs, updateDoc, deleteDoc, doc, setDoc, getDoc, Timestamp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-firestore.js";

// Your Firebase Config
const firebaseConfig = {
  apiKey: "AIzaSyDvXK8gu7nkCVpCwv6urbcfDmE_8FWZv3A",
  authDomain: "robes-of-black.firebaseapp.com",
  projectId: "robes-of-black",
  storageBucket: "robes-of-black.firebasestorage.app",
  messagingSenderId: "725561844044",
  appId: "1:725561844044:web:8ac74e18ce8256cf486fe9",
  measurementId: "G-0VF3L2F7JD"
};

const app = initializeApp(firebaseConfig);
const auth = getAuth(app);
const db = getFirestore(app);

// === AUTHENTICATION GUARD ===
onAuthStateChanged(auth, (user) => {
    if (user) {
        document.body.style.display = 'flex';
        document.getElementById('user-email').textContent = user.email;
        loadTours(); // Pre-load data
        loadMerch();
        loadSettings();
    } else {
        window.location.replace('portal.html');
    }
});

document.getElementById('logout-btn')?.addEventListener('click', async () => {
    await signOut(auth);
});

// === SPA ROUTING ===
const navLinks = document.querySelectorAll('.nav-menu a');
const views = document.querySelectorAll('.view-section');

navLinks.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        // Remove active class from all links and views
        navLinks.forEach(l => l.classList.remove('active'));
        views.forEach(v => v.classList.remove('active'));
        
        // Add active class to clicked link and corresponding view
        link.classList.add('active');
        const targetId = link.getAttribute('data-target');
        document.getElementById(targetId).classList.add('active');
    });
});

// === MANAGE TOURS (CRUD) ===
const tourTableBody = document.getElementById('tour-table-body');
const tourForm = document.getElementById('tour-form');

async function loadTours() {
    tourTableBody.innerHTML = '<tr><td colspan="5">Loading...</td></tr>';
    const querySnapshot = await getDocs(collection(db, "events"));
    tourTableBody.innerHTML = '';
    
    querySnapshot.forEach((docSnap) => {
        const event = docSnap.data();
        const id = docSnap.id;
        // Handle JS Date parsing from Firebase Timestamp or string
        const dateObj = event.date.toDate ? event.date.toDate() : new Date(event.date);
        
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${dateObj.toLocaleDateString()}</td>
            <td>${event.venue}</td>
            <td>${event.city}, ${event.state}</td>
            <td><span style="color: ${event.isPublished ? 'var(--accent-green)' : '#888'}">${event.isPublished ? 'Visible' : 'Hidden'}</span></td>
            <td>
                <button class="btn btn-small btn-outline edit-tour-btn" data-id="${id}">Edit</button>
                <button class="btn btn-small btn-danger delete-tour-btn" data-id="${id}">Delete</button>
            </td>
        `;
        // Attach data to the row so we don't have to fetch it again when editing
        tr.querySelector('.edit-tour-btn').addEventListener('click', () => openEditTour(id, event, dateObj));
        tr.querySelector('.delete-tour-btn').addEventListener('click', () => deleteTour(id));
        tourTableBody.appendChild(tr);
    });
}

function openEditTour(id, event, dateObj) {
    document.getElementById('tour-modal-title').textContent = "Edit Event";
    document.getElementById('tour-id').value = id;
    document.getElementById('tour-date').value = dateObj.toISOString().split('T')[0];
    document.getElementById('tour-venue').value = event.venue;
    document.getElementById('tour-city').value = event.city;
    document.getElementById('tour-state').value = event.state;
    document.getElementById('tour-link').value = event.ticketLink || '';
    document.getElementById('tour-published').checked = event.isPublished;
    window.openModal('tour-modal');
}

tourForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('tour-id').value;
    const dateInput = new Date(document.getElementById('tour-date').value + 'T12:00:00'); // Prevent timezone shift
    const tourData = {
        date: Timestamp.fromDate(dateInput),
        venue: document.getElementById('tour-venue').value,
        city: document.getElementById('tour-city').value,
        state: document.getElementById('tour-state').value,
        ticketLink: document.getElementById('tour-link').value,
        isPublished: document.getElementById('tour-published').checked
    };

    if (id) {
        await updateDoc(doc(db, "events", id), tourData);
    } else {
        await addDoc(collection(db, "events"), tourData);
    }
    window.closeModal('tour-modal');
    loadTours();
});

async function deleteTour(id) {
    if(confirm('Are you sure you want to delete this event?')) {
        await deleteDoc(doc(db, "events", id));
        loadTours();
    }
}

// === MANAGE MERCH (CRUD) ===
const merchGrid = document.getElementById('merch-grid-container');
const merchForm = document.getElementById('merch-form');

async function loadMerch() {
    merchGrid.innerHTML = '<p>Loading merch...</p>';
    const querySnapshot = await getDocs(collection(db, "merch"));
    merchGrid.innerHTML = '';
    
    querySnapshot.forEach((docSnap) => {
        const item = docSnap.data();
        const id = docSnap.id;
        
        const div = document.createElement('div');
        div.className = 'merch-card';
        div.innerHTML = `
            <img src="${item.photoUrl}" alt="${item.name}">
            <h3>${item.name}</h3>
            <div style="color: var(--accent-purple); font-weight: bold; margin-bottom: 0.5rem;">${item.price}</div>
            <p>${item.description}</p>
            <div style="margin-bottom: 1rem; color: ${item.isPublished ? 'var(--accent-green)' : '#888'}">
                ${item.isPublished ? 'Visible' : 'Hidden'}
            </div>
            <div>
                <button class="btn btn-small btn-outline edit-merch-btn" data-id="${id}">Edit</button>
                <button class="btn btn-small btn-danger delete-merch-btn" data-id="${id}">Delete</button>
            </div>
        `;
        div.querySelector('.edit-merch-btn').addEventListener('click', () => openEditMerch(id, item));
        div.querySelector('.delete-merch-btn').addEventListener('click', () => deleteMerch(id));
        merchGrid.appendChild(div);
    });
}

function openEditMerch(id, item) {
    document.getElementById('merch-modal-title').textContent = "Edit Product";
    document.getElementById('merch-id').value = id;
    document.getElementById('merch-name').value = item.name;
    document.getElementById('merch-photo').value = item.photoUrl;
    document.getElementById('merch-price').value = item.price;
    document.getElementById('merch-desc').value = item.description;
    document.getElementById('merch-link').value = item.stripeLink;
    document.getElementById('merch-published').checked = item.isPublished;
    window.openModal('merch-modal');
}

merchForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const id = document.getElementById('merch-id').value;
    const merchData = {
        name: document.getElementById('merch-name').value,
        photoUrl: document.getElementById('merch-photo').value,
        price: document.getElementById('merch-price').value,
        description: document.getElementById('merch-desc').value,
        stripeLink: document.getElementById('merch-link').value,
        isPublished: document.getElementById('merch-published').checked
    };

    if (id) {
        await updateDoc(doc(db, "merch", id), merchData);
    } else {
        await addDoc(collection(db, "merch"), merchData);
    }
    window.closeModal('merch-modal');
    loadMerch();
});

async function deleteMerch(id) {
    if(confirm('Are you sure you want to delete this product?')) {
        await deleteDoc(doc(db, "merch", id));
        loadMerch();
    }
}

// === SETTINGS ===
const settingsForm = document.getElementById('settings-form');

async function loadSettings() {
    const docSnap = await getDoc(doc(db, "settings", "global"));
    if (docSnap.exists()) {
        const data = docSnap.data();
        document.getElementById('setting-header').value = data.floatingHeader || '';
        document.getElementById('setting-about').value = data.aboutText || '';
        document.getElementById('setting-logo').value = data.logoUrl || '';
    }
}

settingsForm.addEventListener('submit', async (e) => {
    e.preventDefault();
    const settingsData = {
        floatingHeader: document.getElementById('setting-header').value,
        aboutText: document.getElementById('setting-about').value,
        logoUrl: document.getElementById('setting-logo').value
    };
    
    const submitBtn = settingsForm.querySelector('button');
    submitBtn.textContent = 'Saving...';
    
    // We use setDoc here to overwrite/create a single specific document named 'global'
    await setDoc(doc(db, "settings", "global"), settingsData);
    
    submitBtn.textContent = 'Saved!';
    setTimeout(() => submitBtn.textContent = 'Save Settings', 2000);
});
