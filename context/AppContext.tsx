
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ExamEnvelope, EnvelopeStatus, Student, User, UserRole, Room, Notification, AttendanceStatus, School, Stage, Committee, ExamSchedule } from '../types';
import { supabase } from '../lib/supabase';

interface AppContextType {
  stages: Stage[];
  committees: Committee[];
  notifications: Notification[];
  currentUser: User | null;
  school: School;
  setStages: React.Dispatch<React.SetStateAction<Stage[]>>;
  setCommittees: React.Dispatch<React.SetStateAction<Committee[]>>;
  login: (role: UserRole) => Promise<void>;
  logout: () => void;
  runAutoDistribution: () => Promise<any>;
  resetDistributionBackend: (clearManual?: boolean) => Promise<void>;
  addStudentManual: (studentId: string, committeeId: string) => Promise<void>;
  refreshData: () => Promise<void>;
  addNotification: (message: string, type?: Notification['type']) => void;
  envelopes: ExamEnvelope[];
  rooms: Room[];
  schedule: ExamSchedule | null;
  students: Student[];
  teachers: User[];
  activeExamId: string | null;
  setActiveExamId: (id: string | null) => void;
  updateEnvelopeStatus: (id: string, status: EnvelopeStatus) => Promise<void>;
  updateStudentStatus: (envId: string, studentId: string, status: AttendanceStatus) => Promise<void>;
  markAttendance: (envId: string, studentId: string, status: AttendanceStatus) => Promise<void>;
  submitEnvelope: (id: string, status: EnvelopeStatus) => Promise<void>;
  clearAllExams: () => Promise<void>;
  updateSchool: (field: string, value: string) => void;
  setSchedule: React.Dispatch<React.SetStateAction<ExamSchedule | null>>;
  setTeachers: React.Dispatch<React.SetStateAction<User[]>>;
  publishSchedule: () => Promise<void>;
  updateCommitteeInfo: (id: string | number, updates: Partial<Committee>) => Promise<void>;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stages, setStages] = useState<Stage[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [school, setSchool] = useState<School>({
    name: 'ثانوية الأمير عبدالمجيد',
    managerName: 'د. خالد العمري',
    agentName: 'أ. محمد الحربي',
    year: '1446 هـ',
    term: 'الفصل الثاني'
  });

  const [envelopes, setEnvelopes] = useState<ExamEnvelope[]>([]);
  const [rooms, setRooms] = useState<Room[]>([]);
  const [schedule, setSchedule] = useState<ExamSchedule | null>(null);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [activeExamId, setActiveExamId] = useState<string | null>(null);

  const addNotification = (message: string, type: Notification['type'] = 'INFO') => {
    setNotifications(p => [{ message, type, timestamp: new Date().toISOString() }, ...p]);
  };

  const refreshData = async () => {
    try {
      const [commsRes, stagesRes] = await Promise.all([
        supabase.from('committees').select('*').order('name', { ascending: true }),
        supabase.from('stages').select('*').order('id', { ascending: true })
      ]);

      if (commsRes.error) throw commsRes.error;
      if (stagesRes.error) throw stagesRes.error;

      setStages(stagesRes.data.map(s => ({
        id: Number(s.id),
        name: s.name,
        prefix: String(Number(s.id) * 10),
        total: s.total_students || 0,
        students: []
      })));

      setCommittees(commsRes.data.map(c => ({
        id: c.id,
        name: c.name,
        location: c.location || '',
        capacity: c.capacity || 20,
        invigilatorCount: c.invigilator_count || 1,
        counts: c.stage_counts || {}
      })));
    } catch (e) {
      addNotification('فشل تحديث البيانات من السحابة', 'ERROR');
    }
  };

  const publishSchedule = async () => {
    if (!schedule || stages.length === 0 || committees.length === 0) {
      addNotification('البيانات ناقصة لإصدار المظاريف', 'ALERT');
      return;
    }

    const generatedEnvelopes: ExamEnvelope[] = [];
    
    schedule.days.forEach(day => {
      day.periods.forEach(period => {
        const availableTeachersPool = [...period.main].sort(() => Math.random() - 0.5);
        let teacherIndex = 0;

        const activeCommitteesForPeriod = committees.filter(comm => {
            const counts = comm.counts || {};
            return Object.values(counts).some(v => Number(v) > 0);
        });

        activeCommitteesForPeriod.forEach(comm => {
          const committeeStages = Object.keys(comm.counts || {}).map(id => Number(id))
                                       .sort((a, b) => a - b); // ترتيب المراحل تصاعدياً (أول، ثاني، ثالث)
          const subjects: string[] = [];
          const studentsList: Student[] = [];
          const grades: string[] = [];
          let startTime = '08:00';
          let endTime = '10:00';

          committeeStages.forEach(sId => {
            const stage = stages.find(s => s.id === sId);
            const countToTake = comm.counts[sId] || 0;
            if (!stage || countToTake === 0) return;
            
            const subj = period.subjects?.[stage.name];
            if (subj && subj.name) {
              subjects.push(subj.name);
              startTime = subj.startTime;
              endTime = subj.endTime;
            }
            grades.push(stage.name);

            // توليد الطلاب مع حالة "حاضر" افتراضياً
            for(let i=0; i < countToTake; i++) {
                studentsList.push({
                  id: `std-${sId}-${comm.id}-${i}`,
                  name: `طالب (${stage.name}) رقم ${i+1}`,
                  studentId: `${stage.prefix}${i + 100}`,
                  grade: stage.name,
                  class: '1',
                  status: AttendanceStatus.PRESENT, // افتراضي حاضر
                  seatNumber: `${stage.prefix}${i + 100}`
                });
            }
          });

          if (studentsList.length > 0) {
            const requiredInvigilators = comm.invigilatorCount || 1;
            const assignedTeachers: User[] = [];
            
            for(let i=0; i < requiredInvigilators; i++) {
                if (teacherIndex < availableTeachersPool.length) {
                    const tId = availableTeachersPool[teacherIndex];
                    const teacher = teachers.find(t => t.id === tId);
                    if (teacher) assignedTeachers.push(teacher);
                    teacherIndex++;
                }
            }

            generatedEnvelopes.push({
              id: `env-${day.dayId}-${period.periodId}-${comm.name}`,
              subject: subjects.join(' + '),
              committeeNumber: comm.name,
              location: comm.location,
              date: day.date,
              grades: [...new Set(grades)],
              startTime,
              endTime,
              period: `فترة ${period.periodId}`,
              status: EnvelopeStatus.PENDING,
              students: studentsList, // مرتبة آلياً حسب المراحل التي تم ترتيبها بالأعلى
              teacherId: assignedTeachers.length > 0 ? assignedTeachers[0].id : undefined,
              teacherName: assignedTeachers.map(t => t.name).join(' / ') || 'لم يحدد'
            });
          }
        });
      });
    });

    setEnvelopes(generatedEnvelopes);
    addNotification(`تم اعتماد المظاريف. جميع الطلاب "حاضرون" افتراضياً.`, 'SUCCESS');
    window.location.hash = '#/control';
  };

  const updateCommitteeInfo = async (id: string | number, updates: Partial<Committee>) => {
    setCommittees(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.location !== undefined) dbUpdates.location = updates.location;
    if (updates.capacity !== undefined) dbUpdates.capacity = updates.capacity;
    if (updates.counts !== undefined) dbUpdates.stage_counts = updates.counts;
    if (updates.invigilatorCount !== undefined) dbUpdates.invigilator_count = updates.invigilatorCount;

    const { error } = await supabase.from('committees').update(dbUpdates).eq('id', id);
    if (error) addNotification('فشل الحفظ السحابي للجنة', 'ERROR');
  };

  const updateEnvelopeStatus = async (id: string, status: EnvelopeStatus) => {
    setEnvelopes(prev => prev.map(e => {
        if (e.id === id) {
            const now = new Date().toISOString();
            return { ...e, status, deliveryTime: status === EnvelopeStatus.DELIVERED ? now : e.deliveryTime };
        }
        return e;
    }));
  };

  const updateStudentStatus = async (envId: string, studentId: string, status: AttendanceStatus) => {
    setEnvelopes(prev => prev.map(e => {
        if (e.id === envId) {
            return { ...e, students: e.students.map(s => s.id === studentId ? { ...s, status } : s) };
        }
        return e;
    }));
  };

  const resetDistributionBackend = async () => {
    const { error } = await supabase.from('committees').update({ stage_counts: {} });
    if (error) addNotification('فشل تصفير التوزيع', 'ERROR');
    else {
      addNotification('تم تصفير الجدول بنجاح', 'SUCCESS');
      await refreshData();
    }
  };

  useEffect(() => { refreshData(); }, []);

  const login = async (role: UserRole) => { setCurrentUser({ id: '1', name: 'المسؤول', civilId: '123', role }); };
  const logout = () => setCurrentUser(null);
  const updateSchool = (field: string, value: string) => setSchool(p => ({ ...p, [field]: value }));
  const runAutoDistribution = async () => { await refreshData(); return null; };
  const addStudentManual = async () => {};
  const markAttendance = async (envId: string, studentId: string, status: AttendanceStatus) => { await updateStudentStatus(envId, studentId, status); };
  const submitEnvelope = async (id: string, status: EnvelopeStatus) => { await updateEnvelopeStatus(id, status); };

  return (
    <AppContext.Provider value={{
      stages, committees, notifications, currentUser, school, setStages, setCommittees,
      login, logout, runAutoDistribution, resetDistributionBackend, addStudentManual, refreshData, addNotification,
      envelopes, rooms, schedule, students, teachers, activeExamId, setActiveExamId,
      updateEnvelopeStatus, updateStudentStatus, markAttendance, submitEnvelope, clearAllExams: async () => {}, updateSchool,
      setSchedule, setTeachers, publishSchedule, updateCommitteeInfo
    }}>
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within AppProvider');
  return context;
};
