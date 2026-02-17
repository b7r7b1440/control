
import React, { useState, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { 
  Printer, 
  Calendar, 
  ClipboardList, 
  Bell, 
  AlertTriangle, 
  Search,
  CheckCircle,
  Clock,
  User,
  Download
} from 'lucide-react';
import { AttendanceStatus, EnvelopeStatus } from '../types';

type ReportTab = 'LOGISTICS' | 'ABSENCE' | 'NOTIFICATIONS';

const Reports: React.FC = () => {
  const { envelopes, notifications } = useApp();
  const [activeTab, setActiveTab] = useState<ReportTab>('LOGISTICS');
  
  const getLocalDate = () => {
      const now = new Date();
      return now.toISOString().split('T')[0];
  };
  
  const [selectedDate, setSelectedDate] = useState(getLocalDate());
  const [searchTerm, setSearchTerm] = useState('');

  // 1. معالجة بيانات حركة المظاريف (Logistics)
  const logisticsData = useMemo(() => {
    return envelopes
      .filter(e => e.date === selectedDate)
      .filter(e => 
        e.committeeNumber.includes(searchTerm) || 
        e.subject.includes(searchTerm) ||
        (e.location && e.location.includes(searchTerm))
      )
      .sort((a, b) => a.committeeNumber.localeCompare(b.committeeNumber, undefined, {numeric: true}));
  }, [envelopes, selectedDate, searchTerm]);

  // 2. معالجة بيانات الغياب (Absence)
  const absenceData = useMemo(() => {
    return envelopes
      .filter(e => e.date === selectedDate)
      .flatMap(env => {
        return env.students
          .filter(student => student.status === AttendanceStatus.ABSENT)
          .map(student => ({
            studentName: student.name,
            grade: student.grade,
            examSubject: env.subject,
            committee: env.committeeNumber,
            location: env.location
          }));
      });
  }, [envelopes, selectedDate]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 pb-20">
      
      {/* Header & Date Filter (No Print) */}
      <div className="bg-white p-6 rounded-[2.5rem] shadow-sm border border-slate-100 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
        <div>
          <h2 className="text-2xl font-black text-slate-800">مركز التقارير والتوثيق</h2>
          <p className="text-slate-500 text-sm mt-1 font-medium">إصدار الكشوفات الرسمية وسجلات المتابعة الحية</p>
        </div>
        <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
            <Calendar className="text-slate-400 mr-2" size={20} />
            <input 
                type="date" 
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="bg-transparent border-none outline-none text-slate-800 font-black text-sm"
            />
        </div>
      </div>

      {/* Tabs Navigation (No Print) */}
      <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar print:hidden">
          <button 
            onClick={() => setActiveTab('LOGISTICS')} 
            className={`px-6 py-4 rounded-3xl font-black text-xs flex items-center gap-3 transition-all whitespace-nowrap shadow-sm border ${
              activeTab === 'LOGISTICS' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100'
            }`}
          >
              <ClipboardList size={18} /> سجل حركة المظاريف
          </button>
          <button 
            onClick={() => setActiveTab('ABSENCE')} 
            className={`px-6 py-4 rounded-3xl font-black text-xs flex items-center gap-3 transition-all whitespace-nowrap shadow-sm border ${
              activeTab === 'ABSENCE' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100'
            }`}
          >
              <AlertTriangle size={18} /> كشف الغياب المجمع 
              <span className={`px-2 py-0.5 rounded-full text-[10px] ${activeTab === 'ABSENCE' ? 'bg-rose-500 text-white' : 'bg-rose-50 text-rose-500'}`}>
                {absenceData.length}
              </span>
          </button>
          <button 
            onClick={() => setActiveTab('NOTIFICATIONS')} 
            className={`px-6 py-4 rounded-3xl font-black text-xs flex items-center gap-3 transition-all whitespace-nowrap shadow-sm border ${
              activeTab === 'NOTIFICATIONS' ? 'bg-slate-900 text-white border-slate-900' : 'bg-white text-slate-400 border-slate-100'
            }`}
          >
              <Bell size={18} /> سجل العمليات
          </button>
      </div>

      {/* Main Table Content */}
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-100 overflow-hidden min-h-[500px] print:shadow-none print:border-none print:rounded-none">
          
          {/* 1. Tab: Logistics (سجل الاستلام) */}
          {activeTab === 'LOGISTICS' && (
              <div className="p-0">
                  <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-4 print:hidden">
                      <div className="relative w-full md:w-64">
                        <input 
                          type="text" 
                          placeholder="بحث سريع..." 
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                          className="w-full pl-10 pr-4 py-2 bg-white border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 outline-none font-bold"
                        />
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-300" size={16} />
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <button onClick={() => window.print()} className="flex-1 md:flex-none bg-indigo-600 text-white px-5 py-2.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2 shadow-lg shadow-indigo-100"><Printer size={16} /> طباعة السجل</button>
                        <button className="flex-1 md:flex-none bg-white text-slate-600 border border-slate-100 px-5 py-2.5 rounded-2xl font-black text-xs flex items-center justify-center gap-2"><Download size={16} /> تصدير PDF</button>
                      </div>
                  </div>

                  {/* Print Header */}
                  <div className="hidden print:block text-center mb-10 border-b-4 border-slate-900 pb-6">
                    <h1 className="text-3xl font-black mb-2">المملكة العربية السعودية</h1>
                    <h2 className="text-xl font-bold">وزارة التعليم - نظام إدارة الاختبارات SEMS</h2>
                    <h3 className="text-2xl mt-6 bg-slate-900 text-white inline-block px-10 py-3 rounded-2xl font-black">سجل تسليم واستلام مظاريف الاختبارات</h3>
                    <div className="flex justify-between mt-8 px-10 font-black text-lg">
                        <p>التاريخ: {selectedDate}</p>
                        <p>الفترة: صباحي</p>
                    </div>
                  </div>

                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-right border-collapse">
                        <thead className="bg-slate-50 font-black border-b border-slate-100 print:bg-slate-100 print:border-slate-900">
                            <tr>
                                <th className="p-5 border border-slate-100 print:border-slate-400">اللجنة</th>
                                <th className="p-5 border border-slate-100 print:border-slate-400">المقر / القاعة</th>
                                <th className="p-5 border border-slate-100 print:border-slate-400">المادة</th>
                                <th className="p-5 border border-slate-100 print:border-slate-400">الحالة</th>
                                <th className="p-5 border border-slate-100 print:border-slate-400">وقت الاستلام</th>
                                <th className="p-5 border border-slate-100 print:border-slate-400 w-32">توقيع المراقب</th>
                                <th className="p-5 border border-slate-100 print:border-slate-400 w-32">توقيع الكنترول</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50 print:divide-slate-900">
                            {logisticsData.map((env) => (
                                <tr key={env.id} className="hover:bg-slate-50/50 transition-colors print:h-16">
                                    <td className="p-5 font-black text-slate-800 border border-slate-100 print:border-slate-400 text-center text-lg">{env.committeeNumber}</td>
                                    <td className="p-5 border border-slate-100 print:border-slate-400 font-bold text-slate-600">{env.location}</td>
                                    <td className="p-5 border border-slate-100 print:border-slate-400 font-bold text-slate-800">{env.subject}</td>
                                    <td className="p-5 border border-slate-100 print:border-slate-400">
                                      <span className={`text-[10px] font-black px-2 py-1 rounded-lg uppercase tracking-widest ${
                                        env.status === EnvelopeStatus.DELIVERED ? 'bg-emerald-50 text-emerald-600' : 'bg-slate-100 text-slate-400'
                                      }`}>
                                        {env.status === EnvelopeStatus.DELIVERED ? 'مكتمل' : 'قيد المعالجة'}
                                      </span>
                                    </td>
                                    <td className="p-5 border border-slate-100 print:border-slate-400 font-mono text-xs text-slate-500">
                                      {env.deliveryTime ? new Date(env.deliveryTime).toLocaleTimeString('ar-SA') : '---'}
                                    </td>
                                    <td className="p-5 border border-slate-100 print:border-slate-400"></td>
                                    <td className="p-5 border border-slate-100 print:border-slate-400"></td>
                                </tr>
                            ))}
                            {logisticsData.length === 0 && (
                              <tr>
                                <td colSpan={7} className="p-20 text-center text-slate-400 font-bold">لا يوجد بيانات لهذا التاريخ</td>
                              </tr>
                            )}
                        </tbody>
                    </table>
                  </div>
              </div>
          )}

          {/* 2. Tab: Absence (كشف الغياب) */}
          {activeTab === 'ABSENCE' && (
              <div className="p-0">
                  <div className="p-6 border-b border-slate-50 bg-slate-50/50 flex justify-between items-center print:hidden">
                      <h3 className="font-black text-lg text-slate-800 flex items-center gap-2">
                        كشف الغياب المجمع
                        <span className="text-xs bg-rose-100 text-rose-600 px-3 py-1 rounded-full">{absenceData.length} طلاب</span>
                      </h3>
                      <button onClick={() => window.print()} className="bg-rose-600 text-white px-5 py-2.5 rounded-2xl font-black text-xs flex gap-2 shadow-lg shadow-rose-100"><Printer size={16} /> طباعة كشف الغياب</button>
                  </div>

                  {/* Print Header for Absence */}
                  <div className="hidden print:block text-center mb-10 border-b-4 border-rose-600 pb-6">
                    <h1 className="text-3xl font-black mb-2">المملكة العربية السعودية</h1>
                    <h2 className="text-xl font-bold">وزارة التعليم - كشف الغياب اليومي</h2>
                    <h3 className="text-2xl mt-6 bg-rose-600 text-white inline-block px-10 py-3 rounded-2xl font-black">بيان الطلاب الغائبين عن الاختبارات</h3>
                    <div className="flex justify-between mt-8 px-10 font-black text-lg">
                        <p>التاريخ: {selectedDate}</p>
                        <p>عدد الغائبين: {absenceData.length}</p>
                    </div>
                  </div>

                  <table className="w-full text-sm text-right print:text-black">
                      <thead className="bg-slate-50 font-black border-b border-slate-100 print:bg-slate-100 print:border-slate-900">
                          <tr>
                              <th className="p-5 border border-slate-100 print:border-slate-400 w-16 text-center">م</th>
                              <th className="p-5 border border-slate-100 print:border-slate-400">اسم الطالب</th>
                              <th className="p-5 border border-slate-100 print:border-slate-400">الصف الدراسي</th>
                              <th className="p-5 border border-slate-100 print:border-slate-400">اللجنة / القاعة</th>
                              <th className="p-5 border border-slate-100 print:border-slate-400">المادة</th>
                              <th className="p-5 border border-slate-100 print:border-slate-400 w-40">ملاحظات / العذر</th>
                          </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100 print:divide-slate-900">
                          {absenceData.map((row, idx) => (
                              <tr key={idx} className="hover:bg-rose-50/30 transition-colors">
                                  <td className="p-5 border border-slate-100 print:border-slate-400 text-center font-bold">{idx + 1}</td>
                                  <td className="p-5 border border-slate-100 print:border-slate-400 font-black text-slate-800">{row.studentName}</td>
                                  <td className="p-5 border border-slate-100 print:border-slate-400 font-bold text-slate-500">{row.grade}</td>
                                  <td className="p-5 border border-slate-100 print:border-slate-400 text-center font-bold text-slate-600">
                                    {row.committee} <span className="text-[10px] text-slate-400 block">{row.location}</span>
                                  </td>
                                  <td className="p-5 border border-slate-100 print:border-slate-400 font-bold text-slate-800">{row.examSubject}</td>
                                  <td className="p-5 border border-slate-100 print:border-slate-400"></td>
                              </tr>
                          ))}
                          {absenceData.length === 0 && (
                            <tr>
                              <td colSpan={6} className="p-20 text-center text-slate-400 font-black">
                                <CheckCircle className="mx-auto mb-4 text-emerald-400" size={48} />
                                لا يوجد غيابات مرصودة لهذا التاريخ
                              </td>
                            </tr>
                          )}
                      </tbody>
                  </table>
              </div>
          )}
          
          {/* 3. Tab: Notifications (سجل العمليات) */}
          {activeTab === 'NOTIFICATIONS' && (
              <div className="p-8 space-y-4">
                  <h3 className="font-black text-slate-800 mb-6 flex items-center gap-2">
                    <Clock size={20} className="text-indigo-500" />
                    سجل الأحداث والعمليات الأخير
                  </h3>
                  <div className="space-y-3">
                    {notifications.length > 0 ? notifications.map((n, i) => (
                        <div key={i} className={`p-4 rounded-2xl border flex items-center justify-between animate-in slide-in-from-right duration-300 shadow-sm`} style={{animationDelay: `${i * 50}ms`}}>
                            <div className="flex items-center gap-4">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                                n.type === 'SUCCESS' ? 'bg-emerald-50 text-emerald-600' :
                                n.type === 'ALERT' ? 'bg-rose-50 text-rose-600' : 'bg-slate-50 text-slate-400'
                              }`}>
                                {n.type === 'SUCCESS' ? <CheckCircle size={18} /> : 
                                 n.type === 'ALERT' ? <AlertTriangle size={18} /> : <User size={18} />}
                              </div>
                              <span className="font-bold text-slate-700 text-sm">{n.message}</span>
                            </div>
                            <span className="text-slate-400 text-[10px] font-mono bg-slate-50 px-2 py-1 rounded-lg">
                              {new Date(n.timestamp).toLocaleTimeString('ar-SA')}
                            </span>
                        </div>
                    )) : (
                      <div className="text-center py-20 text-slate-400 font-bold">لا يوجد أحداث مسجلة حالياً</div>
                    )}
                  </div>
              </div>
          )}
      </div>
      
      {/* Print Signatures Footer */}
      <div className="hidden print:flex justify-between items-end mt-24 px-12 text-center font-black text-slate-900">
          <div className="space-y-16">
            <p>مسؤول الكنترول</p>
            <div className="border-b-2 border-slate-900 w-48 mx-auto"></div>
            <p className="font-bold text-sm">................................</p>
          </div>
          <div className="space-y-16">
            <p>وكيل الشؤون التعليمية</p>
            <div className="border-b-2 border-slate-900 w-48 mx-auto"></div>
            <p className="font-bold text-sm">................................</p>
          </div>
          <div className="space-y-16">
            <p>مدير المدرسة / القائد التربوي</p>
            <div className="border-b-2 border-slate-900 w-48 mx-auto"></div>
            <p className="font-bold text-sm">................................</p>
          </div>
      </div>
    </div>
  );
};

export default Reports;
