# SkillTrack
<p align="center">
  <img src="public/wordmark.svg" alt="SkillTrack" width="220" />
</p>
A dashboard for tracking skills you're learning and habits you're building.

![SkillTrack](./docs/screenshot.png)
<!-- Drop a screenshot at docs/screenshot.png before pushing -->

## Features

- **Skills** — log practice sessions with duration and notes, track weekly goals, custom colors
- **Habits** — daily completion tracking with streaks, 7-day heatmaps, and freeze/unfreeze
- **Progress ring** — see how close you are to your weekly goal at a glance
- **Activity heatmap** — GitHub-style 18-week consistency view
- **Session history** — full log with date/skill filters, search, and pagination
- **Skill detail pages** — per-skill charts (weekly/monthly), notes timeline
- **Improvement badges** — progressive comparison windows that grow with your account age
- **Reminders** — one-tap alarm on Android, calendar export on iOS/desktop
- **Offline support** — mutations queue and sync when connectivity returns
- **Data export** — JSON backup and CSV exports for sessions and habits
- **Admin dashboard** — user metrics, feedback inbox (admin-only)
- **Onboarding tour** — guided first-time walkthrough

## Tech stack

- **React 18** + **TypeScript** + **Vite**
- **Tailwind CSS v4**
- **Supabase** (auth + Postgres + Row Level Security)
- **React Router** for navigation
- **lucide-react** for icons
- **react-hot-toast** for notifications

## Getting started

### 1. Clone and install

```bash
git clone https://github.com/Choco246700/skilltrack.git
cd skilltrack
npm install