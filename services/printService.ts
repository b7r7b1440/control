
import { AppData, PrintSettings, School } from '../types';

export const printStickerSingle = (number: string, location: string, school: School, stageBreakdown: Record<string, number>) => {
  // ترتيب المراحل للطباعة (أول، ثاني، ثالث)
  const sortedGrades = Object.keys(stageBreakdown).sort((a, b) => {
    const order = ['أول', 'ثاني', 'ثالث'];
    return order.findIndex(o => a.includes(o)) - order.findIndex(o => b.includes(o));
  });

  // توزيع الطلاب: المرحلة يمين والعدد يسار
  const breakdownHtml = sortedGrades.map(grade => `
    <div class="stat-row">
        <span class="stat-label">${grade}</span>
        <span class="stat-count">${stageBreakdown[grade]}</span>
    </div>
  `).join('');

  const content = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <meta charset="UTF-8">
      <title>لجنة رقم ${number}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
        @page { size: A4; margin: 0; }
        body { margin: 0; padding: 0; font-family: 'Tajawal', sans-serif; background: white; -webkit-print-color-adjust: exact; width: 210mm; height: 297mm; overflow: hidden; color: #0f3d4e; }
        
        .top-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 45px 80px;
        }
        .header-text { text-align: right; }
        .header-text h1 { margin: 0; font-size: 20px; font-weight: 900; }
        .header-text p { margin: 2px 0; font-size: 14px; font-weight: 700; color: #475569; }
        .header-text h2 { margin: 4px 0; font-size: 16px; font-weight: 800; }
        
        .logo-box img { height: 95px; }

        .title-bar-container { display: flex; justify-content: center; margin-top: -10px; }
        .title-bar {
            background-color: #0f3d4e;
            color: white;
            padding: 12px 60px;
            border-radius: 50px;
            font-size: 24px;
            font-weight: 900;
            min-width: 200px;
            text-align: center;
        }

        .main-frame {
            margin: 20px 65px;
            border: 5px solid #0f3d4e;
            border-radius: 45px;
            padding: 40px;
            height: 205mm;
            display: flex;
            flex-direction: column;
            align-items: center;
            justify-content: center;
            box-sizing: border-box;
            position: relative;
        }

        .huge-number { font-size: 260px; font-weight: 1000; line-height: 0.75; margin: 20px 0; }
        
        .location-pill {
            background-color: #0f3d4e;
            color: white;
            padding: 18px 90px;
            border-radius: 60px;
            font-size: 34px;
            font-weight: 900;
            margin-bottom: 35px;
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .stats-container {
            width: 100%;
            max-width: 440px;
            background: #fcfdfe;
            border-radius: 35px;
            padding: 25px;
            border: 2px dashed #cbd5e1;
            margin-bottom: 35px;
        }
        .stats-title {
            text-align: center;
            font-weight: 900;
            font-size: 14px;
            color: #94a3b8;
            margin-bottom: 18px;
            text-transform: uppercase;
            letter-spacing: 1px;
        }
        .stat-row {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px 25px;
            border-bottom: 1px solid #f1f5f9;
        }
        .stat-row:last-child { border-bottom: none; }
        .stat-label { font-weight: 900; font-size: 20px; color: #0f3d4e; }
        .stat-count { 
            background: #0f3d4e; 
            color: white; 
            min-width: 45px;
            height: 35px;
            display: flex;
            align-items: center;
            justify-content: center;
            border-radius: 12px; 
            font-weight: 900; 
            font-size: 20px; 
        }

        .qr-wrapper {
            background: white;
            padding: 12px;
            border: 4px solid #0f3d4e;
            border-radius: 30px;
            display: inline-block;
        }
        .qr-wrapper img { width: 195px; height: 195px; display: block; }

        .footer-msg { font-size: 14px; font-weight: 800; color: #94a3b8; margin-top: 25px; }

        @media print {
            body { -webkit-print-color-adjust: exact; }
        }
      </style>
    </head>
    <body>
        <div class="top-header">
            <div class="header-text">
                <h1>المملكة العربية السعودية</h1>
                <h1>وزارة التعليم</h1>
                <p>الإدارة العامة للتعليم بمحافظة جدة</p>
                <h2>${school.name}</h2>
            </div>
            <div class="logo-box">
                <img src="https://up6.cc/2026/02/177116640037762.png" alt="وزارة التعليم">
            </div>
        </div>

        <div class="title-bar-container">
            <div class="title-bar">لجنة رقم ${number}</div>
        </div>

        <div class="main-frame">
            <div style="font-size: 26px; font-weight: 700; color: #64748b;">لجنة رقم</div>
            <div class="huge-number">${number}</div>

            <div class="location-pill">
                <span>📍</span>
                <span>${location}</span>
            </div>

            <div class="stats-container">
                <div class="stats-title">تفاصيل توزيع الطلاب</div>
                ${breakdownHtml}
            </div>

            <div class="qr-wrapper">
                <img id="qr-image" src="" alt="باركود اللجنة">
            </div>

            <div class="footer-msg">نظام إدارة الاختبارات الذكي SEMS Pro</div>
        </div>

        <script src="https://cdn.jsdelivr.net/npm/qrcode@1.5.1/build/qrcode.min.js"></script>
        <script>
            window.onload = function() {
                const qrImage = document.getElementById('qr-image');
                QRCode.toDataURL("${number}", { 
                    width: 450, 
                    margin: 1,
                    color: { dark: '#0f3d4e', light: '#ffffff' }
                }, function (err, url) {
                    if (err) return console.error(err);
                    qrImage.src = url;
                    qrImage.onload = function() {
                        setTimeout(() => { window.print(); }, 400);
                    };
                });
            };
        </script>
    </body>
    </html>
  `;

  const popup = window.open('', '_blank');
  if (popup) {
    popup.document.write(content);
    popup.document.close();
  }
};

export const printCommitteeReceipt = (data: AppData, settings: PrintSettings, date: string) => { /* ... */ };
export const printAbsenceSorting = (data: AppData, settings: PrintSettings, date: string) => { /* ... */ };
export const printCommitteeHandover = (data: AppData, settings: PrintSettings, commId: string, date: string) => { /* ... */ };
export const printCommitteeStickers = (committees: any[], settings: PrintSettings) => { /* ... */ };
