
import React, { useState } from 'react';
import { Stage, ExamSchedule, DaySchedule, SubjectDetail, User } from '../../types';
import { Calendar, Clock, Plus, Trash2, Save, Layers, ChevronDown, CheckCircle2, AlertCircle, X, Hash } from 'lucide-react';

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

  const addPeriod = (dayIdx: number) => {
    const next = [...days];
    const newPeriodId = next[dayIdx].periods.length + 1;
    next[dayIdx].periods.push({
      periodId: newPeriodId,
      main: [],
      reserves: [],
      subjects: {}
    });
    setDays(next);
  };

  const removePeriod = (dayIdx: number, pIdx: number) => {
    const next = [...days];
    next[dayIdx].periods = next[dayIdx].periods.filter((_, i) => i !== pIdx);
    // إعادة ترقيم الفترات
    next[dayIdx].periods = next[dayIdx].periods.map((p, i) => ({ ...p, periodId: i + 1 }));
    setDays(next);
  };

  const updateSubject = (dayIdx: number, pIdx: number, stageName: string, field: keyof SubjectDetail, value: string) => {
    const next = [...days];
    const period = next[dayIdx].periods[pIdx];
    if (!period.subjects) period.subjects = {};
    if (!period.subjects[stageName]) period.subjects[stageName] = { name: '', startTime: '08:00', endTime: '10:00' };
    period.subjects[stageName] = { ...period.subjects[stageName], [field]: value };
    setDays(next);
  };

  return (
    <div className="fixed inset-0 z-[100] bg-slate-950/40 backdrop-blur-md flex items-center justify-center p-4 md:p-10 animate-fade-in overflow-y-auto">
      <div className="bg-white w-full max-w-5xl rounded-[3rem] shadow-2xl flex flex-col h-full max-h-[90vh] overflow-hidden">
        
        {/* Modal Header */}
        <div className="p-8 border-b border-slate-50 flex justify-between items-center bg-slate-900 text-white shrink-0">
           <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-2 rounded-xl"><Calendar size={24}/></div>
              <div><h3 className="text-xl font-black">إعداد جدول الاختبارات</h3><p className="text-slate-400 text-xs">ضبط المواعيد، الفترات، وتوزيع المواد</p></div>
           </div>
           <button onClick={onClose} className="p-3 bg-white/5 rounded-2xl hover:bg-rose-500/20 text-slate-400 hover:text-white transition-all"><X size={24}/></button>
        </div>

        {/* Modal Body */}
        <div className="flex-1 overflow-y-auto p-4 md:p-10 space-y-10 custom-scrollbar bg-slate-50/30">
            <div className="flex justify-center mb-6">
                <button onClick={addDay} className="bg-white text-slate-900 px-10 py-5 rounded-3xl font-black flex items-center gap-3 border-2 border-slate-100 hover:border-blue-500 hover:text-blue-600 transition-all shadow-sm">
                    <Plus size={24} /> إضافة يوم اختبار جديد
                </button>
            </div>

            <div className="space-y-12">
                {days.map((day, dIdx) => (
                    <div key={dIdx} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-xl animate-fade-in">
                        <div className="bg-slate-900 text-white p-6 flex justify-between items-center">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-600 px-4 py-1.5 rounded-lg font-black text-[10px] uppercase">يوم {day.dayId}</div>
                                <input type="date" value={day.date} onChange={(e) => { const n = [...days]; n[dIdx].date = e.target.value; setDays(n); }} className="bg-transparent font-black outline-none border-b border-white/20 pb-1" />
                            </div>
                            <div className="flex gap-2">
                                <button onClick={() => addPeriod(dIdx)} className="bg-white/10 hover:bg-white/20 text-white px-4 py-2 rounded-xl text-xs font-black flex items-center gap-2 transition-all">
                                    <Plus size={16} /> إضافة فترة
                                </button>
                                <button onClick={() => setDays(days.filter((_, i) => i !== dIdx))} className="text-rose-400 hover:bg-rose-500/10 p-2 rounded-xl transition-all"><Trash2 size={20}/></button>
                            </div>
                        </div>
                        
                        <div className="p-6 md:p-8 space-y-10">
                            {day.periods.map((period, pIdx) => (
                                <div key={pIdx} className="space-y-6 relative border-b border-slate-100 last:border-0 pb-10 last:pb-0">
                                    <div className="flex justify-between items-center">
                                        <h4 className="font-black text-slate-800 text-sm flex items-center gap-2 uppercase tracking-widest bg-slate-100 px-4 py-1.5 rounded-full">
                                            <Hash size={14} className="text-blue-600" /> الفترة {period.periodId}
                                        </h4>
                                        {day.periods.length > 1 && (
                                            <button onClick={() => removePeriod(dIdx, pIdx)} className="text-rose-300 hover:text-rose-600 text-[10px] font-black uppercase">حذف الفترة</button>
                                        )}
                                    </div>

                                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                                        {stages.map(stage => (
                                            <div key={stage.id} className="bg-slate-50 p-5 rounded-3xl border border-slate-100 space-y-3 shadow-inner group hover:bg-white hover:border-blue-100 transition-all">
                                                <p className="text-[10px] font-black text-blue-600 uppercase tracking-tighter">{stage.name}</p>
                                                <input 
                                                    type="text" 
                                                    placeholder="اسم المادة" 
                                                    value={period.subjects?.[stage.name]?.name || ''} 
                                                    onChange={(e) => updateSubject(dIdx, pIdx, stage.name, 'name', e.target.value)} 
                                                    className="w-full bg-white border border-slate-100 rounded-xl p-3 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-100/50" 
                                                />
                                                <div className="grid grid-cols-2 gap-2">
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 mr-2 uppercase">البداية</label>
                                                        <input type="time" value={period.subjects?.[stage.name]?.startTime || '08:00'} onChange={(e) => updateSubject(dIdx, pIdx, stage.name, 'startTime', e.target.value)} className="w-full bg-white border border-slate-100 p-2 rounded-lg text-[10px] font-bold outline-none" />
                                                    </div>
                                                    <div className="space-y-1">
                                                        <label className="text-[8px] font-black text-slate-400 mr-2 uppercase">النهاية</label>
                                                        <input type="time" value={period.subjects?.[stage.name]?.endTime || '10:00'} onChange={(e) => updateSubject(dIdx, pIdx, stage.name, 'endTime', e.target.value)} className="w-full bg-white border border-slate-100 p-2 rounded-lg text-[10px] font-bold outline-none" />
                                                    </div>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                ))}

                {days.length === 0 && (
                    <div className="py-24 text-center border-4 border-dashed border-slate-200 rounded-[4rem] space-y-4">
                        <Calendar size={64} className="mx-auto text-slate-200" />
                        <p className="text-slate-400 font-black text-xl">ابدأ بإضافة يوم اختبار جديد</p>
                    </div>
                )}
            </div>
        </div>

        {/* Modal Footer */}
        <div className="p-8 border-t border-slate-50 flex flex-col md:flex-row justify-between items-center gap-4 bg-white shrink-0">
            <div className="text-right hidden md:block">
                <p className="text-[10px] font-black text-emerald-500 uppercase tracking-widest flex items-center gap-2">
                    <CheckCircle2 size={14} /> توزيع المعلمين يتم آلياً
                </p>
                <p className="text-slate-400 text-[9px] font-bold mt-1">سيقوم النظام بتخصيص الملاحظين بناءً على العدد المطلوب لكل لجنة.</p>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
                <button onClick={onClose} className="flex-1 md:flex-none px-10 py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all border border-transparent hover:border-slate-100">إلغاء</button>
                <button onClick={() => onSave({ days, teachersPerCommittee: 1 })} className="flex-1 md:flex-none px-12 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-2xl flex items-center justify-center gap-3 hover:bg-blue-600 transition-all active:scale-95">
                    <Save size={20} /> حفظ الجدول وتوليد المظاريف
                </button>
            </div>
        </div>
      </div>
    </div>
  );
};

export default ScheduleWizard;
