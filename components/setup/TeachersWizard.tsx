
import React, { useState, useRef } from 'react';
import { User } from '../../types';
import { 
  Users, UserPlus, Upload, Trash2, ShieldCheck, 
  Phone, CreditCard, Printer, X, QrCode, 
  AlertCircle, FileSpreadsheet, Loader2, Save, Check
} from 'lucide-react';
import { QRCodeCanvas } from 'qrcode.react';
import { readExcelFile, getSheetData } from '../../services/excelService';

interface TeachersWizardProps {
  teachers: User[];
  onUpdate: (teachers: User[]) => void;
}

const TeachersWizard: React.FC<TeachersWizardProps> = ({ teachers, onUpdate }) => {
  const [isImporting, setIsImporting] = useState(false);
  const [previewData, setPreviewData] = useState<User[]>([]);
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // الكلمات المفتاحية الاحترافية المتوافقة مع ملفات (نور) والملفات المدرسية الشائعة
  const KEYWORDS = {
    name: ['اسم المعلم', 'اسم الموظف', 'الاسم', 'name', 'teacher'],
    civilId: ['رقم المعلم', 'سجل', 'مدني', 'هوية', 'id', 'national id', 'civil id', 'رقم الهوية'],
    phone: ['الجوال', 'جوال', 'هاتف', 'موبايل', 'phone', 'mobile']
  };

  // وظيفة لتحويل الأرقام العربية (١٢٣) إلى أرقام دولية (123) لضمان دقة البيانات
  const normalizeDigits = (str: string): string => {
    return str.replace(/[٠-٩]/g, (d) => '٠١٢٣٤٥٦٧٨٩'.indexOf(d).toString())
              .replace(/[0-9]/g, (d) => d); // تأكيد بقاء الأرقام الدولية كما هي
  };

  const findHeaderRow = (data: any[][]) => {
    for (let i = 0; i < Math.min(data.length, 15); i++) {
      const row = data[i].map(cell => String(cell || '').toLowerCase().trim());
      // فحص إذا كان الصف يحتوي على "اسم" و "رقم" أو "سجل"
      const hasName = KEYWORDS.name.some(k => row.some(cell => cell.includes(k)));
      const hasId = KEYWORDS.civilId.some(k => row.some(cell => cell.includes(k)));
      
      if (hasName && hasId) return i;
    }
    return -1;
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setIsImporting(true);
      setError(null);
      try {
        const wb = await readExcelFile(e.target.files[0]);
        const data = getSheetData(wb, wb.SheetNames[0]);
        
        const headerIdx = findHeaderRow(data);
        if (headerIdx === -1) {
          throw new Error('لم يتم التعرف على ترويسة الجدول. تأكد من وجود أعمدة باسم (اسم المعلم) و (رقم المعلم).');
        }

        const headers = data[headerIdx].map(h => String(h || '').toLowerCase().trim());
        
        // البحث عن أفضل الفهارس بناءً على الكلمات المفتاحية
        const mapping = {
          name: headers.findIndex(h => KEYWORDS.name.some(k => h.includes(k))),
          civilId: headers.findIndex(h => KEYWORDS.civilId.some(k => h.includes(k))),
          phone: headers.findIndex(h => KEYWORDS.phone.some(k => h.includes(k)))
        };

        const imported: User[] = data.slice(headerIdx + 1)
          .map((row: any, idx): User | null => {
            const rawName = String(row[mapping.name] || '').trim();
            const rawId = String(row[mapping.civilId] || '').trim();
            const rawPhone = mapping.phone !== -1 ? String(row[mapping.phone] || '').trim() : '';

            if (rawName.length > 2 && rawId.length > 4) {
              return {
                id: `t-${Date.now()}-${idx}`,
                name: rawName,
                civilId: normalizeDigits(rawId), // تحويل السجل للأرقام النظامية
                phone: normalizeDigits(rawPhone), // تحويل الجوال للأرقام النظامية
                role: 'TEACHER' as const
              };
            }
            return null;
          })
          .filter((t): t is User => t !== null);

        if (imported.length === 0) {
          throw new Error('الملف فارغ أو لا يحتوي على بيانات معلمين صالحة.');
        }

        setPreviewData(imported);
      } catch (err: any) {
        setError(err.message || 'حدث خطأ غير متوقع أثناء معالجة الملف.');
      } finally {
        setIsImporting(false);
      }
    }
  };

  const confirmImport = () => {
    onUpdate([...teachers, ...previewData]);
    setPreviewData([]);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const printIDCard = (teacher: User) => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const qrCanvas = document.getElementById(`qr-${teacher.id}`) as HTMLCanvasElement;
    const qrDataUrl = qrCanvas ? qrCanvas.toDataURL() : '';

    printWindow.document.write(`
      <html>
        <head>
          <title>بطاقة تعريف - ${teacher.name}</title>
          <style>
            @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
            body { font-family: 'Tajawal', sans-serif; display: flex; justify-content: center; align-items: center; height: 100vh; margin: 0; background: #f1f5f9; direction: rtl; }
            .card { width: 320px; height: 480px; background: white; border-radius: 25px; box-shadow: 0 20px 40px rgba(0,0,0,0.1); overflow: hidden; position: relative; border: 1px solid #e2e8f0; }
            .header { background: #0f172a; color: white; padding: 25px; text-align: center; }
            .header h1 { margin: 0; font-size: 16px; font-weight: 900; letter-spacing: 1px; }
            .badge { background: #3b82f6; display: inline-block; padding: 4px 12px; border-radius: 50px; font-size: 10px; margin-top: 8px; font-weight: 900; }
            .photo-box { width: 100px; height: 100px; background: #f8fafc; border-radius: 30px; margin: 30px auto 20px; display: flex; justify-content: center; align-items: center; color: #cbd5e1; border: 4px solid #f1f5f9; }
            .info { text-align: center; padding: 0 20px; }
            .info h3 { margin: 0; font-size: 18px; color: #1e293b; font-weight: 900; }
            .info p { margin: 4px 0; font-size: 12px; color: #64748b; font-weight: 700; }
            .qr-box { margin-top: 25px; padding: 15px; background: #f8fafc; border-radius: 20px; display: inline-block; }
            .qr-box img { width: 90px; height: 90px; }
            .footer-strip { position: absolute; bottom: 0; width: 100%; height: 6px; background: linear-gradient(to right, #3b82f6, #0f172a); }
          </style>
        </head>
        <body onload="window.print()">
          <div class="card">
            <div class="header">
              <h1>نظام الاختبارات الذكي</h1>
              <span class="badge">بطاقة ملاحظ</span>
            </div>
            <div class="photo-box">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path><circle cx="12" cy="7" r="4"></circle></svg>
            </div>
            <div class="info">
              <h3>${teacher.name}</h3>
              <p>رقم المعلم: ${teacher.civilId}</p>
              <p>الجوال: ${teacher.phone || '---'}</p>
              <div class="qr-box">
                <img src="${qrDataUrl}" />
              </div>
            </div>
            <div class="footer-strip"></div>
          </div>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  return (
    <div className="space-y-8 animate-fade-in pb-20">
      
      {/* معاينة قبل الحفظ النهائي */}
      {previewData.length > 0 && (
        <div className="bg-slate-900 rounded-[3rem] p-10 text-white shadow-2xl animate-zoom-in relative overflow-hidden">
          <div className="absolute top-0 left-0 w-full h-full bg-blue-600/10 pointer-events-none"></div>
          <div className="relative z-10 flex flex-col md:flex-row justify-between items-center gap-8">
            <div className="text-center md:text-right">
               <h3 className="text-3xl font-[1000] tracking-tight flex items-center gap-4 justify-center md:justify-start">
                  <Check className="text-emerald-400" size={32} />
                  جاهز للاستيراد: {previewData.length} معلم
               </h3>
               <p className="text-slate-400 font-bold mt-2">تم التعرف على البيانات وتحويل الأرقام للصيغة الدولية بنجاح.</p>
            </div>
            <div className="flex gap-4 w-full md:w-auto">
              <button onClick={() => setPreviewData([])} className="flex-1 md:flex-none px-8 py-4 bg-white/5 hover:bg-white/10 rounded-2xl font-black transition-all border border-white/10">إلغاء</button>
              <button onClick={confirmImport} className="flex-1 md:flex-none px-12 py-4 bg-blue-600 text-white rounded-2xl font-black shadow-xl shadow-blue-500/20 flex items-center justify-center gap-3 hover:bg-blue-500 transition-all">
                 <Save size={20} /> اعتماد القائمة
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="bg-white p-10 rounded-[3rem] border border-slate-100 shadow-xl space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-center gap-6 border-b border-slate-50 pb-8">
          <div className="flex items-center gap-6">
            <div className="p-5 bg-blue-50 text-blue-600 rounded-[2rem] shadow-inner">
               {isImporting ? <Loader2 className="animate-spin" size={32}/> : <Users size={32}/>}
            </div>
            <div>
              <h3 className="text-3xl font-[1000] text-slate-800 tracking-tight">إدارة هيئة الرقابة</h3>
              <p className="text-slate-400 text-sm font-bold mt-1">
                الإجمالي المسجل: <span className="text-blue-600">{teachers.length}</span> معلم/ة
              </p>
            </div>
          </div>
          
          <div className="flex gap-4 w-full md:w-auto">
            <label className="flex-1 md:flex-none bg-slate-50 text-slate-600 px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-slate-100 transition-all cursor-pointer border border-slate-100 shadow-sm group">
              <FileSpreadsheet size={22} className="group-hover:text-emerald-500 transition-colors" /> 
              استيراد ملف Excel
              <input ref={fileInputRef} type="file" className="hidden" onChange={handleFileUpload} accept=".xlsx, .xls" />
            </label>
            <button onClick={() => {
              const name = prompt('اسم المعلم:');
              const id = prompt('رقم المعلم/السجل:');
              if(name && id) onUpdate([...teachers, {id: `t-${Date.now()}`, name, civilId: id, role: 'TEACHER'}]);
            }} className="flex-1 md:flex-none bg-slate-900 text-white px-8 py-4 rounded-2xl font-black flex items-center justify-center gap-3 hover:bg-blue-600 transition-all shadow-xl">
              <UserPlus size={20} /> إضافة يدوي
            </button>
          </div>
        </div>

        {error && (
          <div className="p-6 bg-rose-50 border border-rose-100 rounded-3xl flex items-center gap-4 text-rose-600 animate-shake">
            <AlertCircle size={24} />
            <p className="font-bold text-sm">{error}</p>
            <button onClick={() => setError(null)} className="mr-auto p-2 hover:bg-rose-100 rounded-lg"><X size={18}/></button>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {teachers.map((t) => (
            <div key={t.id} className="p-8 bg-white rounded-[2.5rem] border border-slate-100 flex flex-col gap-6 group hover:border-blue-200 transition-all hover:shadow-2xl relative overflow-hidden">
              <div className="absolute top-0 right-0 p-8 bg-blue-500/5 rounded-full translate-x-1/2 -translate-y-1/2"></div>
              
              <div className="flex justify-between items-start relative z-10">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-300 group-hover:bg-blue-600 group-hover:text-white transition-all shadow-inner">
                  <CreditCard size={28} />
                </div>
                <div className="flex gap-2">
                   <button onClick={() => printIDCard(t)} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-blue-50 hover:text-blue-600 transition-all" title="طباعة البطاقة"><Printer size={18}/></button>
                   <button onClick={() => onUpdate(teachers.filter(x => x.id !== t.id))} className="p-3 bg-slate-50 text-slate-400 rounded-xl hover:bg-rose-50 hover:text-rose-600 transition-all" title="حذف"><Trash2 size={18}/></button>
                </div>
              </div>

              <div className="space-y-1">
                <h4 className="font-black text-slate-800 text-xl leading-tight">{t.name}</h4>
                <div className="flex items-center gap-2 text-blue-500 font-black text-[10px] uppercase tracking-widest mt-2">
                  <ShieldCheck size={14} /> رقم المعلم: {t.civilId}
                </div>
                {t.phone && (
                  <div className="flex items-center gap-2 text-slate-400 text-[11px] font-bold mt-2">
                    <Phone size={12} /> {t.phone}
                  </div>
                )}
              </div>

              <div className="pt-6 border-t border-slate-50 flex justify-center bg-slate-50/30 -mx-8 -mb-8 pb-8 rounded-b-[2.5rem]">
                  <div className="p-3 bg-white rounded-2xl shadow-sm border border-slate-100">
                    <QRCodeCanvas id={`qr-${t.id}`} value={t.civilId} size={80} level="H" />
                  </div>
              </div>
            </div>
          ))}
          
          {teachers.length === 0 && !isImporting && (
            <div className="col-span-full py-24 text-center border-4 border-dashed border-slate-50 rounded-[4rem] space-y-6">
              <div className="w-24 h-24 bg-slate-50 text-slate-200 rounded-full flex items-center justify-center mx-auto mb-4">
                <QrCode size={48} />
              </div>
              <div className="space-y-2">
                <h3 className="text-2xl font-black text-slate-300">لا يوجد بيانات حالياً</h3>
                <p className="text-slate-400 font-bold max-w-xs mx-auto">ارفع ملف الإكسل الذي أظهرته في الصورة وسيتعرف النظام على (اسم المعلم) و (رقم المعلم) فوراً.</p>
              </div>
            </div>
          )}

          {isImporting && (
             <div className="col-span-full py-24 text-center space-y-4">
                <Loader2 className="animate-spin mx-auto text-blue-600" size={48} />
                <p className="font-black text-slate-400 text-xl">جاري معالجة الأرقام العربية وتحليل الحقول...</p>
             </div>
          )}
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          25% { transform: translateX(-5px); }
          75% { transform: translateX(5px); }
        }
        .animate-shake { animation: shake 0.2s ease-in-out 0s 2; }
      `}</style>
    </div>
  );
};

export default TeachersWizard;
