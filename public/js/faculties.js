// Check authentication
const token = localStorage.getItem('token');
if (!token) {
    window.location.href = '/';
}

// Load user info
const user = JSON.parse(localStorage.getItem('user'));
if (user) {
    document.getElementById('user-name').textContent = user.full_name;
    document.getElementById('user-info').textContent = `${user.faculty} • ${user.degree} • ${user.course}-ci kurs`;
    
    // Set avatar
    if (user.avatar) {
        document.getElementById('user-avatar').innerHTML = `<img src="${user.avatar}" alt="Avatar">`;
    } else {
        const initials = user.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
        document.getElementById('avatar-initials').textContent = initials;
    }
}

// Load settings (rules and daily topic)
async function loadSettings() {
    try {
        const response = await fetch('/api/chat/settings', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const { settings } = await response.json();
            
            // Show daily topic if exists
            if (settings.daily_topic && settings.daily_topic.trim()) {
                document.getElementById('daily-topic').style.display = 'block';
                document.getElementById('daily-topic-text').textContent = settings.daily_topic;
            }
        }
    } catch (error) {
        console.error('Settings yükləmə xətası:', error);
    }
}

loadSettings();

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
        console.error('Qaydalar yükləmə xətası:', error);
    }
}

function closeRules() {
    document.getElementById('rules-modal').classList.remove('active');
}

// Logout
function logout() {
    if (confirm('Çıxış etmək istədiyinizə əminsiniz?')) {
        fetch('/api/auth/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${token}` }
        }).finally(() => {
            localStorage.removeItem('token');
            localStorage.removeItem('user');
            window.location.href = '/';
        });
    }
}

// Close modal on outside click
document.getElementById('rules-modal').addEventListener('click', function(e) {
    if (e.target === this) {
        closeRules();
    }
});
