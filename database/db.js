const Database = require('better-sqlite3');
const path = require('path');
const bcrypt = require('bcryptjs');

const db = new Database(path.join(__dirname, 'bsu-chat.db'));

// Cədvəlləri yarat
db.exec(`
  CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    full_name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    faculty TEXT NOT NULL,
    degree TEXT NOT NULL,
    course INTEGER NOT NULL,
    avatar TEXT DEFAULT NULL,
    is_active INTEGER DEFAULT 1,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS messages (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER NOT NULL,
    room_or_recipient TEXT NOT NULL,
    message TEXT NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('group', 'private')),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS blocked_users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    blocker_id INTEGER NOT NULL,
    blocked_id INTEGER NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (blocker_id) REFERENCES users(id),
    FOREIGN KEY (blocked_id) REFERENCES users(id),
    UNIQUE(blocker_id, blocked_id)
  );

  CREATE TABLE IF NOT EXISTS reports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    message_id INTEGER NOT NULL,
    reported_by INTEGER NOT NULL,
    reason TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (message_id) REFERENCES messages(id),
    FOREIGN KEY (reported_by) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS report_counts (
    user_id INTEGER PRIMARY KEY,
    report_count INTEGER DEFAULT 0,
    FOREIGN KEY (user_id) REFERENCES users(id)
  );

  CREATE TABLE IF NOT EXISTS admins (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    is_super_admin INTEGER DEFAULT 0,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS settings (
    id INTEGER PRIMARY KEY DEFAULT 1,
    rules TEXT DEFAULT '',
    daily_topic TEXT DEFAULT '',
    filter_words TEXT DEFAULT '[]',
    auto_delete_group_messages INTEGER DEFAULT 0,
    auto_delete_private_messages INTEGER DEFAULT 0,
    CHECK (id = 1)
  );

  INSERT OR IGNORE INTO settings (id) VALUES (1);
`);

// Super admin yaradırıq (username: ursamajor, password: ursa618)
const createSuperAdmin = () => {
  const stmt = db.prepare('SELECT * FROM admins WHERE username = ?');
  const existing = stmt.get('ursamajor');
  
  if (!existing) {
    const hashedPassword = bcrypt.hashSync('ursa618', 10);
    const insertStmt = db.prepare('INSERT INTO admins (username, password, is_super_admin) VALUES (?, ?, ?)');
    insertStmt.run('ursamajor', hashedPassword, 1);
    console.log('✅ Super admin yaradıldı: ursamajor');
  }
};

createSuperAdmin();

