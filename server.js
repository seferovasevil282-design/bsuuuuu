const express = require('express');
const http = require('http');
const socketIO = require('socket.io');
const path = require('path');
const session = require('express-session');
const cookieParser = require('cookie-parser');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');
require('dotenv').config();

const db = require('./database/db');
const authRoutes = require('./routes/auth');
const chatRoutes = require('./routes/chat');
const adminRoutes = require('./routes/admin');
const { authenticateToken } = require('./middleware/auth');

const app = express();
const server = http.createServer(app);
const io = socketIO(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const PORT = process.env.PORT || 3000;

// Middleware
app.use(helmet({
  contentSecurityPolicy: false,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'bsu-chat-secret-key-2024',
  resave: false,
  saveUninitialized: false,
  cookie: { 
    secure: process.env.NODE_ENV === 'production',
    maxAge: 24 * 60 * 60 * 1000 // 24 saat
  }
}));

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 dəqiqə
  max: 100 // maksimum 100 request
});
app.use('/api/', limiter);

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/chat', authenticateToken, chatRoutes);
app.use('/api/admin', adminRoutes);

// Socket.IO connection
const connectedUsers = new Map(); // userId -> {socketId, facultyRoom}
const activeRooms = new Map(); // roomName -> Set of userIds

io.on('connection', (socket) => {
  console.log('Yeni istifadəçi qoşuldu:', socket.id);

  // İstifadəçi otağa qoşulur
  socket.on('join-room', ({ userId, facultyRoom, userData }) => {
    socket.join(facultyRoom);
    
    connectedUsers.set(userId, {
      socketId: socket.id,
      facultyRoom,
      userData
    });

    if (!activeRooms.has(facultyRoom)) {
      activeRooms.set(facultyRoom, new Set());
    }
    activeRooms.get(facultyRoom).add(userId);

    // Otaqdakı digər istifadəçilərə bildir
    socket.to(facultyRoom).emit('user-joined', {
      userId,
      userData
    });

    // Aktiv istifadəçiləri göndər
    const roomUsers = Array.from(activeRooms.get(facultyRoom));
    io.to(facultyRoom).emit('active-users', roomUsers);
  });

  // Mesaj göndərmə
  socket.on('send-message', async (messageData) => {
    const { userId, facultyRoom, message, userName, userAvatar, userInfo } = messageData;
    
    // Verilənlər bazasına əlavə et
    try {
      const messageId = db.addMessage(userId, facultyRoom, message, 'group');
      
      // Bütün otaq üzvlərinə göndər
      const messagePayload = {
        id: messageId,
        userId,
        userName,
        userAvatar,
        userInfo,
        message,
        timestamp: new Date().toISOString(),
        type: 'group'
      };

      io.to(facultyRoom).emit('receive-message', messagePayload);
    } catch (error) {
      console.error('Mesaj göndərmə xətası:', error);
      socket.emit('message-error', { error: 'Mesaj göndərilmədi' });
    }
  });

  // Şəxsi mesaj
  socket.on('send-private-message', async (messageData) => {
    const { fromUserId, toUserId, message, fromUserData } = messageData;
    
    try {
      const messageId = db.addMessage(fromUserId, toUserId, message, 'private');
      
      const messagePayload = {
        id: messageId,
        fromUserId,
        toUserId,
        fromUserData,
        message,
        timestamp: new Date().toISOString(),
        type: 'private'
      };

      // Göndərənə və alana çatdır
      const recipientData = connectedUsers.get(toUserId);
      if (recipientData) {
        io.to(recipientData.socketId).emit('receive-private-message', messagePayload);
      }
      
      socket.emit('receive-private-message', messagePayload);
    } catch (error) {
      console.error('Şəxsi mesaj xətası:', error);
      socket.emit('message-error', { error: 'Mesaj göndərilmədi' });
    }
  });

  // Mesajı şikayət et
  socket.on('report-message', ({ messageId, reportedBy, reason }) => {
    try {
      db.reportMessage(messageId, reportedBy, reason);
      socket.emit('report-success', { messageId });
    } catch (error) {
      socket.emit('report-error', { error: 'Şikayət qeydə alınmadı' });
    }
  });

  // İstifadəçini əngəllə
  socket.on('block-user', ({ blockerId, blockedId }) => {
    try {
      db.blockUser(blockerId, blockedId);
      socket.emit('block-success', { blockedId });
    } catch (error) {
      socket.emit('block-error', { error: 'Əngəlləmə uğursuz oldu' });
    }
  });

  // Disconnect
  socket.on('disconnect', () => {
    console.log('İstifadəçi ayrıldı:', socket.id);
    
    // Ayrılan istifadəçini tap və silT
    for (const [userId, userData] of connectedUsers.entries()) {
      if (userData.socketId === socket.id) {
        const facultyRoom = userData.facultyRoom;
        
        connectedUsers.delete(userId);
        
        if (activeRooms.has(facultyRoom)) {
          activeRooms.get(facultyRoom).delete(userId);
          
          // Otaqdakı digərlərə bildir
          socket.to(facultyRoom).emit('user-left', { userId });
          
          // Yenilənmiş siyahını göndər
          const roomUsers = Array.from(activeRooms.get(facultyRoom));
          io.to(facultyRoom).emit('active-users', roomUsers);
        }
        break;
      }
    }
  });
});

// Ana səhifə
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Admin paneli
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'admin.html'));
});

// Chat səhifəsi
app.get('/chat', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'chat.html'));
});

// Fakültə səhifəsi
app.get('/faculties', (req, res) => {
  res.sendFile(path.join(__dirname, 'public', 'faculties.html'));
});

// Server başlatma
server.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 BSU Chat server ${PORT} portunda işləyir`);
  console.log(`📍 URL: http://localhost:${PORT}`);
});

// Avtomatik mesaj silmə (1 saatlıq interval)
setInterval(() => {
  try {
    const settings = db.getSettings();
    if (settings.autoDeleteGroupMessages > 0) {
      db.deleteOldMessages('group', settings.autoDeleteGroupMessages);
    }
    if (settings.autoDeletePrivateMessages > 0) {
      db.deleteOldMessages('private', settings.autoDeletePrivateMessages);
    }
  } catch (error) {
    console.error('Avtomatik silmə xətası:', error);
  }
}, 60 * 60 * 1000); // hər saat

module.exports = { app, server, io };
