# HRMS.pro — Human Resource Management System

A modern, full-stack HRMS built with **Next.js 16**, **React 19**, **Supabase**, and **Tailwind CSS**. Features role-based dashboards for admins and employees, covering employee management, attendance tracking, leave management, and real-time notifications.

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
| Icons | Lucide React |
| Theming | next-themes (dark/light mode) |

---

## Features

### Admin Dashboard
- **Dashboard Analytics** — Real-time KPIs (total employees, present today, on leave, pending requests), 7-day attendance trend chart, recent leave requests
- **Employee Management** — Add, view, edit, and search employees. Email invitation system for onboarding. Auto-initializes leave balances on creation
- **Attendance Tracking** — View all employee clock-in/out records, average work hours, late check-in detection
- **Leave Management** — Approve/reject leave requests with automatic balance deduction. Supports 6 leave types (Annual, Sick, Casual, Maternity, Paternity, Unpaid)
- **Notifications** — Real-time alerts for clock-ins, leave applications, and employee additions

### Employee Dashboard
- **Clock In/Out** — One-click attendance with automatic late detection (after 9:00 AM). Calculates total hours worked
- **Leave Applications** — Apply for leave with real-time balance validation. View leave history and remaining balances with progress bars
- **Attendance History** — Full personal attendance log with status badges
- **Profile Settings** — Update display name and change password

### System Features
- **Role-Based Access Control** — Separate admin and employee dashboards with server-side route protection
- **Email Invitation Flow** — Admin sends invite, employee sets password via secure link, account auto-links to employee record
- **Leave Balance System** — Auto-initialized quotas, deducted on approval, restored on rejection
- **Dark/Light Mode** — Full theme support across the entire application
- **Responsive Design** — Mobile-friendly with collapsible sidebar and responsive tables

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
│   │   ├── dashboard/            # Admin home — KPIs & charts
│   │   ├── attendance/           # Attendance management
│   │   ├── employees/            # Employee CRUD
│   │   │   ├── new/              # Add employee + send invite
│   │   │   └── [id]/             # Employee profile
│   │   │       └── edit/         # Edit employee details
│   │   ├── leave/                # Leave approval/rejection
│   │   │   └── apply/            # Apply leave (admin)
│   │   └── settings/             # Admin settings
│   ├── employee-dashboard/       # Employee routes
│   │   ├── attendance/           # Personal attendance history
│   │   ├── leaves/               # Apply & track leaves
│   │   └── settings/             # Employee settings
│   ├── api/
│   │   └── employees/invite/     # Email invitation API
│   ├── auth/
│   │   ├── set-password/         # Initial password setup
│   │   └── confirm/              # Auth confirmation handler
│   ├── login/                    # Login page
│   └── register/                 # First-time admin setup
├── components/
│   ├── layout/                   # Sidebar, header, navigation
│   ├── ui/                       # shadcn/ui components
│   ├── charts/                   # Attendance chart (Recharts)
│   └── dashboard/                # Dashboard widgets
├── lib/
│   ├── supabaseClient.ts         # Browser Supabase client
│   ├── supabaseServer.ts         # Server-side Supabase client
│   ├── supabaseAdmin.ts          # Admin client (invites)
│   ├── notifications.ts          # Notification helpers
│   └── utils.ts                  # Utility functions
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
3. Employee clicks **"Clock Out"** when leaving
4. Total hours are calculated automatically
5. Records appear in both employee and admin attendance logs

### Leave Application
1. Employee selects leave type, dates, and reason
2. System validates against remaining balance (prevents over-application)
3. Request is submitted with **"pending"** status; admins are notified
4. Admin approves or rejects from the Leave Management page
5. On approval: balance is deducted. On rejection of approved leave: balance is restored
6. Employee receives a notification of the decision

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
