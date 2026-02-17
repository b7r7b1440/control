
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { QRCodeCanvas } from 'qrcode.react';
import { 
  Printer, X, MapPin, Search, 
  Clock, CheckCircle2
} from 'lucide-react';
import { ExamEnvelope } from '../types';
import { printStickerSingle } from '../services/printService';

const Control: React.FC = () => {
  const { envelopes, school, stages } = useApp();
  const [selectedCommittee, setSelectedCommittee] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const groupedCommittees = useMemo(() => {
    const groups: Record<string, {
        exams: ExamEnvelope[],
        stageBreakdown: Record<string, number>
    }> = {};

    envelopes.forEach(env => {
      if (!groups[env.committeeNumber]) {
          groups[env.committeeNumber] = { exams: [], stageBreakdown: {} };
      }
      groups[env.committeeNumber].exams.push(env);
      
      if (Object.keys(groups[env.committeeNumber].stageBreakdown).length === 0) {
          env.students.forEach(s => {
              groups[env.committeeNumber].stageBreakdown[s.grade] = (groups[env.committeeNumber].stageBreakdown[s.grade] || 0) + 1;
          });
      }
    });
    
    return Object.keys(groups)
      .filter(num => num.includes(searchTerm))
      .sort((a, b) => parseInt(a) - parseInt(b))
      .map(num => ({
        number: num,
        location: groups[num].exams[0].location,
        stageBreakdown: groups[num].stageBreakdown,
        exams: groups[num].exams.sort((a, b) => a.startTime.localeCompare(b.startTime))
      }));
  }, [envelopes, searchTerm]);

  const committeeForModal = useMemo(() => {
    return groupedCommittees.find(c => c.number === selectedCommittee);
  }, [groupedCommittees, selectedCommittee]);

  // دالة لترتيب المراحل بشكل صحيح (أول، ثاني، ثالث)
  const sortGrades = (grades: string[]) => {
    const order = ['أول', 'ثاني', 'ثالث'];
    return [...grades].sort((a, b) => {
      const idxA = order.findIndex(o => a.includes(o));
      const idxB = order.findIndex(o => b.includes(o));
      return idxA - idxB;
    });
  };

  return (
    <div className="space-y-8 animate-fade-in pb-32" dir="rtl">
      <div className="relative max-w-2xl mx-auto group">
          <input 
            type="text" 
            placeholder="ابحث برقم اللجنة..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-white border border-slate-100 rounded-[2rem] py-5 pr-14 pl-6 font-bold text-slate-800 shadow-xl focus:ring-4 focus:ring-blue-100/50 outline-none transition-all text-lg"
          />
          <Search className="absolute right-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-blue-500 transition-colors" size={24} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {groupedCommittees.map((comm) => (
              <div 
                key={comm.number} 
                className="bg-white rounded-[2.5rem] border border-slate-100 shadow-xl overflow-hidden hover:shadow-2xl transition-all group"
              >
                  <div className="p-6 flex justify-between items-start">
                      <button 
                        onClick={() => setSelectedCommittee(comm.number)}
                        className="p-3 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-2xl transition-all"
                      >
                        <Printer size={24} />
                      </button>
                      <div className="text-right flex-1 px-4">
                          <div className="flex items-center justify-end gap-2 text-slate-900 font-black text-xl mb-3">
                             {comm.location} <MapPin size={20} className="text-rose-500" />
                          </div>
                          {/* التعديل: عرض المراحل والعدد فوق بعضها مرتبة */}
                          <div className="flex flex-col items-end gap-2">
                              {sortGrades(Object.keys(comm.stageBreakdown)).map((grade, i) => (
                                  <div key={i} className="flex items-center gap-3 bg-slate-50 border border-slate-100 px-4 py-1.5 rounded-xl w-fit min-w-[120px] justify-between">
                                      <span className="text-blue-600 font-black text-xs">{comm.stageBreakdown[grade]}</span>
                                      <span className="text-[10px] text-slate-500 font-black">{grade}</span>
                                  </div>
                              ))}
                          </div>
                      </div>
                      <div className="w-16 h-16 bg-white border border-slate-50 rounded-2xl flex flex-col items-center justify-center shadow-lg">
                          <span className="text-3xl font-black text-slate-900 leading-none">{comm.number}</span>
                          <span className="text-[8px] font-bold text-slate-300 uppercase">لجنة</span>
                      </div>
                  </div>

                  <div className="p-6 space-y-3 bg-slate-50/30">
                      {comm.exams.map((exam, idx) => (
                          <div key={idx} className="bg-white p-4 rounded-2xl border-r-4 border-r-amber-400 shadow-sm flex justify-between items-center group/item hover:translate-x-1 transition-transform">
                              <span className="bg-amber-50 text-amber-600 px-3 py-1 rounded-lg text-[10px] font-black">انتظار</span>
                              <div className="text-right">
                                  <h5 className="font-black text-slate-800">{exam.subject}</h5>
                                  <div className="flex items-center justify-end gap-3 mt-1">
                                      <span className="text-[10px] text-slate-400 font-bold">الفترة {exam.period === '1' ? 'الأولى' : 'الثانية'}</span>
                                      <div className="flex items-center gap-1 bg-slate-50 px-2 py-0.5 rounded-md text-slate-500 text-[10px] font-black">
                                          <Clock size={10} /> {exam.startTime}
                                      </div>
                                  </div>
                              </div>
                          </div>
                      ))}
                  </div>
              </div>
          ))}
      </div>

      {selectedCommittee && committeeForModal && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6">
              <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm animate-fade-in" onClick={() => setSelectedCommittee(null)}></div>
              <div className="bg-white w-full max-w-sm rounded-[3rem] shadow-2xl relative z-10 overflow-hidden animate-zoom-in">
                  <button 
                    onClick={() => setSelectedCommittee(null)} 
                    className="absolute top-6 left-6 w-10 h-10 bg-slate-100 text-slate-400 rounded-full flex items-center justify-center hover:bg-rose-50 hover:text-rose-500 transition-all"
                  >
                    <X size={20} />
                  </button>

                  <div className="p-10 text-center space-y-6">
                      <div className="space-y-1">
                          <p className="text-[10px] font-black text-slate-300 uppercase tracking-widest">رقم اللجنة</p>
                          <h3 className="text-7xl font-[1000] text-slate-900 tracking-tighter">{committeeForModal.number}</h3>
                      </div>

                      <div className="inline-flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-2xl border border-slate-100 text-slate-600 font-black text-sm">
                          {committeeForModal.location} <MapPin size={16} className="text-rose-500" />
                      </div>

                      <div className="bg-white p-6 rounded-[2.5rem] shadow-inner border-2 border-slate-900 mx-auto w-fit">
                          <QRCodeCanvas value={committeeForModal.number} size={180} level="H" />
                      </div>

                      <button 
                        onClick={() => printStickerSingle(committeeForModal.number, committeeForModal.location, school)}
                        className="w-full bg-slate-900 text-white py-5 rounded-2xl font-black text-lg flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl shadow-slate-200"
                      >
                         <Printer size={22} /> طباعة الملصق التعريفي
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default Control;
