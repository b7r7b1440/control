
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EnvelopeStatus, AttendanceStatus } from '../types';
import { 
  ChevronRight, UserCheck, UserX, PackageCheck, QrCode, ShieldCheck
} from 'lucide-react';
import { ScannerComponent } from '../components/ScannerComponent';

const Scanner: React.FC = () => {
  const { envelopes, updateEnvelopeStatus, markAttendance, currentUser } = useApp();
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const handleScan = (scannedText: string) => {
    // تنظيف النص الممسوح من المسافات
    const committeeId = scannedText.trim();
    const today = new Date().toISOString().split('T')[0];

    // البحث عن المظروف المطابق لرقم اللجنة وتاريخ اليوم
    const env = envelopes.find(e => 
        (e.committeeNumber === committeeId || e.id === committeeId) && 
        e.date === today
    );
    
    if (!env) {
      setError(`اللجنة رقم (${committeeId}) غير مجدولة لتاريخ اليوم ${today}`);
      return;
    }

    if (currentUser?.role === 'CONTROL') {
      if (env.status === EnvelopeStatus.COMPLETED) {
        updateEnvelopeStatus(env.id, EnvelopeStatus.DELIVERED);
        setSuccessMsg(`تم استلام مظروف لجنة ${env.committeeNumber} بنجاح.`);
        setTimeout(() => navigate('/reports'), 2000);
        return;
      }
      setError("المظروف لم يتم إنهاؤه من المراقب بعد.");
      return;
    }

    if (currentUser?.role === 'TEACHER') {
      if (env.status === EnvelopeStatus.PENDING) updateEnvelopeStatus(env.id, EnvelopeStatus.RECEIVED);
      setActiveSession(env.id);
    }
  };

  if (successMsg) {
    return (
      <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center animate-fade-in">
        <div className="w-20 h-20 bg-emerald-50 text-emerald-500 rounded-3xl flex items-center justify-center mb-6 shadow-xl"><PackageCheck size={40} /></div>
        <h2 className="text-xl font-black text-slate-800">{successMsg}</h2>
        <p className="text-slate-400 text-sm mt-2">جاري التوجيه للتقارير...</p>
      </div>
    );
  }

  if (activeSession) {
      const currentEnvelope = envelopes.find(e => e.id === activeSession);
      if (!currentEnvelope) return null;
      return (
        <div className="space-y-6 animate-fade-in">
          <div className="bg-slate-900 text-white p-6 rounded-[2.5rem] flex justify-between items-center shadow-2xl">
              <button onClick={() => setActiveSession(null)} className="p-2 bg-white/10 rounded-xl"><ChevronRight size={20}/></button>
              <div className="text-center">
                  <h2 className="text-lg font-black">لجنة {currentEnvelope.committeeNumber}</h2>
                  <p className="text-[10px] text-blue-400 font-bold uppercase">{currentEnvelope.subject}</p>
              </div>
              <div className="w-10"></div>
          </div>
          <div className="space-y-3">
              {currentEnvelope.students.map(student => (
                  <div key={student.id} className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm">
                      <div>
                          <p className="text-sm font-black text-slate-800">{student.name}</p>
                          <p className="text-[10px] text-slate-400 font-bold">مقعد {student.seatNumber}</p>
                      </div>
                      <div className="flex gap-2">
                          <button 
                            onClick={() => markAttendance(activeSession, student.id, AttendanceStatus.PRESENT)}
                            className={`p-3 rounded-xl ${student.status === AttendanceStatus.PRESENT ? 'bg-blue-600 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                          ><UserCheck size={18}/></button>
                          <button 
                            onClick={() => markAttendance(activeSession, student.id, AttendanceStatus.ABSENT)}
                            className={`p-3 rounded-xl ${student.status === AttendanceStatus.ABSENT ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-50 text-slate-400'}`}
                          ><UserX size={18}/></button>
                      </div>
                  </div>
              ))}
          </div>
          <button 
            onClick={() => { updateEnvelopeStatus(activeSession, EnvelopeStatus.COMPLETED); setActiveSession(null); }}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black shadow-2xl flex items-center justify-center gap-3"
          >
            <ShieldCheck size={24} className="text-blue-400" /> تسليم اللجنة للكنترول
          </button>
        </div>
      );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] space-y-10">
      <div className="text-center space-y-2">
        <div className="inline-flex bg-blue-50 p-4 rounded-2xl text-blue-600 mb-2"><QrCode size={32} /></div>
        <h1 className="text-xl font-black text-slate-800">الماسح الضوئي</h1>
        <p className="text-slate-400 font-bold text-xs max-w-xs mx-auto">وجه الكاميرا نحو باركود اللجنة للبدء</p>
      </div>

      <div className="w-full max-w-[320px] shadow-2xl">
          <ScannerComponent onScanSuccess={handleScan} />
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-600 px-6 py-3 rounded-2xl text-[10px] font-black border border-rose-100 animate-fade-in max-w-sm text-center">
          {error}
        </div>
      )}
    </div>
  );
};

export default Scanner;
