# 🚀 Quick Setup Guide

## Immediate Action Required

Your Supabase project is **almost ready** but missing one critical piece!

### ❌ What's Missing
- **SUPABASE_ANON_KEY** - This is required for the frontend to work

### ✅ What You Have
- **SUPABASE_URL** - Your project URL
- **SUPABASE_SERVICE_ROLE_KEY** - Your service role key (but it's incomplete)

## 🔧 Fix This Now

### Step 1: Get Your Supabase Keys
1. Go to [supabase.com](https://supabase.com) and sign in
2. Open your project: `hyzcigbofcitdncbmekk`
3. Click **Settings** → **API** in the left sidebar
4. Copy these values:

```
Project URL: https://hyzcigbofcitdncbmekk.supabase.co
anon public key: [Copy the long string here]
service_role secret key: [Copy the complete long string here]
```

### Step 2: Update Your .env File
Edit your `.env` file to look like this:

```env
SUPABASE_URL=https://hyzcigbofcitdncbmekk.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...[complete key here]
SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...[complete key here]
```

### Step 3: Create Your Database Tables
1. In Supabase, go to **SQL Editor**
2. Copy the entire content of `supabase_schema.sql`
3. Paste and run it

### Step 4: Test Everything
```bash
# Test your configuration
node scripts/test-config.js

# If successful, start the server
npm run dev

# In another terminal, load sample data
npm run load-data
```

### Step 5: Open Your App
Visit: `http://localhost:3000`

## 🆘 Still Having Issues?

Run this to see what's wrong:
```bash
node scripts/test-config.js
```

## 📱 What You'll Get

Once working, you'll have:
- ⚡ **Fast API** serving data from Supabase
- 🏈 **Beautiful frontend** showing player rankings
- 📊 **Real-time data** with auto-refresh
- 📱 **Mobile-responsive** design
- 🔄 **Easy data updates** via CSV uploads

## 🎯 Next Steps After Setup

1. **Customize your data** - Replace the sample CSV with real rankings
2. **Deploy to Vercel** - `npm i -g vercel && vercel`
3. **Add more features** - Player search, position filters, etc.

---

**Need help?** Check the main README.md for detailed troubleshooting! 