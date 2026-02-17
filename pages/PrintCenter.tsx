
import React, { useState } from 'react';
import { AppData, PrintSettings } from '../types';
import { 
  printCommitteeReceipt, 
  printCommitteeHandover,
  printAbsenceSorting,
  printCommitteeStickers
} from '../services/printService';
import { 
  Printer, Settings, ClipboardList, FileCheck, ShieldAlert, Calendar, QrCode
} from 'lucide-react';

interface PrintCenterProps {
  data: AppData;
  onUpdateSchool: (field: string, value: string) => void;
}

const PrintCenter: React.FC<PrintCenterProps> = ({ data, onUpdateSchool }) => {
  const [selectedDate, setSelectedDate] = useState(new Date().toLocaleDateString('en-CA'));
  
  const [settings, setSettings] = useState<PrintSettings>({
    adminName: 'الإدارة العامة للتعليم بمحافظة جدة',
    schoolName: data.school.name || 'ثانوية الأمير عبدالمجيد',
    managerName: data.school.managerName || '', 
    agentName: data.school.agentName || '',
    logoUrl: 'https://up6.cc/2026/02/177116640037762.png',
    doorLabelTitle: 'بطاقة لجنة',
    attendanceTitle: 'كشف مناداة',
    stickerTitle: 'ملصق طاولة',
    showBorder: true,
    colSequence: 'م',
    colSeatId: 'رقم الجلوس',
    colName: 'اسم الطالب',
    colStage: 'المرحلة',
    colPresence: 'توقيع',
    colSignature: 'ملاحظات',
    showColSequence: true,
    showColSeatId: true,
    showColName: true,
    showColStage: true,
    showColPresence: true,
    showColSignature: true,
  });

  const [selectedCommittee, setSelectedCommittee] = useState<string>('');

  const handleSettingChange = (field: keyof PrintSettings, value: string) => {
    setSettings(prev => ({ ...prev, [field]: value }));
    if (field === 'schoolName' || field === 'managerName' || field === 'agentName') {
        onUpdateSchool(field === 'schoolName' ? 'name' : field, value);
    }
  };

  const sortedCommittees = [...data.committees].sort((a, b) => 
    parseInt(a.name) - parseInt(b.name)
  );

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-20">
      
      <div className="bg-gradient-to-r from-[#0e3f51] to-[#258f9d] rounded-[2.5rem] p-8 text-white shadow-xl flex flex-col md:flex-row justify-between items-center gap-6">
        <div>
            <h2 className="text-3xl font-black mb-2 flex items-center gap-3">
                <Printer className="w-8 h-8 text-yellow-400" />
                مركز الطباعة والتقارير
            </h2>
            <p className="opacity-90 text-lg">إصدار الكشوفات الرسمية والمحاضر والملصقات الثابتة</p>
        </div>
        <div className="bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20 flex flex-col gap-2 min-w-[250px]">
            <label className="text-xs font-bold text-white/80 flex items-center gap-2"><Calendar size={14} /> تاريخ التقارير</label>
            <input type="date" value={selectedDate} onChange={(e) => setSelectedDate(e.target.value)} className="bg-white text-[#0e3f51] font-bold rounded-lg px-3 py-2 outline-none text-center shadow-lg" />
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
                  <h3 className="font-black text-gray-800 mb-6 flex items-center gap-2 text-sm uppercase tracking-widest"><Settings className="w-5 h-5 text-gray-500" /> إعدادات الهوية</h3>
                  <div className="space-y-4">
                      <div><label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">اسم المدرسة</label><input type="text" value={settings.schoolName} onChange={(e) => handleSettingChange('schoolName', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold outline-none" /></div>
                      <div><label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">مدير المدرسة</label><input type="text" value={settings.managerName} onChange={(e) => handleSettingChange('managerName', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold outline-none" /></div>
                      <div><label className="block text-[10px] font-black text-gray-400 mb-1 uppercase">وكيل المدرسة</label><input type="text" value={settings.agentName} onChange={(e) => handleSettingChange('agentName', e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-xl p-3 text-sm font-bold outline-none" /></div>
                  </div>
              </div>
          </div>

          <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
                  <h3 className="font-black text-lg text-[#0e3f51] mb-6 border-b border-slate-50 pb-4">النماذج الثابتة (تطبع مرة واحدة)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ReportCard 
                          title="ملصقات الأبواب الثابتة"
                          desc="تحتوي على رقم اللجنة والقاعة والباركود الموحد الدائم"
                          icon={QrCode}
                          onClick={() => printCommitteeStickers(sortedCommittees, settings)}
                          color="bg-slate-900 text-white"
                      />
                  </div>
              </div>

              <div className="bg-white rounded-[2.5rem] shadow-sm border border-gray-100 p-8">
                  <h3 className="font-black text-lg text-[#0e3f51] mb-6 border-b border-slate-50 pb-4">نماذج الكنترول (اليومية)</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <ReportCard title="كشف استلام المظاريف" desc="جدول إجمالي لجميع اللجان النشطة اليوم" icon={ClipboardList} onClick={() => printCommitteeReceipt(data, settings, selectedDate)} color="bg-blue-50 text-blue-700" />
                      <ReportCard title="كشف الغياب المجمع" desc="كشف آلي بالطلاب الغائبين بتاريخ اليوم فقط" icon={ShieldAlert} onClick={() => printAbsenceSorting(data, settings, selectedDate)} color="bg-red-50 text-red-700" />
                  </div>
              </div>
          </div>
      </div>
    </div>
  );
};

const ReportCard = ({ title, desc, icon: Icon, onClick, color }: any) => (
    <button onClick={onClick} className="flex items-start gap-5 p-6 rounded-3xl border border-slate-100 hover:border-indigo-600 hover:shadow-xl transition-all text-right group w-full bg-white active:scale-95">
        <div className={`p-4 rounded-2xl ${color} group-hover:scale-110 transition-transform shadow-inner`}><Icon size={28} /></div>
        <div className="flex-1">
            <h4 className="font-black text-slate-800 mb-1 group-hover:text-indigo-600 transition-colors text-base">{title}</h4>
            <p className="text-xs text-slate-400 leading-relaxed font-medium">{desc}</p>
        </div>
    </button>
);

export default PrintCenter;
