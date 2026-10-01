export type DayStatus = 'empty' | 'full' | 'half' | 'absent' | 'leave' | 'sick' | 'holiday';

export interface DayRecord {
  status: DayStatus;
  overtimeHours: number; // e.g. 0, 1, 2, 3, 4, 5...
  note?: string;
}

export interface Personnel {
  id: string;
  name: string;
  role: string;
  site: string;
  phone: string;
  tcNo?: string;
  dailyWage: number; // Günlük yevmiye ₺
  hourlyOvertimeWage: number; // Saatlik mesai ücreti ₺
  startDate: string;
  isActive: boolean;
  avatarColor?: string;
}

export interface AdvancePayment {
  id: string;
  personnelId: string;
  monthKey: string; // YYYY-MM
  date: string; // YYYY-MM-DD
  amount: number;
  note: string;
}

export interface SiteProject {
  id: string;
  name: string;
  location: string;
}

// Storage structure: { [monthKey]: { [personnelId]: { [day]: DayRecord } } }
export type MonthAttendanceMap = Record<string, Record<string, DayRecord>>;
export type AllAttendanceData = Record<string, MonthAttendanceMap>;
