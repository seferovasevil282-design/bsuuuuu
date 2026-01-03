# Railway.com Deployment Guide

## 🚂 Railway-ə Deploy Etmək

### 1. Railway Account

1. [Railway.com](https://railway.app/) saytına daxil olun
2. GitHub hesabı ilə qeydiyyatdan keçin
3. Dashboard-a keçin

### 2. Yeni Project Yaradın

1. **"New Project"** düyməsinə basın
2. **"Deploy from GitHub repo"** seçin
3. **"seferovasevil282-design/bsuuuuu"** repository-ni seçin
4. Railway avtomatik deployment başladacaq

### 3. Environment Variables Əlavə Edin

Railway dashboard-da project settings-ə keçin və aşağıdakı environment variables-ları əlavə edin:

```
NODE_ENV=production
PORT=3000
JWT_SECRET=bsu-chat-jwt-secret-key-2024-production-railway
SESSION_SECRET=bsu-chat-session-secret-key-2024-railway
```

### 4. Deploy Statusu

Railway avtomatik olaraq:
- Dependencies quraşdıracaq (`npm install`)
- `npm start` scriptini işə salacaq
- Public URL verəcək

### 5. Custom Domain (İstəyə bağlı)

Railway dashboard-da:
1. **Settings** → **Domains** seçin
2. Custom domain əlavə edin
3. DNS parametrlərini konfiqurasiya edin

## 📊 Deployment Logs

Railway dashboard-da **"Deployments"** tab-ında bütün deployment logs-ları görə bilərsiniz:
- Build logs
- Runtime logs
- Error logs

## 🔄 Avtomatik Deploy

Hər GitHub push-dan sonra Railway avtomatik yenidən deploy edəcək.

## 🛠️ Troubleshooting

### Build Uğursuz olarsa:

1. **Dependencies xətası:**
   ```bash
   # package.json-da bütün dependencies doğrudur
   npm install
   ```

2. **Port xətası:**
   ```bash
   # Railway avtomatik PORT environment variable təyin edir
   # server.js-də: const PORT = process.env.PORT || 3000
   ```

3. **Database xətası:**
   ```bash
   # SQLite .gitignore-da olduğu üçün Railway yeni db yaradacaq
   # İlk dəfə işə salınanda super admin avtomatik yaradılır
   ```

### Runtime Xətaları:

Railway logs-unda xətaları yoxlayın:
```bash
# Dashboard → Deployments → View Logs
```

## 📝 Deployment Checklist

- [x] `package.json` - bütün dependencies mövcuddur
- [x] `Procfile` - Railway üçün start komandası
- [x] `railway.json` - Railway konfiqurasiyası
- [x] Environment variables - konfiqurasiya edilib
- [x] `.gitignore` - sensitive fayllar ignore edilib
- [x] Port konfiqurasiyası - `process.env.PORT`
- [x] Database - SQLite avtomatik yaradılır

## 🎯 Production URL

Deploy uğurlu olduqdan sonra Railway sizə public URL verəcək:
```
https://bsuuuuu-production.up.railway.app
```

Bu URL ilə bütün dünyadan əlçatandır!

## 💡 Performance Tips

1. **Keep-Alive:** Railway 5 dəqiqə inactivity-dən sonra service-i yatıra bilər (Free plan)
2. **Database:** Production üçün PostgreSQL/MySQL istifadə etmək tövsiyyə olunur
3. **File Uploads:** Avatar şəkillər üçün S3 və ya Cloudinary istifadə edin

## 🔐 Security Checklist

- [x] Environment variables Railway-də təhlükəsiz saxlanılır
- [x] JWT secrets güclü və unikaldır
- [x] Bcrypt şifrə hashing
- [x] Helmet.js security headers
- [x] Rate limiting aktiv
- [x] CORS konfiqurasiyası

## 📞 Support

Railway ilə bağlı suallar üçün:
- [Railway Documentation](https://docs.railway.app/)
- [Railway Discord](https://discord.gg/railway)

---

**Deploy zamanı problem yaşasanız README.md-də göstərilən sandbox URL-dən test edə bilərsiniz.**
