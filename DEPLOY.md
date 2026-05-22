# DET Trades — VPS Deployment Guide
# Dark Empire Technologies | fx.darkempiretech.eu.cc

## ── STEP 1: Upload backend to VPS ──────────────────────────

```bash
# On your local machine, zip and upload
scp -r det-trades-backend/ user@YOUR_VPS_IP:/var/www/det-trades/
```

Or use FileZilla/SFTP to upload the folder.

## ── STEP 2: Install Node.js (Ubuntu) ───────────────────────

```bash
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs
node --version   # should show v20.x
```

## ── STEP 3: Install dependencies ───────────────────────────

```bash
cd /var/www/det-trades/det-trades-backend
npm install
```

## ── STEP 4: Create upload directories ──────────────────────

```bash
mkdir -p uploads/chat-images uploads/analysis
chmod 755 uploads uploads/chat-images uploads/analysis
```

## ── STEP 5: Install PM2 (process manager) ──────────────────

```bash
sudo npm install -g pm2

# Start the server
pm2 start server.js --name det-trades

# Auto-start on reboot
pm2 startup
pm2 save
```

### Useful PM2 commands:
```bash
pm2 status              # Check running status
pm2 logs det-trades     # View live logs
pm2 restart det-trades  # Restart server
pm2 stop det-trades     # Stop server
```

## ── STEP 6: Install & Configure Nginx ──────────────────────

```bash
sudo apt install nginx -y
sudo nano /etc/nginx/sites-available/det-trades
```

Paste this config:

```nginx
server {
    listen 80;
    server_name fx.darkempiretech.eu.cc;

    # Max upload size for chart images
    client_max_body_size 15M;

    location / {
        # Frontend files (add later)
        root /var/www/det-trades/frontend;
        index index.html;
        try_files $uri $uri/ /index.html;
    }

    location /api/ {
        proxy_pass http://localhost:4010;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
        proxy_read_timeout 120s;
    }

    location /uploads/ {
        alias /var/www/det-trades/det-trades-backend/uploads/;
        expires 7d;
        add_header Cache-Control "public";
        add_header Access-Control-Allow-Origin *;
    }

    location /health {
        proxy_pass http://localhost:4010/health;
    }
}
```

```bash
# Enable the site
sudo ln -s /etc/nginx/sites-available/det-trades /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl restart nginx
```

## ── STEP 7: SSL Certificate (HTTPS) ────────────────────────

```bash
sudo apt install certbot python3-certbot-nginx -y
sudo certbot --nginx -d fx.darkempiretech.eu.cc
# Follow prompts — enter email, agree to terms
# Certbot auto-renews every 90 days
```

## ── STEP 8: Firewall ────────────────────────────────────────

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

## ── STEP 9: Set up Firebase Realtime Database ───────────────

1. Go to Firebase Console → Realtime Database → Create Database
2. Choose region: us-central1 (or nearest)
3. Start in **locked mode**
4. Paste these security rules:

```json
{
  "rules": {
    "community_chat": {
      ".read": "auth != null",
      ".write": "auth != null",
      "$messageId": {
        ".write": "auth != null"
      }
    },
    "support_chat": {
      "$uid": {
        ".read": "auth != null && (auth.uid == $uid || root.child('users/' + auth.uid + '/role').val() == 'admin')",
        ".write": "auth != null && (auth.uid == $uid || root.child('users/' + auth.uid + '/role').val() == 'admin')"
      }
    },
    "support_chat_meta": {
      ".read": "auth != null",
      "$uid": {
        ".write": "auth != null && (auth.uid == $uid || root.child('users/' + auth.uid + '/role').val() == 'admin')"
      }
    }
  }
}
```

## ── STEP 10: Firestore Security Rules ──────────────────────

In Firebase Console → Firestore → Rules:

