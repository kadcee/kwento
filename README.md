# Kwento

A private daily capture app. Text, voice, photos, moods. Weekly, monthly, and yearly AI summaries generated automatically.

*Kwento* is Tagalog for story. You build yours one fragment at a time.

---

## Setup (one-time, ~30 minutes)

### 1. Supabase

1. Create a free account at [supabase.com](https://supabase.com)
2. Create a new project
3. Go to **SQL Editor** and run the contents of `supabase/migrations/001_initial.sql`
4. Go to **Storage** > **New bucket**
   - Name: `photos`
   - Public: OFF (keep private)
5. In Storage > Policies, add a policy for the `photos` bucket:
   - Allowed operation: All
   - Policy: `(auth.uid()::text = (storage.foldername(name))[1])`
6. Go to **Settings > API** and copy:
   - Project URL
   - `anon` public key
   - `service_role` key (keep this secret)

### 2. Anthropic API Key

1. Go to [console.anthropic.com](https://console.anthropic.com)
2. Create an API key
3. Keep it secret

### 3. Deploy to Vercel

1. Push this repo to GitHub
2. Go to [vercel.com](https://vercel.com) and import your GitHub repo
3. Add environment variables in Vercel:
   ```
   VITE_SUPABASE_URL=your_supabase_project_url
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```
4. Deploy. Vercel gives you a URL like `your-app.vercel.app`

### 4. GitHub Actions Secrets

In your GitHub repo, go to **Settings > Secrets and variables > Actions** and add:

| Secret | Value |
|--------|-------|
| `SUPABASE_URL` | Your Supabase project URL |
| `SUPABASE_SERVICE_KEY` | Your Supabase service_role key |
| `ANTHROPIC_API_KEY` | Your Anthropic API key |

### 5. Supabase Auth Redirect

1. In Supabase, go to **Authentication > URL Configuration**
2. Add your Vercel URL to **Redirect URLs**: `https://your-app.vercel.app`

---

## How it works

**Capturing**
- Open the app on your phone
- Type, tap voice to dictate, take a photo, or pick moods
- Hit Save. Done.

**Summaries**
- Weekly: auto-generated every Sunday night
- Monthly: auto-generated on the last day of the month
- Yearly: auto-generated on December 31
- Each summary includes AI narrative, mood counts, and (for monthly/yearly) highs, lows, accomplishments, and trips
- Add your own note to any summary

**Manual trigger**
- Go to your GitHub repo > Actions > Generate Summaries > Run workflow
- Pick weekly, monthly, or yearly

---

## Privacy

- Login is via magic link (email only, no password)
- All data lives in your private Supabase project
- Photos stored in a private bucket only you can access
- No third party has access to your data except Supabase (storage) and Anthropic (summary generation only, not stored)

---

## Local development

```bash
cp .env.example .env
# Fill in your Supabase URL and anon key

npm install
npm run dev
```
