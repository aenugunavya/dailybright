# Daily Prompt System Setup Guide

This guide helps you set up the automated daily prompt generation system for Daily Bright.

## 🎯 What This System Does

1. **Automated Generation**: OpenAI generates creative, gamified gratitude prompts every day
2. **Random Timing**: Prompts are generated at random times throughout the day (8 AM - 6 PM)
3. **Smart Caching**: Each day gets exactly one prompt, stored in the database
4. **User Responses**: Users can respond to daily prompts with text and photos
5. **Fallback System**: If OpenAI fails, curated creative prompts are used

## 🏗️ Architecture

```
Vercel Cron Jobs (5 random times daily)
    ↓
/api/cron/daily-prompt (Protected endpoint)
    ↓
OpenAI API (Generate creative prompt)
    ↓
Database (Store in daily_prompts table)
    ↓
Frontend (/dashboard/today) displays prompt
    ↓
Users respond via /api/daily-prompt POST
```

## 📋 Setup Steps

### 1. Database Setup

Run the database schema update:

```sql
-- Run this in your Supabase SQL editor:
-- Copy the contents of daily-prompts-schema.sql
```

### 2. Environment Variables

Add these to your `.env.local` and Vercel environment:

```bash
# Required: OpenAI API Key for prompt generation
OPENAI_API_KEY=sk-your-openai-api-key-here

# Required: Secret for securing cron endpoints
CRON_SECRET=your-super-secret-cron-password-here

# Your existing Supabase variables (already set)
NEXT_PUBLIC_SUPABASE_URL=your-supabase-url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

### 3. Vercel Deployment

1. Deploy your app to Vercel
2. The `vercel.json` configuration will automatically set up 5 cron jobs
3. Cron jobs run at random times: 9:37 AM, 11:23 AM, 2:51 PM, 4:18 PM, 6:44 PM

### 4. Test the System

#### Test Cron Endpoint Manually:
```bash
curl -X POST https://your-app.vercel.app/api/cron/daily-prompt \
  -H "Authorization: Bearer your-cron-secret" \
  -H "Content-Type: application/json"
```

#### Test Frontend:
1. Visit `/dashboard/today`
2. Check if today's prompt loads
3. Try submitting a response

## 🎮 Prompt Generation Features

### Creative Formats
- **Metaphorical**: "If your day was a song, what genre would it be?"
- **Gaming**: "What achievement did you unlock today?"
- **Sensory**: "What unexpected texture surprised you?"
- **Time Travel**: "What would you tell yesterday's you?"
- **Rating/Scoring**: "Rate your day's plot twists from 1-10"

### Smart Uniqueness
- Checks last 50 prompts to avoid duplicates
- Considers day of week and season
- Uses high creativity settings (temperature: 0.95)

### Fallback System
If OpenAI fails, 20 curated creative prompts rotate based on day of year.

## 📊 Database Tables

### `daily_prompts`
- `id`: Auto-increment primary key
- `date`: Unique date (ensures one prompt per day)
- `prompt_id`: Reference to prompts table
- `generated_at`: When prompt was created
- `scheduled_time`: Random time for generation
- `is_active`: Flag for active prompts

### Functions Added
- `get_todays_prompt()`: Retrieves today's active prompt
- `create_daily_prompt()`: Creates new daily prompt (cron-safe)

## 🔒 Security

- Cron endpoints protected by `CRON_SECRET`
- Database functions use security definer
- RLS policies ensure proper access control
- Service role used for automated operations

## 🐛 Troubleshooting

### No Prompt Shows
1. Check if cron jobs are running in Vercel dashboard
2. Verify `CRON_SECRET` is set correctly
3. Check Supabase logs for database errors

### OpenAI Errors
1. Verify `OPENAI_API_KEY` is valid
2. Check OpenAI API quotas and billing
3. Fallback prompts should still work

### Database Issues
1. Ensure `daily-prompts-schema.sql` was run
2. Check RLS policies are correctly applied
3. Verify service role has proper permissions

## 🚀 Future Enhancements

- **Personalization**: Prompts based on user timezone/preferences
- **Seasonal Themes**: Holiday and season-specific prompts
- **Community Voting**: Users vote on favorite prompts
- **Streak Bonuses**: Special prompts for long streaks
- **Multiple Languages**: i18n prompt generation

## 📝 Logs and Monitoring

Check these logs for system health:
- Vercel Function logs for cron execution
- Supabase logs for database operations
- Frontend console for prompt loading
- OpenAI API usage in OpenAI dashboard

---

🎉 **Your automated daily prompt system is now live!** Users will get fresh, creative gratitude prompts every day automatically.
