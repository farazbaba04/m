import { auth, db, collection, getDocs, deleteDoc, doc, setDoc, getDoc } from './firebase-config.js';
import { showAlert } from './auth.js';

// Your Firebase API Key (from your config)
const FIREBASE_API_KEY = "AIzaSyDRwh-tQe1cV0G0-RXbxVZfF-LZ4iUQVDI";

// Create User - Firebase Authentication mein bhi create hoga
async function createUser(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    const fullName = document.getElementById('fullName').value;
    const role = document.getElementById('role').value;
    
    const submitBtn = event.target.querySelector('button[type="submit"]');
    const originalText = submitBtn.textContent;
    submitBtn.textContent = 'Creating user...';
    submitBtn.disabled = true;
    
    try {
        // Create user in Firebase Authentication
        const signUpResponse = await fetch(`https://identitytoolkit.googleapis.com/v1/accounts:signUp?key=${FIREBASE_API_KEY}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                email: email,
                password: password,
                returnSecureToken: true
            })
        });
        
        const signUpData = await signUpResponse.json();
        
        if (signUpData.error) {
            throw new Error(signUpData.error.message);
        }
        
        const uid = signUpData.localId;
        
        // Save user data in Firestore
        await setDoc(doc(db, 'users', uid), {
            uid: uid,
            email: email,
            fullName: fullName,
            role: role,
            createdAt: new Date().toISOString(),
            createdBy: 'admin',
            status: 'active'
        });
        
        showAlert(`✅ User "${fullName}" created successfully! Password: ${password}`, 'success');
        document.getElementById('createUserForm').reset();
        await loadUsers();
        
    } catch (error) {
        if (error.message.includes('EMAIL_EXISTS')) {
            showAlert('❌ Email already exists!', 'error');
        } else {
            showAlert('❌ Error: ' + error.message, 'error');
        }
    } finally {
        submitBtn.textContent = originalText;
        submitBtn.disabled = false;
    }
}

// Load all users
async function loadUsers() {
    const usersList = document.getElementById('usersList');
    const statsDiv = document.getElementById('stats');
    
    if (!usersList) return;
    
    usersList.innerHTML = '<div class="card">Loading users...</div>';
    
    try {
        const querySnapshot = await getDocs(collection(db, 'users'));
        const users = [];
        
        querySnapshot.forEach((doc) => {
            users.push({ id: doc.id, ...doc.data() });
        });
        
        users.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        
        if (users.length === 0) {
            usersList.innerHTML = '<div class="card">No users found. Create your first user!</div>';
            if (statsDiv) statsDiv.innerHTML = '';
            return;
        }
        
        updateStats(users);
        
        usersList.innerHTML = '';
        users.forEach((user) => {
            usersList.appendChild(createUserCard(user));
        });
        
    } catch (error) {
        usersList.innerHTML = '<div class="card">Error loading users: ' + error.message + '</div>';
    }
}

// Update statistics
function updateStats(users) {
    const statsDiv = document.getElementById('stats');
    const roles = {
        'IT_Executive': 0,
        'Assistant_Manager': 0,
        'HOD_IT': 0,
        'Account_Officer': 0,
        'ADMIN': 0
    };
    
    users.forEach(user => {
        if (roles[user.role] !== undefined) {
            roles[user.role]++;
        }
    });
    
    statsDiv.innerHTML = `
        <div class="stat-card" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);">
            <div class="stat-number">${users.length}</div>
            <div class="stat-label">Total Users</div>
        </div>
        <div class="stat-card" style="background: linear-gradient(135deg, #007bff 0%, #0056b3 100%);">
            <div class="stat-number">${roles['IT_Executive']}</div>
            <div class="stat-label">IT Executives</div>
        </div>
        <div class="stat-card" style="background: linear-gradient(135deg, #fd7e14 0%, #dc6b0a 100%);">
            <div class="stat-number">${roles['Assistant_Manager']}</div>
            <div class="stat-label">Assistant Managers</div>
        </div>
        <div class="stat-card" style="background: linear-gradient(135deg, #6f42c1 0%, #5a32a3 100%);">
            <div class="stat-number">${roles['HOD_IT']}</div>
            <div class="stat-label">HOD IT</div>
        </div>
        <div class="stat-card" style="background: linear-gradient(135deg, #28a745 0%, #1e7e34 100%);">
            <div class="stat-number">${roles['Account_Officer']}</div>
            <div class="stat-label">Account Officers</div>
        </div>
    `;
}

// Create user card
function createUserCard(user) {
    const card = document.createElement('div');
    card.className = 'user-card';
    const date = new Date(user.createdAt).toLocaleString();
    
    const roleColors = {
        'ADMIN': '#dc3545',
        'IT_Executive': '#007bff',
        'Assistant_Manager': '#fd7e14',
        'HOD_IT': '#6f42c1',
        'Account_Officer': '#28a745'
    };
    
    card.innerHTML = `
        <div class="user-info">
            <h4>${escapeHtml(user.fullName)}</h4>
            <p>📧 ${escapeHtml(user.email)}</p>
            <span class="user-role" style="background: ${roleColors[user.role]}; color: white; padding: 4px 12px; border-radius: 20px; font-size: 12px; display: inline-block; margin-top: 5px;">
                ${user.role.replace('_', ' ')}
            </span>
            <p style="font-size: 11px; margin-top: 8px; color: #999;">📅 ${date}</p>
        </div>
        ${user.role !== 'ADMIN' ? `<button class="delete-btn" onclick="deleteUser('${user.uid}')">🗑️ Delete</button>` : '<span style="color: #999; font-size: 12px;">👑 Admin</span>'}
    `;
    return card;
}

// Delete user
async function deleteUser(uid) {
    if (!confirm('⚠️ Delete this user?')) return;
    
    try {
        const userDoc = await getDoc(doc(db, 'users', uid));
        const userData = userDoc.data();
        
        if (!userData) {
            showAlert('User not found!', 'error');
            return;
        }
        
        await deleteDoc(doc(db, 'users', uid));
        showAlert(`✅ User "${userData.fullName}" deleted!`, 'success');
        await loadUsers();
        
    } catch (error) {
        showAlert('Error: ' + error.message, 'error');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

export { createUser, loadUsers, deleteUser };