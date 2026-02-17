
import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceStatus, EnvelopeStatus, Student } from '../types';
import { 
  QrCode, UserCheck, UserX, Search, Clock, 
  LogOut, Users, Send, Layers, RefreshCw, CheckCircle2, ShieldCheck, AlertCircle
} from 'lucide-react';
import { ScannerComponent as Scanner } from '../components/ScannerComponent';

export const TeacherDashboard: React.FC = () => {
  const { envelopes, currentUser, activeExamId, setActiveExamId, markAttendance, submitEnvelope, logout } = useApp();
  const [isScanningMode, setIsScanningMode] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [filter, setFilter] = useState<'all' | 'absent'>('all');

  const activeExam = useMemo(() => {
    return envelopes.find(e => e.id === activeExamId || e.status === EnvelopeStatus.RECEIVED);
  }, [envelopes, activeExamId]);

  // الطلاب مرتبون أصلاً في الـ Context حسب الصف (أول ثانوي، ثم ثاني...)
  const stats = useMemo(() => {
    if (!activeExam) return { total: 0, present: 0, absent: 0 };
    const total = activeExam.students.length;
    const present = activeExam.students.filter(s => s.status === AttendanceStatus.PRESENT).length;
    const absent = activeExam.students.filter(s => s.status === AttendanceStatus.ABSENT).length;
    return { total, present, absent };
  }, [activeExam]);

  if (!activeExam || isScanningMode) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col items-center justify-center p-8 space-y-12 animate-fade-in" dir="rtl">
        <header className="fixed top-0 left-0 right-0 p-8 flex justify-between items-center bg-slate-900/50 backdrop-blur-xl z-50">
           <div className="flex items-center gap-4">
              <div className="bg-blue-600 p-2 rounded-xl"><ShieldCheck size={24} /></div>
              <h1 className="text-xl font-black">ركن المعلم الذكي</h1>
           </div>
           <button onClick={logout} className="p-3 bg-white/5 rounded-2xl text-rose-400"><LogOut size={20}/></button>
        </header>
        <div className="text-center space-y-4 max-w-sm">
            <div className="w-24 h-24 bg-blue-600 rounded-full flex items-center justify-center mx-auto shadow-2xl animate-pulse"><QrCode size={48} /></div>
            <h2 className="text-2xl font-black">وجه الكاميرا نحو باركود اللجنة</h2>
        </div>
        <div className="w-full max-w-sm rounded-[3rem] overflow-hidden border-[8px] border-white/5 bg-slate-800 relative">
            <Scanner onScanSuccess={(id) => {
                const ex = envelopes.find(e => e.committeeNumber === id || e.id === id);
                if (ex) { setActiveExamId(ex.id); setIsScanningMode(false); if(ex.status === EnvelopeStatus.PENDING) submitEnvelope(ex.id, EnvelopeStatus.RECEIVED); }
                else alert("لجنة غير موجودة اليوم");
            }} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#fcfdfe] pb-40 font-sans text-right" dir="rtl">
      <div className="bg-slate-900 text-white p-8 rounded-b-[3rem] shadow-2xl sticky top-0 z-40">
        <div className="flex justify-between items-start mb-6">
            <div>
                <span className="bg-emerald-500 text-white px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest">لجنة نشطة</span>
                <h2 className="text-2xl font-black mt-2 tracking-tight">لجنة {activeExam.committeeNumber}</h2>
                <p className="text-blue-400 font-bold text-sm">{activeExam.subject} | {activeExam.location}</p>
            </div>
            <button onClick={logout} className="p-3 bg-white/5 rounded-2xl text-rose-400"><LogOut size={20}/></button>
        </div>
        <div className="grid grid-cols-2 gap-4 mb-6">
            <div className="bg-white/5 p-4 rounded-2xl text-center"><p className="text-[10px] text-slate-400 uppercase">الطلاب</p><p className="text-2xl font-black">{stats.total}</p></div>
            <div className="bg-rose-500/20 p-4 rounded-2xl text-center"><p className="text-[10px] text-rose-400 uppercase">الغياب</p><p className="text-2xl font-black text-rose-500">{stats.absent}</p></div>
        </div>
        <div className="relative">
            <input type="text" placeholder="ابحث باسم الطالب أو رقم الجلوس..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="w-full bg-white/10 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white outline-none focus:bg-white focus:text-slate-900 transition-all" />
            <Search className="absolute right-4 top-1/2 -translate-y-1/2 text-white/30" size={20} />
        </div>
      </div>

      <div className="p-4 space-y-3">
        {activeExam.students.filter(s => s.name.includes(searchTerm) || s.seatNumber.includes(searchTerm)).map((student, i) => (
            <div key={student.id} className={`bg-white p-4 rounded-3xl border flex items-center justify-between transition-all ${student.status === AttendanceStatus.ABSENT ? 'border-rose-200 bg-rose-50' : 'border-slate-100 shadow-sm'}`}>
                <div className="flex items-center gap-4">
                    <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-xl ${student.status === AttendanceStatus.ABSENT ? 'bg-rose-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                        {student.seatNumber.slice(-2)}
                    </div>
                    <div>
                        <h4 className="font-black text-slate-800 text-sm leading-tight">{student.name}</h4>
                        <p className="text-[10px] text-slate-400 font-bold mt-1">{student.grade} | مقعد {student.seatNumber}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    {student.status === AttendanceStatus.PRESENT ? (
                        <button onClick={() => markAttendance(activeExam.id, student.id, AttendanceStatus.ABSENT)} className="px-5 py-3 bg-slate-100 text-slate-400 rounded-2xl font-black text-xs hover:bg-rose-50 hover:text-rose-500 transition-all">رصد غياب</button>
                    ) : (
                        <button onClick={() => markAttendance(activeExam.id, student.id, AttendanceStatus.PRESENT)} className="px-5 py-3 bg-rose-500 text-white rounded-2xl font-black text-xs shadow-lg transition-all flex items-center gap-2"><UserCheck size={14}/> تراجع عن الغياب</button>
                    )}
                </div>
            </div>
        ))}
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 backdrop-blur-xl border-t border-slate-100">
          <button onClick={() => { if(confirm('هل تم الانتهاء من الرصد؟')) { submitEnvelope(activeExam.id, EnvelopeStatus.COMPLETED); window.location.reload(); } }} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-xl shadow-2xl flex items-center justify-center gap-3 active:scale-95 transition-all">
              <CheckCircle2 size={24} className="text-emerald-500" /> إنهاء وتسليم اللجنة
          </button>
      </div>
    </div>
  );
};

export default TeacherDashboard;
