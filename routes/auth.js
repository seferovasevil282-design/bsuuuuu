const express = require('express');
const router = express.Router();
const jwt = require('jsonwebtoken');
const db = require('../database/db');
const { JWT_SECRET } = require('../middleware/auth');

// Doğrulama sualları və cavabları
const VERIFICATION_QUESTIONS = [
  { question: 'Mexanika-riyaziyyat fakültəsi hansı korpusda yerləşir?', answer: '3' },
  { question: 'Tətbiqi riyaziyyat və kibernetika fakültəsi hansı korpusda yerləşir?', answer: '3' },
  { question: 'Fizika fakültəsi hansı korpusda yerləşir?', answer: 'əsas' },
  { question: 'Kimya fakültəsi hansı korpusda yerləşir?', answer: 'əsas' },
  { question: 'Biologiya fakültəsi hansı korpusda yerləşir?', answer: 'əsas' },
  { question: 'Ekologiya və torpaqşünaslıq fakültəsi hansı korpusda yerləşir?', answer: 'əsas' },
  { question: 'Coğrafiya fakültəsi hansı korpusda yerləşir?', answer: 'əsas' },
  { question: 'Geologiya fakültəsi hansı korpusda yerləşir?', answer: 'əsas' },
  { question: 'Filologiya fakültəsi hansı korpusda yerləşir?', answer: '1' },
  { question: 'Tarix fakültəsi hansı korpusda yerləşir?', answer: '3' },
  { question: 'Beynəlxalq münasibətlər və iqtisadiyyat fakültəsi hansı korpusda yerləşir?', answer: '1' },
  { question: 'Hüquq fakültəsi hansı korpusda yerləşir?', answer: '1' },
  { question: 'Jurnalistika fakültəsi hansı korpusda yerləşir?', answer: '2' },
  { question: 'İnformasiya və sənəd menecmenti fakültəsi hansı korpusda yerləşir?', answer: '2' },
  { question: 'Şərqşünaslıq fakültəsi hansı korpusda yerləşir?', answer: '2' },
  { question: 'Sosial elmlər və psixologiya fakültəsi hansı korpusda yerləşir?', answer: '2' }
];

// Random 3 sual seç
router.get('/verification-questions', (req, res) => {
  const shuffled = [...VERIFICATION_QUESTIONS].sort(() => 0.5 - Math.random());
  const selected = shuffled.slice(0, 3).map((q, idx) => ({
    id: idx,
    question: q.question,
    options: ['1', '2', '3', 'əsas']
  }));
  
  // Cavabları session-da saxla
  req.session.correctAnswers = shuffled.slice(0, 3).map(q => q.answer);
  
  res.json({ questions: selected });
});

// Qeydiyyat
router.post('/register', async (req, res) => {
  try {
    const { full_name, email, phone, password, faculty, degree, course, answers } = req.body;

    // Validasiya
    if (!email.endsWith('@bsu.edu.az')) {
      return res.status(400).json({ error: 'Email @bsu.edu.az ilə bitməlidir' });
    }

    if (!phone.match(/^\+994\d{9}$/)) {
      return res.status(400).json({ error: 'Telefon nömrəsi +994XXXXXXXXX formatında olmalıdır' });
    }

    // Doğrulama cavablarını yoxla
    const correctAnswers = req.session.correctAnswers || [];
    if (!answers || answers.length !== 3) {
      return res.status(400).json({ error: 'Doğrulama suallarını cavablandırın' });
    }

    let correctCount = 0;
    answers.forEach((answer, idx) => {
      if (answer === correctAnswers[idx]) {
        correctCount++;
      }
    });

    if (correctCount < 2) {
      return res.status(400).json({ error: 'Minimum 2 doğrulama sualını düzgün cavablandırmalısınız' });
    }

    // İstifadəçi mövcuddurmu?
    const existingUser = db.getUserByEmail(email);
    if (existingUser) {
      return res.status(400).json({ error: 'Bu email artıq qeydiyyatdan keçib' });
    }

    const existingPhone = db.getUserByPhone(phone);
    if (existingPhone) {
      return res.status(400).json({ error: 'Bu telefon nömrəsi artıq qeydiyyatdan keçib' });
    }

    // İstifadəçi yarat
    const userId = db.createUser({
      full_name,
      email,
      phone,
      password,
      faculty,
      degree,
      course
    });

    res.json({ 
      success: true, 
      message: 'Qeydiyyat uğurla tamamlandı',
      userId 
    });
  } catch (error) {
    console.error('Qeydiyyat xətası:', error);
    res.status(500).json({ error: 'Qeydiyyat zamanı xəta baş verdi' });
  }
});

// Giriş
router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = db.getUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Email və ya şifrə yanlışdır' });
    }

    if (!user.is_active) {
      return res.status(403).json({ error: 'Hesabınız deaktiv edilib' });
    }

    const isValidPassword = db.verifyPassword(password, user.password);
    if (!isValidPassword) {
      return res.status(401).json({ error: 'Email və ya şifrə yanlışdır' });
    }

    // JWT token yarat
    const token = jwt.sign(
      { 
        userId: user.id, 
        email: user.email,
        faculty: user.faculty
      },
      JWT_SECRET,
      { expiresIn: '24h' }
    );

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      maxAge: 24 * 60 * 60 * 1000
    });

    res.json({
      success: true,
      token,
      user: {
        id: user.id,
        full_name: user.full_name,
        email: user.email,
        faculty: user.faculty,
        degree: user.degree,
        course: user.course,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('Giriş xətası:', error);
    res.status(500).json({ error: 'Giriş zamanı xəta baş verdi' });
  }
});

// Çıxış
router.post('/logout', (req, res) => {
  res.clearCookie('token');
  res.json({ success: true, message: 'Çıxış uğurla həyata keçirildi' });
});

// İstifadəçi məlumatlarını yoxla
router.get('/me', (req, res) => {
  const token = req.cookies.token || req.headers['authorization']?.split(' ')[1];
  
  if (!token) {
    return res.status(401).json({ error: 'Token tapılmadı' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    const user = db.getUserById(decoded.userId);
    
    if (!user || !user.is_active) {
      return res.status(403).json({ error: 'İstifadəçi tapılmadı və ya deaktivdir' });
    }

    res.json({
      id: user.id,
      full_name: user.full_name,
      email: user.email,
      faculty: user.faculty,
      degree: user.degree,
      course: user.course,
      avatar: user.avatar
    });
  } catch (error) {
    return res.status(403).json({ error: 'Token etibarsızdır' });
  }
});

module.exports = router;