// İstifadəçi funksiyaları
const userFunctions = {
  createUser: (userData) => {
    const { full_name, email, phone, password, faculty, degree, course } = userData;
    const hashedPassword = bcrypt.hashSync(password, 10);
    
    const stmt = db.prepare(`
      INSERT INTO users (full_name, email, phone, password, faculty, degree, course)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const result = stmt.run(full_name, email, phone, hashedPassword, faculty, degree, course);
    return result.lastInsertRowid;
  },

  getUserByEmail: (email) => {
    const stmt = db.prepare('SELECT * FROM users WHERE email = ?');
    return stmt.get(email);
  },

  getUserByPhone: (phone) => {
    const stmt = db.prepare('SELECT * FROM users WHERE phone = ?');
    return stmt.get(phone);
  },

  getUserById: (id) => {
    const stmt = db.prepare('SELECT * FROM users WHERE id = ?');
    return stmt.get(id);
  },

  updateUserAvatar: (userId, avatarPath) => {
    const stmt = db.prepare('UPDATE users SET avatar = ? WHERE id = ?');
    stmt.run(avatarPath, userId);
  },

  updateUserStatus: (userId, isActive) => {
    const stmt = db.prepare('UPDATE users SET is_active = ? WHERE id = ?');
    stmt.run(isActive, userId);
  },

  getAllUsers: () => {
    const stmt = db.prepare('SELECT id, full_name, email, phone, faculty, degree, course, is_active, created_at FROM users');
    return stmt.all();
  },

  verifyPassword: (password, hashedPassword) => {
    return bcrypt.compareSync(password, hashedPassword);
  },

  updateUserProfile: (userId, profileData) => {
    const { full_name, faculty, degree, course } = profileData;
    const stmt = db.prepare(`
      UPDATE users 
      SET full_name = ?, faculty = ?, degree = ?, course = ?
      WHERE id = ?
    `);
    stmt.run(full_name, faculty, degree, course, userId);
  }
};

// Mesaj funksiyaları
const messageFunctions = {
  addMessage: (userId, roomOrRecipient, message, type) => {
    const stmt = db.prepare(`
      INSERT INTO messages (user_id, room_or_recipient, message, type)
      VALUES (?, ?, ?, ?)
    `);
    const result = stmt.run(userId, roomOrRecipient, message, type);
    return result.lastInsertRowid;
  },

  getGroupMessages: (room, limit = 100) => {
    const stmt = db.prepare(`
      SELECT m.*, u.full_name, u.avatar, u.faculty, u.degree, u.course
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.room_or_recipient = ? AND m.type = 'group'
      ORDER BY m.created_at DESC
      LIMIT ?
    `);
    return stmt.all(room, limit).reverse();
  },

  getPrivateMessages: (userId1, userId2, limit = 100) => {
    const stmt = db.prepare(`
      SELECT m.*, u.full_name, u.avatar
      FROM messages m
      JOIN users u ON m.user_id = u.id
      WHERE m.type = 'private' AND (
        (m.user_id = ? AND m.room_or_recipient = ?) OR
        (m.user_id = ? AND m.room_or_recipient = ?)
      )
      ORDER BY m.created_at DESC
      LIMIT ?
    `);
    return stmt.all(userId1, userId2, userId2, userId1, limit).reverse();
  },

  deleteOldMessages: (type, hours) => {
    const stmt = db.prepare(`
      DELETE FROM messages 
      WHERE type = ? AND 
      datetime(created_at) < datetime('now', '-' || ? || ' hours')
    `);
    const result = stmt.run(type, hours);
    return result.changes;
  }
};

// Əngəlləmə funksiyaları
const blockFunctions = {
  blockUser: (blockerId, blockedId) => {
    const stmt = db.prepare(`
      INSERT OR IGNORE INTO blocked_users (blocker_id, blocked_id)
      VALUES (?, ?)
    `);
    stmt.run(blockerId, blockedId);
  },

  unblockUser: (blockerId, blockedId) => {
    const stmt = db.prepare(`
      DELETE FROM blocked_users 
      WHERE blocker_id = ? AND blocked_id = ?
    `);
    stmt.run(blockerId, blockedId);
  },

  isBlocked: (blockerId, blockedId) => {
    const stmt = db.prepare(`
      SELECT * FROM blocked_users 
      WHERE blocker_id = ? AND blocked_id = ?
    `);
    return stmt.get(blockerId, blockedId) !== undefined;
  },

  getBlockedUsers: (userId) => {
    const stmt = db.prepare(`
      SELECT u.id, u.full_name, u.avatar
      FROM blocked_users b
      JOIN users u ON b.blocked_id = u.id
      WHERE b.blocker_id = ?
    `);
    return stmt.all(userId);
  }
};

// Şikayət funksiyaları
const reportFunctions = {
  reportMessage: (messageId, reportedBy, reason = '') => {
    const stmt = db.prepare(`
      INSERT INTO reports (message_id, reported_by, reason)
      VALUES (?, ?, ?)
    `);
    stmt.run(messageId, reportedBy, reason);

    // Mesajın sahibini tap və şikayət sayını artır
    const msgStmt = db.prepare('SELECT user_id FROM messages WHERE id = ?');
    const message = msgStmt.get(messageId);
    
    if (message) {
      const countStmt = db.prepare(`
        INSERT INTO report_counts (user_id, report_count)
        VALUES (?, 1)
        ON CONFLICT(user_id) DO UPDATE SET report_count = report_count + 1
      `);
      countStmt.run(message.user_id);
    }
  },

  getReportedUsers: () => {
    const stmt = db.prepare(`
      SELECT u.*, rc.report_count
      FROM users u
      JOIN report_counts rc ON u.id = rc.user_id
      WHERE rc.report_count >= 16
      ORDER BY rc.report_count DESC
    `);
    return stmt.all();
  }
};

// Admin funksiyaları
const adminFunctions = {
  createAdmin: (username, password) => {
    const hashedPassword = bcrypt.hashSync(password, 10);
    const stmt = db.prepare(`
      INSERT INTO admins (username, password, is_super_admin)
      VALUES (?, ?, 0)
    `);
    const result = stmt.run(username, hashedPassword);
    return result.lastInsertRowid;
  },

  getAdminByUsername: (username) => {
    const stmt = db.prepare('SELECT * FROM admins WHERE username = ?');
    return stmt.get(username);
  },

  getAllAdmins: () => {
    const stmt = db.prepare('SELECT id, username, is_super_admin, created_at FROM admins');
    return stmt.all();
  },

  deleteAdmin: (adminId) => {
    const stmt = db.prepare('DELETE FROM admins WHERE id = ? AND is_super_admin = 0');
    stmt.run(adminId);
  },

  verifyAdminPassword: (password, hashedPassword) => {
    return bcrypt.compareSync(password, hashedPassword);
  }
};

// Parametrlər funksiyaları
const settingsFunctions = {
  getSettings: () => {
    const stmt = db.prepare('SELECT * FROM settings WHERE id = 1');
    const settings = stmt.get();
    if (settings && settings.filter_words) {
      settings.filter_words = JSON.parse(settings.filter_words);
    }
    return settings || {};
  },

  updateRules: (rules) => {
    const stmt = db.prepare('UPDATE settings SET rules = ? WHERE id = 1');
    stmt.run(rules);
  },

  updateDailyTopic: (topic) => {
    const stmt = db.prepare('UPDATE settings SET daily_topic = ? WHERE id = 1');
    stmt.run(topic);
  },

  updateFilterWords: (words) => {
    const wordsJson = JSON.stringify(words);
    const stmt = db.prepare('UPDATE settings SET filter_words = ? WHERE id = 1');
    stmt.run(wordsJson);
  },

  updateAutoDelete: (groupHours, privateHours) => {
    const stmt = db.prepare(`
      UPDATE settings 
      SET auto_delete_group_messages = ?,
          auto_delete_private_messages = ?
      WHERE id = 1
    `);
    stmt.run(groupHours, privateHours);
  }
};

module.exports = {
  db,
  ...userFunctions,
  ...messageFunctions,
  ...blockFunctions,
  ...reportFunctions,
  ...adminFunctions,
  ...settingsFunctions
};
