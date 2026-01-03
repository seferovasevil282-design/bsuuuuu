// Authentication check
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/';
}

// Get user and faculty info
const user = JSON.parse(localStorage.getItem('user'));
const urlParams = new URLSearchParams(window.location.search);
const faculty = urlParams.get('faculty') || user.faculty;

// Update UI with user info
if (user) {
    document.getElementById('sidebar-user-name').textContent = user.full_name;
    document.getElementById('sidebar-user-info').textContent = `${user.degree} • ${user.course}-ci kurs`;
    
    if (user.avatar) {
        document.getElementById('sidebar-avatar').innerHTML = `<img src="${user.avatar}" alt="Avatar">`;
    } else {
        const initials = user.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
        document.getElementById('sidebar-avatar-initials').textContent = initials;
    }
}

// Update faculty name
document.getElementById('faculty-name').textContent = faculty;
document.getElementById('chat-faculty-name').textContent = faculty;

// Socket.IO connection
const socket = io({
    auth: { token }
});

let selectedUserId = null;
let blockedUsers = new Set();
let filterWords = [];

// Load settings and join room
async function initialize() {
    try {
        // Load settings
        const response = await fetch('/api/chat/settings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const { settings } = await response.json();
            
            // Show daily topic
            if (settings.daily_topic && settings.daily_topic.trim()) {
                document.getElementById('daily-topic-sidebar').classList.add('active');
                document.getElementById('daily-topic-sidebar-text').textContent = settings.daily_topic;
            }
            
            // Store filter words
            filterWords = settings.filter_words || [];
        }
        
        // Load blocked users
        const blockedResponse = await fetch('/api/chat/blocked-users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (blockedResponse.ok) {
            const { blockedUsers: blocked } = await blockedResponse.json();
            blocked.forEach(u => blockedUsers.add(u.id));
        }
        
        // Load previous messages
        await loadMessages();
        
        // Join room
        socket.emit('join-room', {
            userId: user.id,
            facultyRoom: faculty,
            userData: {
                id: user.id,
                full_name: user.full_name,
                avatar: user.avatar,
                faculty: user.faculty,
                degree: user.degree,
                course: user.course
            }
        });
        
    } catch (error) {
        console.error('Initialization error:', error);
    }
}

// Load previous messages
async function loadMessages() {
    try {
        const response = await fetch(`/api/chat/messages/group/${encodeURIComponent(faculty)}`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const { messages } = await response.json();
            const messagesContainer = document.getElementById('chat-messages');
            messagesContainer.innerHTML = '';
            
            if (messages.length === 0) {
                messagesContainer.innerHTML = `
                    <div class="no-messages">
                        <h3>💬 Söhbət başlasın!</h3>
                        <p>İlk mesajı siz yazın və söhbətə qoşulun</p>
                    </div>
                `;
            } else {
                messages.forEach(msg => {
                    if (!blockedUsers.has(msg.user_id)) {
                        displayMessage(msg);
                    }
                });
                scrollToBottom();
            }
        }
    } catch (error) {
        console.error('Messages loading error:', error);
    }
}

// Display message in chat
function displayMessage(messageData) {
    const messagesContainer = document.getElementById('chat-messages');
    
    // Remove no-messages placeholder
    const noMessages = messagesContainer.querySelector('.no-messages');
    if (noMessages) {
        noMessages.remove();
    }
    
    const messageDiv = document.createElement('div');
    messageDiv.className = 'message';
    messageDiv.dataset.userId = messageData.userId || messageData.user_id;
    messageDiv.dataset.messageId = messageData.id;
    
    // Get user info
    const authorName = messageData.userName || messageData.full_name || 'İstifadəçi';
    const authorAvatar = messageData.userAvatar || messageData.avatar;
    const authorInfo = messageData.userInfo || `${messageData.faculty} • ${messageData.degree} • ${messageData.course}-ci kurs`;
    const initials = authorName.split(' ').map(n => n[0]).join('').toUpperCase();
    
    // Filter message text
    let messageText = messageData.message;
    filterWords.forEach(word => {
        const regex = new RegExp(word, 'gi');
        messageText = messageText.replace(regex, '***');
    });
    
    // Format time - Bakı timezone (UTC+4)
    const messageTime = new Date(messageData.created_at || messageData.timestamp);
    const bakuTime = new Date(messageTime.getTime() + (4 * 60 * 60 * 1000)); // Add 4 hours for Baku
    const timeString = bakuTime.toLocaleTimeString('az-AZ', { 
        hour: '2-digit', 
        minute: '2-digit',
        timeZone: 'Asia/Baku'
    });
    const dateString = bakuTime.toLocaleDateString('az-AZ', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
        timeZone: 'Asia/Baku'
    });
    
    messageDiv.innerHTML = `
        <div class="message-avatar" onclick="showUserProfile(${messageData.userId || messageData.user_id})">
            ${authorAvatar ? `<img src="${authorAvatar}" alt="Avatar">` : initials}
        </div>
        <div class="message-content">
            <div class="message-header">
                <span class="message-author">${authorName}</span>
                <span class="message-info">${authorInfo}</span>
                <span class="message-time">${timeString} • ${dateString}</span>
            </div>
            <div class="message-text">${messageText}</div>
            <div class="message-actions">
                <button class="message-action-btn" onclick="showUserProfile(${messageData.userId || messageData.user_id})">
                    👤 Profil
                </button>
                ${(messageData.userId || messageData.user_id) !== user.id ? `
                    <button class="message-action-btn" onclick="reportMessage(${messageData.id})">
                        ⚠️ Şikayət
                    </button>
                ` : ''}
            </div>
        </div>
    `;
    
    messagesContainer.appendChild(messageDiv);
}

