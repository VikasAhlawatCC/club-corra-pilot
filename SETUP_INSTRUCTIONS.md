# 🚀 Environment Setup Guide

## 📋 **What I've Created For You**

I've created template environment files that you need to rename and configure:

1. **`apps/api/env.local.template`** → Rename to `apps/api/.env.local`
2. **`apps/admin/env.local.template`** → Rename to `apps/admin/.env.local`
3. **`apps/mobile/env.local.template`** → Rename to `apps/mobile/.env.local`
4. **`env.local.template`** → Rename to `.env.local` (root level)

## 🔑 **What You Need to Do**

### **Step 1: Rename Template Files**
```bash
# In the root directory
mv env.local.template .env.local

# In the API directory
cd apps/api
mv env.local.template .env.local

# In the Admin directory
cd ../admin
mv env.local.template .env.local

# In the Mobile directory
cd ../mobile
mv env.local.template .env.local
```

### **Step 2: Get Missing Credentials**

#### **Google OAuth Client Secret**
1. Go to [Google Cloud Console](https://console.cloud.google.com)
2. Navigate to "APIs & Services" → "Credentials"
3. Click on your OAuth 2.0 Client ID: `1001053464584-ttlqj8tuql3b0ed4f1mus33kukn3s034.apps.googleusercontent.com`
4. Copy the **Client Secret**
5. Replace `YOUR_GOOGLE_CLIENT_SECRET_HERE` in all `.env.local` files

#### **Generate JWT Secrets**
```bash
# Generate secure JWT secrets
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```
Replace the JWT secrets in `apps/api/.env.local`

#### **Generate NextAuth Secret**
```bash
# Generate NextAuth secret
node -e "console.log(require('crypto').randomBytes(32).toString('base64'))"
```
Replace in `apps/admin/.env.local`

### **Step 3: Configure Google Cloud Console**

Add these **Authorized redirect URIs** in your Google OAuth 2.0 Client ID:

```
http://localhost:3000/api/auth/callback/google
http://localhost:3001/auth/google/callback
clubcorra://auth/callback
```

### **Step 4: Optional Services Setup**

#### **Email Service (Gmail)**
1. Enable 2-Factor Authentication on your Google account
2. Generate App Password: [Google Account Settings](https://myaccount.google.com)
3. Use your Gmail and the generated app password

#### **SMS Service (Twilio)**
1. Sign up at [twilio.com](https://twilio.com) (free trial)
2. Get Account SID, Auth Token, and Phone Number
3. Update `apps/api/.env.local`

#### **Monitoring (Sentry)**
1. Sign up at [sentry.io](https://sentry.io) (free tier)
2. Create projects for Admin, Mobile, and API
3. Get DSN for each project

## 🎯 **Priority Order**

1. **HIGH PRIORITY** - Google OAuth Client Secret + JWT Secrets
2. **MEDIUM PRIORITY** - Email service (Gmail)
3. **LOW PRIORITY** - SMS service (Twilio) + Sentry

## ✅ **Verification Checklist**

- [ ] All `.env.local` files created and renamed
- [ ] Google OAuth Client Secret added
- [ ] JWT secrets generated and added
- [ ] NextAuth secret generated and added
- [ ] Google Cloud Console redirect URIs configured
- [ ] Email service configured (optional)
- [ ] SMS service configured (optional)
- [ ] Sentry configured (optional)

## 🚨 **Important Notes**

- **Never commit** `.env.local` files to git
- **Keep credentials secure** - use password managers
- **Test OAuth flow** after setup
- **Update production** credentials separately

## 🔧 **Quick Test**

After setup, test your configuration:

```bash
# Start the API
cd apps/api
yarn start:dev

# Start the Admin app
cd ../admin
yarn dev

# Start the Mobile app
cd ../mobile
yarn start
```

Your Google OAuth should now work across all three applications!
