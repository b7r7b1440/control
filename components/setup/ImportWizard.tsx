
import React, { useState, useEffect } from 'react';
import * as XLSX from 'https://esm.sh/xlsx@0.18.5';
import { Upload, FileSpreadsheet, Check, AlertCircle, Save, Layers, Search, Split, Sparkles } from 'lucide-react';
import { readExcelFile, getSheetData, parseStudents } from '../../services/excelService';
import { Student } from '../../types';

interface ImportWizardProps {
  onSave: (name: string, prefix: string, students: Student[]) => void;
  onCancel: () => void;
}

const ImportWizard: React.FC<ImportWizardProps> = ({ onSave, onCancel }) => {
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null);
  const [sheets, setSheets] = useState<string[]>([]);
  const [selectedSheet, setSelectedSheet] = useState('');
  const [sheetData, setSheetData] = useState<any[][]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [headerRowIndex, setHeaderRowIndex] = useState(0);
  const [stageName, setStageName] = useState('');
  const [prefix, setPrefix] = useState('10');
  const [splitByGrade, setSplitByGrade] = useState(true);
  const [mapping, setMapping] = useState({ nameIdx: -1, idIdx: -1, gradeIdx: -1, classIdx: -1, phoneIdx: -1 });
  const [previewData, setPreviewData] = useState<Student[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isNoorFormat, setIsNoorFormat] = useState(false);

  const detectHeaderRow = (data: any[][]): number => {
    const keywords = ['اسم الطالب', 'رقم الصف', 'رقم الفصل', 'رقم الجوال', 'جوال', 'السجل', 'الهوية', 'ولي الأمر'];
    let bestRow = 0;
    let maxScore = 0;
    const limit = Math.min(data.length, 20);
    for (let i = 0; i < limit; i++) {
        const row = data[i];
        let score = 0;
        if (Array.isArray(row)) {
            row.forEach(cell => {
                const val = String(cell).toLowerCase();
                if (keywords.some(k => val.includes(k))) score += 2;
            });
        }
        if (score > maxScore) { maxScore = score; bestRow = i; }
    }
    return bestRow;
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      try {
        setError(null);
        const wb = await readExcelFile(e.target.files[0]);
        setWorkbook(wb);
        setSheets(wb.SheetNames);
        if (wb.SheetNames.length > 0) handleSheetSelect(wb.SheetNames[0], wb);
      } catch (err) {
        setError('فشل قراءة الملف. تأكد من أنه ملف Excel صالح.');
      }
    }
  };

  const handleSheetSelect = (sheetName: string, wb: XLSX.WorkBook = workbook!) => {
    setSelectedSheet(sheetName);
    setStageName(sheetName);
    const data = getSheetData(wb, sheetName);
    setSheetData(data);
    if (data.length > 0) {
      const bestHeaderRow = detectHeaderRow(data);
      setHeaderRowIndex(bestHeaderRow);
      processHeadersAndMap(data, bestHeaderRow);
    }
  };

  const processHeadersAndMap = (data: any[][], rowIndex: number) => {
      if (!data[rowIndex]) return;
      const heads = data[rowIndex].map((h: any) => String(h || `Column`));
      setHeaders(heads);
      
      const newMapping = { nameIdx: -1, idIdx: -1, gradeIdx: -1, classIdx: -1, phoneIdx: -1 };
      let noorScore = 0;

      heads.forEach((h, i) => {
        const text = h.trim();
        // الكلمات المفتاحية الذكية لرقم الطالب (الأولوية القصوى)
        if ((text === 'رقم الطالب' || text.includes('السجل') || text.includes('الهوية')) && newMapping.idIdx === -1) {
            newMapping.idIdx = i;
            noorScore += 2;
        }
        else if (text === 'اسم الطالب' || text === 'الاسم') { newMapping.nameIdx = i; noorScore++; }
        else if (text.includes('جوال') || text.includes('هاتف') || text.includes('تواصل')) { newMapping.phoneIdx = i; noorScore += 2; }
        else if (text.includes('صف')) { newMapping.gradeIdx = i; noorScore++; }
        else if (text.includes('فصل')) { newMapping.classIdx = i; noorScore++; }
      });

      // القاعدة الذهبية: العمود الأول هو الهوية افتراضياً
      if (newMapping.idIdx === -1 && heads.length > 0) newMapping.idIdx = 0;
      
      setMapping(newMapping);
      setIsNoorFormat(noorScore >= 2);
  };

  useEffect(() => {
    if (sheetData.length > 0 && mapping.nameIdx !== -1) {
      setPreviewData(parseStudents(sheetData, mapping, headerRowIndex));
    }
  }, [sheetData, mapping, headerRowIndex]);

  const handleSave = () => {
    if (previewData.length === 0) return;
    
    if (splitByGrade && mapping.gradeIdx !== -1) {
      const groups: Record<string, Student[]> = {};
      previewData.forEach(s => {
        const key = s.grade || 'غير محدد';
        if (!groups[key]) groups[key] = [];
        groups[key].push(s);
      });
      
      let currentPrefix = parseInt(prefix) || 10;
      Object.keys(groups).sort().forEach((gradeName) => {
         onSave(gradeName, String(currentPrefix), groups[gradeName]);
         currentPrefix += 10;
      });
    } else {
      onSave(stageName, prefix, previewData);
    }
    onCancel();
  };

  if (!workbook) {
    return (
      <div className="border-2 border-dashed border-slate-300 rounded-[3rem] p-12 text-center bg-white hover:border-blue-400 transition-all cursor-pointer relative group">
        <input type="file" accept=".xlsx, .xls" onChange={handleFileChange} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10" />
        <div className="w-20 h-20 bg-blue-50 text-blue-400 rounded-[2rem] flex items-center justify-center mx-auto mb-6 group-hover:bg-blue-600 group-hover:text-white transition-all">
            <Upload size={40} />
        </div>
        <h3 className="text-2xl font-black text-slate-800">ارفع ملف طلاب (نظام نور)</h3>
        <p className="text-slate-400 font-bold mt-2">سيتم التقاط رقم الطالب من العمود الأول والجوال آلياً</p>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-[3rem] p-10 border border-slate-100 shadow-xl space-y-8 animate-fade-in relative overflow-hidden">
      {isNoorFormat && (
          <div className="absolute top-6 left-6 bg-emerald-50 text-emerald-600 px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2 border border-emerald-100 animate-pulse">
              <Sparkles size={14} /> متوافق مع نظام نور
          </div>
      )}

      <div className="flex justify-between items-center border-b border-slate-50 pb-6">
        <h3 className="text-2xl font-black text-slate-800 flex items-center gap-3">
            <FileSpreadsheet className="text-blue-500" size={28} /> تهيئة بيانات الاستيراد
        </h3>
        <button onClick={() => setWorkbook(null)} className="text-rose-500 font-bold hover:bg-rose-50 px-6 py-2 rounded-2xl transition-all">تغيير الملف</button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase mr-2">ورقة العمل</label>
          <select value={selectedSheet} onChange={(e) => handleSheetSelect(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold outline-none">
            {sheets.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase mr-2">تسمية المرحلة</label>
          <input type="text" value={stageName} onChange={(e) => setStageName(e.target.value)} disabled={splitByGrade} placeholder="مثال: المسار العام" className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold outline-none disabled:opacity-50" />
        </div>
        <div className="space-y-2">
          <label className="text-xs font-black text-slate-400 uppercase mr-2">بداية أرقام الجلوس</label>
          <input type="text" value={prefix} onChange={(e) => setPrefix(e.target.value)} className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 font-bold outline-none" />
        </div>
      </div>

      <div className="bg-slate-50/50 p-8 rounded-[2.5rem] border border-slate-100">
        <div className="flex justify-between items-center mb-6">
            <h4 className="text-sm font-black text-slate-500 flex items-center gap-2"><Layers size={18} /> التحقق من مطابقة الحقول</h4>
            <span className="text-[10px] font-bold text-blue-500">العمود 1 مخصص لرقم السجل المدني</span>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4">
          {[
              { label: 'رقم الطالب (العمود 1)', key: 'idIdx' }, 
              { label: 'اسم الطالب', key: 'nameIdx' }, 
              { label: 'رقم الجوال', key: 'phoneIdx' }, 
              { label: 'الصف', key: 'gradeIdx' }, 
              { label: 'الفصل', key: 'classIdx' }
          ].map(f => (
            <div key={f.key} className="space-y-2">
              <label className="block text-[10px] font-black text-slate-400 mr-2">{f.label}</label>
              <select 
                value={mapping[f.key as keyof typeof mapping]} 
                onChange={(e) => setMapping({ ...mapping, [f.key]: Number(e.target.value) })} 
                className={`w-full bg-white border rounded-xl p-3 text-xs font-black outline-none transition-all ${mapping[f.key as keyof typeof mapping] !== -1 ? 'border-emerald-200 text-emerald-700' : 'border-slate-200'}`}
              >
                <option value="-1">-- غير محدد --</option>
                {headers.map((h, i) => <option key={i} value={i}>{h}</option>)}
              </select>
            </div>
          ))}
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between items-center gap-6 p-6 bg-blue-50/30 rounded-[2rem] border border-blue-100">
         <label className="flex items-center gap-4 cursor-pointer group">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center border-2 transition-all ${splitByGrade ? 'bg-blue-600 border-blue-600 text-white' : 'bg-white border-slate-200'}`}>
                {splitByGrade && <Check size={16} />}
                <input type="checkbox" checked={splitByGrade} onChange={(e) => setSplitByGrade(e.target.checked)} className="hidden" />
            </div>
            <div>
                <span className="font-black text-slate-800 block">فصل الطلاب حسب عمود الصف الدراسي</span>
            </div>
         </label>
         <div className="flex gap-4 w-full md:w-auto">
            <button onClick={onCancel} className="flex-1 md:flex-none px-10 py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-50 transition-all">تراجع</button>
            <button onClick={handleSave} className="flex-1 md:flex-none px-12 py-4 bg-slate-900 text-white rounded-2xl font-black shadow-2xl hover:bg-blue-600 transition-all flex items-center justify-center gap-3 active:scale-95">
                <Save size={20} /> حفظ الطلاب المستوردين
            </button>
         </div>
      </div>
    </div>
  );
};

export default ImportWizard;