// Send message
function sendMessage() {
    const input = document.getElementById('message-input');
    const message = input.value.trim();
    
    if (!message) return;
    
    socket.emit('send-message', {
        userId: user.id,
        facultyRoom: faculty,
        message: message,
        userName: user.full_name,
        userAvatar: user.avatar,
        userInfo: `${user.faculty} • ${user.degree} • ${user.course}-ci kurs`
    });
    
    input.value = '';
}

// Enter key to send
document.getElementById('message-input').addEventListener('keypress', (e) => {
    if (e.key === 'Enter') {
        sendMessage();
    }
});

// Socket event listeners
socket.on('receive-message', (messageData) => {
    if (!blockedUsers.has(messageData.userId)) {
        displayMessage(messageData);
        scrollToBottom();
    }
});

socket.on('active-users', (users) => {
    document.getElementById('online-users-count').textContent = `${users.length} aktiv istifadəçi`;
});

socket.on('user-joined', (data) => {
    console.log('User joined:', data.userData.full_name);
});

socket.on('user-left', (data) => {
    console.log('User left:', data.userId);
});

// Scroll to bottom
function scrollToBottom() {
    const messagesContainer = document.getElementById('chat-messages');
    messagesContainer.scrollTop = messagesContainer.scrollHeight;
}

// Show user profile
async function showUserProfile(userId) {
    if (userId === user.id) {
        alert('Bu sizin profilinizdir');
        return;
    }
    
    selectedUserId = userId;
    
    try {
        const response = await fetch(`/api/auth/me`, {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        // For now, get user info from message
        const messageElements = document.querySelectorAll(`[data-user-id="${userId}"]`);
        if (messageElements.length > 0) {
            const messageElement = messageElements[0];
            const authorName = messageElement.querySelector('.message-author').textContent;
            const authorInfo = messageElement.querySelector('.message-info').textContent;
            const avatarElement = messageElement.querySelector('.message-avatar');
            
            document.getElementById('modal-user-name').textContent = authorName;
            document.getElementById('modal-user-info').textContent = authorInfo;
            
            if (avatarElement.querySelector('img')) {
                const avatarSrc = avatarElement.querySelector('img').src;
                document.getElementById('modal-user-avatar').innerHTML = `<img src="${avatarSrc}" alt="Avatar">`;
            } else {
                document.getElementById('modal-avatar-initials').textContent = avatarElement.textContent;
            }
            
            // Update block button text
            if (blockedUsers.has(userId)) {
                document.getElementById('block-text').textContent = 'Əngəldən çıxar';
            } else {
                document.getElementById('block-text').textContent = 'Əngəllə';
            }
            
            document.getElementById('user-modal').classList.add('active');
        }
    } catch (error) {
        console.error('User profile error:', error);
    }
}

// Start private chat
function startPrivateChat() {
    alert('Şəxsi mesaj funksiyası tezliklə əlavə ediləcək');
    closeModal('user-modal');
}

// Toggle block user
async function toggleBlock() {
    if (!selectedUserId) return;
    
    try {
        const endpoint = blockedUsers.has(selectedUserId) ? '/api/chat/unblock-user' : '/api/chat/block-user';
        
        const response = await fetch(endpoint, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ blockedId: selectedUserId })
        });
        
        if (response.ok) {
            if (blockedUsers.has(selectedUserId)) {
                blockedUsers.delete(selectedUserId);
                alert('İstifadəçi əngəldən çıxarıldı');
            } else {
                blockedUsers.add(selectedUserId);
                alert('İstifadəçi əngəlləndi. Onun mesajları görünməyəcək.');
                // Remove blocked user messages
                document.querySelectorAll(`[data-user-id="${selectedUserId}"]`).forEach(el => el.remove());
            }
            closeModal('user-modal');
            await loadMessages(); // Reload messages
        }
    } catch (error) {
        console.error('Block error:', error);
        alert('Əməliyyat uğursuz oldu');
    }
}

// Report user
function reportUser() {
    if (!selectedUserId) return;
    
    const reason = prompt('Şikayət səbəbini qeyd edin (istəyə bağlı):');
    
    // Find a message from this user to report
    const messageElement = document.querySelector(`[data-user-id="${selectedUserId}"]`);
    if (messageElement) {
        const messageId = messageElement.dataset.messageId;
        
        socket.emit('report-message', {
            messageId: parseInt(messageId),
            reportedBy: user.id,
            reason: reason || ''
        });
        
        alert('Şikayətiniz qeydə alındı. Təşəkkür edirik!');
        closeModal('user-modal');
    }
}

// Report message
function reportMessage(messageId) {
    const reason = prompt('Şikayət səbəbini qeyd edin (istəyə bağlı):');
    
    socket.emit('report-message', {
        messageId: messageId,
        reportedBy: user.id,
        reason: reason || ''
    });
    
    alert('Şikayətiniz qeydə alındı. Təşəkkür edirik!');
}

// Show rules
async function showRules() {
    try {
        const response = await fetch('/api/chat/settings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const { settings } = await response.json();
            document.getElementById('rules-content').textContent = settings.rules || 'Qaydalar hələ əlavə edilməyib.';
            document.getElementById('rules-modal').classList.add('active');
        }
    } catch (error) {
        console.error('Rules loading error:', error);
    }
}

// Close modal
function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Go back to faculties
function goBack() {
    window.location.href = '/faculties';
}

// Close modals on outside click
document.querySelectorAll('.modal').forEach(modal => {
    modal.addEventListener('click', function(e) {
        if (e.target === this) {
            closeModal(this.id);
        }
    });
});

// Initialize on page load
initialize();
