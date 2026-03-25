# HRMS.pro — Human Resource Management System

A modern, production-ready HRMS built with **Next.js 16**, **React 19**, **Supabase**, and **Tailwind CSS 4**. Features role-based dashboards for admins and employees, covering employee management, attendance tracking, leave management, and real-time notifications — with a polished SaaS-grade UX.

![Next.js](https://img.shields.io/badge/Next.js-16-black?logo=next.js)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3FCF8E?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-4-06B6D4?logo=tailwindcss)
![TypeScript](https://img.shields.io/badge/TypeScript-5-3178C6?logo=typescript)

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Framework | Next.js 16 (App Router) |
| Frontend | React 19, TypeScript 5 |
| Styling | Tailwind CSS 4, shadcn/ui components |
| Backend & Auth | Supabase (PostgreSQL, Auth, RLS) |
| State Management | Zustand |
| Charts | Recharts |
| Forms | React Hook Form + Zod validation |
| Toasts | Sonner (rich toast notifications) |
| Icons | Lucide React |
| Theming | next-themes (dark/light mode) |

---

## Features

### Admin Dashboard
- **Dashboard Analytics** — Real-time KPIs with trend indicators (total employees, present today with day-over-day comparison, on leave with attendance rate %, pending requests). 7-day attendance trend chart with improved tooltips. Gradient insight cards for attendance rate, total approved leaves, and pending actions
- **Employee Management** — Add, view, edit, and search employees with a reusable DataTable component featuring pagination, column sorting, and full-text search. Email invitation system for onboarding. Auto-initializes leave balances on creation
- **Attendance Tracking** — View all employee clock-in/out records with sortable/searchable DataTable, status filters (All/Present/Late/Absent), average work hours, late detection stats, and a today's summary card
- **Leave Management** — Approve/reject leave requests with toast confirmations, automatic balance deduction, filterable DataTable (All/Pending), approval rate stats, and loading states on action buttons
- **Notifications** — Real-time Supabase subscription alerts with mark-as-read, unread badge with animation, and polling fallback

### Employee Dashboard
- **Clock In/Out** — One-click attendance with automatic late detection (after 9:00 AM). Calculates total hours worked. Toast notifications on success/failure
- **Leave Applications** — Apply for leave with real-time balance validation, toast feedback, and auto-form reset on success. DataTable with sorting for leave history. Progress bars for remaining balances
- **Attendance History** — Full personal attendance log with DataTable (pagination, sorting), stat cards with skeleton loading, and attendance policy reference
- **Profile Settings** — Update display name and change password

### System Features
- **Edge Middleware Route Protection** — Strict role-based access control enforced at the edge via Next.js middleware. Admin routes blocked for employees, employee routes blocked for admins, unauthenticated users redirected to login
- **Email Invitation Flow** — Admin sends invite, employee sets password via secure link, account auto-links to employee record
- **Leave Balance System** — Auto-initialized quotas, deducted on approval, restored on rejection
- **Dark/Light Mode** — Full theme support across the entire application
- **Responsive Design** — Mobile-optimized with collapsible sidebar drawer, bottom navigation bar for employees, horizontally scrollable tables, and responsive grid layouts
- **Toast Notifications** — Rich success/error feedback using Sonner for all user actions (clock in/out, leave submit, approve/reject)
- **Smooth Transitions** — Page fade-in animations, button hover/active states, skeleton loading states, and custom scrollbar styling

---

## Reusable Component Library

| Component | Description |
|-----------|-------------|
| `DataTable` | Generic table with pagination, column sorting, search, filters, toolbar, loading skeletons, empty/error states |
| `StatCard` | KPI card with icon, value, trend indicator, and skeleton loading state |
| `EmptyState` | Illustrated empty state with icon, title, description, and optional action |
| `ErrorState` | Error display with message and retry button |
| `TableSkeleton` | Shimmer loading placeholder for tables |
| `Toaster` | Theme-aware toast notification provider (Sonner) |

---

## Database Schema

| Table | Purpose |
|-------|---------|
| `profiles` | User accounts (name, email, role, department) |
| `employees` | Employee records (linked to profiles via `profile_id`) |
| `attendance` | Clock-in/out records with status and total hours |
| `leaves` | Leave applications with type, dates, status, and reason |
| `leave_balances` | Per-employee leave quotas (total and used for each type) |
| `notifications` | System notifications with read/unread tracking |

**Default Leave Allocations:**
- Annual: 12 days | Sick: 6 days | Casual: 4 days | Maternity: 90 days | Paternity: 7 days

---

## Project Structure

```
src/
├── app/
│   ├── (dashboard)/              # Admin routes (grouped layout)
│   │   ├── dashboard/            # Admin home — KPIs, insights & charts
│   │   ├── attendance/           # Attendance management with DataTable
│   │   ├── employees/            # Employee CRUD with DataTable
│   │   │   ├── new/              # Add employee + send invite
│   │   │   └── [id]/             # Employee profile
│   │   │       └── edit/         # Edit employee details
│   │   ├── leave/                # Leave approval/rejection with DataTable
│   │   │   └── apply/            # Apply leave (admin)
│   │   └── settings/             # Admin settings
│   ├── employee-dashboard/       # Employee routes
│   │   ├── attendance/           # Personal attendance with DataTable
│   │   ├── leaves/               # Apply & track leaves with DataTable
│   │   └── settings/             # Employee settings
│   ├── api/
│   │   └── employees/invite/     # Email invitation API
│   ├── auth/
│   │   ├── set-password/         # Initial password setup
│   │   └── confirm/              # Auth confirmation handler
│   ├── login/                    # Login page
│   └── register/                 # First-time admin setup
├── components/
│   ├── layout/                   # Sidebar, header, mobile nav, notification bell
│   ├── ui/                       # shadcn/ui + custom reusable components
│   │   ├── data-table.tsx        # Generic DataTable with pagination & sorting
│   │   ├── stat-card.tsx         # KPI stat card with trends
│   │   ├── empty-state.tsx       # Empty state component
│   │   ├── error-state.tsx       # Error state with retry
│   │   ├── table-skeleton.tsx    # Table loading skeleton
│   │   ├── sonner.tsx            # Toast notification provider
│   │   └── ...                   # shadcn/ui base components
│   ├── charts/                   # Attendance chart (Recharts)
│   └── dashboard/                # Dashboard widgets
├── hooks/
│   └── use-supabase-query.ts     # Reusable data fetching hook
├── lib/
│   ├── supabaseClient.ts         # Browser Supabase client
│   ├── supabaseServer.ts         # Server-side Supabase client
│   ├── supabaseAdmin.ts          # Admin client (invites)
│   ├── notifications.ts          # Notification helpers
│   └── utils.ts                  # Utility functions (cn)
├── middleware.ts                  # Edge middleware for route protection
├── store/
│   └── userStore/                # Zustand state (user profile)
└── types/
    └── index.ts                  # TypeScript interfaces & types
```

---

## Key Workflows

### Employee Onboarding
1. Admin clicks **"Add Employee"** and fills in details (name, email, role, department)
2. System creates the employee record and initializes leave balances
3. An email invitation is sent via Supabase Admin API
4. Employee clicks the invite link, sets their password
5. Employee can now log in and access their dashboard

### Attendance Tracking
1. Employee opens their dashboard and clicks **"Clock In"**
2. System records the timestamp; marks as **Late** if after 9:00 AM
3. Toast notification confirms the action
4. Employee clicks **"Clock Out"** when leaving
5. Total hours are calculated automatically
6. Records appear in both employee and admin attendance logs with pagination

### Leave Application
1. Employee selects leave type, dates, and reason
2. System validates against remaining balance (prevents over-application)
3. Request is submitted with **"pending"** status; admins are notified in real-time
4. Admin approves or rejects from the Leave Management page
5. On approval: balance is deducted. On rejection of approved leave: balance is restored
6. Toast confirms the action; employee receives a notification of the decision

---

## Getting Started

### Prerequisites
- Node.js 18+
- A [Supabase](https://supabase.com) project

### Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/your-username/hrms-system.git
   cd hrms-system
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Configure environment variables**

   Create a `.env.local` file:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
   SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
   NEXT_PUBLIC_SITE_URL=http://localhost:3000
   ```

4. **Set up the database**

   Run the following tables in your Supabase SQL Editor:
   - `profiles` — with trigger to auto-create on auth signup
   - `employees` — employee records
   - `attendance` — clock-in/out logs
   - `leaves` — leave applications
   - `leave_balances` — leave quotas per employee
   - `notifications` — system notifications

   Enable **Row Level Security (RLS)** on all tables with appropriate policies for authenticated users.

5. **Run the development server**
   ```bash
   npm run dev
   ```

6. **Register the first admin**

   Visit `http://localhost:3000/register` to create the initial admin account. Registration closes after the first admin is created — all subsequent users are added via the employee invitation flow.

---

## Scripts

| Command | Description |
|---------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm run start` | Start production server |
| `npm run lint` | Run ESLint |

---

## License

This project is private and not licensed for redistribution.
