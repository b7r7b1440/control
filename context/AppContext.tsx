
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
        capacity: c.capacity || 30, // افتراضي 30
        invigilatorCount: c.invigilator_count || 1,
        counts: c.stage_counts || {}
      })));
    } catch (e) {
      addNotification('فشل تحديث البيانات من السحابة', 'ERROR');
    }
  };

  const runAutoDistribution = async (numCommittees?: number) => {
    if (stages.length === 0) {
      addNotification('يجب إضافة مراحل دراسية أولاً', 'ALERT');
      return;
    }

    let targetCommittees = [...committees];

    // إذا حدد المستخدم عدد لجان معين، نقوم بإنشاء لجان جديدة أو مسح الفائض
    if (numCommittees && numCommittees > 0) {
      const newComms: Committee[] = [];
      for (let i = 1; i <= numCommittees; i++) {
        newComms.push({
          id: i, // سيتم استبداله عند الحفظ في Supabase
          name: String(i),
          location: `قاعة ${i}`,
          capacity: 30, // المعيار الجديد 30
          invigilatorCount: 1,
          counts: {}
        });
      }
      targetCommittees = newComms;
    }

    if (targetCommittees.length === 0) {
      addNotification('يرجى إضافة لجان أو تحديد عدد اللجان المطلوب', 'ALERT');
      return;
    }

    // 1. تصفير التوزيع
    const tempCommittees = targetCommittees.map(c => ({ ...c, counts: {} as Record<number, number> }));
    const stagePool = stages.map(s => ({ id: s.id, remaining: s.total }));

    // 2. خوارزمية التوزيع المتداخل (منع الغش) - سعة 30
    let allStudentsDistributed = false;
    while (!allStudentsDistributed) {
      let changesMadeInThisRound = false;

      for (let i = 0; i < tempCommittees.length; i++) {
        const comm = tempCommittees[i];
        const capacity = comm.capacity || 30;
        
        // في كل لجنة، نمر على المراحل ونأخذ طالباً من كل مرحلة بالتبادل
        for (let j = 0; j < stagePool.length; j++) {
          const stage = stagePool[j];
          const currentTotalInComm = Object.values(tempCommittees[i].counts).reduce((a, b) => a + b, 0);
          
          if (stage.remaining > 0 && currentTotalInComm < capacity) {
            tempCommittees[i].counts[stage.id] = (tempCommittees[i].counts[stage.id] || 0) + 1;
            stage.remaining--;
            changesMadeInThisRound = true;
          }
        }
      }
      if (!changesMadeInThisRound) allStudentsDistributed = true;
    }

    // 3. التحقق من الطلاب المتبقين (في حال كانت اللجان غير كافية)
    const totalRemaining = stagePool.reduce((a, b) => a + b.remaining, 0);
    if (totalRemaining > 0) {
      addNotification(`تنبيه: تبقى ${totalRemaining} طالب لم يتم توزيعهم. اللجان الحالية لا تكفي.`, 'ALERT');
    }

    // 4. الحفظ في السحابة
    try {
      // إذا كنا قد ولدنا لجان جديدة، يفضل مسح القديم أولاً في نظام حقيقي
      // هنا سنقوم بتحديث اللجان الموجودة فقط أو الإضافة إذا كان numCommittees مرسلاً
      if (numCommittees) {
         // مسح اللجان القديمة وحفظ الجديدة (عملية حساسة)
         await supabase.from('committees').delete().neq('name', '0'); // مسح افتراضي
         for (const comm of tempCommittees) {
            await supabase.from('committees').insert({
               name: comm.name,
               location: comm.location,
               capacity: comm.capacity,
               stage_counts: comm.counts
            });
         }
      } else {
         for (const comm of tempCommittees) {
           await supabase.from('committees').update({ stage_counts: comm.counts }).eq('id', comm.id);
         }
      }
      
      addNotification('تم التوزيع الآلي بنجاح (سعة 30 طالب لكل لجنة)', 'SUCCESS');
      await refreshData();
    } catch (e) {
      addNotification('فشل حفظ التوزيع في السحابة', 'ERROR');
    }
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

  const publishSchedule = async () => {
    if (!schedule || stages.length === 0 || committees.length === 0) {
      addNotification('البيانات ناقصة لإصدار المظاريف', 'ALERT');
      return;
    }

    const generatedEnvelopes: ExamEnvelope[] = [];
    
    schedule.days.forEach(day => {
      day.periods.forEach(period => {
        const sourcePool = (period.main && period.main.length > 0) ? period.main : teachers.map(t => t.id);
        const availableTeachersPool = [...sourcePool].sort(() => Math.random() - 0.5);
        let teacherIndex = 0;

        const activeCommitteesForPeriod = committees.filter(comm => {
            const counts = comm.counts || {};
            return Object.values(counts).some(v => Number(v) > 0);
        });

        activeCommitteesForPeriod.forEach(comm => {
          const committeeStages = Object.keys(comm.counts || {}).map(id => Number(id))
                                       .sort((a, b) => a - b);
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

            for(let i=0; i < countToTake; i++) {
                studentsList.push({
                  id: `std-${sId}-${comm.id}-${i}`,
                  name: `طالب (${stage.name}) رقم ${i+1}`,
                  studentId: `${stage.prefix}${i + 100}`,
                  grade: stage.name,
                  class: '1',
                  status: AttendanceStatus.PRESENT,
                  seatNumber: `${stage.prefix}${i + 100}`
                });
            }
          });

          if (studentsList.length > 0) {
            const requiredInvigilators = comm.invigilatorCount || 1;
            const assignedTeachers: User[] = [];
            
            for(let i=0; i < requiredInvigilators; i++) {
                const tId = availableTeachersPool[teacherIndex % availableTeachersPool.length];
                const teacher = teachers.find(t => t.id === tId);
                if (teacher) assignedTeachers.push(teacher);
                teacherIndex++;
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
              students: studentsList,
              teacherId: assignedTeachers.length > 0 ? assignedTeachers[0].id : undefined,
              teacherName: assignedTeachers.map(t => t.name).join(' / ') || 'لم يحدد'
            });
          }
        });
      });
    });

    setEnvelopes(generatedEnvelopes);
    addNotification(`تم اعتماد المظاريف. التوزيع تم آلياً بناءً على عدد الملاحظين.`, 'SUCCESS');
    window.location.hash = '#/control';
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
