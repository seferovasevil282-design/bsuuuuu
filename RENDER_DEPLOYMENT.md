# Render.com Deployment Guide for BSU Chat

## 🚀 Render.com-a Deploy Etmək

### 1. Render Account Yaradın

1. [Render.com](https://render.com/) saytına daxil olun
2. GitHub hesabı ilə qeydiyyatdan keçin ("Sign Up with GitHub")
3. Dashboard-a keçin

### 2. Yeni Web Service Yaradın

1. Dashboard-da **"New +"** düyməsinə basın
2. **"Web Service"** seçin
3. GitHub repository-ni bağlayın:
   - **Repository:** `seferovasevil282-design/bsuuuuu`
   - **Connect** düyməsinə basın

### 3. Service Settings

Aşağıdakı parametrləri konfiqurasiya edin:

**Basic Settings:**
- **Name:** `bsu-chat` (və ya istədiyiniz ad)
- **Region:** Closest to users (məsələn: Frankfurt)
- **Branch:** `main`
- **Runtime:** `Node`
- **Build Command:** `npm install`
- **Start Command:** `npm start`

**Instance Type:**
- **Free** (başlanğıc üçün)
- **Starter** (daha yaxşı performans üçün - $7/ay)

### 4. Environment Variables

**Environment** tab-ında aşağıdakı variables əlavə edin:

```
NODE_ENV=production
JWT_SECRET=bsu-chat-jwt-secret-key-2024-production-render
SESSION_SECRET=bsu-chat-session-secret-key-2024-render
PORT=3000
```

**⚠️ Qeyd:** PORT environment variable Render tərəfindən avtomatik təyin edilir, amma 3000 default olaraq saxlamaq olar.

### 5. Deploy Başlatma

1. Bütün parametrlər konfiqurasiya edildikdən sonra **"Create Web Service"** düyməsinə basın
2. Render avtomatik olaraq deploy prosesini başladacaq
3. Deploy logs-unda gedişatı izləyə bilərsiniz

### 6. Deploy Prosesi

Render avtomatik olaraq:
1. ✅ Repository-ni clone edəcək
2. ✅ `npm install` ilə dependencies quraşdıracaq
3. ✅ `npm start` ilə serveri işə salacaq
4. ✅ Public URL verəcək

### 7. Public URL

Deploy uğurlu olduqdan sonra Render sizə public URL verəcək:
```
https://bsu-chat.onrender.com
```

Bu URL ilə tətbiqə hər yerdən daxil ola bilərsiniz!

## 📊 Deploy Status Yoxlama

1. **Logs:** Deploy və runtime logs-ları real-time izləyin
2. **Metrics:** CPU, Memory, Network istifadəsini görün
3. **Events:** Deploy tarixçəsi və statuslar

## 🔄 Avtomatik Deploy

Hər GitHub push-dan sonra Render avtomatik yenidən deploy edəcək:
1. Code-da dəyişiklik edin
2. `git push origin main`
3. Render avtomatik deploy başladacaq

## 🛠️ Troubleshooting

### Build Xətaları:

**Dependencies yüklənmir:**
```bash
# package.json-da bütün dependencies mövcuddur
# Render logs-unda xətanı yoxlayın
```

**Port xətası:**
```bash
# server.js-də PORT environment variable istifadə olunur:
const PORT = process.env.PORT || 3000;
```

**Database xətası:**
```bash
# SQLite verilənlər bazası avtomatik yaradılır
# İlk dəfə super admin (ursamajor/ursa618) avtomatik qurulur
```

### Runtime Xətaları:

**503 Service Unavailable:**
- Free plan-da 15 dəqiqə inactivity-dən sonra service yatır
- İlk request-də yenidən oyanır (cold start ~30 saniyə)

**Memory Limit:**
- Free plan: 512MB RAM
- Starter plan: 1GB RAM
- Lazım gələrsə plan upgrade edin

## ⚙️ Advanced Configuration

### Custom Domain

1. Render Dashboard → Settings → Custom Domain
2. Domain əlavə edin (məsələn: `chat.bsu.edu.az`)
3. DNS records konfiqurasiya edin:
   ```
   Type: CNAME
   Name: chat
   Value: bsu-chat.onrender.com
   ```

### Health Check

Render avtomatik health check edir:
- URL: `https://bsu-chat.onrender.com/`
- Interval: 30 saniyə
- Timeout: 10 saniyə

### Persistent Disk (Opsional)

Free plan-da disk persistent deyil. Database üçün:
1. Dashboard → Disks
2. Add Disk
3. Mount path: `/data`
4. Size: 1GB (minimum)

## 🔐 Security

Render avtomatik təmin edir:
- ✅ HTTPS/SSL certificates (pulsuz)
- ✅ DDoS protection
- ✅ Environment variables encryption
- ✅ Private networking

## 💰 Pricing

**Free Plan:**
- ✅ 750 saat/ay (kifayətdir)
- ✅ Avtomatik SSL
- ⚠️ 15 dəqiqə inactivity-dən sonra yatır
- ⚠️ 512MB RAM

**Starter Plan ($7/ay):**
- ✅ Always on (heç vaxt yatmır)
- ✅ 1GB RAM
- ✅ Daha sürətli
- ✅ Priority support

## 📝 Production Checklist

- [x] `package.json` - `start` script mövcuddur
- [x] `server.js` - `process.env.PORT` istifadə olunur
- [x] Environment variables - production values
- [x] `.gitignore` - sensitive fayllar ignore edilib
- [x] Database - SQLite avtomatik yaradılır
- [x] Error handling - production-ready
- [x] Logging - console.log aktiv

## 🎯 Deploy URL-lər

**Production:**
- Render: `https://bsu-chat.onrender.com`
- Custom domain (opsional): `https://chat.bsu.edu.az`

**Development:**
- Sandbox: https://3000-i5n7t42cimpg3d86j1phu-8f57ffe2.sandbox.novita.ai
- GitHub: https://github.com/seferovasevil282-design/bsuuuuu

## 📞 Support

**Render Dokumentasiya:**
- [Render Docs](https://render.com/docs)
- [Node.js Deployment](https://render.com/docs/deploy-node-express-app)
- [Environment Variables](https://render.com/docs/environment-variables)

**BSU Chat Support:**
- GitHub Issues: https://github.com/seferovasevil282-design/bsuuuuu/issues
- README: https://github.com/seferovasevil282-design/bsuuuuu/blob/main/README.md

---

**🎉 Deploy uğurlu olduqdan sonra test edin:**
1. Ana səhifə: `https://bsu-chat.onrender.com/`
2. Admin panel: `https://bsu-chat.onrender.com/admin`
3. API health: `https://bsu-chat.onrender.com/api/auth/verification-questions`
