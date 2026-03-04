# FitTrack — Deployment Guide

## Prerequisites
- Node.js 18+
- npm / pnpm / yarn
- A [Supabase](https://supabase.com) account (free tier)
- A [Vercel](https://vercel.com) account (free tier)

---

## Step 1 — Supabase Setup

### 1.1 Create a new Supabase project
1. Go to [app.supabase.com](https://app.supabase.com)
2. Click **New project**
3. Choose a name (e.g. `fittrack`), pick a region, set a DB password
4. Wait ~2 minutes for the project to spin up

### 1.2 Run the migration
1. In the Supabase dashboard, go to **SQL Editor**
2. Open `supabase/migrations/001_initial.sql` from this project
3. Paste the entire file contents and click **Run**
4. Verify in **Table Editor** that tables (exercises, routines, workouts, etc.) and ~60 exercises exist

### 1.3 Get your API keys
Go to **Project Settings → API**:
- Copy **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
- Copy **anon / public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`

### 1.4 Configure Auth
1. Go to **Authentication → Providers**
2. Ensure **Email** is enabled
3. Optionally set site URL to your Vercel domain later

---

## Step 2 — Local Development

```bash
# Clone / navigate to project
cd fitness-tracker

# Install dependencies
npm install

# Copy env file
cp .env.local.example .env.local

# Edit .env.local with your Supabase values
NEXT_PUBLIC_SUPABASE_URL=https://YOUR_PROJECT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=YOUR_ANON_KEY

# Start dev server
npm run dev
# Open http://localhost:3000
```

---

## Step 3 — Generate PWA Icons

Icons are required for the PWA install to work on iOS.

**Option A — Use maskable.app:**
1. Go to https://maskable.app/editor
2. Create an icon using the dumbbell SVG in `scripts/generate-icons.js`
3. Export all sizes and place in `public/icons/`

**Option B — Use realfavicongenerator.net:**
1. Upload a 512×512 image
2. Download the package
3. Place PNGs in `public/icons/` with these exact names:
   - `icon-72x72.png`, `icon-96x96.png`, `icon-128x128.png`
   - `icon-144x144.png`, `icon-152x152.png`, `icon-167x167.png`
   - `icon-180x180.png`, `icon-192x192.png`, `icon-512x512.png`

---

## Step 4 — Deploy to Vercel

### 4.1 Push to GitHub
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USER/fittrack.git
git push -u origin main
```

### 4.2 Import to Vercel
1. Go to [vercel.com/new](https://vercel.com/new)
2. Import your GitHub repo
3. Framework: **Next.js** (auto-detected)
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click **Deploy**

### 4.3 Update Supabase Auth URL
1. Go to Supabase → **Authentication → URL Configuration**
2. Set **Site URL** to `https://your-app.vercel.app`
3. Add `https://your-app.vercel.app/**` to **Redirect URLs**

---

## Step 5 — Install as PWA on iPhone

1. Open your Vercel URL in **Safari** on iPhone
2. Tap the **Share** button (box with arrow)
3. Scroll down and tap **"Add to Home Screen"**
4. Name it "FitTrack" and tap **Add**
5. The app now appears as a standalone app with no browser chrome

---

## Verification Checklist

- [ ] Sign up and log in
- [ ] Create a routine with 3+ exercises
- [ ] Start workout from routine → log sets → finish
- [ ] PR notification appears when you beat a previous best
- [ ] Progress → Chart → select exercise → line chart shows historical data
- [ ] Install to iPhone home screen → opens standalone (no Safari bar)
- [ ] Log workout on iPhone → check PC — data syncs via Supabase

---

## Troubleshooting

**"Cannot connect to Supabase"**
→ Check `.env.local` values match your project exactly

**PWA not installable on iOS**
→ Must be served over HTTPS (Vercel does this automatically)
→ Check `manifest.json` is accessible at `/manifest.json`

**Middleware redirect loop**
→ Ensure your Supabase anon key is valid
→ Check cookie settings in `middleware.ts`

**Charts not rendering**
→ `recharts` uses client-side rendering — ensure `"use client"` is at top of ProgressChart

---

## Tech Stack Summary

| Layer | Tech |
|-------|------|
| Framework | Next.js 14 App Router |
| Styling | Tailwind CSS + iOS design tokens |
| Database | Supabase PostgreSQL |
| Auth | Supabase Email/Password |
| Charts | Recharts |
| PWA | @ducanh2912/next-pwa (Workbox) |
| Deploy | Vercel (free tier) |
