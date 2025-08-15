# 🔌 WebSocket Setup Guide - Fix "Live Updates Disconnected"

## 🚨 **Problem Identified**

The admin portal shows "Live Updates Disconnected" because:
1. **Missing environment configuration** - No `NEXT_PUBLIC_WS_URL` set
2. **WebSocket connection failures** - Admin app can't connect to backend
3. **Missing admin event handling** - Backend doesn't handle admin-specific events

## ✅ **What I've Fixed**

### 1. **Environment Configuration**
- Created `apps/admin/env.local.template` with proper WebSocket URL
- Added `NEXT_PUBLIC_WS_URL=ws://localhost:3001`

### 2. **WebSocket Hook Improvements**
- Enhanced error handling and logging
- Added admin-specific event handling
- Improved reconnection logic

### 3. **Backend WebSocket Gateway**
- Added admin subscription handling
- Implemented pending counts updates
- Added transaction status change notifications

### 4. **Admin UI Enhancements**
- Better connection status display
- Real-time pending request counts
- Reconnect button for failed connections

## 🚀 **Setup Instructions**

### **Step 1: Create Environment Files**

```bash
# In the admin app directory
cd apps/admin
cp env.local.template .env.local
```

### **Step 2: Configure Environment Variables**

Edit `apps/admin/.env.local`:

```bash
# Admin App Environment Variables
NEXT_PUBLIC_API_BASE_URL=http://localhost:3001/api/v1
NEXT_PUBLIC_WS_URL=ws://localhost:3001

# Development Settings
NODE_ENV=development

# NextAuth Configuration
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=your-nextauth-secret-here

# Google OAuth (if using)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
```

### **Step 3: Start the Backend API**

```bash
# In the API directory
cd apps/api
yarn dev
```

**Verify the API is running:**
- Check `http://localhost:3001/api/v1/health`
- Should see WebSocket Gateway initialized in logs

### **Step 4: Start the Admin App**

```bash
# In the admin directory
cd apps/admin
yarn dev
```

**Verify the connection:**
- Open browser console
- Should see "Admin WebSocket connecting to: ws://localhost:3001"
- Should see "Admin WebSocket connected"

## 🔍 **Troubleshooting**

### **Connection Still Failing?**

1. **Check Backend Logs:**
   ```bash
   # In API directory
   yarn dev
   # Look for WebSocket Gateway logs
   ```

2. **Check Browser Console:**
   - Open DevTools → Console
   - Look for WebSocket connection errors
   - Check for CORS issues

3. **Verify Ports:**
   - Backend API: Port 3001
   - Admin App: Port 3000
   - WebSocket: Port 3001 (same as API)

4. **Check Firewall/Network:**
   - Ensure localhost:3001 is accessible
   - Check if any firewall is blocking WebSocket connections

### **Common Issues & Solutions**

#### **Issue: "WebSocket connection failed"**
**Solution:** Ensure backend API is running on port 3001

#### **Issue: "CORS error"**
**Solution:** Backend CORS is already configured for localhost:3000

#### **Issue: "Connection refused"**
**Solution:** Check if port 3001 is available and not used by another service

## 🧪 **Testing the Connection**

### **1. Check Connection Status**
- Admin portal should show "Live Updates Connected" with green indicator
- Pending request counts should display (currently showing mock data)

### **2. Monitor Real-time Updates**
- Open browser console
- Look for WebSocket messages
- Should see connection confirmations and admin events

### **3. Test Admin Events**
- Backend sends mock pending counts on connection
- Admin dashboard should update automatically

## 📊 **Current Implementation Status**

### **✅ Completed**
- [x] Environment configuration templates
- [x] WebSocket hook improvements
- [x] Backend admin event handling
- [x] Admin UI connection status
- [x] Real-time pending counts display

### **🔄 In Progress**
- [ ] Database integration for real pending counts
- [ ] Transaction status change notifications
- [ ] Admin action real-time updates

### **📋 Next Steps**
1. **Database Integration:** Connect pending counts to actual database queries
2. **Real-time Updates:** Implement live transaction status changes
3. **Admin Notifications:** Add real-time notifications for new transactions
4. **Error Handling:** Improve error recovery and user feedback

## 🔧 **Development Commands**

```bash
# Start all services
yarn dev

# Start specific services
yarn workspace @club-corra/api dev
yarn workspace @club-corra/admin dev

# Check WebSocket status
curl http://localhost:3001/api/v1/health
```

## 📝 **Environment Variables Reference**

| Variable | Description | Default |
|----------|-------------|---------|
| `NEXT_PUBLIC_WS_URL` | WebSocket server URL | `ws://localhost:3001` |
| `NEXT_PUBLIC_API_BASE_URL` | API base URL | `http://localhost:3001/api/v1` |
| `NODE_ENV` | Environment mode | `development` |

## 🎯 **Expected Behavior After Setup**

1. **Admin Portal:** Shows "Live Updates Connected" with green indicator
2. **Pending Counts:** Displays real-time counts (currently mock data)
3. **Console Logs:** Shows successful WebSocket connection
4. **Real-time Updates:** Admin dashboard updates automatically
5. **Connection Status:** Clear visual feedback on connection health

## 🚨 **Important Notes**

- **Never commit** `.env.local` files to version control
- WebSocket URL must match your backend API port
- Ensure backend CORS allows your admin app origin
- Check browser console for detailed connection logs

## 📞 **Need Help?**

If you're still experiencing issues:

1. **Check the logs** in both backend and browser console
2. **Verify environment** variables are set correctly
3. **Ensure ports** are not conflicting
4. **Test network** connectivity to localhost:3001

The WebSocket connection should now work properly and show "Live Updates Connected" in the admin portal!
