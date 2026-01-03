// Check admin authentication
const adminToken = localStorage.getItem('adminToken');
if (!adminToken) {
    window.location.href = '/';
}

const admin = JSON.parse(localStorage.getItem('admin'));
if (admin) {
    document.getElementById('admin-name').textContent = `👤 ${admin.username}`;
    
    // Show super admin sections if super admin
    if (admin.is_super_admin) {
        document.querySelectorAll('.super-admin-only').forEach(el => {
            el.style.display = 'block';
        });
    }
}

let currentSettings = {};
let currentFilterWords = [];

// Switch tabs
function switchTab(tab) {
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    document.querySelectorAll('.section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${tab}-section`).classList.add('active');
}

// Initialize
async function initialize() {
    await loadDashboard();
    await loadUsers();
    await loadSettings();
    await loadReportedUsers();
    if (admin.is_super_admin) {
        await loadAdmins();
    }
}

// Load dashboard stats
async function loadDashboard() {
    try {
        const usersResponse = await fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (usersResponse.ok) {
            const { users, totalUsers } = await usersResponse.json();
            const activeUsers = users.filter(u => u.is_active).length;
            
            document.getElementById('total-users').textContent = totalUsers;
            document.getElementById('active-users').textContent = activeUsers;
        }
        
        const reportsResponse = await fetch('/api/admin/reported-users', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (reportsResponse.ok) {
            const { reportedUsers } = await reportsResponse.json();
            document.getElementById('reported-users').textContent = reportedUsers.length;
        }
    } catch (error) {
        console.error('Dashboard loading error:', error);
    }
}

// Load users
async function loadUsers() {
    try {
        const response = await fetch('/api/admin/users', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.ok) {
            const { users, totalUsers } = await response.json();
            document.getElementById('users-count').textContent = totalUsers;
            
            const tbody = document.getElementById('users-table-body');
            tbody.innerHTML = '';
            
            users.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${user.full_name}</td>
                    <td>${user.email}</td>
                    <td>${user.phone}</td>
                    <td style="font-size: 12px;">${user.faculty}</td>
                    <td>${user.degree}</td>
                    <td>${user.course}</td>
                    <td>
                        <span class="status-badge ${user.is_active ? 'status-active' : 'status-inactive'}">
                            ${user.is_active ? 'Aktiv' : 'Deaktiv'}
                        </span>
                    </td>
                    <td>
                        ${user.is_active ? 
                            `<button class="btn btn-small btn-deactivate" onclick="toggleUserStatus(${user.id}, 0)">Deaktiv et</button>` :
                            `<button class="btn btn-small btn-activate" onclick="toggleUserStatus(${user.id}, 1)">Aktiv et</button>`
                        }
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Users loading error:', error);
    }
}

// Toggle user status
async function toggleUserStatus(userId, isActive) {
    const action = isActive ? 'aktiv' : 'deaktiv';
    if (!confirm(`Bu istifadəçini ${action} etmək istədiyinizə əminsiniz?`)) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/users/${userId}/status`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ is_active: isActive })
        });
        
        if (response.ok) {
            alert(`İstifadəçi ${action} edildi`);
            await loadUsers();
            await loadDashboard();
        } else {
            alert('Əməliyyat uğursuz oldu');
        }
    } catch (error) {
        console.error('Status toggle error:', error);
        alert('Xəta baş verdi');
    }
}

// Load settings
async function loadSettings() {
    try {
        const response = await fetch('/api/admin/settings', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.ok) {
            const { settings } = await response.json();
            currentSettings = settings;
            
            // Load rules
            document.getElementById('rules-textarea').value = settings.rules || '';
            
            // Load daily topic
            document.getElementById('topic-input').value = settings.daily_topic || '';
            
            // Load filter words
            currentFilterWords = settings.filter_words || [];
            displayFilterWords();
            
            // Load auto delete settings
            document.getElementById('group-hours').value = settings.auto_delete_group_messages || 0;
            document.getElementById('private-hours').value = settings.auto_delete_private_messages || 0;
        }
    } catch (error) {
        console.error('Settings loading error:', error);
    }
}

// Save rules
document.getElementById('rules-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const rules = document.getElementById('rules-textarea').value;
    
    try {
        const response = await fetch('/api/admin/rules', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ rules })
        });
        
        if (response.ok) {
            showMessage('rules', 'Qaydalar uğurla yeniləndi', 'success');
        } else {
            showMessage('rules', 'Qaydalar yenilənmədi', 'error');
        }
    } catch (error) {
        showMessage('rules', 'Xəta baş verdi', 'error');
    }
});

// Save daily topic
document.getElementById('topic-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const topic = document.getElementById('topic-input').value;
    
    try {
        const response = await fetch('/api/admin/daily-topic', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ topic })
        });
        
        if (response.ok) {
            showMessage('topic', 'Günün mövzusu uğurla yeniləndi', 'success');
        } else {
            showMessage('topic', 'Mövzu yenilənmədi', 'error');
        }
    } catch (error) {
        showMessage('topic', 'Xəta baş verdi', 'error');
    }
});

// Display filter words
function displayFilterWords() {
    const container = document.getElementById('filter-words-list');
    container.innerHTML = '';
    
    if (currentFilterWords.length === 0) {
        container.innerHTML = '<p style="color: #999;">Filtr sözləri yoxdur</p>';
        return;
    }
    
    currentFilterWords.forEach(word => {
        const div = document.createElement('div');
        div.className = 'filter-word';
        div.innerHTML = `
            <span>${word}</span>
            <span class="remove-word" onclick="removeFilterWord('${word}')">&times;</span>
        `;
        container.appendChild(div);
    });
}

// Add filter word
async function addFilterWord() {
    const input = document.getElementById('filter-word-input');
    const word = input.value.trim();
    
    if (!word) return;
    
    if (currentFilterWords.includes(word)) {
        showMessage('filter', 'Bu söz artıq əlavə edilib', 'error');
        return;
    }
    
    currentFilterWords.push(word);
    
    try {
        const response = await fetch('/api/admin/filter-words', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ words: currentFilterWords })
        });
        
        if (response.ok) {
            showMessage('filter', 'Filtr söz əlavə edildi', 'success');
            input.value = '';
            displayFilterWords();
        } else {
            currentFilterWords.pop();
            showMessage('filter', 'Söz əlavə edilmədi', 'error');
        }
    } catch (error) {
        currentFilterWords.pop();
        showMessage('filter', 'Xəta baş verdi', 'error');
    }
}

// Remove filter word
async function removeFilterWord(word) {
    if (!confirm(`"${word}" sözünü filtrdən silmək istədiyinizə əminsiniz?`)) {
        return;
    }
    
    currentFilterWords = currentFilterWords.filter(w => w !== word);
    
    try {
        const response = await fetch('/api/admin/filter-words', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ words: currentFilterWords })
        });
        
        if (response.ok) {
            showMessage('filter', 'Filtr söz silindi', 'success');
            displayFilterWords();
        } else {
            await loadSettings();
            showMessage('filter', 'Söz silinmədi', 'error');
        }
    } catch (error) {
        await loadSettings();
        showMessage('filter', 'Xəta baş verdi', 'error');
    }
}

// Save auto delete settings
document.getElementById('auto-delete-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const groupHours = parseInt(document.getElementById('group-hours').value) || 0;
    const privateHours = parseInt(document.getElementById('private-hours').value) || 0;
    
    try {
        const response = await fetch('/api/admin/auto-delete', {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ groupHours, privateHours })
        });
        
        if (response.ok) {
            showMessage('auto-delete', 'Avtomatik silmə parametrləri yeniləndi', 'success');
        } else {
            showMessage('auto-delete', 'Parametrlər yenilənmədi', 'error');
        }
    } catch (error) {
        showMessage('auto-delete', 'Xəta baş verdi', 'error');
    }
});

// Load reported users
async function loadReportedUsers() {
    try {
        const response = await fetch('/api/admin/reported-users', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.ok) {
            const { reportedUsers } = await response.json();
            
            const tbody = document.getElementById('reports-table-body');
            tbody.innerHTML = '';
            
            if (reportedUsers.length === 0) {
                tbody.innerHTML = '<tr><td colspan="5" style="text-align: center;">Şikayət edilən istifadəçi yoxdur</td></tr>';
                return;
            }
            
            reportedUsers.forEach(user => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${user.full_name}</td>
                    <td>${user.email}</td>
                    <td style="font-size: 12px;">${user.faculty}</td>
                    <td><strong style="color: #f44336;">${user.report_count}</strong></td>
                    <td>
                        ${user.is_active ? 
                            `<button class="btn btn-small btn-deactivate" onclick="toggleUserStatus(${user.id}, 0)">Deaktiv et</button>` :
                            `<span class="status-badge status-inactive">Deaktiv</span>`
                        }
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Reported users loading error:', error);
    }
}

// Load admins (super admin only)
async function loadAdmins() {
    try {
        const response = await fetch('/api/admin/admins', {
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.ok) {
            const { admins } = await response.json();
            
            const tbody = document.getElementById('admins-table-body');
            tbody.innerHTML = '';
            
            admins.forEach(adm => {
                const tr = document.createElement('tr');
                tr.innerHTML = `
                    <td>${adm.username}</td>
                    <td>${adm.is_super_admin ? '<strong style="color: #f5576c;">Super Admin</strong>' : 'Admin'}</td>
                    <td>${new Date(adm.created_at).toLocaleDateString('az-AZ')}</td>
                    <td>
                        ${!adm.is_super_admin ? 
                            `<button class="btn btn-small btn-deactivate" onclick="deleteAdmin(${adm.id})">Sil</button>` :
                            '<span style="color: #999;">-</span>'
                        }
                    </td>
                `;
                tbody.appendChild(tr);
            });
        }
    } catch (error) {
        console.error('Admins loading error:', error);
    }
}

// Create admin
document.getElementById('create-admin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const username = document.getElementById('new-admin-username').value.trim();
    const password = document.getElementById('new-admin-password').value;
    
    if (!username || !password) {
        showMessage('admins', 'Bütün xanaları doldurun', 'error');
        return;
    }
    
    try {
        const response = await fetch('/api/admin/create-admin', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${adminToken}`
            },
            body: JSON.stringify({ username, password })
        });
        
        if (response.ok) {
            showMessage('admins', 'Admin uğurla yaradıldı', 'success');
            document.getElementById('create-admin-form').reset();
            await loadAdmins();
        } else {
            const result = await response.json();
            showMessage('admins', result.error || 'Admin yaradılmadı', 'error');
        }
    } catch (error) {
        showMessage('admins', 'Xəta baş verdi', 'error');
    }
});

// Delete admin
async function deleteAdmin(adminId) {
    if (!confirm('Bu admini silmək istədiyinizə əminsiniz?')) {
        return;
    }
    
    try {
        const response = await fetch(`/api/admin/admins/${adminId}`, {
            method: 'DELETE',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        });
        
        if (response.ok) {
            showMessage('admins', 'Admin silindi', 'success');
            await loadAdmins();
        } else {
            showMessage('admins', 'Admin silinmədi', 'error');
        }
    } catch (error) {
        showMessage('admins', 'Xəta baş verdi', 'error');
    }
}

// Show message
function showMessage(section, message, type) {
    const messageEl = document.getElementById(`${section}-message`);
    messageEl.textContent = message;
    messageEl.className = `message ${type}`;
    
    setTimeout(() => {
        messageEl.className = 'message';
    }, 3000);
}

// Logout
function logout() {
    if (confirm('Çıxış etmək istədiyinizə əminsiniz?')) {
        fetch('/api/admin/logout', {
            method: 'POST',
            headers: { 'Authorization': `Bearer ${adminToken}` }
        }).finally(() => {
            localStorage.removeItem('adminToken');
            localStorage.removeItem('admin');
            window.location.href = '/';
        });
    }
}

// Initialize on page load
initialize();
