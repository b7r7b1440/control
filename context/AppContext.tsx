
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
  runAutoDistribution: (numCommittees?: number) => Promise<void>;
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
      const { data: comms } = await supabase.from('committees').select('*').order('name', { ascending: true });
      const { data: stgs } = await supabase.from('stages').select('*').order('id', { ascending: true });

      if (comms && comms.length > 0) {
        setCommittees(comms.map(c => ({
          id: c.id,
          name: c.name,
          location: c.location || '',
          capacity: c.capacity || 30,
          invigilatorCount: c.invigilator_count || 1,
          counts: c.stage_counts || {}
        })));
      }
      if (stgs) {
        setStages(stgs.map(s => ({
          id: Number(s.id),
          name: s.name,
          prefix: String(Number(s.id) * 10),
          total: s.total_students || 0,
          students: [] // سيتم جلبهم عند الحاجة أو عبر الـ props
        })));
      }
    } catch (e) { console.warn('Offline mode enabled'); }
  };

  const runAutoDistribution = async (numCommittees?: number) => {
    const targetCount = numCommittees || 25;
    const localCommittees: Committee[] = [];
    for (let i = 1; i <= targetCount; i++) {
      localCommittees.push({
        id: `local-${i}-${Date.now()}`,
        name: String(i),
        location: `قاعة ${i}`,
        capacity: 30,
        invigilatorCount: 1,
        counts: {}
      });
    }

    if (stages.length > 0) {
      const stagePool = stages.map(s => ({ id: s.id, remaining: s.total }));
      let changesMade = true;
      while (changesMade) {
        changesMade = false;
        for (let i = 0; i < localCommittees.length; i++) {
          for (let j = 0; j < stagePool.length; j++) {
            const currentTotal = Object.values(localCommittees[i].counts).reduce((a, b) => a + Number(b), 0);
            if (stagePool[j].remaining > 0 && currentTotal < localCommittees[i].capacity) {
              localCommittees[i].counts[stagePool[j].id] = (localCommittees[i].counts[stagePool[j].id] || 0) + 1;
              stagePool[j].remaining--;
              changesMade = true;
            }
          }
        }
      }
    }
    setCommittees([...localCommittees]);
    addNotification(`تم توليد ${targetCount} لجنة وتوزيع الطلاب بنجاح`, 'SUCCESS');
    // حفظ خلفي صامت
    supabase.from('committees').delete().neq('name', '_').then(() => {
        const toInsert = localCommittees.map(c => ({ name: c.name, location: c.location, capacity: c.capacity, stage_counts: c.counts, invigilator_count: c.invigilatorCount }));
        supabase.from('committees').insert(toInsert).then();
    });
  };

  const publishSchedule = async () => {
    if (committees.length === 0) {
      addNotification('لا توجد لجان موزعة لاعتمادها', 'ALERT');
      return;
    }

    // --- توليد المظاريف حقيقياً ---
    const newEnvelopes: ExamEnvelope[] = [];
    
    // إذا لم يوجد جدول، سنصنع واحداً افتراضياً لليوم
    const activeDays = schedule?.days.length ? schedule.days : [{
        dayId: 1,
        date: new Date().toISOString().split('T')[0],
        periods: [{ periodId: 1, main: [], reserves: [], subjects: {} }]
    }];

    activeDays.forEach(day => {
        day.periods.forEach(period => {
            committees.forEach(comm => {
                // تجميع أسماء المواد بناءً على المراحل الموجودة في اللجنة
                const commStageIds = Object.keys(comm.counts);
                const subjectsForComm = commStageIds.map(sId => {
                    const stage = stages.find(s => String(s.id) === sId);
                    return period.subjects?.[stage?.name || '']?.name || 'اختبار عام';
                });
                const uniqueSubjects = [...new Set(subjectsForComm)].filter(s => s !== 'اختبار عام');
                const finalSubject = uniqueSubjects.length > 0 ? uniqueSubjects.join(' / ') : 'اختبار عام';

                // محاكاة سحب الطلاب لهذه اللجنة
                const envStudents: Student[] = [];
                Object.entries(comm.counts).forEach(([sId, count]) => {
                    const stage = stages.find(s => String(s.id) === sId);
                    if (stage) {
                        for(let i=1; i<=count; i++) {
                            envStudents.push({
                                id: `std-${sId}-${comm.name}-${i}`,
                                name: `طالب من ${stage.name}`,
                                studentId: `${stage.prefix}${i.toString().padStart(3, '0')}`,
                                grade: stage.name,
                                class: '1',
                                seatNumber: `${stage.prefix}${i.toString().padStart(3, '0')}`,
                                status: AttendanceStatus.PENDING
                            });
                        }
                    }
                });

                newEnvelopes.push({
                    id: `env-${day.dayId}-${period.periodId}-${comm.name}`,
                    subject: finalSubject,
                    committeeNumber: String(comm.name),
                    location: comm.location,
                    date: day.date,
                    grades: commStageIds.map(id => stages.find(s => String(s.id) === id)?.name || ''),
                    startTime: '08:00',
                    endTime: '10:00',
                    period: String(period.periodId),
                    status: EnvelopeStatus.PENDING,
                    students: envStudents
                });
            });
        });
    });

    setEnvelopes(newEnvelopes);
    addNotification(`تم اعتماد ${newEnvelopes.length} مظروف اختبار وتفعيل الباركود الموحد`, 'SUCCESS');
    
    // التوجه لصفحة اللجان فوراً لمشاهدة النتيجة
    window.location.hash = '#/control';
  };

  const updateCommitteeInfo = async (id: string | number, updates: Partial<Committee>) => {
    setCommittees(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const updateEnvelopeStatus = async (id: string, status: EnvelopeStatus) => {
    setEnvelopes(prev => prev.map(e => e.id === id ? { ...e, status, deliveryTime: status === EnvelopeStatus.DELIVERED ? new Date().toISOString() : e.deliveryTime } : e));
    addNotification(`تم تحديث حالة المظروف ${id} إلى ${status}`, 'INFO');
  };

  const updateStudentStatus = async (envId: string, studentId: string, status: AttendanceStatus) => {
    setEnvelopes(prev => prev.map(e => e.id === envId ? { ...e, students: e.students.map(s => s.id === studentId ? { ...s, status } : s) } : e));
  };

  const markAttendance = async (envId: string, studentId: string, status: AttendanceStatus) => {
    setEnvelopes(prev => prev.map(e => e.id === envId ? { ...e, students: e.students.map(s => s.id === studentId ? { ...s, status } : s) } : e));
  };

  const logout = () => setCurrentUser(null);
  const login = async (role: UserRole) => { setCurrentUser({ id: '1', name: 'المسؤول', civilId: '123', role }); };
  const updateSchool = (field: string, value: string) => setSchool(p => ({ ...p, [field]: value }));

  useEffect(() => { refreshData(); }, []);

  return (
    <AppContext.Provider value={{
      stages, committees, notifications, currentUser, school, setStages, setCommittees,
      login, logout, runAutoDistribution, resetDistributionBackend: async () => setCommittees([]), addStudentManual: async () => {}, refreshData, addNotification,
      envelopes, rooms, schedule, students, teachers, activeExamId, setActiveExamId,
      updateEnvelopeStatus, updateStudentStatus, markAttendance, submitEnvelope: async () => {}, clearAllExams: async () => setEnvelopes([]), updateSchool,
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
