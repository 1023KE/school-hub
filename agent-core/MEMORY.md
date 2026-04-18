# Project: School Hub

## Overview
A school life management app integrating Google Classroom, Outlook, and Teams for @st.omu.ac.jp accounts.

## Technical Stack
- **Framework**: Next.js (App Router), TypeScript
- **Styling**: Tailwind CSS, Lucide React icons
- **Authentication**: Auth.js (NextAuth.js)
    - `Google Provider` (Scopes: courses, announcements, coursework.me, courseworkmaterials)
    - `Azure AD Provider` (Scopes: User.Read, Calendars.Read, Chat.Read, ActivityFeed.Read)
    - Added `classroom.courseworkmaterials.readonly` scope for Classwork tab "Materials".

## Core Logic & Features
- **Categorization**: 
    - `課題` (Assignments): Matches keywords like "レポート", "課題", "宿題", "提出", "試験", "フォーム", "アンケート", "振り返り", "コメント", "評価", "ワーク". Even "Announcements" with these keywords are re-categorized as "課題".
    - `連絡` (Announcements): General notices. Includes Outlook/Teams data by default.
- **Data Fetching**:
    - Uses `pageSize: 100` for all Classroom API calls (CourseWork, Announcements, Materials) to ensure complete data visibility.
    - Merges data from Classroom, Outlook, and Teams into a single chronological feed.
- **Dashboard Tabs**:
    - `すべて` (All): Shows all data sorted by date. Expired items are NOT grayed out here (full opacity).
    - `課題` (Assignments): Filtered view of tasks. Expired items can be toggled and are dimmed by default.
    - `お知らせ` (Announcements): General notices, including Outlook/Teams data.
- **UI/UX**:
    - Slim, compact design (1200px max width) to minimize scrolling. Smaller fonts and tighter padding for density.
    - Sidebar for cleaning duty (static) and schedule.
    - Modal for content view with automatic link detection and attachment listing (detects Drive files, Forms, and links).
    - Platform-specific icons: Red (Classroom Task), Green (Classroom Notice), Blue (Outlook), Indigo (Teams).

## Deployment & Identity
- **Target**: Vercel via GitHub.
- **Git Identity**: Name "KE", Email "1023KE".
- **Current Blocker**: Authenticating GitHub via `gh auth login` for automated deployment.

## User Preferences
- Prefers a slim, dense UI over large cards.
- Wants all types of data (Classroom, Outlook, Teams) integrated into the main feed.
- High importance on distinguishing actual task-like items (including forms/surveys) from simple notices.
- Uses `@st.omu.ac.jp` account for both Google and Microsoft services.
