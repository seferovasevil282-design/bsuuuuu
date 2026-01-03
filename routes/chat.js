const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const db = require('../database/db');
const { authenticateToken } = require('../middleware/auth');

// Şəkil yükləmə konfiqurasiyası
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../public/images/avatars'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.random().toString(36).substring(7)}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

const upload = multer({ 
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
  fileFilter: (req, file, cb) => {
    const filetypes = /jpeg|jpg|png|gif/;
    const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = filetypes.test(file.mimetype);
    
    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Yalnız şəkil faylları yükləyə bilərsiniz!'));
    }
  }
});

// Avatar yüklə
router.post('/upload-avatar', authenticateToken, upload.single('avatar'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Şəkil seçilməyib' });
    }

    const avatarPath = `/images/avatars/${req.file.filename}`;
    db.updateUserAvatar(req.user.userId, avatarPath);

    res.json({ 
      success: true, 
      avatar: avatarPath,
      message: 'Profil şəkli yeniləndi'
    });
  } catch (error) {
    console.error('Avatar yükləmə xətası:', error);
    res.status(500).json({ error: 'Şəkil yüklənərkən xəta baş verdi' });
  }
});

// Qrup mesajlarını al
router.get('/messages/group/:faculty', authenticateToken, (req, res) => {
  try {
    const { faculty } = req.params;
    const messages = db.getGroupMessages(faculty);
    
    // Əngəllənmiş istifadəçilərin mesajlarını filtrələ
    const userId = req.user.userId;
    const blockedUsers = db.getBlockedUsers(userId).map(u => u.id);
    
    const filteredMessages = messages.filter(msg => !blockedUsers.includes(msg.user_id));
    
    res.json({ messages: filteredMessages });
  } catch (error) {
    console.error('Mesajları alma xətası:', error);
    res.status(500).json({ error: 'Mesajlar alınmadı' });
  }
});

// Şəxsi mesajları al
router.get('/messages/private/:otherUserId', authenticateToken, (req, res) => {
  try {
    const { otherUserId } = req.params;
    const userId = req.user.userId;
    
    // Əngəllənmə yoxla
    if (db.isBlocked(userId, otherUserId) || db.isBlocked(otherUserId, userId)) {
      return res.status(403).json({ error: 'Bu istifadəçi ilə mesajlaşa bilməzsiniz' });
    }
    
    const messages = db.getPrivateMessages(userId, otherUserId);
    res.json({ messages });
  } catch (error) {
    console.error('Şəxsi mesajları alma xətası:', error);
    res.status(500).json({ error: 'Mesajlar alınmadı' });
  }
});

// İstifadəçini əngəllə
router.post('/block-user', authenticateToken, (req, res) => {
  try {
    const { blockedId } = req.body;
    const blockerId = req.user.userId;
    
    db.blockUser(blockerId, blockedId);
    res.json({ success: true, message: 'İstifadəçi əngəlləndi' });
  } catch (error) {
    console.error('Əngəlləmə xətası:', error);
    res.status(500).json({ error: 'Əngəlləmə uğursuz oldu' });
  }
});

// İstifadəçini əngəldən çıxar
router.post('/unblock-user', authenticateToken, (req, res) => {
  try {
    const { blockedId } = req.body;
    const blockerId = req.user.userId;
    
    db.unblockUser(blockerId, blockedId);
    res.json({ success: true, message: 'İstifadəçi əngəldən çıxarıldı' });
  } catch (error) {
    console.error('Əngəldən çıxarma xətası:', error);
    res.status(500).json({ error: 'Əngəldən çıxarma uğursuz oldu' });
  }
});

// Əngəllənmiş istifadəçilər
router.get('/blocked-users', authenticateToken, (req, res) => {
  try {
    const userId = req.user.userId;
    const blockedUsers = db.getBlockedUsers(userId);
    res.json({ blockedUsers });
  } catch (error) {
    console.error('Əngəllənmiş istifadəçilər xətası:', error);
    res.status(500).json({ error: 'Siyahı alınmadı' });
  }
});

// Parametrləri al
router.get('/settings', (req, res) => {
  try {
    const settings = db.getSettings();
    res.json({ settings });
  } catch (error) {
    console.error('Parametrlər xətası:', error);
    res.status(500).json({ error: 'Parametrlər alınmadı' });
  }
});

module.exports = router;
