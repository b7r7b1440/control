
import React, { useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { EnvelopeStatus, AttendanceStatus } from '../types';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts';
import { Activity, Users, AlertTriangle, Layers, CalendarClock, Target, CheckCircle2, TrendingUp, Sparkles } from 'lucide-react';

export const Dashboard: React.FC = () => {
  // Fix: Property 'exams' does not exist on type 'AppContextType'. Use 'envelopes' instead.
  const { envelopes } = useApp();
  const today = new Date().toISOString().split('T')[0];
  
  const displayExams = useMemo(() => {
      if (envelopes.length > 0) return envelopes.filter(e => e.date === today);
      return [];
  }, [envelopes, today]);
  
  const stats = useMemo(() => {
    let totalStd = 0;
    let present = 0;
    let absent = 0;
    let delivered = 0;
    let ongoing = 0;

    displayExams.forEach(e => {
        totalStd += e.students.length;
        if (e.status === EnvelopeStatus.DELIVERED) delivered++;
        if (e.status === EnvelopeStatus.RECEIVED) ongoing++;
        e.students.forEach(s => {
            if (s.status === AttendanceStatus.PRESENT) present++;
            if (s.status === AttendanceStatus.ABSENT) absent++;
        });
    });

    const completionRate = displayExams.length > 0 ? (delivered / displayExams.length) * 100 : 0;
    const attendanceRate = totalStd > 0 ? (present / totalStd) * 100 : 0;

    return { totalStd, present, absent, delivered, ongoing, completionRate, attendanceRate };
  }, [displayExams]);

  const attendancePie = [
    { name: 'حضور', value: stats.present, color: '#3b82f6' },
    { name: 'غياب', value: stats.absent, color: '#f43f5e' },
    { name: 'لم يرصد', value: Math.max(0, stats.totalStd - (stats.present + stats.absent)), color: '#e2e8f0' },
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      
      <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white relative overflow-hidden shadow-xl">
          <div className="absolute top-0 right-0 p-8 bg-blue-500/10 rounded-full translate-x-1/2 -translate-y-1/2"></div>
          <div className="relative z-10 flex items-center justify-between">
              <div className="space-y-1">
                  <h2 className="text-2xl font-black tracking-tight">مرحباً بك</h2>
                  <p className="text-blue-400 text-[10px] font-bold uppercase tracking-widest">إحصائيات اليوم الحيّة</p>
              </div>
              <div className="bg-white/10 p-3 rounded-2xl backdrop-blur-md border border-white/5">
                <CalendarClock className="text-blue-400" size={24} />
              </div>
          </div>
          
          <div className="mt-8 flex items-end justify-between">
              <div>
                  <p className="text-4xl font-black">{Math.round(stats.completionRate)}%</p>
                  <p className="text-[10px] font-bold text-slate-400 mt-1 uppercase">نسبة إنجاز الكنترول</p>
              </div>
              <div className="w-24 h-12">
                  {/* Miniature chart placeholder */}
                  <div className="flex items-end gap-1 h-full">
                      {[40, 70, 45, 90, 65, 80].map((h, i) => (
                          <div key={i} className="flex-1 bg-blue-500/30 rounded-t-sm" style={{ height: `${h}%` }}></div>
                      ))}
                  </div>
              </div>
          </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
          <StatMiniCard label="اللجان" value={displayExams.length} icon={<Layers size={18}/>} color="blue" />
          <StatMiniCard label="الغياب" value={stats.absent} icon={<AlertTriangle size={18}/>} color="rose" />
      </div>

      <div className="bg-white rounded-[2.5rem] p-8 border border-slate-100 shadow-sm">
          <h3 className="text-sm font-black text-slate-800 mb-6 flex items-center gap-2">
              <TrendingUp size={18} className="text-emerald-500" /> تحليل الحضور اللحظي
          </h3>
          <div className="h-56 relative">
              <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                      <Pie data={attendancePie} innerRadius={60} outerRadius={80} paddingAngle={8} dataKey="value" stroke="none">
                          {attendancePie.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={entry.color} />
                          ))}
                      </Pie>
                  </PieChart>
              </ResponsiveContainer>
              <div className="absolute inset-0 flex flex-col items-center justify-center">
                  <span className="text-3xl font-black text-slate-800">{Math.round(stats.attendanceRate)}%</span>
                  <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-1">حضور</span>
              </div>
          </div>
      </div>

      <div className="space-y-4">
          <div className="flex justify-between items-center px-2">
              <h3 className="text-sm font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <CheckCircle2 size={18} className="text-blue-500" /> حالة اللجان
              </h3>
              <span className="text-[10px] font-bold text-slate-400">اليوم</span>
          </div>
          {displayExams.map((exam) => (
              <div key={exam.id} className="p-5 bg-white border border-slate-100 rounded-[2rem] flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-4">
                      <div className="w-12 h-12 bg-slate-900 text-white rounded-2xl flex flex-col items-center justify-center font-black">
                          <span className="text-[8px] opacity-60">لجنة</span>
                          <span className="text-lg leading-none">{exam.committeeNumber}</span>
                      </div>
                      <div>
                          <h4 className="font-black text-slate-800 text-sm">{exam.subject}</h4>
                          <p className="text-[10px] text-slate-400 font-bold">{exam.location}</p>
                      </div>
                  </div>
                  <StatusBadgeMini status={exam.status} />
              </div>
          ))}
          {displayExams.length === 0 && (
              <div className="py-12 text-center text-slate-400 font-bold text-xs bg-slate-50 rounded-[2rem] border border-dashed">
                  لا توجد لجان نشطة اليوم
              </div>
          )}
      </div>
    </div>
  );
};

const StatMiniCard = ({ label, value, icon, color }: any) => {
    const colors: any = {
        blue: 'bg-blue-50 text-blue-600',
        rose: 'bg-rose-50 text-rose-600',
    };
    return (
        <div className={`p-6 rounded-[2rem] flex flex-col gap-3 shadow-sm border border-white ${colors[color]}`}>
            <div className="bg-white/50 w-10 h-10 rounded-xl flex items-center justify-center shadow-inner">
                {icon}
            </div>
            <div>
                <p className="text-[8px] font-black uppercase tracking-widest opacity-60">{label}</p>
                <h4 className="text-2xl font-black">{value}</h4>
            </div>
        </div>
    );
};

const StatusBadgeMini = ({ status }: { status: EnvelopeStatus }) => {
    const config = {
        [EnvelopeStatus.PENDING]: { color: 'bg-slate-100 text-slate-500' },
        [EnvelopeStatus.RECEIVED]: { color: 'bg-blue-100 text-blue-700' },
        [EnvelopeStatus.COMPLETED]: { color: 'bg-emerald-100 text-emerald-700' },
        [EnvelopeStatus.DELIVERED]: { color: 'bg-slate-800 text-white' },
    };
    const { color } = config[status];
    return <span className={`px-3 py-1.5 rounded-lg text-[8px] font-black uppercase tracking-widest ${color}`}>
        {status === EnvelopeStatus.DELIVERED ? 'مستلمة' : 'نشطة'}
    </span>;
};

export default Dashboard;