
import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { Phone, MessageSquare, AlertCircle, Clock, CheckCircle, Search, UserMinus, ShieldAlert } from 'lucide-react';
import { AttendanceStatus } from '../types';

const Attendance: React.FC = () => {
  const { envelopes } = useApp();

  const absentStudents = useMemo(() => {
    const list: any[] = [];
    envelopes.forEach(env => {
      env.students.forEach(std => {
        if (std.status === AttendanceStatus.ABSENT) {
          list.push({
            ...std,
            committee: env.committeeNumber,
            subject: env.subject,
            location: env.location,
            envId: env.id
          });
        }
      });
    });
    return list;
  }, [envelopes]);

  const sendWhatsApp = (student: any) => {
    const phone = student.phone || '';
    if (!phone) {
        alert('رقم الجوال غير متوفر لهذا الطالب');
        return;
    }
    // تنظيف الرقم من المسافات
    const cleanPhone = phone.replace(/\s+/g, '');
    const message = `السلام عليكم ورحمة الله وبركاته، نحيطكم علماً بغياب الطالب/ة: ${student.name} عن اختبار مادة ${student.subject} اليوم. نرجو التواصل مع المدرسة لتوضيح السبب.`;
    const url = `https://wa.me/${cleanPhone}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  return (
    <div className="space-y-10 animate-fade-in pb-20">
      
      {/* Premium Header */}
      <div className="bg-slate-900 text-white p-10 rounded-[3rem] shadow-2xl relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-rose-500/20 via-transparent to-transparent opacity-50"></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="text-center md:text-right">
                <h1 className="text-4xl font-[900] flex items-center gap-4 justify-center md:justify-start">
                    رصد الغياب اللحظي
                    <span className="bg-rose-500/20 text-rose-400 text-xs px-4 py-1.5 rounded-full border border-rose-500/30 font-black tracking-widest uppercase">Live Tracking</span>
                </h1>
                <p className="text-slate-400 mt-2 font-bold text-lg max-w-lg leading-relaxed">متابعة دقيقة لكل حالة غياب وضمان التواصل المباشر مع أولياء الأمور لسلامة أبنائنا.</p>
            </div>
            <div className="bg-white/5 backdrop-blur-xl border border-white/10 p-6 rounded-[2rem] text-center min-w-[200px]">
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي الحالات</p>
                <p className="text-5xl font-black text-rose-500">{absentStudents.length}</p>
            </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-10">
        
        {/* Sidebar Info */}
        <div className="lg:col-span-1 space-y-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
                <h3 className="font-black text-slate-800 flex items-center gap-3 border-b border-slate-50 pb-4 text-sm uppercase tracking-widest">
                    <Clock size={20} className="text-blue-500" />
                    توزيع الغياب باللجان
                </h3>
                <div className="space-y-4">
                    {envelopes.filter(e => e.students.some(s => s.status === AttendanceStatus.ABSENT)).map(env => {
                        const count = env.students.filter(s => s.status === AttendanceStatus.ABSENT).length;
                        return (
                        <div key={env.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl hover:bg-slate-100 transition-colors group cursor-default">
                            <div className="text-right">
                                <p className="text-xs font-black text-slate-800">لجنة {env.committeeNumber}</p>
                                <p className="text-[10px] text-slate-400 font-bold">{env.location}</p>
                            </div>
                            <span className="bg-rose-500 text-white w-8 h-8 rounded-xl flex items-center justify-center text-xs font-black shadow-lg shadow-rose-200">{count}</span>
                        </div>
                        );
                    })}
                    {absentStudents.length === 0 && <p className="text-center py-10 text-slate-400 font-bold text-xs">لا توجد غيابات حالياً</p>}
                </div>
            </div>

            <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 flex flex-col items-center text-center space-y-4">
                <div className="bg-white w-16 h-16 rounded-3xl flex items-center justify-center text-emerald-600 shadow-xl shadow-emerald-200/50 ring-4 ring-emerald-50">
                    <ShieldAlert size={28} />
                </div>
                <div>
                    <h4 className="font-black text-emerald-800 text-sm">بيئة آمنة</h4>
                    <p className="text-[10px] text-emerald-600 font-bold mt-1">تواصلك السريع يساهم في رعاية الطلاب ومتابعتهم بشكل أفضل.</p>
                </div>
            </div>
        </div>

        {/* Main List */}
        <div className="lg:col-span-3 space-y-6">
          <div className="flex items-center justify-between px-4">
            <h3 className="font-black text-slate-800 text-sm uppercase tracking-widest flex items-center gap-2">
                <UserMinus size={18} className="text-rose-500" /> قائمة التواصل العاجل
            </h3>
            <span className="text-[10px] font-black text-slate-400 flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-rose-500 animate-ping"></span>
                مزامنة حية من القاعات
            </span>
          </div>

          <div className="grid grid-cols-1 gap-4">
            {absentStudents.map((std, i) => (
              <div key={`${std.envId}-${std.id}`} 
                   style={{ animationDelay: `${i * 100}ms` }}
                   className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-6 hover:shadow-2xl hover:border-blue-100 transition-all animate-fade-in group">
                <div className="flex gap-6 items-center">
                  <div className="w-20 h-20 bg-rose-50 rounded-3xl flex items-center justify-center text-rose-500 shadow-inner group-hover:scale-110 transition-transform duration-500">
                    <AlertCircle size={36} />
                  </div>
                  <div className="text-right">
                    <h4 className="text-xl font-black text-slate-800 group-hover:text-blue-600 transition-colors">{std.name}</h4>
                    <div className="flex flex-wrap gap-2 mt-2">
                        <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">لجنة {std.committee}</span>
                        <span className="bg-slate-100 text-slate-500 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{std.grade}</span>
                        <span className="bg-blue-50 text-blue-600 px-3 py-1 rounded-lg text-[10px] font-black uppercase tracking-widest">{std.subject}</span>
                    </div>
                    {std.phone && <p className="text-xs text-blue-500 font-bold mt-2">الجوال: {std.phone}</p>}
                  </div>
                </div>

                <div className="flex gap-3">
                  <button 
                    onClick={() => sendWhatsApp(std)}
                    className="flex-1 md:flex-none bg-emerald-600 text-white px-8 py-4 rounded-2xl hover:bg-emerald-700 transition-all flex items-center justify-center gap-3 text-sm font-black shadow-xl shadow-emerald-100 group/btn"
                  >
                    <MessageSquare size={18} className="group-hover/btn:scale-125 transition-transform" />
                    مراسلة ولي الأمر
                  </button>
                  <a 
                    href={std.phone ? `tel:${std.phone}` : '#'}
                    className={`flex-1 md:flex-none bg-white text-slate-700 border border-slate-200 px-8 py-4 rounded-2xl hover:bg-slate-50 transition-all flex items-center justify-center gap-3 text-sm font-black shadow-sm group/btn ${!std.phone ? 'opacity-30 cursor-not-allowed' : ''}`}
                  >
                    <Phone size={18} className="text-blue-500 group-hover/btn:rotate-12 transition-transform" />
                    اتصال سريع
                  </a>
                </div>
              </div>
            ))}
            
            {absentStudents.length === 0 && (
              <div className="bg-white border-4 border-dashed border-slate-50 py-32 rounded-[3.5rem] text-center space-y-6">
                <div className="bg-emerald-50 w-28 h-28 rounded-full flex items-center justify-center mx-auto shadow-2xl ring-8 ring-emerald-50 animate-bounce">
                   <CheckCircle size={52} className="text-emerald-500" />
                </div>
                <div className="space-y-2">
                    <p className="text-2xl font-black text-slate-800">الانضباط مكتمل</p>
                    <p className="text-slate-400 font-bold max-w-xs mx-auto">لم يتم رصد أي حالات غياب حتى الآن.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Attendance;
