import { auth, db, signInWithEmailAndPassword, signOut, collection, query, where, getDocs } from './firebase-config.js';

// Login User
async function loginUser(event) {
    event.preventDefault();
    
    const email = document.getElementById('email').value;
    const password = document.getElementById('password').value;
    
    try {
        // Sign in with Firebase Auth
        const userCredential = await signInWithEmailAndPassword(auth, email, password);
        const user = userCredential.user;
        
        // Get user data from Firestore
        const q = query(collection(db, 'users'), where('uid', '==', user.uid));
        const querySnapshot = await getDocs(q);
        
        let userData = null;
        querySnapshot.forEach((doc) => {
            userData = { id: doc.id, ...doc.data() };
        });
        
        if (userData) {
            // Store user data in localStorage
            localStorage.setItem('user', JSON.stringify({
                uid: user.uid,
                email: user.email,
                fullName: userData.fullName,
                role: userData.role,
                firestoreId: userData.id
            }));
            
            showAlert('Login successful!', 'success');
            
            // Redirect based on role
            setTimeout(() => {
                if (userData.role === 'ADMIN') {
                    window.location.href = 'admin.html';
                } else {
                    window.location.href = 'dashboard.html';
                }
            }, 1000);
        }
    } catch (error) {
        if (error.code === 'auth/user-not-found') {
            showAlert('User not found! Contact administrator.', 'error');
        } else if (error.code === 'auth/wrong-password') {
            showAlert('Wrong password!', 'error');
        } else {
            showAlert('Login failed: ' + error.message, 'error');
        }
    }
}

// Logout User
async function logoutUser() {
    try {
        await signOut(auth);
        localStorage.removeItem('user');
        window.location.href = 'index.html';
    } catch (error) {
        showAlert('Error logging out!', 'error');
    }
}

// Show Alert
function showAlert(message, type) {
    const alertDiv = document.getElementById('alert');
    if (alertDiv) {
        alertDiv.textContent = message;
        alertDiv.className = `alert alert-${type} show`;
        setTimeout(() => {
            alertDiv.classList.remove('show');
        }, 3000);
    } else {
        alert(message);
    }
}

// Check Auth Status
function checkAuth() {
    const user = localStorage.getItem('user');
    const currentPage = window.location.pathname;
    
    if (!user && !currentPage.includes('index.html')) {
        window.location.href = 'index.html';
    }
    
    if (user && currentPage.includes('index.html')) {
        const userData = JSON.parse(user);
        if (userData.role === 'ADMIN') {
            window.location.href = 'admin.html';
        } else {
            window.location.href = 'dashboard.html';
        }
    }
}

export { loginUser, logoutUser, checkAuth, showAlert };