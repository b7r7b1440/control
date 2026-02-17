
import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ExamEnvelope, EnvelopeStatus, Student, User, UserRole, Room, Notification, AttendanceStatus, School, Stage, Committee, ExamSchedule } from '../types';
import { supabase } from '../lib/supabase';

interface AppContextType {
  stages: Stage[];
  committees: Committee[];
  notifications: Notification[];
  currentUser: User | null;
  school: School;
  envelopes: ExamEnvelope[];
  students: Student[];
  teachers: User[];
  schedule: ExamSchedule | null;
  setStages: React.Dispatch<React.SetStateAction<Stage[]>>;
  setCommittees: React.Dispatch<React.SetStateAction<Committee[]>>;
  setTeachers: React.Dispatch<React.SetStateAction<User[]>>;
  setSchedule: React.Dispatch<React.SetStateAction<ExamSchedule | null>>;
  login: (role: UserRole) => Promise<void>;
  logout: () => void;
  runAutoDistribution: (numCommittees?: number) => Promise<void>;
  resetDistributionBackend: () => Promise<void>;
  clearAllSystemData: () => Promise<void>;
  refreshData: () => Promise<void>;
  addNotification: (message: string, type?: Notification['type']) => void;
  publishSchedule: () => Promise<void>;
  updateEnvelopeStatus: (id: string, status: EnvelopeStatus) => Promise<void>;
  updateStudentStatus: (envId: string, studentId: string, status: AttendanceStatus) => Promise<void>;
  markAttendance: (envId: string, studentId: string, status: AttendanceStatus) => Promise<void>;
  updateSchool: (field: string, value: string) => void;
  updateCommitteeInfo: (id: string | number, updates: Partial<Committee>) => Promise<void>;
  activeExamId: string | null;
  setActiveExamId: (id: string | null) => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [stages, setStages] = useState<Stage[]>([]);
  const [committees, setCommittees] = useState<Committee[]>([]);
  const [envelopes, setEnvelopes] = useState<ExamEnvelope[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [schedule, setSchedule] = useState<ExamSchedule | null>(null);
  const [activeExamId, setActiveExamId] = useState<string | null>(null);
  const [school, setSchool] = useState<School>({
    name: 'ثانوية الأمير عبدالمجيد',
    managerName: 'د. خالد العمري',
    agentName: 'أ. محمد الحربي',
    year: '1446 هـ',
    term: 'الفصل الثاني'
  });

  const addNotification = (message: string, type: Notification['type'] = 'INFO') => {
    setNotifications(p => [{ message, type, timestamp: new Date().toISOString() }, ...p]);
  };

  const refreshData = async () => {
    try {
      const { data: stg } = await supabase.from('stages').select('*');
      const { data: com } = await supabase.from('committees').select('*').order('name');
      const { data: env } = await supabase.from('envelopes').select('*');
      const { data: tea } = await supabase.from('teachers').select('*');

      if (stg) setStages(stg.map(s => ({ id: Number(s.id), name: s.name, prefix: s.prefix || '10', total: s.total_students || 0, students: [] })));
      if (com) setCommittees(com.map(c => ({ id: c.id, name: c.name, location: c.location || '', capacity: c.capacity, invigilatorCount: c.invigilator_count, counts: c.stage_counts || {} })));
      if (env) setEnvelopes(env as ExamEnvelope[]);
      if (tea) setTeachers(tea.map(t => ({ id: t.id, name: t.name, civilId: t.civil_id, phone: t.phone, role: t.role as UserRole })));
    } catch (e) { console.error('Error refreshing data', e); }
  };

  const clearAllSystemData = async () => {
    if(!confirm('هل أنت متأكد؟ سيتم حذف كافة الطلاب واللجان والمظاريف نهائياً.')) return;
    await supabase.rpc('clear_all_data');
    setStages([]);
    setCommittees([]);
    setEnvelopes([]);
    setTeachers([]);
    addNotification('تم تصفير النظام بالكامل بنجاح', 'ALERT');
  };

  const runAutoDistribution = async (numCommittees?: number) => {
    const targetCount = numCommittees || 25;
    const localCommittees: Committee[] = [];
    for (let i = 1; i <= targetCount; i++) {
      localCommittees.push({ id: crypto.randomUUID(), name: String(i), location: `قاعة ${i}`, capacity: 30, invigilatorCount: 1, counts: {} });
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
    
    // حفظ اللجان سحابياً
    await supabase.from('committees').delete().neq('name', '_');
    const toInsert = localCommittees.map(c => ({ name: c.name, location: c.location, capacity: c.capacity, stage_counts: c.counts, invigilator_count: c.invigilatorCount }));
    await supabase.from('committees').insert(toInsert);
    
    setCommittees(localCommittees);
    addNotification(`تم توليد ${targetCount} لجنة وحفظها سحابياً`, 'SUCCESS');
  };

  const publishSchedule = async () => {
    if (committees.length === 0) {
      addNotification('لا توجد لجان موزعة لاعتمادها', 'ALERT');
      return;
    }

    const today = new Date().toISOString().split('T')[0];
    const newEnvelopes: any[] = [];
    
    const activeDays = schedule?.days.length ? schedule.days : [{
        dayId: 1,
        date: today,
        periods: [{ periodId: 1, main: [], reserves: [], subjects: {} }]
    }];

    activeDays.forEach(day => {
        day.periods.forEach(period => {
            committees.forEach(comm => {
                const commStageIds = Object.keys(comm.counts);
                const subjectsForComm = commStageIds.map(sId => {
                    const stage = stages.find(s => String(s.id) === sId);
                    return period.subjects?.[stage?.name || '']?.name || 'اختبار عام';
                });
                const finalSubject = [...new Set(subjectsForComm)].filter(s => s !== 'اختبار عام').join(' / ') || 'اختبار عام';

                const envStudents: Student[] = [];
                Object.entries(comm.counts).forEach(([sId, count]) => {
                    const stage = stages.find(s => String(s.id) === sId);
                    if (stage) {
                        for(let i=1; i<=Number(count); i++) {
                            envStudents.push({
                                id: `std-${sId}-${comm.name}-${i}-${day.date}`,
                                name: `طالب ${stage.name} - ${i}`,
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
                    id: `env-${day.date}-${period.periodId}-${comm.name}`,
                    subject: finalSubject,
                    committee_number: String(comm.name),
                    location: comm.location,
                    date: day.date,
                    grades: commStageIds.map(id => stages.find(s => String(s.id) === id)?.name || ''),
                    start_time: '08:00',
                    end_time: '10:00',
                    period: String(period.periodId),
                    status: EnvelopeStatus.PENDING,
                    students: envStudents
                });
            });
        });
    });

    // حفظ المظاريف في Supabase
    await supabase.from('envelopes').delete().neq('id', '_');
    const { error } = await supabase.from('envelopes').insert(newEnvelopes);
    
    if (error) {
        addNotification('خطأ في الاعتماد السحابي: ' + error.message, 'ALERT');
    } else {
        await refreshData();
        addNotification(`تم اعتماد ${newEnvelopes.length} مظروف اختبار بنجاح سحابياً`, 'SUCCESS');
        window.location.hash = '#/control';
    }
  };

  const updateEnvelopeStatus = async (id: string, status: EnvelopeStatus) => {
    const deliveryTime = status === EnvelopeStatus.DELIVERED ? new Date().toISOString() : null;
    const { error } = await supabase.from('envelopes').update({ status, delivery_time: deliveryTime }).eq('id', id);
    if (!error) {
        setEnvelopes(prev => prev.map(e => e.id === id ? { ...e, status, deliveryTime: deliveryTime || undefined } : e));
    }
  };

  const markAttendance = async (envId: string, studentId: string, status: AttendanceStatus) => {
    const env = envelopes.find(e => e.id === envId);
    if (!env) return;
    const updatedStudents = env.students.map(s => s.id === studentId ? { ...s, status } : s);
    const { error } = await supabase.from('envelopes').update({ students: updatedStudents }).eq('id', envId);
    if (!error) {
        setEnvelopes(prev => prev.map(e => e.id === envId ? { ...e, students: updatedStudents } : e));
    }
  };

  const login = async (role: UserRole) => { setCurrentUser({ id: '1', name: 'المسؤول', civilId: '123', role }); };
  const logout = () => setCurrentUser(null);
  const updateSchool = (field: string, value: string) => setSchool(p => ({ ...p, [field]: value }));
  const updateCommitteeInfo = async (id: string | number, updates: Partial<Committee>) => {
      // مزامنة فورية مع Supabase
      await supabase.from('committees').update({ 
          location: updates.location, 
          capacity: updates.capacity, 
          stage_counts: updates.counts 
      }).eq('id', id);
      setCommittees(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  useEffect(() => { refreshData(); }, []);

  return (
    <AppContext.Provider value={{
      stages, committees, notifications, currentUser, school, envelopes, students, teachers, schedule,
      setStages, setCommittees, setTeachers, setSchedule,
      login, logout, runAutoDistribution, resetDistributionBackend: async () => {}, clearAllSystemData,
      refreshData, addNotification, publishSchedule, updateEnvelopeStatus,
      updateStudentStatus: markAttendance, markAttendance, updateSchool, updateCommitteeInfo,
      activeExamId, setActiveExamId
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
