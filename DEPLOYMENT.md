# 🚀 Fantasy Football App Deployment Guide

## 📋 **Prerequisites**

1. **GitHub Account** - Your code needs to be in a GitHub repository
2. **Vercel Account** - Sign up at [vercel.com](https://vercel.com)
3. **Supabase Project** - You need your Supabase credentials

## 🔧 **Step 1: Prepare Your Repository**

Make sure your code is committed and pushed to GitHub:

```bash
git add .
git commit -m "Prepare for Vercel deployment"
git push origin main
```

## 🌐 **Step 2: Deploy to Vercel**

### **Option A: Deploy via Vercel Dashboard (Recommended for beginners)**

1. Go to [vercel.com](https://vercel.com) and sign in
2. Click **"New Project"**
3. Import your GitHub repository
4. Vercel will automatically detect it's a Node.js app
5. Click **"Deploy"**

### **Option B: Deploy via Vercel CLI**

```bash
# Install Vercel CLI globally
npm install -g vercel

# Login to Vercel
vercel login

# Deploy
vercel

# Follow the prompts:
# - Set up and deploy? → Yes
# - Which scope? → Select your account
# - Link to existing project? → No
# - Project name? → ff-api-skeleton (or your preferred name)
# - Directory? → ./ (current directory)
# - Override settings? → No
```

## 🔑 **Step 3: Set Environment Variables**

After deployment, you need to set your Supabase credentials:

1. Go to your Vercel project dashboard
2. Click **"Settings"** tab
3. Click **"Environment Variables"**
4. Add these variables:

```
SUPABASE_URL = your_supabase_project_url
SUPABASE_ANON_KEY = your_supabase_anon_key
NODE_ENV = production
```

5. Click **"Save"**
6. Redeploy your project (Vercel will do this automatically)

## 📁 **Step 4: Verify Deployment**

Your app will be available at: `https://your-project-name.vercel.app`

Test these endpoints:
- **Homepage**: `https://your-project-name.vercel.app/`
- **Draft Analyzer**: `https://your-project-name.vercel.app/draft-analyzer`
- **Cheat Sheet**: `https://your-project-name.vercel.app/cheat-sheet`
- **Health Check**: `https://your-project-name.vercel.app/health`

## 🔄 **Step 5: Continuous Deployment**

Every time you push to your GitHub `main` branch, Vercel will automatically redeploy!

## 🛠️ **Development Workflow**

### **Local Development (Port 3000)**
```bash
npm run dev
```

### **Production (Vercel)**
- Automatically deployed from GitHub
- Uses `scripts/server-prod.js`
- Environment variables set in Vercel dashboard

## 🚨 **Important Notes**

1. **Data Files**: Your `data/` folder with player projections and VORP scores will be deployed
2. **Supabase**: Make sure your Supabase project is accessible from Vercel's servers
3. **API Limits**: Vercel has function execution time limits (10 seconds for hobby plan)
4. **Environment**: Production uses `NODE_ENV=production`

## 🆘 **Troubleshooting**

### **Common Issues:**

1. **"Module not found" errors**
   - Make sure all dependencies are in `package.json`
   - Check that import paths are correct

2. **Environment variables not working**
   - Verify they're set in Vercel dashboard
   - Redeploy after setting variables

3. **API endpoints returning 404**
   - Check `vercel.json` routing configuration
   - Verify server-prod.js is being used

4. **Build failures**
   - Check Vercel build logs
   - Ensure all files are committed to GitHub

## 📞 **Need Help?**

- **Vercel Docs**: [vercel.com/docs](https://vercel.com/docs)
- **Vercel Support**: [vercel.com/support](https://vercel.com/support)
- **Check Build Logs**: In your Vercel project dashboard

---

**🎯 Your app is now live and ready for your buddies to use!** 