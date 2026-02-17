
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { AttendanceStatus, EnvelopeStatus } from '../types';
import { 
  QrCode, UserCheck, UserX, Search, LogOut, 
  CheckCircle2, ShieldCheck, Camera
} from 'lucide-react';
import { ScannerComponent } from '../components/ScannerComponent';

export const TeacherDashboard: React.FC = () => {
  const { envelopes, currentUser, activeExamId, setActiveExamId, markAttendance, submitEnvelope, logout, updateEnvelopeStatus } = useApp();
  const [searchTerm, setSearchTerm] = useState('');

  const activeExam = useMemo(() => {
    return envelopes.find(e => e.id === activeExamId || e.status === EnvelopeStatus.RECEIVED);
  }, [envelopes, activeExamId]);

  if (!activeExam) {
    return (
      <div className="min-h-screen bg-slate-900 text-white flex flex-col p-6 animate-fade-in" dir="rtl">
        <header className="flex justify-between items-center mb-12">
           <h1 className="text-lg font-black tracking-tighter">SEMS <span className="text-blue-500">PRO</span></h1>
           <button onClick={logout} className="p-2 bg-white/5 rounded-xl text-rose-400"><LogOut size={20}/></button>
        </header>

        <div className="flex-1 flex flex-col items-center justify-center space-y-8">
            <div className="text-center space-y-4">
                <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto shadow-2xl shadow-blue-500/20"><Camera size={32} /></div>
                <h2 className="text-xl font-black">امسح باركود اللجنة</h2>
                <p className="text-slate-400 text-xs font-bold">يرجى توجيه الكاميرا نحو باركود القاعة أو المظروف</p>
            </div>
            
            <div className="w-full max-w-xs">
                <ScannerComponent onScanSuccess={(id) => {
                    const ex = envelopes.find(e => e.committeeNumber === id || e.id === id);
                    if (ex) { 
                        setActiveExamId(ex.id); 
                        if(ex.status === EnvelopeStatus.PENDING) updateEnvelopeStatus(ex.id, EnvelopeStatus.RECEIVED); 
                    }
                    else alert("اللجنة غير مجدولة لليوم");
                }} />
            </div>
        </div>
      </div>
    );
  }

  const stats = {
    total: activeExam.students.length,
    absent: activeExam.students.filter(s => s.status === AttendanceStatus.ABSENT).length
  };

  return (
    <div className="min-h-screen bg-[#fcfdfe] font-sans pb-32" dir="rtl">
      <div className="bg-slate-900 text-white p-6 rounded-b-[2.5rem] shadow-2xl sticky top-0 z-40">
        <div className="flex justify-between items-center mb-6">
            <div>
                <h2 className="text-xl font-black">لجنة {activeExam.committeeNumber}</h2>
                <p className="text-blue-400 font-bold text-[10px] uppercase">{activeExam.subject}</p>
            </div>
            <button onClick={logout} className="p-3 bg-white/5 rounded-2xl text-rose-400"><LogOut size={20}/></button>
        </div>
        <div className="grid grid-cols-2 gap-4">
            <div className="bg-white/5 p-4 rounded-2xl text-center"><p className="text-[8px] text-slate-400 uppercase">الطلاب</p><p className="text-xl font-black">{stats.total}</p></div>
            <div className="bg-rose-500/20 p-4 rounded-2xl text-center"><p className="text-[8px] text-rose-400 uppercase">الغياب</p><p className="text-xl font-black text-rose-500">{stats.absent}</p></div>
        </div>
      </div>

      <div className="p-4 space-y-3 mt-4">
        {activeExam.students.map((student) => (
            <div key={student.id} className={`bg-white p-4 rounded-[1.5rem] border flex items-center justify-between transition-all ${student.status === AttendanceStatus.ABSENT ? 'border-rose-200 bg-rose-50' : 'border-slate-100 shadow-sm'}`}>
                <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-sm ${student.status === AttendanceStatus.ABSENT ? 'bg-rose-500 text-white' : 'bg-slate-50 text-slate-400'}`}>
                        {student.seatNumber.slice(-2)}
                    </div>
                    <div>
                        <h4 className="font-black text-slate-800 text-sm leading-tight">{student.name}</h4>
                        <p className="text-[9px] text-slate-400 font-bold">مقعد {student.seatNumber}</p>
                    </div>
                </div>
                <div className="flex gap-2">
                    <button 
                        onClick={() => markAttendance(activeExam.id, student.id, student.status === AttendanceStatus.ABSENT ? AttendanceStatus.PRESENT : AttendanceStatus.ABSENT)} 
                        className={`px-4 py-2 rounded-xl font-black text-[10px] transition-all ${student.status === AttendanceStatus.ABSENT ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'}`}
                    >
                        {student.status === AttendanceStatus.ABSENT ? 'تراجع' : 'رصد غياب'}
                    </button>
                </div>
            </div>
        ))}
      </div>

      <div className="fixed bottom-4 left-4 right-4 z-50">
          <button onClick={() => { if(confirm('إنهاء وتسليم اللجنة؟')) { updateEnvelopeStatus(activeExam.id, EnvelopeStatus.COMPLETED); window.location.reload(); } }} className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-2xl flex items-center justify-center gap-3 active:scale-95">
              <CheckCircle2 size={24} className="text-emerald-500" /> إنهاء وتسليم اللجنة
          </button>
      </div>
    </div>
  );
};

export default TeacherDashboard;
