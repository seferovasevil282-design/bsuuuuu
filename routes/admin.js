const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { authenticateAdmin, JWT_SECRET } = require('../middleware/auth');

// Admin girişi
router.post('/login', (req, res) => {
  try {
    const { username, password } = req.body;

    const admin = db.getAdminByUsername(username);
    if (!admin) {
      return res.status(401).json({ error: 'İstifadəçi adı və ya şifrə yanlışdır' });
    }

    const isValidPassword = db.verifyAdminPassword(password, admin.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'İstifadəçi adı və ya şifrə yanlışdır' });
    }

    // JWT token yarat
    const token = jwt.sign(
      { 
        adminId: admin.id, 
        username: admin.username,
        isSuperAdmin: admin.is_super_admin === 1,
        isAdmin: true
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      token,
      admin: {
        id: admin.id,
        username: admin.username,
        is_super_admin: admin.is_super_admin === 1
      }
    });
  } catch (error) {
    console.error('Admin giriş xətası:', error);
    res.status(500).json({ error: 'Giriş zamanı xəta baş verdi' });
  }
});

// Admin çıxışı
router.post('/logout', (req, res) => {
  res.clearCookie('adminToken');
  res.json({ success: true, message: 'Çıxış uğurla həyata keçirildi' });
});

// Bütün istifadəçilər
router.get('/users', authenticateAdmin, (req, res) => {
  try {
    const users = db.getAllUsers();
    res.json({ users, totalUsers: users.length });
  } catch (error) {
    console.error('İstifadəçilər xətası:', error);
    res.status(500).json({ error: 'İstifadəçilər alınmadı' });
  }
});

// İstifadəçi statusunu dəyiş
router.put('/users/:userId/status', authenticateAdmin, (req, res) => {
  try {
    const { userId } = req.params;
    const { is_active } = req.body;
    
    db.updateUserStatus(userId, is_active ? 1 : 0);
    res.json({ success: true, message: 'Status yeniləndi' });
  } catch (error) {
    console.error('Status dəyişmə xətası:', error);
    res.status(500).json({ error: 'Status dəyişdirilmədi' });
  }
});

// Qaydaları yenilə
router.put('/rules', authenticateAdmin, (req, res) => {
  try {
    const { rules } = req.body;
    db.updateRules(rules);
    res.json({ success: true, message: 'Qaydalar yeniləndi' });
  } catch (error) {
    console.error('Qaydalar xətası:', error);
    res.status(500).json({ error: 'Qaydalar yenilənmədi' });
  }
});

// Günün mövzusunu yenilə
router.put('/daily-topic', authenticateAdmin, (req, res) => {
  try {
    const { topic } = req.body;
    db.updateDailyTopic(topic);
    res.json({ success: true, message: 'Günün mövzusu yeniləndi' });
  } catch (error) {
    console.error('Mövzu xətası:', error);
    res.status(500).json({ error: 'Mövzu yenilənmədi' });
  }
});

// Filtr sözlərini yenilə
router.put('/filter-words', authenticateAdmin, (req, res) => {
  try {
    const { words } = req.body;
    db.updateFilterWords(words);
    res.json({ success: true, message: 'Filtr sözləri yeniləndi' });
  } catch (error) {
    console.error('Filtr xətası:', error);
    res.status(500).json({ error: 'Filtr yenilənmədi' });
  }
});

// Avtomatik silmə parametrləri
router.put('/auto-delete', authenticateAdmin, (req, res) => {
  try {
    const { groupHours, privateHours } = req.body;
    db.updateAutoDelete(groupHours || 0, privateHours || 0);
    res.json({ success: true, message: 'Avtomatik silmə parametrləri yeniləndi' });
  } catch (error) {
    console.error('Avtomatik silmə xətası:', error);
    res.status(500).json({ error: 'Parametrlər yenilənmədi' });
  }
});

// Şikayət edilən istifadəçilər
router.get('/reported-users', authenticateAdmin, (req, res) => {
  try {
    const reportedUsers = db.getReportedUsers();
    res.json({ reportedUsers });
  } catch (error) {
    console.error('Şikayətlər xətası:', error);
    res.status(500).json({ error: 'Şikayətlər alınmadı' });
  }
});

// Parametrlər
router.get('/settings', authenticateAdmin, (req, res) => {
  try {
    const settings = db.getSettings();
    res.json({ settings });
  } catch (error) {
    console.error('Parametrlər xətası:', error);
    res.status(500).json({ error: 'Parametrlər alınmadı' });
  }
});

// Yeni admin yarat (yalnız super admin)
router.post('/create-admin', authenticateAdmin, (req, res) => {
  try {
    if (!req.admin.isSuperAdmin) {
      return res.status(403).json({ error: 'Yalnız super admin yeni admin yarada bilər' });
    }

    const { username, password } = req.body;
    
    if (!username || !password) {
      return res.status(400).json({ error: 'İstifadəçi adı və şifrə tələb olunur' });
    }

    const existingAdmin = db.getAdminByUsername(username);
    if (existingAdmin) {
      return res.status(400).json({ error: 'Bu istifadəçi adı artıq mövcuddur' });
    }

    const adminId = db.createAdmin(username, password);
    res.json({ success: true, message: 'Admin yaradıldı', adminId });
  } catch (error) {
    console.error('Admin yaratma xətası:', error);
    res.status(500).json({ error: 'Admin yaradılmadı' });
  }
});

// Adminləri al (yalnız super admin)
router.get('/admins', authenticateAdmin, (req, res) => {
  try {
    if (!req.admin.isSuperAdmin) {
      return res.status(403).json({ error: 'Yalnız super admin bu məlumatlara çata bilər' });
    }

    const admins = db.getAllAdmins();
    res.json({ admins });
  } catch (error) {
    console.error('Adminlər xətası:', error);
    res.status(500).json({ error: 'Adminlər alınmadı' });
  }
});

// Admin sil (yalnız super admin)
router.delete('/admins/:adminId', authenticateAdmin, (req, res) => {
  try {
    if (!req.admin.isSuperAdmin) {
      return res.status(403).json({ error: 'Yalnız super admin admin silə bilər' });
    }

    const { adminId } = req.params;
    db.deleteAdmin(adminId);
    res.json({ success: true, message: 'Admin silindi' });
  } catch (error) {
    console.error('Admin silmə xətası:', error);
    res.status(500).json({ error: 'Admin silinmədi' });
  }
});

module.exports = router;
