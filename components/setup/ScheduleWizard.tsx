
import React, { useState } from 'react';
import { Stage, ExamSchedule, DaySchedule, SubjectDetail, User } from '../../types';
import { Calendar, Clock, Plus, Trash2, Save, Users, ChevronDown, CheckCircle2, AlertCircle, X } from 'lucide-react';

interface ScheduleWizardProps {
  stages: Stage[];
  teachers: User[];
  onSave: (schedule: ExamSchedule) => void;
  onClose: () => void;
  initialData?: ExamSchedule | null;
}

const ScheduleWizard: React.FC<ScheduleWizardProps> = ({ stages, teachers, onSave, onClose, initialData }) => {
  const [days, setDays] = useState<DaySchedule[]>(initialData?.days || []);

  const addDay = () => {
    setDays([...days, {
      dayId: days.length + 1,
      date: new Date().toISOString().split('T')[0],
      periods: [{ periodId: 1, main: [], reserves: [], subjects: {} }]
    }]);
  };

  const updateSubject = (dayIdx: number, pIdx: number, stageName: string, field: keyof SubjectDetail, value: string) => {
    const next = [...days];
    const period = next[dayIdx].periods[pIdx];
    if (!period.subjects) period.subjects = {};
    if (!period.subjects[stageName]) period.subjects[stageName] = { name: '', startTime: '08:00', endTime: '10:00' };
    period.subjects[stageName] = { ...period.subjects[stageName], [field]: value };
    setDays(next);
  };

  const toggleTeacher = (dayIdx: number, pIdx: number, teacherId: string) => {
    const next = [...days];
    const period = next[dayIdx].periods[pIdx];
    if (period.main.includes(teacherId)) period.main = period.main.filter(id => id !== teacherId);
    else period.main.push(teacherId);
    setDays(next);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 md:p-10 animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl flex flex-col h-full max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-900 text-white shrink-0">
           <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-2 rounded-xl"><Calendar size={24}/></div>
              <div><h3 className="text-xl font-black">إعداد جدول الاختبارات</h3><p className="text-slate-400 text-xs">ضبط المواعيد، المواد، وتخصيص الملاحظين المتاحين</p></div>
           </div>
           <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl hover:bg-rose-500/20 text-slate-400 hover:text-white transition-all"><X size={24}/></button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-10 custom-scrollbar">
            <div className="flex justify-center mb-6">
                <button onClick={addDay} className="bg-blue-50 text-blue-600 px-10 py-5 rounded-3xl font-black flex items-center gap-3 border-2 border-dashed border-blue-200 hover:bg-blue-600 hover:text-white transition-all">
                    <Plus size={24} /> إضافة يوم اختبار جديد
                </button>
            </div>

            <div className="space-y-12">
                {days.map((day, dIdx) => (
                    <div key={dIdx} className="bg-slate-50/50 rounded-[2.5rem] border border-slate-100 overflow-hidden shadow-sm">
                        <div className="bg-slate-800 text-white p-6 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <span className="bg-white/10 px-4 py-1.5 rounded-lg font-black text-[10px] uppercase">يوم {day.dayId}</span>
                                <input type="date" value={day.date} onChange={(e) => { const n = [...days]; n[dIdx].date = e.target.value; setDays(n); }} className="bg-transparent font-black outline-none" />
                            </div>
                            <button onClick={() => setDays(days.filter((_, i) => i !== dIdx))} className="text-rose-400 p-2"><Trash2 size={20}/></button>
                        </div>
                        
                        <div className="p-6 md:p-8 space-y-8">
                            {day.periods.map((period, pIdx) => (
                                <div key={pIdx} className="space-y-6">
                                    <h4 className="font-black text-slate-800 text-sm flex items-center gap-2 uppercase tracking-widest opacity-60">بيانات المواد - الفترة {period.periodId}</h4>
                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {stages.map(stage => (
                                            <div key={stage.id} className="bg-white p-5 rounded-3xl border border-slate-100 space-y-3 shadow-inner">
                                                <p className="text-[10px] font-black text-blue-600">{stage.name}</p>
                                                <input type="text" placeholder="اسم المادة" value={period.subjects?.[stage.name]?.name || ''} onChange={(e) => updateSubject(dIdx, pIdx, stage.name, 'name', e.target.value)} className="w-full bg-slate-50 border-none rounded-xl p-3 text-sm font-bold outline-none focus:ring-2 focus:ring-blue-100" />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <input type="time" value={period.subjects?.[stage.name]?.startTime || '08:00'} onChange={(e) => updateSubject(dIdx, pIdx, stage.name, 'startTime', e.target.value)} className="bg-slate-50 p-2 rounded-lg text-[10px] font-bold outline-none" />
                                                    <input type="time" value={period.subjects?.[stage.name]?.endTime || '10:00'} onChange={(e) => updateSubject(dIdx, pIdx, stage.name, 'endTime', e.target.value)} className="bg-slate-50 p-2 rounded-lg text-[10px] font-bold outline-none" />
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                    <div className="bg-white p-6 rounded-3xl border border-slate-100">
                                        <p className="text-[10px] font-black text-slate-400 mb-4 uppercase flex items-center gap-2"><Users size={14}/> هيئة الرقابة المتاحة لهذه الفترة</p>
                                        <div className="flex flex-wrap gap-2">
                                            {teachers.map(t => (
                                                <button key={t.id} onClick={() => toggleTeacher(dIdx, pIdx, t.id)} className={`px-4 py-2 rounded-xl text-[10px] font-black transition-all ${period.main.includes(t.id) ? 'bg-indigo-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}>
                                                    {t.name}
                                                </button>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Modal Footer */}
        <div className="p-8 border-t border-slate-50 flex flex-col md:flex-row justify-end gap-4 bg-slate-50 shrink-0">
            <button onClick={onClose} className="px-10 py-4 rounded-2xl font-black text-slate-400 hover:bg-white transition-all">إلغاء</button>
            <button onClick={() => onSave({ days, teachersPerCommittee: 1 })} className="px-12 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-xl flex items-center justify-center gap-3 hover:bg-blue-600 transition-all">
                <Save size={20} /> حفظ الجدول وتوليد المظاريف
            </button>
        </div>
      </div>
    </div>
  );
};

export default ScheduleWizard;
