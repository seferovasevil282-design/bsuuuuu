// Tab switch
function switchTab(tab) {
    // Update tab buttons
    document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
    event.target.classList.add('active');
    
    // Update form sections
    document.querySelectorAll('.form-section').forEach(s => s.classList.remove('active'));
    document.getElementById(`${tab}-section`).classList.add('active');
    
    // Clear messages
    clearMessages();
}

function clearMessages() {
    document.querySelectorAll('.error-message, .success-message').forEach(el => {
        el.style.display = 'none';
        el.textContent = '';
    });
}

function showError(sectionId, message) {
    const errorEl = document.getElementById(`${sectionId}-error`);
    errorEl.textContent = message;
    errorEl.style.display = 'block';
}

function showSuccess(sectionId, message) {
    const successEl = document.getElementById(`${sectionId}-success`);
    successEl.textContent = message;
    successEl.style.display = 'block';
}

// Login
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessages();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch('/api/auth/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            localStorage.setItem('token', result.token);
            localStorage.setItem('user', JSON.stringify(result.user));
            window.location.href = '/faculties';
        } else {
            showError('login', result.error || 'Giriş uğursuz oldu');
        }
    } catch (error) {
        showError('login', 'Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
    }
});

// Registration - Load verification questions
let verificationQuestions = [];

async function loadVerificationQuestions() {
    clearMessages();
    
    const form = document.getElementById('register-form');
    if (!form.checkValidity()) {
        form.reportValidity();
        return;
    }
    
    try {
        const response = await fetch('/api/auth/verification-questions');
        const result = await response.json();
        
        verificationQuestions = result.questions;
        
        const container = document.getElementById('questions-container');
        container.innerHTML = '';
        
        result.questions.forEach((q, idx) => {
            const questionDiv = document.createElement('div');
            questionDiv.className = 'question';
            questionDiv.innerHTML = `
                <div class="question-text">${idx + 1}. ${q.question}</div>
                <div class="options">
                    ${q.options.map(opt => `
                        <div class="option" data-question="${idx}" data-answer="${opt}">
                            ${opt}
                        </div>
                    `).join('')}
                </div>
            `;
            container.appendChild(questionDiv);
        });
        
        // Add click handlers
        document.querySelectorAll('.option').forEach(option => {
            option.addEventListener('click', function() {
                const questionId = this.dataset.question;
                // Remove selected from other options in same question
                document.querySelectorAll(`.option[data-question="${questionId}"]`).forEach(opt => {
                    opt.classList.remove('selected');
                });
                this.classList.add('selected');
            });
        });
        
        // Show verification section
        document.getElementById('register-form-section').classList.remove('active');
        document.getElementById('verification-section').classList.add('active');
        
    } catch (error) {
        showError('register', 'Doğrulama sualları yüklənmədi. Yenidən cəhd edin.');
    }
}

function backToRegisterForm() {
    document.getElementById('verification-section').classList.remove('active');
    document.getElementById('register-form-section').classList.add('active');
}

async function submitRegistration() {
    clearMessages();
    
    // Get selected answers
    const answers = [];
    for (let i = 0; i < verificationQuestions.length; i++) {
        const selected = document.querySelector(`.option[data-question="${i}"].selected`);
        if (!selected) {
            showError('register', 'Bütün doğrulama suallarını cavablandırın');
            return;
        }
        answers.push(selected.dataset.answer);
    }
    
    // Get form data
    const form = document.getElementById('register-form');
    const formData = new FormData(form);
    const data = Object.fromEntries(formData);
    data.answers = answers;
    
    try {
        const response = await fetch('/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            showSuccess('register', 'Qeydiyyat uğurla tamamlandı! İndi giriş edə bilərsiniz.');
            setTimeout(() => {
                form.reset();
                backToRegisterForm();
                switchTab('login');
            }, 2000);
        } else {
            showError('register', result.error || 'Qeydiyyat uğursuz oldu');
            if (result.error && result.error.includes('doğrulama')) {
                // Go back to show questions again
                backToRegisterForm();
            }
        }
    } catch (error) {
        showError('register', 'Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
    }
}

// Admin Login
document.getElementById('admin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    clearMessages();
    
    const formData = new FormData(e.target);
    const data = Object.fromEntries(formData);
    
    try {
        const response = await fetch('/api/admin/login', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        
        const result = await response.json();
        
        if (response.ok) {
            localStorage.setItem('adminToken', result.token);
            localStorage.setItem('admin', JSON.stringify(result.admin));
            window.location.href = '/admin';
        } else {
            showError('admin', result.error || 'Admin girişi uğursuz oldu');
        }
    } catch (error) {
        showError('admin', 'Xəta baş verdi. Zəhmət olmasa yenidən cəhd edin.');
    }
});

// Check if already logged in
window.addEventListener('DOMContentLoaded', () => {
    const token = localStorage.getItem('token');
    if (token) {
        // Verify token is still valid
        fetch('/api/auth/me', {
            headers: { 'Authorization': `Bearer ${token}` }
        }).then(res => {
            if (res.ok) {
                window.location.href = '/faculties';
            } else {
                localStorage.removeItem('token');
                localStorage.removeItem('user');
            }
        });
    }
});
