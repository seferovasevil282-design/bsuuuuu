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

function closeModal(modalId) {
    document.getElementById(modalId).classList.remove('active');
}

// Show profile
async function showProfile() {
    const user = JSON.parse(localStorage.getItem('user'));
    
    // Set current values
    document.getElementById('profile-fullname').value = user.full_name;
    document.getElementById('profile-faculty').value = user.faculty;
    document.getElementById('profile-degree').value = user.degree;
    document.getElementById('profile-course').value = user.course;
    
    // Set avatar
    if (user.avatar) {
        document.getElementById('profile-modal-avatar').innerHTML = `<img src="${user.avatar}" alt="Avatar">`;
    } else {
        const initials = user.full_name.split(' ').map(n => n[0]).join('').toUpperCase();
        document.getElementById('profile-modal-avatar-initials').textContent = initials;
    }
    
    // Load blocked users
    await loadBlockedUsers();
    
    document.getElementById('profile-modal').classList.add('active');
}

// Load blocked users
async function loadBlockedUsers() {
    try {
        const response = await fetch('/api/chat/blocked-users', {
            headers: { 'Authorization': `Bearer ${token}` }
        });
        
        if (response.ok) {
            const { blockedUsers } = await response.json();
            const container = document.getElementById('blocked-users-list');
            
            if (blockedUsers.length === 0) {
                container.innerHTML = '<p style="color: #999; text-align: center;">Əngəllənmiş istifadəçi yoxdur</p>';
            } else {
                container.innerHTML = blockedUsers.map(u => `
                    <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px; background: #f5f7fb; border-radius: 8px; margin-bottom: 10px;">
                        <div>
                            <strong>${u.full_name}</strong>
                        </div>
                        <button onclick="unblockUser(${u.id})" style="padding: 6px 12px; background: #4CAF50; color: white; border: none; border-radius: 6px; cursor: pointer; font-size: 12px;">
                            Əngəli aç
                        </button>
                    </div>
                `).join('');
            }
        }
    } catch (error) {
        console.error('Blocked users yükləmə xətası:', error);
    }
}

// Unblock user
async function unblockUser(userId) {
    if (!confirm('Bu istifadəçinin əngəlini açmaq istədiyinizə əminsiniz?')) {
        return;
    }
    
    try {
        const response = await fetch('/api/chat/unblock-user', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${token}`
            },
            body: JSON.stringify({ blockedId: userId })
        });
        
        if (response.ok) {
            alert('İstifadəçinin əngəli açıldı');
            await loadBlockedUsers();
        } else {
            alert('Əməliyyat uğursuz oldu');
        }
    } catch (error) {
        console.error('Unblock error:', error);
        alert('Xəta baş verdi');
    }
}

// Profile update form submit and event listeners
document.addEventListener('DOMContentLoaded', () => {
    document.getElementById('profile-update-form').addEventListener('submit', async (e) => {
        e.preventDefault();
        
        const data = {
            full_name: document.getElementById('profile-fullname').value,
            faculty: document.getElementById('profile-faculty').value,
            degree: document.getElementById('profile-degree').value,
            course: document.getElementById('profile-course').value
        };
        
        try {
            const response = await fetch('/api/auth/update-profile', {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(data)
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert('Profil uğurla yeniləndi!');
                localStorage.setItem('user', JSON.stringify(result.user));
                location.reload();
            } else {
                alert(result.error || 'Profil yenilənmədi');
            }
        } catch (error) {
            console.error('Profile update error:', error);
            alert('Xəta baş verdi');
        }
    });
    
    // Avatar upload
    document.getElementById('avatar-upload').addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;
        
        if (file.size > 5 * 1024 * 1024) {
            alert('Şəkil maksimum 5MB ola bilər');
            return;
        }
        
        const formData = new FormData();
        formData.append('avatar', file);
        
        try {
            const response = await fetch('/api/chat/upload-avatar', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${token}`
                },
                body: formData
            });
            
            const result = await response.json();
            
            if (response.ok) {
                alert('Profil şəkli yeniləndi!');
                const user = JSON.parse(localStorage.getItem('user'));
                user.avatar = result.avatar;
                localStorage.setItem('user', JSON.stringify(user));
                location.reload();
            } else {
                alert(result.error || 'Şəkil yüklənmədi');
            }
        } catch (error) {
            console.error('Avatar upload error:', error);
            alert('Xəta baş verdi');
        }
    });
    
    // Close modal on outside click
    document.querySelectorAll('.modal').forEach(modal => {
        modal.addEventListener('click', function(e) {
            if (e.target === this) {
                closeModal(this.id);
            }
        });
    });
});

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