```
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {

    // Users — read own, write own
    match /users/{uid} {
      allow read: if request.auth != null && request.auth.uid == uid;
      allow write: if false; // backend only
    }

    // Analyses — read own
    match /analyses/{id} {
      allow read: if request.auth != null &&
        resource.data.uid == request.auth.uid;
      allow write: if false;
    }

    // Notifications — read own
    match /notifications/{id} {
      allow read: if request.auth != null &&
        resource.data.uid == request.auth.uid;
      allow write: if false;
    }

    // Signals — read by authenticated
    match /signals/{id} {
      allow read: if request.auth != null;
      allow write: if false;
    }

    // App settings — read by authenticated
    match /app_settings/{id} {
      allow read: if request.auth != null;
      allow write: if false;
    }

    // Everything else — backend only
    match /{document=**} {
      allow read, write: if false;
    }
  }
}
```

## ── STEP 11: Create Admin Account ──────────────────────────

1. Register normally via the app (or API)
2. Go to **Firebase Console → Firestore → users collection**
3. Find your user document
4. Edit the `role` field → set to `"admin"`
5. Done — that account now has full admin access

## ── STEP 12: Set Paystack Webhook ──────────────────────────

1. Go to dashboard.paystack.com → Settings → API Keys & Webhooks
2. Webhook URL: `https://fx.darkempiretech.eu.cc/api/subscription/webhook`
3. Copy the webhook secret → paste into `config.js` → `PAYSTACK.WEBHOOK_SECRET`
4. Restart server: `pm2 restart det-trades`

## ── VERIFY EVERYTHING IS WORKING ───────────────────────────

```bash
# Health check
curl https://fx.darkempiretech.eu.cc/health

# Expected response:
# {"status":"ok","app":"DET Trades","brand":"Dark Empire Technologies",...}
```

## ── API ENDPOINTS SUMMARY ───────────────────────────────────

### Auth
POST   /api/auth/register
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout
POST   /api/auth/change-password
POST   /api/auth/update-profile

### Analysis
POST   /api/analysis/analyze          (multipart: chart_4h, chart_15m, pair)
GET    /api/analysis/history
GET    /api/analysis/:id
GET    /api/analysis/stats/pairs

### Subscription
GET    /api/subscription/plans
POST   /api/subscription/initialize
GET    /api/subscription/verify/:ref
POST   /api/subscription/webhook
GET    /api/subscription/status
POST   /api/subscription/cancel

### Chat
GET    /api/chat/community/messages
POST   /api/chat/community/message
POST   /api/chat/community/image      (multipart: image)
DELETE /api/chat/community/:messageId (admin)
POST   /api/chat/community/ban/:uid   (admin)
GET    /api/chat/support/thread
POST   /api/chat/support/message
GET    /api/chat/support/threads      (admin)

### Signals & Notifications
GET    /api/signals
GET    /api/signals/:id
POST   /api/signals                   (admin)
PATCH  /api/signals/:id               (admin)
DELETE /api/signals/:id               (admin)
PATCH  /api/signals/:id/outcome       (admin)
GET    /api/signals/notifications/all
PATCH  /api/signals/notifications/:id/read
PATCH  /api/signals/notifications/read-all
POST   /api/signals/broadcast         (admin)
GET    /api/signals/broadcast/history (admin)

### Admin
GET    /api/admin/overview
GET    /api/admin/users
GET    /api/admin/users/:uid
PATCH  /api/admin/users/:uid/ban
PATCH  /api/admin/users/:uid/unban
PATCH  /api/admin/users/:uid/plan
PATCH  /api/admin/users/:uid/role
GET    /api/admin/pricing
PUT    /api/admin/pricing
GET    /api/admin/coupons
POST   /api/admin/coupons
PATCH  /api/admin/coupons/:id
DELETE /api/admin/coupons/:id
GET    /api/admin/settings
PUT    /api/admin/settings
GET    /api/admin/flagged-ips
PATCH  /api/admin/flagged-ips/:ip/block
PATCH  /api/admin/flagged-ips/:ip/unblock
GET    /api/admin/analytics
