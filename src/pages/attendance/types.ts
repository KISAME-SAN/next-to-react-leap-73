export type AttendanceStatus = "present" | "absent" | "retard" | "renvoi";

export interface Student { id: string; firstName: string; lastName: string; classId: string }
export interface Class { id: string; name: string }
export interface Teacher { id: string; firstName: string; lastName: string }
export interface ScheduleBlock { id: string; day: string; startTime: string; endTime: string; subject: string; teacherId: string; classId: string }

export interface AttendanceEntry { studentId: string; status: AttendanceStatus; comment?: string }
export interface AttendanceRecord { id: string; date: string; classId: string; scheduleBlockId: string; entries: AttendanceEntry[]; createdAt: string; locked?: boolean }
