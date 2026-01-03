# BSU Chat - Bakı Dövlət Universiteti Tələbələr Chat Platforması

## 📋 Layihə haqqında

BSU Chat - Bakı Dövlət Universiteti tələbələri üçün xüsusi olaraq hazırlanmış real-time mesajlaşma platformasıdır. 16 fakültə üzrə ayrı-ayrı chat otaqları ilə tələbələr öz fakültə yoldaşları ilə ünsiyyət qura bilərlər.

## ✨ Xüsusiyyətlər

### İstifadəçi Xüsusiyyətləri
- ✅ @bsu.edu.az email ilə qeydiyyat sistemi
- ✅ Telefon nömrəsi doğrulaması (+994XXXXXXXXX formatı)
- ✅ 3 təsadüfi doğrulama sualı (minimum 2 düzgün cavab tələb olunur)
- ✅ 16 fakültə üzrə ayrı chat otaqları
- ✅ Real-time mesajlaşma (Socket.IO)
- ✅ Profil şəkli yükləmə və dəyişdirmə
- ✅ İstifadəçiləri əngəlləmə funksiyası
- ✅ Mesaj və istifadəçi şikayət etmə
- ✅ Şəxsi mesajlaşma hazırlığı
- ✅ Bakı vaxtı ilə mesaj tarixləri
- ✅ Avtomatik filtr sistemi

### Admin Panel Xüsusiyyətləri
- 👑 Super Admin və Alt Admin sistemi
- 📊 Dashboard (statistika)
- 👥 İstifadəçi idarəetməsi (aktiv/deaktiv)
- 📜 Qaydaların yaradılması və redaktəsi
- 📌 Günün mövzusunun təyin edilməsi
- 🔒 Filtr sözlərinin idarəsi
- ⏰ Avtomatik mesaj silmə parametrləri
- ⚠️ 16+ şikayəti olan istifadəçilərin monitorinqi
- 👨‍💼 Alt admin yaratma və silmə (Super Admin)

### Təhlükəsizlik
- 🔐 JWT authentication
- 🔒 Bcrypt şifrə şifrələməsi
- 🛡️ Helmet.js təhlükəsizlik başlıqları
- ⏱️ Rate limiting
- 🚫 İstifadəçi əngəlləmə sistemi

## 🏗️ Texnologiyalar

### Backend
- **Node.js** - Runtime environment
- **Express.js** - Web framework
- **Socket.IO** - Real-time communication
- **Better-SQLite3** - Database
- **JWT** - Authentication
- **Bcrypt** - Password hashing

### Frontend
- **Vanilla JavaScript** - No framework
- **Socket.IO Client** - Real-time updates
- **Modern CSS** - Responsive design

## 📁 Layihə strukturu

```
webapp/
├── server.js                 # Ana server faylı
├── package.json              # Dependencies və scripts
├── .env                      # Environment variables
├── .gitignore               # Git ignore
├── Procfile                 # Railway deployment
├── railway.json             # Railway config
├── database/
│   └── db.js                # Database module
├── routes/
│   ├── auth.js              # Authentication routes
│   ├── chat.js              # Chat routes
│   └── admin.js             # Admin routes
├── middleware/
│   └── auth.js              # Auth middleware
└── public/
    ├── index.html           # Login/Register page
    ├── faculties.html       # Faculties selection
    ├── chat.html            # Chat room
    ├── admin.html           # Admin panel
    ├── js/
    │   ├── auth.js          # Auth logic
    │   ├── faculties.js     # Faculties logic
    │   ├── chat.js          # Chat logic (Socket.IO)
    │   └── admin.js         # Admin logic
    └── images/
        └── avatars/         # User avatars
```

## 🚀 Quraşdırma və İstifadə

### Lokal Development

1. **Dependencies quraşdırın:**
```bash
npm install
```

2. **Serveri işə salın:**
```bash
npm start
```

3. **Development mode:**
```bash
npm run dev
```

Server `http://localhost:3000` ünvanında işə düşəcək.

### Railway.com Deploy

1. **GitHub-a push edin:**
```bash
git add .
git commit -m "Initial commit"
git push origin main
```

2. **Railway.com-da yeni project yaradın**

3. **GitHub repo-nu bağlayın**

4. **Environment variables əlavə edin:**
   - `NODE_ENV=production`
   - `JWT_SECRET=your-secret-key`
   - `SESSION_SECRET=your-session-secret`

5. **Deploy edin**

Railway avtomatik olaraq package.json-dakı `start` scriptini işə salacaq.

## 👥 Admin Hesabları

### Super Admin (default)
- **İstifadəçi adı:** ursamajor
- **Şifrə:** ursa618

