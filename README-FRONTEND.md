# 🚀 Frontend Setup - Lighting Monitoring Application

## ✅ Status Setup

**API Backend:** ✅ SUDAH SIAP
- Google Apps Script deployed: ✅
- Spreadsheet ID configured: ✅  
- Folder ID configured: ✅
- API URL: `https://script.google.com/macros/s/AKfycbwIqRPDbjntE-Ox4DsGXtNa-JFrXeDmNeK6PsUIY-qBDb1BhYLiAqw7AOKu2QqGurzw/exec`

## 📁 File Structure

```
frontend-setup/
├── index.html          # Main application interface
├── css/
│   └── style.css       # Application styling
├── js/
│   ├── auth.js         # Authentication & session management
│   └── app.js          # Main application logic
└── README-FRONTEND.md  # This file
```

## 🌐 Cara Deploy Frontend

### Option 1: GitHub Pages (Recommended)

1. **Buat Repository GitHub**
   - Login ke GitHub
   - Buat repository baru: `lighting-monitoring-app`
   - Set Public

2. **Upload Files**
   - Upload semua file dari folder `frontend-setup/` ke repository
   - Pastikan struktur folder tetap sama

3. **Enable GitHub Pages**
   - Go to Settings → Pages
   - Source: Deploy from a branch
   - Branch: main / root
   - Save

4. **Akses Aplikasi**
   - URL: `https://yourusername.github.io/lighting-monitoring-app`
   - Aplikasi sudah bisa digunakan!

### Option 2: Netlify

1. **Deploy via Netlify**
   - Login ke [Netlify](https://netlify.com)
   - Drag & drop folder `frontend-setup/` ke Netlify
   - Tunggu deployment selesai

2. **Akses Aplikasi**
   - Netlify akan berikan URL seperti: `https://random-name-123456.netlify.app`

### Option 3: Local Server

1. **Siapkan Local Server**
   ```bash
   # Navigate to frontend-setup folder
   cd frontend-setup
   
   # Using Python (if installed)
   python -m http.server 8000
   
   # Using Node.js (if installed)
   npx serve .
   ```

2. **Akses Aplikasi**
   - Buka browser: `http://localhost:8000`

## 🔧 Configuration Status

**✅ API Endpoint sudah dikonfigurasi di:**
- `js/auth.js` - Line dengan API_ENDPOINT
- `js/app.js` - Line dengan API_ENDPOINT

**✅ Demo Accounts:**
- **Admin:** admin / password123
- **User1:** user1 / password123  
- **User2:** user2 / password123
- **User3:** user3 / password123

## 🎯 Features Aplikasi

### Dashboard
- 📊 Summary statistics (Total Fitting, Completed, In Progress, Total Wattage)
- 🔄 Real-time data refresh
- 📄 PDF export functionality

### Data Management
- ➕ Add new lighting installation data
- ✏️ Edit existing records
- 🗑️ Delete records
- 🔍 Filter by floor, status, and search
- 📋 Data table dengan pagination

### Authentication
- 🔐 Role-based access (Admin, User1, User2, User3)
- ⏰ Session timeout (30 minutes)
- 🔄 Auto logout when session expires

### User Interface
- 📱 Responsive design (mobile-friendly)
- 🎨 Modern UI dengan Font Awesome icons
- ⚡ Loading indicators
- 🔔 Alert notifications
- 🌙 Clean and professional design

## 🧪 Testing

Setelah deploy, test dengan:

1. **Login Test**
   - Coba login dengan demo account
   - Verifikasi redirect ke dashboard

2. **Data Test**
   - Add new lighting data
   - Edit existing data
   - Apply filters
   - Export PDF

3. **Session Test**
   - Leave aplikasi idle untuk 30+ menit
   - Verifikasi auto logout

## 🚨 Troubleshooting

### CORS Issues
Jika ada error CORS:
- Pastikan API endpoint benar
- Check Google Apps Script permissions
- Verify spreadsheet access

### Authentication Issues
Jika login gagal:
- Check API endpoint accessibility
- Verify demo accounts di Google Sheets
- Check browser console untuk error

### Data Loading Issues
Jika data tidak muncul:
- Check spreadsheet permissions
- Verify sheet names (Data, Users, Activities)
- Check filter settings

## 📞 Support

Jika ada masalah:
1. Check browser console untuk error messages
2. Verify API response di Network tab
3. Test API endpoint directly di browser
4. Check Google Sheets permissions

---

**Ready to Deploy!** 🚀

Pilih salah satu deployment method di atas dan aplikasi Anda akan siap digunakan!
