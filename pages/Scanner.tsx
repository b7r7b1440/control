
import React, { useEffect, useState, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { useNavigate } from 'react-router-dom';
import { useApp } from '../context/AppContext';
import { EnvelopeStatus, AttendanceStatus } from '../types';
import { 
  ChevronRight, 
  UserCheck, 
  UserX, 
  AlertTriangle,
  Zap,
  PackageCheck,
  ShieldCheck,
  Activity,
  Clock
} from 'lucide-react';

const Scanner: React.FC = () => {
  const { envelopes, updateEnvelopeStatus, updateStudentStatus, currentUser } = useApp();
  const navigate = useNavigate();
  const [activeSession, setActiveSession] = useState<string | null>(null);
  const [scanning, setScanning] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    if (scanning && !activeSession) {
      const initScanner = () => {
        try {
          if (document.getElementById("qr-reader")) {
              scannerRef.current = new Html5QrcodeScanner(
                "qr-reader",
                { fps: 20, qrbox: { width: 250, height: 250 } },
                false
              );
              
              scannerRef.current.render((decodedText) => {
                handleScan(decodedText);
              }, (err) => {});
          }
        } catch (e) {
          console.error("Scanner init failed", e);
        }
      };
      
      const timer = setTimeout(initScanner, 100);
      return () => clearTimeout(timer);
    }

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => {});
      }
    };
  }, [scanning, activeSession]);

  const handleScan = (envelopeId: string) => {
    // دعم المسح عبر ID المظروف أو رقم اللجنة
    const env = envelopes.find(e => e.id === envelopeId || e.committeeNumber === envelopeId);
    
    if (!env) {
      setError("الرمز الممسوح غير صالح أو المظروف غير موجود في جدول اليوم");
      return;
    }

    // منطق الكنترول (الاستلام النهائي)
    if (currentUser?.role === 'CONTROL') {
      if (env.status === EnvelopeStatus.COMPLETED) {
        updateEnvelopeStatus(env.id, EnvelopeStatus.DELIVERED);
        setScanning(false);
        setSuccessMsg(`تم استلام مظروف لجنة ${env.committeeNumber} بنجاح وأرشفته في الكنترول.`);
        setTimeout(() => navigate('/reports'), 3000);
        return;
      } else if (env.status === EnvelopeStatus.DELIVERED) {
        setError("تم استلام هذا المظروف مسبقاً وتوثيقه في السجلات.");
        return;
      } else if (env.status === EnvelopeStatus.PENDING) {
        setError("هذا المظروف لم يفتح بعد من قبل المراقب في القاعة.");
        return;
      } else {
        setError("يجب على المراقب إنهاء اللجنة من تطبيقه أولاً قبل الاستلام في الكنترول.");
        return;
      }
    }

    // منطق المعلم (فتح اللجنة)
    if (currentUser?.role === 'TEACHER') {
      if (env.status === EnvelopeStatus.DELIVERED) {
         setError("هذه اللجنة مغلقة ومسلمة للكنترول.");
         return;
      }
      if (env.status === EnvelopeStatus.PENDING) {
        updateEnvelopeStatus(env.id, EnvelopeStatus.RECEIVED);
      }
      setActiveSession(env.id);
      setScanning(false);
    }
  };

  const currentEnvelope = envelopes.find(e => e.id === activeSession);

  if (successMsg) {
    return (
      <div className="min-h-[70vh] flex flex-col items-center justify-center p-8 text-center animate-zoom-in">
        <div className="w-24 h-24 bg-emerald-50 text-emerald-500 rounded-[2rem] flex items-center justify-center mb-8 shadow-2xl animate-bounce border-4 border-emerald-100">
          <PackageCheck size={48} />
        </div>
        <h2 className="text-2xl font-black text-slate-800 mb-3">توثيق الاستلام</h2>
        <p className="text-slate-500 text-sm font-bold leading-relaxed">{successMsg}</p>
        <button onClick={() => navigate('/')} className="mt-10 bg-slate-900 text-white px-12 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-blue-600 transition-all">العودة للرئيسية</button>
      </div>
    );
  }

  if (activeSession && currentEnvelope) {
    return (
      <div className="space-y-6 pb-40 animate-fade-in px-2">
        <header className="flex items-center justify-between bg-white p-6 rounded-[2rem] shadow-sm border border-slate-100">
          <button onClick={() => {setActiveSession(null); setScanning(true);}} className="text-slate-400 p-2 hover:bg-slate-50 rounded-xl">
            <ChevronRight size={24} />
          </button>
          <div className="text-center">
            <h2 className="text-lg font-black text-slate-800 leading-none">لجنة {currentEnvelope.committeeNumber}</h2>
            <p className="text-[9px] text-blue-600 font-black tracking-widest uppercase mt-1">{currentEnvelope.subject}</p>
          </div>
          <div className="flex flex-col items-center bg-blue-50 px-3 py-1 rounded-xl">
              <Clock size={12} className="text-blue-500" />
              <span className="text-[8px] font-black text-blue-600">{currentEnvelope.startTime}</span>
          </div>
        </header>

        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
            <p className="text-[8px] font-black text-slate-400 mb-1 uppercase tracking-widest">حاضرون</p>
            <p className="text-3xl font-black text-blue-600">
              {currentEnvelope.students.filter(s => s.status === AttendanceStatus.PRESENT).length}
            </p>
          </div>
          <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm text-center">
            <p className="text-[8px] font-black text-slate-400 mb-1 uppercase tracking-widest">غائبون</p>
            <p className="text-3xl font-black text-rose-500">
              {currentEnvelope.students.filter(s => s.status === AttendanceStatus.ABSENT).length}
            </p>
          </div>
        </div>

        <div className="space-y-3">
          {currentEnvelope.students.map((student, i) => (
            <div key={student.id} 
                 className="bg-white p-4 rounded-3xl border border-slate-100 flex items-center justify-between shadow-sm group active:scale-95 transition-all">
              <div className="flex items-center gap-4">
                 <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-sm transition-colors ${
                   student.status === AttendanceStatus.PRESENT ? 'bg-blue-600 text-white shadow-lg' : 
                   student.status === AttendanceStatus.ABSENT ? 'bg-rose-500 text-white shadow-lg' : 'bg-slate-100 text-slate-400'
                 }`}>
                   {student.seatNumber.slice(-2)}
                 </div>
                 <div className="text-right">
                    <p className="text-sm font-black text-slate-800 leading-none mb-1">{student.name}</p>
                    <p className="text-[9px] text-slate-400 font-bold">رقم الجلوس: {student.seatNumber}</p>
                 </div>
              </div>
              <div className="flex gap-2">
                <button 
                  onClick={() => updateStudentStatus(activeSession, student.id, AttendanceStatus.PRESENT)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${student.status === AttendanceStatus.PRESENT ? 'bg-blue-600 text-white shadow-lg scale-105' : 'bg-slate-50 text-slate-400'}`}
                >
                  <UserCheck size={20} />
                </button>
                <button 
                  onClick={() => updateStudentStatus(activeSession, student.id, AttendanceStatus.ABSENT)}
                  className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all ${student.status === AttendanceStatus.ABSENT ? 'bg-rose-500 text-white shadow-lg scale-105' : 'bg-slate-50 text-slate-400'}`}
                >
                  <UserX size={20} />
                </button>
              </div>
            </div>
          ))}
        </div>

        <div className="fixed bottom-32 left-6 right-6 z-[60]">
          <button 
            onClick={() => { if(confirm('هل تم الانتهاء من رصد الحضور؟ سيتم إغلاق اللجنة وإتاحتها للكنترول للاستلام.')) { updateEnvelopeStatus(activeSession, EnvelopeStatus.COMPLETED); setActiveSession(null); setScanning(true); } }}
            className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 shadow-2xl active:scale-95 transition-all"
          >
            <ShieldCheck size={24} className="text-blue-400" /> إنهاء وتسليم اللجنة
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[70vh] space-y-10 px-4">
      <div className="text-center space-y-3">
        <div className="inline-flex bg-blue-50 p-4 rounded-2xl text-blue-600 shadow-inner">
          <Zap size={28} className="animate-pulse" />
        </div>
        <h1 className="text-2xl font-black text-slate-800 leading-tight">الماسح الضوئي الذكي</h1>
        <p className="text-slate-400 font-bold text-sm max-w-[280px] mx-auto">
            {currentUser?.role === 'CONTROL' ? 'استخدم الكاميرا لاستلام المظاريف من المراقبين' : 'وجه الكاميرا نحو رمز QR على المظروف أو باب اللجنة'}
        </p>
      </div>

      <div className="relative w-full max-w-[300px] aspect-square bg-slate-900 rounded-[3rem] overflow-hidden shadow-2xl border-[8px] border-white ring-1 ring-slate-100">
        <div id="qr-reader" className="w-full h-full scale-110"></div>
        <div className="absolute inset-0 pointer-events-none p-10 flex flex-col justify-between">
           <div className="flex justify-between">
              <div className="w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-2xl"></div>
              <div className="w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-2xl"></div>
           </div>
           <div className="flex justify-between">
              <div className="w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-2xl"></div>
              <div className="w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-2xl"></div>
           </div>
        </div>
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-blue-500 to-transparent shadow-[0_0_20px_rgba(59,130,246,1)] animate-scan-line"></div>
      </div>

      {error && (
        <div className="bg-rose-50 text-rose-600 px-6 py-4 rounded-2xl text-[10px] font-black flex items-center gap-3 border border-rose-100 shadow-xl max-w-sm text-center">
          <AlertTriangle size={20} className="shrink-0" />
          {error}
        </div>
      )}

      <style>{`
        @keyframes scan-line {
          0% { top: 0; }
          50% { top: 100%; }
          100% { top: 0; }
        }
        .animate-scan-line { animation: scan-line 3s linear infinite; }
      `}</style>
    </div>
  );
};

export default Scanner;
