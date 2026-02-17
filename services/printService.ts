
import { AppData, PrintSettings, AttendanceStatus } from '../types';

const COLORS = {
  headerBg: '#0e3f51',
  footerGradient: 'linear-gradient(90deg, #258f9d 0%, #0e3f51 100%)',
  tableHeader: '#eef2f3',
  border: '#000000'
};

const createPrintPage = (title: string, content: string, settings: PrintSettings) => {
  return `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <title>${title}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
        @page { size: A4; margin: 0; }
        body { margin: 0; font-family: 'Tajawal', sans-serif; -webkit-print-color-adjust: exact; background: white; }
        .header-container { background-color: ${COLORS.headerBg}; color: white; padding: 15px 40px; height: 140px; display: flex; justify-content: space-between; align-items: center; border-bottom: 4px solid #258f9d; }
        .school-info { text-align: right; }
        .school-info h1 { margin: 0; font-size: 16px; font-weight: 900; }
        .school-info h2 { margin: 0; font-size: 13px; font-weight: 400; opacity: 0.9; }
        .ministry-logo img { height: 90px; filter: brightness(0) invert(1); }
        .center-title h1 { font-size: 22px; font-weight: 900; border: 2px solid rgba(255,255,255,0.3); padding: 8px 25px; border-radius: 50px; background: rgba(0,0,0,0.1); }
        .content-wrapper { padding: 30px 40px; }
        table { width: 100%; border-collapse: collapse; margin-top: 10px; font-size: 12px; }
        th { background-color: ${COLORS.tableHeader}; font-weight: 900; padding: 10px; border: 1px solid #000; text-align: center; }
        td { padding: 8px; border: 1px solid #000; text-align: center; font-weight: 500; }
        .footer-container { background: ${COLORS.footerGradient}; height: 30px; width: 100%; position: fixed; bottom: 0; left: 0; color: white; font-size: 10px; display: flex; justify-content: center; align-items: center; }
        .signatures { margin-top: 50px; display: flex; justify-content: space-between; }
        .sig-block { text-align: center; width: 30%; }
        .sig-title { font-weight: bold; margin-bottom: 35px; font-size: 13px; }
        .sig-line { border-bottom: 1px dashed #000; width: 80%; margin: 0 auto; }
        @media print { .page-break { page-break-before: always; } }
      </style>
    </head>
    <body>
      <div class="header-container">
         <div class="school-info"><h1>المملكة العربية السعودية</h1><h1>وزارة التعليم</h1><h2>${settings.schoolName}</h2></div>
         <div class="center-title"><h1>${title}</h1></div>
         <div class="ministry-logo"><img src="${settings.logoUrl}" alt="وزارة التعليم"></div>
      </div>
      <div class="content-wrapper">${content}</div>
      <div class="footer-container">نظام SEMS PRO الذكي لإدارة الاختبارات</div>
    </body>
    </html>
  `;
};

export const printCommitteeStickers = (committees: any[], settings: PrintSettings) => {
    let content = '<div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">';
    
    committees.forEach((comm, idx) => {
        if (idx > 0 && idx % 4 === 0) content += '</div><div class="page-break"></div><div style="display: grid; grid-template-columns: 1fr 1fr; gap: 20px;">';
        
        content += `
            <div style="border: 4px double #0e3f51; border-radius: 20px; padding: 20px; text-align: center; height: 13cm; display: flex; flex-direction: column; justify-content: space-between;">
                <div>
                    <h3 style="margin: 0; color: #666; font-size: 14px;">نظام الاختبارات الذكي</h3>
                    <h2 style="margin: 10px 0; color: #0e3f51; font-weight: 900; font-size: 24px;">بطاقة لجنة اختبار</h2>
                </div>
                
                <div style="background: #0e3f51; color: white; padding: 15px; border-radius: 15px; margin: 15px 0;">
                    <span style="font-size: 16px; opacity: 0.8; display: block;">رقم اللجنة</span>
                    <strong style="font-size: 60px; line-height: 1;">${comm.name}</strong>
                </div>

                <div style="margin: 10px 0;">
                    <span style="display: block; font-size: 14px; color: #666;">المقر</span>
                    <strong style="font-size: 20px; color: #333;">${comm.location}</strong>
                </div>

                <div style="margin: 20px auto;">
                    <div id="qr-target-${comm.id}"></div>
                    <p style="font-size: 10px; color: #888; margin-top: 10px;">امسح الباركود للاستلام ورصد الغياب</p>
                </div>
            </div>
        `;
    });
    
    content += '</div>';

    const popup = window.open('', '_blank');
    if (popup) {
        popup.document.write(createPrintPage('ملصقات اللجان الثابتة', content, settings));
        
        // توليد الـ QR بعد تحميل الصفحة
        committees.forEach(comm => {
            const qrCanvas = document.createElement('canvas');
            // استخدام اسم اللجنة كمعرف ثابت للباركود
            import('https://esm.sh/qrcode').then(QRCode => {
                QRCode.toCanvas(qrCanvas, comm.name, { width: 150 }, (err) => {
                    const target = popup.document.getElementById(`qr-target-${comm.id}`);
                    if (target) target.appendChild(qrCanvas);
                });
            });
        });

        setTimeout(() => popup.print(), 1000);
    }
};

