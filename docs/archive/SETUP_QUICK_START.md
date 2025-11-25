# 🚀 Quick Start Guide - FabZClean with Supabase

## ⚡ 5-Minute Setup

### Step 1: Install Dependencies
```bash
npm install
```

### Step 2: Create Supabase Project
1. Go to https://supabase.com/dashboard
2. Click "New Project"
3. Fill in details and create

### Step 3: Set Up Database
1. In Supabase, go to SQL Editor
2. Open `/supabase/schema.sql` from this project
3. Copy ALL content and paste into SQL Editor
4. Click "Run" (takes ~30 seconds)

### Step 4: Configure Environment
1. In Supabase, go to Settings → API
2. Copy your Project URL and anon public key
3. Create `.env` file in project root:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here
PORT=5000
NODE_ENV=development
SESSION_SECRET=change-this-to-random-string
```

### Step 5: Start Application
```bash
npm run dev
```

Visit: http://localhost:5000

### Step 6: Create Admin Account
1. Go to http://localhost:5000/signup
2. Sign up with your email
3. In Supabase Dashboard → SQL Editor, run:

```sql
UPDATE public.users 
SET role = 'admin' 
WHERE email = 'your-email@example.com';
```

4. Refresh the app and log in

## ✅ You're Done!

You now have:
- ✅ Full authentication system
- ✅ 6 user roles (Admin, Manager, Employee, Driver, Customer, Factory Manager)
- ✅ Secure database with Row Level Security
- ✅ Clean, organized codebase
- ✅ Role-based access control

## 📚 Next Steps

1. **Read the docs**: 
   - `MIGRATION_TO_SUPABASE.md` - Complete migration guide
   - `SUPABASE_SETUP.md` - Detailed Supabase setup
   - `PROJECT_STRUCTURE.md` - Project organization

2. **Add data**:
   - Create franchises in the app
   - Add services
   - Create test customers

3. **Customize**:
   - Update branding
   - Adjust permissions
   - Add custom features

## 🆘 Need Help?

- **Setup Issues**: Check `SUPABASE_SETUP.md`
- **Code Structure**: See `PROJECT_STRUCTURE.md`
- **Migration Info**: Read `MIGRATION_TO_SUPABASE.md`
- **Errors**: Check the troubleshooting sections in docs

## 🎯 User Roles

### How to assign roles:
```sql
-- Make someone an admin
UPDATE public.users SET role = 'admin' WHERE email = 'user@example.com';

-- Make someone a franchise manager
UPDATE public.users SET role = 'franchise_manager', franchise_id = 'franchise-uuid' 
WHERE email = 'manager@example.com';

-- Make someone an employee
UPDATE public.users SET role = 'employee' WHERE email = 'employee@example.com';

-- Make someone a driver
UPDATE public.users SET role = 'driver' WHERE email = 'driver@example.com';

-- Factory manager
UPDATE public.users SET role = 'factory_manager', factory_id = 'factory-uuid' 
WHERE email = 'factory@example.com';
```

## 🔒 Important Security Notes

1. **Never commit `.env`** - It's in .gitignore
2. **Never share your anon key publicly** - It's meant for client-side use but still keep it private
3. **Never use the service_role key in frontend** - Only in secure backend
4. **Keep dependencies updated** - Run `npm audit` regularly

## 📱 Testing Different Roles

1. Create multiple test accounts with different roles
2. Log in as each role to see different permissions
3. Try accessing restricted pages
4. Verify data isolation works correctly

## 🎨 Customization Ideas

- Update colors in `tailwind.config.ts`
- Add your logo in `client/src/components/layout/header.tsx`
- Customize email templates in Supabase dashboard
- Add custom fields to forms
- Extend database schema for your needs

## 🚀 Production Deployment

When ready for production:

1. **Build**:
   ```bash
   npm run build
   ```

2. **Deploy**:
   - Frontend: Vercel, Netlify, Cloudflare Pages
   - Backend: Render, Railway, Fly.io
   - Database: Already on Supabase!

3. **Set production env vars** in your hosting platform

4. **Enable email verification** in Supabase for production

## 💡 Pro Tips

- Use SQL Editor in Supabase for quick database queries
- Check Activity Logs table for debugging
- Enable email notifications for important events
- Set up backups (Supabase does this automatically)
- Monitor usage in Supabase dashboard

---

**That's it! You're ready to manage laundry operations like a pro! 🧺✨**

