export type UserRole = 'admin' | 'employee'

export interface Profile {
  id: string
  name: string
  email: string
  role: UserRole
  department: string | null
  created_at: string
}

export interface Employee {
  id: string
  profile_id: string | null
  name: string
  email: string
  department: string | null
  designation: string | null
  joining_date: string | null
  status: 'Active' | 'Inactive' | 'On Leave'
  created_at: string
}

export interface Attendance {
  id: string
  user_id: string
  date: string
  check_in: string | null
  check_out: string | null
  total_hours: number | null
  status: 'Present' | 'Late' | 'Absent' | 'Half Day'
  created_at: string
  profiles?: Pick<Profile, 'name' | 'email'>
}

export type LeaveType = 'Annual' | 'Sick' | 'Casual' | 'Maternity' | 'Paternity' | 'Unpaid'
export type LeaveStatus = 'pending' | 'approved' | 'rejected'

export interface Leave {
  id: string
  user_id: string
  start_date: string
  end_date: string
  leave_type: LeaveType
  status: LeaveStatus
  reason: string | null
  created_at: string
  profiles?: Pick<Profile, 'name' | 'email'>
}

export interface DashboardStats {
  totalEmployees: number
  presentToday: number
  onLeave: number
  pendingRequests: number
}

export interface LeaveBalance {
  id: string
  employee_id: string
  annual_total: number
  annual_used: number
  sick_total: number
  sick_used: number
  casual_total: number
  casual_used: number
  earned_total: number
  earned_used: number
  maternity_total: number
  maternity_used: number
  paternity_total: number
  paternity_used: number
  created_at: string
  updated_at: string
}

export const DEFAULT_LEAVE_BALANCES = {
  annual_total: 12,
  sick_total: 6,
  casual_total: 4,
  earned_total: 0,
  maternity_total: 90,
  paternity_total: 7,
}

export type NotificationType = 'clock_in' | 'clock_out' | 'leave_applied' | 'leave_approved' | 'leave_rejected' | 'employee_added'

export interface Notification {
  id: string
  user_id: string
  title: string
  message: string
  type: NotificationType
  read: boolean
  created_at: string
}