export const printCommitteeReceipt = (data: AppData, settings: PrintSettings, date: string) => {
  let content = '';
  const todaysExams = (data.rawExams || []).filter((e) => e.date === date);
  if (todaysExams.length === 0) { alert('لا توجد اختبارات مسجلة!'); return; }

  content += `
    <table style="margin-top:20px;">
        <thead><tr><th>م</th><th>اللجنة</th><th>المقر</th><th>المادة</th><th>مسجل</th><th>غياب</th><th>حاضر</th><th>توقيع المستلم</th></tr></thead>
        <tbody>
  `;
  todaysExams.forEach((env, idx) => {
      const registered = env.students.length;
      const absent = env.students.filter(s => s.status === AttendanceStatus.ABSENT).length;
      content += `<tr><td>${idx+1}</td><td style="font-weight:900;">${env.committeeNumber}</td><td>${env.location}</td><td>${env.subject}</td><td>${registered}</td><td>${absent}</td><td>${registered-absent}</td><td></td></tr>`;
  });
  content += `</tbody></table>`;

  const popup = window.open('', '_blank');
  if (popup) { popup.document.write(createPrintPage('كشف استلام الأوراق', content, { ...settings, date })); popup.document.close(); }
};

export const printAbsenceSorting = (data: AppData, settings: PrintSettings, date: string) => {
    const absentStudents = (data.rawExams || []).filter((e) => e.date === date).flatMap((e) => e.students.filter((s) => s.status === AttendanceStatus.ABSENT).map((s) => ({ ...s, subject: e.subject, comm: e.committeeNumber })));
    let content = `<table><thead><tr><th>م</th><th>الاسم</th><th>الصف</th><th>اللجنة</th><th>المادة</th></tr></thead><tbody>`;
    absentStudents.forEach((s, i) => content += `<tr><td>${i+1}</td><td>${s.name}</td><td>${s.grade}</td><td>${s.comm}</td><td>${s.subject}</td></tr>`);
    content += `</tbody></table>`;
    const popup = window.open('', '_blank');
    if (popup) { popup.document.write(createPrintPage('كشف الغياب المجمع', content, { ...settings, date })); popup.document.close(); }
};

export const printCommitteeHandover = (data: AppData, settings: PrintSettings, commId: string, date: string) => {
    const env = (data.rawExams || []).find(e => e.committeeNumber === commId && e.date === date);
    if (!env) return;
    let content = `<div style="border:2px solid #000; padding:15px; margin-bottom:20px;">اللجنة: ${env.committeeNumber} | المقر: ${env.location} | المادة: ${env.subject}</div>`;
    content += `<table><thead><tr><th>م</th><th>رقم الجلوس</th><th>الاسم</th><th>الصف</th><th>الحالة</th></tr></thead><tbody>`;
    env.students.forEach((s, i) => content += `<tr><td>${i+1}</td><td>${s.seatNumber}</td><td>${s.name}</td><td>${s.grade}</td><td>${s.status === AttendanceStatus.PRESENT ? 'حاضر' : 'غائب'}</td></tr>`);
    content += `</tbody></table>`;
    const popup = window.open('', '_blank');
    if (popup) { popup.document.write(createPrintPage(`محضر لجنة ${commId}`, content, { ...settings, date })); popup.document.close(); }
};
