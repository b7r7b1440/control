
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  Printer, X, MapPin, Search, LayoutGrid, List, Plus, QrCode, FileText,
  Activity, ArrowUpRight, CheckCircle2, Package, Clock, ShieldCheck, Users
} from 'lucide-react';
import { EnvelopeStatus, ExamEnvelope } from '../types';

const Control: React.FC = () => {
  const { envelopes, clearAllExams, updateEnvelopeStatus } = useApp();
  const [selectedCommittee, setSelectedCommittee] = useState<ExamEnvelope | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'GRID' | 'LIST'>('GRID');

  const filteredEnvelopes = useMemo(() => {
    return envelopes.filter(e => 
        e.committeeNumber.includes(searchTerm) || 
        e.subject.includes(searchTerm) || 
        e.location.includes(searchTerm)
    ).sort((a, b) => a.committeeNumber.localeCompare(b.committeeNumber, undefined, {numeric: true}));
  }, [envelopes, searchTerm]);

  const stats = useMemo(() => {
      const total = envelopes.length;
      const delivered = envelopes.filter(e => e.status === EnvelopeStatus.DELIVERED).length;
      const progress = total > 0 ? (delivered / total) * 100 : 0;
      return { total, delivered, progress };
  }, [envelopes]);

  return (
    <div className="space-y-8 animate-fade-in pb-24">
      
      {/* Control Mission Panel */}
      <div className="bg-slate-900 rounded-[4rem] p-12 text-white relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-blue-600/30 via-transparent to-slate-900/50"></div>
          <div className="absolute -bottom-24 -right-24 w-64 h-64 bg-blue-500/10 rounded-full blur-[80px]"></div>
          
          <div className="relative z-10 flex flex-col lg:flex-row justify-between items-center gap-12">
              <div className="text-center lg:text-right space-y-4">
                  <div className="inline-flex items-center gap-3 px-6 py-2 bg-white/5 rounded-full border border-white/10 text-blue-400 font-black text-xs uppercase tracking-widest">
                      <div className="w-2 h-2 bg-blue-400 rounded-full animate-ping"></div>
                      نظام التتبع الذكي النشط
                  </div>
                  <h2 className="text-5xl font-[1000] tracking-tighter">مركز مراقبة <span className="text-blue-500">اللجان</span></h2>
                  <p className="text-slate-400 text-xl font-bold max-w-xl leading-relaxed">إدارة شاملة للمظاريف الذكية المعتمدة على تقنية الباركود الموحد.</p>
              </div>

              <div className="bg-white/5 backdrop-blur-3xl p-8 rounded-[3.5rem] border border-white/10 flex items-center gap-10 min-w-[400px]">
                  <div className="relative w-28 h-28">
                      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 36 36">
                          <circle cx="18" cy="18" r="16" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="3" />
                          <circle cx="18" cy="18" r="16" fill="none" stroke="#3b82f6" strokeWidth="3" strokeDasharray={`${stats.progress}, 100`} strokeLinecap="round" className="transition-all duration-1000" />
                      </svg>
                      <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <span className="text-2xl font-black">{Math.round(stats.progress)}%</span>
                      </div>
                  </div>
                  <div className="space-y-4">
                      <div>
                          <p className="text-[10px] font-black text-slate-500 uppercase tracking-widest">المظاريف المعتمدة</p>
                          <p className="text-3xl font-black">{stats.total}</p>
                      </div>
                      <div className="flex gap-4">
                          <div className="bg-emerald-500/10 px-3 py-1 rounded-lg text-emerald-400 text-xs font-black">مستلم {stats.delivered}</div>
                          <div className="bg-blue-500/10 px-3 py-1 rounded-lg text-blue-400 text-xs font-black">نشط {stats.total - stats.delivered}</div>
                      </div>
                  </div>
              </div>
          </div>
      </div>

      <div className="flex flex-col md:flex-row gap-6 items-center justify-between">
          <div className="relative w-full md:w-[500px] group">
              <input 
                type="text" 
                placeholder="رقم اللجنة أو المادة..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-white border border-slate-100 rounded-[2.5rem] py-6 pr-16 pl-8 font-bold text-slate-800 shadow-xl focus:ring-4 focus:ring-blue-100/50 outline-none transition-all text-lg"
              />
              <Search className="absolute right-6 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={28} />
          </div>
          <div className="bg-white p-2 rounded-[2rem] shadow-sm border border-slate-100 flex">
              <button onClick={() => setViewMode('GRID')} className={`p-4 rounded-2xl transition-all ${viewMode === 'GRID' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}><LayoutGrid size={22}/></button>
              <button onClick={() => setViewMode('LIST')} className={`p-4 rounded-2xl transition-all ${viewMode === 'LIST' ? 'bg-slate-900 text-white shadow-xl' : 'text-slate-400 hover:bg-slate-50'}`}><List size={22}/></button>
          </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
          {filteredEnvelopes.map((env) => (
              <div 
                key={env.id} 
                onClick={() => setSelectedCommittee(env)}
                className={`bg-white p-8 rounded-[3.5rem] border border-slate-100 shadow-xl hover:shadow-2xl hover:-translate-y-2 transition-all cursor-pointer group relative overflow-hidden ${
                  env.status === EnvelopeStatus.DELIVERED ? 'opacity-70 bg-slate-50/50' : ''
                }`}
              >
                  <div className="flex justify-between items-start mb-8">
                      <div className="w-16 h-16 bg-slate-900 text-white rounded-2xl flex flex-col items-center justify-center font-black shadow-xl group-hover:bg-blue-600 transition-all duration-500">
                          <span className="text-[9px] opacity-50 mb-0.5">لجنة</span>
                          <span className="text-2xl leading-none">{env.committeeNumber}</span>
                      </div>
                      <div className="p-3 bg-slate-50 rounded-xl group-hover:bg-blue-50 transition-colors shadow-inner">
                        <QRCodeCanvas value={env.id} size={40} level="M" />
                      </div>
                  </div>

                  <div className="space-y-4">
                      <h4 className="text-xl font-[900] text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">{env.subject}</h4>
                      <div className="flex items-center gap-2 text-slate-400 text-sm font-bold">
                          <MapPin size={16} className="text-blue-500" />
                          {env.location}
                      </div>
                  </div>

                  <div className="mt-8 pt-8 border-t border-slate-50 flex items-center justify-between">
                       <StatusBadge status={env.status} />
                       <ArrowUpRight size={20} className="text-slate-200 group-hover:text-blue-600 transition-all" />
                  </div>
              </div>
          ))}
      </div>

      {selectedCommittee && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-8">
              <div className="absolute inset-0 bg-slate-950/90 backdrop-blur-2xl animate-fade-in" onClick={() => setSelectedCommittee(null)}></div>
              <div className="bg-white w-full max-w-2xl rounded-[4rem] shadow-2xl relative z-10 overflow-hidden animate-zoom-in border border-white/20">
                  <div className="bg-slate-900 p-12 text-white relative">
                      <button onClick={() => setSelectedCommittee(null)} className="absolute top-8 left-8 text-white/40 hover:text-white transition-colors p-3 bg-white/5 rounded-2xl"><X size={28} /></button>
                      <div className="flex items-center gap-8">
                          <div className="bg-white p-5 rounded-[2.5rem] shadow-2xl">
                              <QRCodeCanvas id={`qr-comm-${selectedCommittee.id}`} value={selectedCommittee.id} size={120} level="H" />
                          </div>
                          <div className="space-y-2">
                              <span className="bg-blue-600 text-white px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest">مظروف ذكي</span>
                              <h3 className="text-4xl font-[1000] tracking-tighter">لجنة {selectedCommittee.committeeNumber}</h3>
                              <p className="text-blue-400 font-bold text-lg">{selectedCommittee.location}</p>
                          </div>
                      </div>
                  </div>
                  
                  <div className="p-12 space-y-10 text-right">
                      <div className="grid grid-cols-2 gap-10">
                          <DetailItem label="المادة" value={selectedCommittee.subject} icon={<FileText size={16}/>} />
                          <DetailItem label="المكلف" value={selectedCommittee.teacherName || 'لم يحدد بعد'} icon={<Users size={16}/>} />
                      </div>
                      <button onClick={() => window.print()} className="w-full bg-slate-900 text-white py-6 rounded-3xl font-black text-xl flex items-center justify-center gap-4 hover:bg-slate-800 transition-all shadow-2xl shadow-slate-200">
                          <Printer size={24} /> طباعة بيانات اللجنة الموحدة
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

const DetailItem = ({ label, value, icon }: any) => (
    <div className="space-y-2">
        <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 justify-end">
             {label} {icon}
        </p>
        <p className="text-xl font-black text-slate-800">{value}</p>
    </div>
);

const StatusBadge = ({ status }: { status: EnvelopeStatus }) => {
    const config = {
        [EnvelopeStatus.PENDING]: { label: 'انتظار', color: 'bg-slate-100 text-slate-400' },
        [EnvelopeStatus.RECEIVED]: { label: 'نشطة', color: 'bg-blue-100 text-blue-600' },
        [EnvelopeStatus.COMPLETED]: { label: 'جاهزة', color: 'bg-emerald-100 text-emerald-600' },
        [EnvelopeStatus.DELIVERED]: { label: 'مستلمة', color: 'bg-slate-900 text-white' },
    };
    const { label, color } = config[status];
    return <span className={`px-4 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest ${color}`}>{label}</span>;
};

export default Control;
