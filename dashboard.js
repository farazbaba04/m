import { db, collection, addDoc, getDocs, query, where, updateDoc, doc, orderBy } from './firebase-config.js';
import { showAlert } from './auth.js';

// Load dashboard
async function loadDashboard() {
    const user = JSON.parse(localStorage.getItem('user'));
    if (!user) return;
    
    document.getElementById('userName').textContent = user.fullName;
    document.getElementById('userRole').textContent = user.role.replace('_', ' ');
    
    if (user.role === 'IT_Executive') {
        document.getElementById('requestForm').style.display = 'block';
    }
    
    await loadRequests();
}

// Create request (IT Executive)
async function createRequest(event) {
    event.preventDefault();
    
    const user = JSON.parse(localStorage.getItem('user'));
    if (user.role !== 'IT_Executive') {
        showAlert('Not authorized!', 'error');
        return;
    }
    
    const title = document.getElementById('title').value;
    const description = document.getElementById('description').value;
    const amount = document.getElementById('amount').value;
    
    try {
        await addDoc(collection(db, 'requests'), {
            title: title,
            description: description,
            amount: parseFloat(amount),
            status: 'pending_assistant',
            createdBy: user.uid,
            createdByName: user.fullName,
            createdAt: new Date().toISOString(),
            remarks: ''
        });
        
        showAlert('Request created!', 'success');
        document.getElementById('requestFormElement').reset();
        await loadRequests();
    } catch (error) {
        showAlert('Error: ' + error.message, 'error');
    }
}

// Load requests based on role
async function loadRequests() {
    const user = JSON.parse(localStorage.getItem('user'));
    const requestsList = document.getElementById('requestsList');
    
    if (!requestsList) return;
    
    requestsList.innerHTML = '<div class="card">Loading...</div>';
    
    try {
        let q;
        
        if (user.role === 'IT_Executive') {
            q = query(collection(db, 'requests'), where('createdBy', '==', user.uid), orderBy('createdAt', 'desc'));
        } else if (user.role === 'Assistant_Manager') {
            q = query(collection(db, 'requests'), where('status', '==', 'pending_assistant'), orderBy('createdAt', 'desc'));
        } else if (user.role === 'HOD_IT') {
            q = query(collection(db, 'requests'), where('status', '==', 'pending_hod'), orderBy('createdAt', 'desc'));
        } else if (user.role === 'Account_Officer') {
            q = query(collection(db, 'requests'), where('status', '==', 'pending_account'), orderBy('createdAt', 'desc'));
        }
        
        const querySnapshot = await getDocs(q);
        
        if (querySnapshot.empty) {
            requestsList.innerHTML = '<div class="card">No requests found.</div>';
            return;
        }
        
        requestsList.innerHTML = '';
        querySnapshot.forEach((doc) => {
            const request = { id: doc.id, ...doc.data() };
            requestsList.appendChild(createRequestCard(request, user.role));
        });
        
    } catch (error) {
        requestsList.innerHTML = '<div class="card">Error: ' + error.message + '</div>';
    }
}

// Create request card
function createRequestCard(request, userRole) {
    const card = document.createElement('div');
    card.className = 'request-card';
    
    const statusClass = `status-${request.status}`;
    let actions = '';
    
    if (userRole === 'Assistant_Manager' && request.status === 'pending_assistant') {
        actions = `<div class="request-actions"><button class="btn btn-small btn-verify" onclick="verifyRequest('${request.id}')">✓ Verify</button><button class="btn btn-small btn-reject" onclick="rejectRequest('${request.id}')">✗ Reject</button></div>`;
    } else if (userRole === 'HOD_IT' && request.status === 'pending_hod') {
        actions = `<div class="request-actions"><button class="btn btn-small btn-approve" onclick="approveRequest('${request.id}')">✓ Approve</button><button class="btn btn-small btn-reject" onclick="rejectRequest('${request.id}')">✗ Reject</button></div>`;
    } else if (userRole === 'Account_Officer' && request.status === 'pending_account') {
        actions = `<div class="request-actions"><button class="btn btn-small btn-approve" onclick="processPayment('${request.id}')">💰 Process</button><button class="btn btn-small btn-reject" onclick="rejectRequest('${request.id}')">✗ Reject</button></div>`;
    }
    
    card.innerHTML = `
        <div class="request-header">
            <div class="request-title">${escapeHtml(request.title)}</div>
            <div class="request-status ${statusClass}">${request.status.replace('_', ' ').toUpperCase()}</div>
        </div>
        <div class="request-details">
            <p><strong>By:</strong> ${escapeHtml(request.createdByName)}</p>
            <p><strong>Amount:</strong> Rs. ${request.amount || 0}</p>
            <p><strong>Description:</strong> ${escapeHtml(request.description)}</p>
            ${request.remarks ? `<p><strong>Remarks:</strong> ${escapeHtml(request.remarks)}</p>` : ''}
        </div>
        ${actions}
    `;
    return card;
}

async function verifyRequest(requestId) {
    const remarks = prompt('Verification remarks:');
    if (!remarks) return;
    
    try {
        await updateDoc(doc(db, 'requests', requestId), {
            status: 'pending_hod',
            remarks: remarks,
            verifiedAt: new Date().toISOString()
        });
        showAlert('Verified!', 'success');
        await loadRequests();
    } catch (error) {
        showAlert('Error: ' + error.message, 'error');
    }
}

async function approveRequest(requestId) {
    const remarks = prompt('Approval remarks:');
    if (!remarks) return;
    
    try {
        await updateDoc(doc(db, 'requests', requestId), {
            status: 'pending_account',
            remarks: remarks,
            approvedAt: new Date().toISOString()
        });
        showAlert('Approved!', 'success');
        await loadRequests();
    } catch (error) {
        showAlert('Error: ' + error.message, 'error');
    }
}

async function processPayment(requestId) {
    const remarks = prompt('Payment remarks:');
    if (!remarks) return;
    
    try {
        await updateDoc(doc(db, 'requests', requestId), {
            status: 'approved',
            remarks: remarks,
            processedAt: new Date().toISOString()
        });
        showAlert('Payment processed!', 'success');
        await loadRequests();
    } catch (error) {
        showAlert('Error: ' + error.message, 'error');
    }
}

async function rejectRequest(requestId) {
    const remarks = prompt('Rejection reason:');
    if (!remarks) return;
    
    try {
        await updateDoc(doc(db, 'requests', requestId), {
            status: 'rejected',
            remarks: remarks
        });
        showAlert('Rejected!', 'success');
        await loadRequests();
    } catch (error) {
        showAlert('Error: ' + error.message, 'error');
    }
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}

window.verifyRequest = verifyRequest;
window.approveRequest = approveRequest;
window.processPayment = processPayment;
window.rejectRequest = rejectRequest;
window.createRequest = createRequest;

export { loadDashboard, loadRequests };