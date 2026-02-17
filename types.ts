
export enum EnvelopeStatus {
  PENDING = 'PENDING',
  RECEIVED = 'RECEIVED',
  COMPLETED = 'COMPLETED',
  DELIVERED = 'DELIVERED'
}

export enum AttendanceStatus {
  PRESENT = 'PRESENT',
  ABSENT = 'ABSENT',
  LATE = 'LATE',
  PENDING = 'PENDING'
}

export interface Student {
  id: string;
  name: string;
  studentId: string; 
  grade: string;
  class: string;
  phone?: string;
  seatNumber?: string; 
  status: AttendanceStatus;
}

export interface Stage {
  id: number;
  name: string;
  prefix: string;
  students: Student[];
  total: number;
}

export interface Committee {
  id: string | number; // تحديث لدعم UUID من Supabase
  name: string;
  location: string;
  counts: Record<number, number>; 
  invigilatorCount?: number;
  capacity: number;
}

export interface SubjectDetail {
  name: string;
  startTime: string;
  endTime: string;
}

export interface PeriodAssignment {
  periodId: number;
  main: string[]; 
  reserves: string[]; 
  subjects?: Record<string, SubjectDetail>; 
}

export interface DaySchedule {
  dayId: number;
  date: string;
  periods: PeriodAssignment[];
}

export interface ExamSchedule {
  days: DaySchedule[];
  teachersPerCommittee: number; 
}

export interface ExamEnvelope {
  id: string;
  subject: string;
  committeeNumber: string;
  roomId?: string; 
  location: string; 
  date: string;
  grades: string[]; 
  startTime: string;
  endTime: string;
  period: string;
  status: EnvelopeStatus;
  students: Student[];
  teacherId?: string;
  teacherName?: string;
  deliveryTime?: string;
}

export type UserRole = 'MANAGER' | 'CONTROL' | 'COUNSELOR' | 'TEACHER';

export interface User {
  id: string;
  name: string;
  civilId: string; // السجل المدني
  role: UserRole;
  phone?: string;
  qrCode?: string;
}

export interface School {
  name: string;
  managerName: string;
  agentName: string;
  year?: string;
  term?: string;
}

export interface Room {
  id: string;
  name: string;
}

export interface Notification {
  message: string;
  type: 'INFO' | 'SUCCESS' | 'ALERT' | 'ERROR';
  timestamp: string;
}

export interface AppData {
  school: School;
  committees: { id: string | number; name: string; location: string }[];
  rawExams: ExamEnvelope[];
  teachers: User[];
}

export interface PrintSettings {
  adminName: string;
  schoolName: string;
  managerName: string;
  agentName: string;
  logoUrl: string;
  doorLabelTitle: string;
  attendanceTitle: string;
  stickerTitle: string;
  showBorder: boolean;
  colSequence: string;
  colSeatId: string;
  colName: string;
  colStage: string;
  colPresence: string;
  colSignature: string;
  showColSequence: boolean;
  showColSeatId: boolean;
  showColName: boolean;
  showColStage: boolean;
  showColPresence: boolean;
  showColSignature: boolean;
  date?: string;
}
