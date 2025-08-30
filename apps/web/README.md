# GratiTime - Daily Gratitude Journaling

A BeReal-style gratitude journaling platform built with Next.js 14 and Supabase.

## Features

- **Daily Gratitude Prompts**: Random prompts assigned each day with 2-hour posting windows
- **Timed Windows**: BeReal-style time constraints (5-7 PM daily, randomized)
- **Friend Circles**: Share gratitude posts with mutual friends
- **Streak Tracking**: Monitor your consistency with current and longest streaks
- **Photo Support**: Optional photos with your gratitude entries
- **Real-time Notifications**: Push notifications when your posting window opens

## Tech Stack

- **Frontend + Backend**: Next.js 14 (App Router, TypeScript)
- **Database/Auth/Storage**: Supabase (Postgres, RLS, Auth, Storage bucket)
- **Notifications**: OneSignal for web push notifications
- **Hosting**: Vercel with Scheduled Functions for cron jobs

## Getting Started

### Prerequisites

1. Node.js 18+ 
2. A Supabase project
3. OneSignal account (for notifications)

### Installation

1. Clone the repository:
```bash
git clone <your-repo-url>
cd dailybright/apps/web
```

2. Install dependencies:
```bash
npm install
```

3. Set up environment variables:
Copy `.env.local` and fill in your Supabase credentials:
```bash
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url_here
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key_here
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key_here
NEXT_PUBLIC_ONESIGNAL_APP_ID=your_onesignal_app_id_here
CRON_SECRET=your_random_secret_here
```

4. Set up your Supabase database:
Run the SQL script in `supabase-schema.sql` in your Supabase SQL editor to create all tables, policies, and sample data.

5. Configure Supabase Authentication:
   - Enable Email authentication
   - Enable Google OAuth (optional)
   - Set up redirect URLs for your domain

6. Run the development server:
```bash
npm run dev
```

7. Open [http://localhost:3000](http://localhost:3000) to see the application.

## Database Schema

### Core Tables

- **users**: User profiles with timezone information
- **prompts**: Daily gratitude prompts with tags
- **user_daily_state**: Daily prompt assignments and posting windows
- **entries**: User gratitude posts with text, photos, and timing
- **streaks**: User streak tracking (current and longest)
- **friends**: Friend relationships and status
- **reactions**: Emoji reactions to entries

### Security

All tables use Supabase Row Level Security (RLS) to ensure:
- Users only see their own data
- Friend posts are only visible to accepted friends
- Proper isolation and privacy controls

## API Routes

### Client Routes
- `GET /api/me/today` - Get today's prompt and window for user
- `POST /api/entries` - Save new gratitude entry
- `POST /api/friends/request` - Send friend request
- `POST /api/friends/accept` - Accept friend request
- `POST /api/reactions` - Add emoji reaction
- `GET /api/circle/feed` - Get friends' recent entries

### Cron Routes (Vercel Scheduled Functions)
- `POST /api/cron/assign-prompts` - Daily prompt assignment (runs daily)
- `POST /api/cron/send-push` - Send push notifications (runs every minute)

## Deployment

1. Deploy to Vercel:
```bash
vercel --prod
```

2. Set up Vercel Environment Variables:
Add all environment variables from `.env.local` to your Vercel project settings.

3. Configure Vercel Cron Jobs:
Add to `vercel.json`:
```json
{
  "crons": [
    {
      "path": "/api/cron/assign-prompts",
      "schedule": "0 0 * * *"
    },
    {
      "path": "/api/cron/send-push", 
      "schedule": "* * * * *"
    }
  ]
}
```

4. Set up OneSignal:
   - Create web push configuration
   - Add your domain to allowed origins
   - Configure service worker for push notifications

## Development Notes

- **Timezone Handling**: All times stored in UTC, converted to user's local timezone in UI
- **Photo Storage**: Private Supabase bucket with signed URLs
- **Cron Idempotency**: All cron jobs use upsert operations to prevent duplicates
- **Privacy**: Photos and posts are private by default, only shared with accepted friends

## Next Steps

- [ ] Implement OneSignal push notifications
- [ ] Add photo upload functionality  
- [ ] Create friend management UI
- [ ] Build API endpoints for all functionality
- [ ] Set up Vercel cron jobs
- [ ] Add emoji reaction system
- [ ] Implement streak calculation logic