
import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Users, Calculator, CalendarDays, CheckCircle2, 
  ChevronRight, ChevronLeft, Upload, Trash2, Rocket, Sparkles, ShieldCheck, Plus, UserCheck
} from 'lucide-react';
import ImportWizard from '../components/setup/ImportWizard.tsx';
import DistributionPanel from '../components/setup/DistributionPanel.tsx';
import ScheduleWizard from '../components/setup/ScheduleWizard.tsx';
import TeachersWizard from '../components/setup/TeachersWizard.tsx';

export const SetupCenter: React.FC = () => {
  const { stages, committees, schedule, teachers, setStages, setCommittees, setSchedule, setTeachers, publishSchedule } = useApp();
  const [activeStep, setActiveStep] = useState(1);
  const [showImport, setShowImport] = useState(false);

  const steps = [
    { id: 1, label: 'الطلاب والمراحل', icon: Users, desc: 'استيراد البيانات' },
    { id: 2, label: 'إدارة الملاحظين', icon: UserCheck, desc: 'هيئة الرقابة' },
    { id: 3, label: 'توزيع اللجان', icon: Calculator, desc: 'التقسيم الذكي' },
    { id: 4, label: 'بناء الجدول', icon: CalendarDays, desc: 'المواعيد والمهام' },
    { id: 5, label: 'الإعتماد النهائي', icon: Rocket, desc: 'إطلاق النظام' },
  ];

  const handleNext = () => setActiveStep(prev => Math.min(prev + 1, 5));
  const handleBack = () => setActiveStep(prev => Math.max(prev - 1, 1));

  const handleAddStage = (name: string, prefix: string, students: any[]) => {
    setStages(prev => [
      ...prev, 
      { 
        id: Math.floor(Math.random() * 1000000),
        name, 
        prefix, 
        students, 
        total: students.length 
      }
    ]);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-10 animate-fade-in pb-24" dir="rtl">
      {/* Step Header */}
      <div className="bg-white p-10 rounded-[3.5rem] shadow-2xl shadow-blue-100/40 border border-slate-50 flex justify-between items-center relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-50">
          <div 
            className="h-full bg-gradient-to-r from-blue-400 to-blue-600 transition-all duration-1000 ease-out shadow-[0_0_15px_rgba(37,99,235,0.5)]" 
            style={{ width: `${(activeStep / 5) * 100}%` }}
          ></div>
        </div>
        
        {steps.map((step) => (
          <div key={step.id} className="flex flex-col items-center gap-4 relative z-10">
            <div className={`w-14 h-14 rounded-[1.5rem] flex items-center justify-center transition-all duration-700 ${
              activeStep >= step.id 
                ? 'bg-slate-900 text-white shadow-2xl scale-110' 
                : 'bg-slate-50 text-slate-300 border border-slate-100'
            }`}>
              <step.icon size={22} />
            </div>
            <div className="text-center hidden md:block">
              <span className={`block text-[10px] font-black uppercase tracking-widest ${activeStep >= step.id ? 'text-slate-900' : 'text-slate-300'}`}>{step.label}</span>
            </div>
          </div>
        ))}
      </div>

      {/* Content Area */}
      <div className="min-h-[550px]">
        {activeStep === 1 && (
          <div className="space-y-8">
            <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3"><Sparkles className="text-blue-500"/> استيراد بيانات الطلاب</h3>
            {showImport ? (
              <ImportWizard 
                onSave={handleAddStage} 
                onCancel={() => setShowImport(false)} 
              />
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                <button onClick={() => setShowImport(true)} className="bg-white p-12 rounded-[3rem] border-4 border-dashed border-slate-100 flex flex-col items-center justify-center text-center space-y-4 hover:border-blue-300 transition-all group">
                  <div className="w-20 h-20 bg-blue-50 text-blue-600 rounded-[2rem] flex items-center justify-center group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner"><Plus size={32} /></div>
                  <h4 className="text-xl font-black text-slate-800">إضافة صف دراسي</h4>
                </button>
                {stages.map(s => (
                  <div key={s.id} className="bg-white p-8 rounded-[3rem] border border-slate-100 shadow-xl flex flex-col justify-between">
                    <div className="flex justify-between items-start">
                      <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex items-center justify-center font-black text-xl shadow-xl">{s.prefix}</div>
                      <button onClick={() => setStages(stages.filter(x => x.id !== s.id))} className="text-rose-100 hover:text-rose-500 p-2"><Trash2 size={20}/></button>
                    </div>
                    <div className="mt-6">
                      <h4 className="font-black text-slate-800 text-xl">{s.name}</h4>
                      <p className="text-blue-500 text-sm font-bold">{s.total} طالب</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {activeStep === 2 && (
          <TeachersWizard teachers={teachers} onUpdate={setTeachers} />
        )}

        {activeStep === 3 && (
          <DistributionPanel stages={stages} committees={committees} onChange={setCommittees} />
        )}

        {activeStep === 4 && (
          <ScheduleWizard stages={stages} teachers={teachers} onSave={(s) => { setSchedule(s); handleNext(); }} onClose={handleBack} initialData={schedule} />
        )}

        {activeStep === 5 && (
          <div className="max-w-3xl mx-auto space-y-12 py-10 text-center animate-zoom-in">
            <div className="w-40 h-40 bg-emerald-50 text-emerald-500 rounded-[4rem] flex items-center justify-center mx-auto shadow-2xl animate-bounce border-4 border-white"><Rocket size={72} /></div>
            <div className="space-y-4">
              <h2 className="text-5xl font-[1000] text-slate-900 tracking-tighter">جاهز للإطلاق الحقيقي</h2>
              <p className="text-slate-400 text-xl font-bold">تم ربط {stages.length} مراحل بـ {teachers.length} ملاحظ في {committees.length} لجنة.</p>
            </div>
            <div className="flex flex-col gap-4">
                <button onClick={publishSchedule} className="w-full bg-slate-900 text-white py-8 rounded-[3rem] font-black text-3xl flex items-center justify-center gap-6 shadow-2xl hover:bg-blue-600 transition-all">
                  <ShieldCheck size={40} /> اعتماد وإصدار المظاريف الذكية
                </button>
                <button onClick={handleBack} className="text-slate-400 font-black hover:text-slate-600 transition-colors flex items-center justify-center gap-2">
                   <ChevronRight size={20} /> مراجعة البيانات والجدول
                </button>
            </div>
          </div>
        )}
      </div>

      {activeStep < 5 && !showImport && (
        <div className="flex justify-between items-center bg-white/80 backdrop-blur-xl p-6 rounded-[3rem] shadow-2xl border border-white sticky bottom-6 z-50">
          <button onClick={handleBack} disabled={activeStep === 1} className="flex items-center gap-3 px-10 py-5 rounded-[2rem] font-black text-slate-400 hover:bg-slate-50 disabled:opacity-30">
            <ChevronRight size={20} /> السابق
          </button>
          <button onClick={handleNext} className="flex items-center gap-3 px-12 py-5 rounded-[2rem] bg-slate-900 text-white font-black shadow-2xl hover:bg-blue-600 active:scale-95 transition-all">
            متابعة الخطوة التالية <ChevronLeft size={20} />
          </button>
        </div>
      )}
    </div>
  );
};

export default SetupCenter;
