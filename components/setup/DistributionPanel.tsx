
import React, { useMemo } from 'react';
import { Stage, Committee } from '../../types';
import { useApp } from '../../context/AppContext';
import { 
  Calculator, Plus, Trash2, MapPin, Eraser, CheckCircle2, Info, UserCheck 
} from 'lucide-react';

interface DistributionPanelProps {
  stages: Stage[];
  committees: Committee[];
  onChange: (committees: Committee[]) => void;
}

const DistributionPanel: React.FC<DistributionPanelProps> = ({ stages, committees, onChange }) => {
  const { updateCommitteeInfo, resetDistributionBackend, refreshData } = useApp();

  const distributedStats = useMemo(() => {
    const stats: Record<string | number, number> = {};
    stages.forEach(s => stats[s.id] = 0);
    
    committees.forEach(c => {
      const counts = c.counts || {};
      stages.forEach(s => {
        const val = parseInt(String(counts[s.id] || 0));
        if (!isNaN(val)) stats[s.id] += val;
      });
    });
    return stats;
  }, [committees, stages]);

  const handleCellUpdate = (committeeId: string | number, stageId: number, value: string) => {
    const cleanVal = value.replace(/[٠-٩]/g, d => "٠١٢٣٤٥٦٧٨٩".indexOf(d).toString());
    const numValue = cleanVal === '' ? 0 : parseInt(cleanVal);
    
    if (isNaN(numValue) && cleanVal !== '') return;

    const newCommittees = committees.map(c => {
      if (c.id === committeeId) {
        const currentCounts = { ...(c.counts || {}) };
        currentCounts[stageId] = numValue;
        updateCommitteeInfo(c.id, { counts: currentCounts });
        return { ...c, counts: currentCounts };
      }
      return c;
    });

    onChange(newCommittees);
  };

  const totalSchoolStudents = stages.reduce((acc, s) => acc + s.total, 0);

  return (
    <div className="space-y-10 animate-fade-in pb-24" dir="rtl">
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="bg-slate-900 p-8 rounded-[3rem] text-white shadow-2xl">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">إجمالي طلاب المدرسة</p>
            <h4 className="text-5xl font-[1000] mt-2 tracking-tighter">{totalSchoolStudents}</h4>
            <div className="mt-4 flex items-center gap-2 text-emerald-400 text-xs font-bold">
                <CheckCircle2 size={14} /> الربط المحاسبي نشط
            </div>
        </div>

        {stages.map(stage => {
          const distributed = distributedStats[stage.id] || 0;
          const remaining = stage.total - distributed;
          const isFull = distributed === stage.total;
          const isOver = distributed > stage.total;

          return (
            <div key={stage.id} className={`p-8 rounded-[3rem] border shadow-xl flex flex-col justify-between transition-all duration-500 ${isFull ? 'bg-emerald-50 border-emerald-200' : isOver ? 'bg-rose-50 border-rose-200' : 'bg-white border-slate-100'}`}>
              <div>
                <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{stage.name}</p>
                <div className="flex items-baseline gap-2 mt-2">
                   <h4 className="text-4xl font-[1000] text-slate-900">{distributed}</h4>
                   <span className="text-slate-300 font-bold text-lg">/ {stage.total}</span>
                </div>
              </div>
              <div className="mt-4">
                  <div className="h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div className={`h-full transition-all duration-700 ${isFull ? 'bg-emerald-500' : isOver ? 'bg-rose-500' : 'bg-blue-600'}`} style={{ width: `${Math.min(100, (distributed / stage.total) * 100)}%` }}></div>
                  </div>
                  <p className="text-[10px] font-black mt-3 text-slate-400">
                    {remaining === 0 ? 'تم التوزيع' : `المتبقي: ${remaining}`}
                  </p>
              </div>
            </div>
          );
        })}
      </div>

      <div className="bg-white p-10 rounded-[4rem] border border-slate-100 shadow-2xl space-y-10">
        <div className="flex flex-col lg:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-6 text-right">
            <div className="w-20 h-20 bg-blue-600 text-white rounded-[2rem] flex items-center justify-center shadow-xl">
              <Calculator size={32} />
            </div>
            <div>
              <h3 className="text-3xl font-[1000] text-slate-800 tracking-tighter">التوزيع المستقل</h3>
              <p className="text-slate-400 font-bold">حدد عدد الطلاب لكل مرحلة وعدد الملاحظين المطلوب لكل لجنة</p>
            </div>
          </div>

          <div className="flex gap-3">
             <button onClick={() => resetDistributionBackend()} className="px-6 py-3 bg-rose-50 text-rose-600 rounded-2xl font-black text-xs hover:bg-rose-100 border border-rose-100 flex items-center gap-2 transition-all">
                <Eraser size={18} /> تصفير الجدول
             </button>
             <button onClick={() => onChange([...committees, { id: Date.now(), name: String(committees.length + 1), location: `قاعة ${committees.length + 1}`, capacity: 20, invigilatorCount: 1, counts: {} }])} className="px-8 py-3 bg-slate-900 text-white rounded-2xl font-black text-xs hover:bg-blue-600 transition-all shadow-lg flex items-center gap-2">
                <Plus size={18} /> إضافة لجنة
             </button>
          </div>
        </div>

        <div className="overflow-x-auto rounded-[3rem] border border-slate-100">
          <table className="w-full text-right border-collapse">
            <thead className="bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest">
              <tr>
                <th className="p-6 text-center border-l border-white/5">اللجنة</th>
                <th className="p-6 border-l border-white/5">المقر</th>
                <th className="p-6 text-center border-l border-white/5 bg-slate-800">سعة الطلاب</th>
                <th className="p-6 text-center border-l border-white/5 bg-blue-900/50">عدد الملاحظين</th>
                {stages.map(s => (
                  <th key={s.id} className="p-6 text-center border-l border-white/5 bg-slate-800">
                    {s.name}
                  </th>
                ))}
                <th className="p-6 text-center bg-slate-900">إجمالي اللجنة</th>
                <th className="p-6"></th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {committees.map((comm) => {
                const currentCounts = comm.counts || {};
                const rowTotal = stages.reduce((acc, stage) => {
                  const val = parseInt(String(currentCounts[stage.id] || 0));
                  return acc + (isNaN(val) ? 0 : val);
                }, 0);
                
                const isOverCap = rowTotal > (comm.capacity || 20);

                return (
                  <tr key={comm.id} className="bg-white hover:bg-slate-50 transition-colors">
                    <td className="p-6 text-center border-l border-slate-50 font-[1000] text-3xl text-slate-800">
                       {comm.name}
                    </td>
                    
                    <td className="p-6 border-l border-slate-50">
                        <input 
                          type="text" 
                          value={comm.location} 
                          onBlur={(e) => updateCommitteeInfo(comm.id, { location: e.target.value })}
                          onChange={(e) => onChange(committees.map(c => c.id === comm.id ? {...c, location: e.target.value} : c))} 
                          className="bg-transparent border-none font-black text-slate-700 outline-none text-lg w-full" 
                        />
                    </td>

                    <td className="p-6 border-l border-slate-50 bg-slate-50/30">
                      <div className="flex items-center justify-center gap-2 bg-white px-3 py-2 rounded-xl border border-slate-100 shadow-sm">
                        <input 
                          type="number" 
                          value={comm.capacity} 
                          onBlur={(e) => updateCommitteeInfo(comm.id, { capacity: Number(e.target.value) })}
                          onChange={(e) => onChange(committees.map(c => c.id === comm.id ? {...c, capacity: Number(e.target.value)} : c))} 
                          className="w-12 bg-transparent border-none text-center font-black text-blue-600 outline-none text-xl" 
                        />
                      </div>
                    </td>

                    <td className="p-6 border-l border-slate-50 bg-blue-50/20">
                      <div className="flex items-center justify-center gap-2 bg-white px-3 py-2 rounded-xl border border-blue-100 shadow-sm">
                         <UserCheck size={16} className="text-blue-500" />
                        <input 
                          type="number" 
                          min="1"
                          max="4"
                          value={comm.invigilatorCount || 1} 
                          onBlur={(e) => updateCommitteeInfo(comm.id, { invigilatorCount: Number(e.target.value) })}
                          onChange={(e) => onChange(committees.map(c => c.id === comm.id ? {...c, invigilatorCount: Number(e.target.value)} : c))} 
                          className="w-10 bg-transparent border-none text-center font-black text-slate-900 outline-none text-lg" 
                        />
                      </div>
                    </td>

                    {stages.map(s => (
                      <td key={s.id} className="p-6 text-center border-l border-slate-50">
                        <div className="flex flex-col gap-1 items-center">
                            <input 
                              type="text" 
                              inputMode="numeric"
                              placeholder="0"
                              value={comm.counts?.[s.id] || ''}
                              onChange={(e) => handleCellUpdate(comm.id, s.id, e.target.value)}
                              className="w-20 h-16 text-center text-4xl font-[1000] text-slate-900 bg-slate-50 border-2 border-transparent focus:border-blue-500 focus:bg-white rounded-2xl transition-all outline-none shadow-inner"
                            />
                        </div>
                      </td>
                    ))}

                    <td className="p-6 text-center bg-slate-900/5">
                        <div className={`w-24 h-24 mx-auto rounded-[2.5rem] flex items-center justify-center font-[1000] text-5xl shadow-2xl transition-all duration-500 ${isOverCap ? 'bg-rose-500 text-white' : 'bg-slate-900 text-white'}`}>
                            {rowTotal}
                        </div>
                    </td>
                    
                    <td className="p-6">
                      <button onClick={() => { if(confirm('حذف اللجنة؟')) refreshData(); }} className="text-slate-200 hover:text-rose-500 transition-colors p-3 rounded-full hover:bg-rose-50"><Trash2 size={24}/></button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default DistributionPanel;