Super Admin aşağıdakı əlavə hüquqlara malikdir:
- Yeni adminlər yaratmaq
- Mövcud adminləri silmək
- Bütün admin əməliyyatları

## 🎯 İstifadə Qaydaları

1. **Qeydiyyat:**
   - @bsu.edu.az email və +994 prefiksli telefon tələb olunur
   - 3 doğrulama sualından minimum 2-si düzgün cavablandırılmalıdır
   - Ad, soyad, fakültə, dərəcə və kurs məcburidir

2. **Mesajlaşma:**
   - Fakültənizi seçin və chat otağına daxil olun
   - Real-time mesaj göndərin və alın
   - İstifadəçi profilinə baxın
   - Lazım gələrsə əngəlləyin və ya şikayət edin

3. **Admin Panel:**
   - `/admin` səhifəsindən giriş edin
   - İstifadəçiləri idarə edin
   - Qaydalar və günün mövzusunu yeniləyin
   - Filtr sözlərini əlavə edin
   - Şikayətlərə baxın

## 🔧 API Endpoints

### Authentication
- `POST /api/auth/register` - Qeydiyyat
- `POST /api/auth/login` - Giriş
- `POST /api/auth/logout` - Çıxış
- `GET /api/auth/me` - İstifadəçi məlumatı
- `GET /api/auth/verification-questions` - Doğrulama sualları

### Chat
- `GET /api/chat/messages/group/:faculty` - Qrup mesajları
- `GET /api/chat/messages/private/:otherUserId` - Şəxsi mesajlar
- `POST /api/chat/block-user` - İstifadəçini əngəllə
- `POST /api/chat/unblock-user` - Əngəldən çıxar
- `GET /api/chat/blocked-users` - Əngəllənmiş istifadəçilər
- `GET /api/chat/settings` - Parametrlər
- `POST /api/chat/upload-avatar` - Avatar yüklə

### Admin
- `POST /api/admin/login` - Admin girişi
- `GET /api/admin/users` - İstifadəçilər
- `PUT /api/admin/users/:userId/status` - Status dəyiş
- `PUT /api/admin/rules` - Qaydalar yenilə
- `PUT /api/admin/daily-topic` - Günün mövzusu
- `PUT /api/admin/filter-words` - Filtr sözləri
- `PUT /api/admin/auto-delete` - Avtomatik silmə
- `GET /api/admin/reported-users` - Şikayətlər
- `POST /api/admin/create-admin` - Admin yarat (Super)
- `GET /api/admin/admins` - Adminlər (Super)
- `DELETE /api/admin/admins/:adminId` - Admin sil (Super)

## 🌐 Socket.IO Events

### Client → Server
- `join-room` - Otağa qoşul
- `send-message` - Mesaj göndər
- `send-private-message` - Şəxsi mesaj
- `report-message` - Mesajı şikayət et
- `block-user` - İstifadəçini əngəllə

### Server → Client
- `receive-message` - Mesaj al
- `receive-private-message` - Şəxsi mesaj al
- `active-users` - Aktiv istifadəçilər
- `user-joined` - İstifadəçi qoşuldu
- `user-left` - İstifadəçi ayrıldı
- `message-error` - Mesaj xətası
- `report-success` - Şikayət uğurlu
- `block-success` - Əngəlləmə uğurlu

## 📊 Database Schema

### users
- id, full_name, email, phone, password (hashed)
- faculty, degree, course, avatar
- is_active, created_at

### messages
- id, user_id, room_or_recipient, message
- type (group/private), created_at

### blocked_users
- id, blocker_id, blocked_id, created_at

### reports
- id, message_id, reported_by, reason, created_at

### report_counts
- user_id, report_count

### admins
- id, username, password (hashed)
- is_super_admin, created_at

### settings
- id, rules, daily_topic, filter_words
- auto_delete_group_messages, auto_delete_private_messages

## 🔐 Təhlükəsizlik Qeydləri

- Bütün şifrələr bcrypt ilə hash olunur
- JWT tokenləri 24 saat etibarlıdır
- Rate limiting qorunması aktiv
- Helmet.js təhlükəsizlik başlıqları
- CORS konfiqurasiyası
- Session idarəetməsi

## 📝 Lisenziya

Bu layihə BSU tələbələri üçün hazırlanmışdır.

## 👨‍💻 Development

Layihəyə töhfə vermək istəyirsinizsə:

1. Repo-nu fork edin
2. Feature branch yaradın
3. Commit edin
4. Push edin
5. Pull Request açın

## 📞 Əlaqə

Suallar və təkliflər üçün BSU-nun rəsmi kanalları ilə əlaqə saxlayın.

---

**Hazırlanma tarixi:** 2026
**Status:** ✅ Production Ready
**Platform:** Railway.com
