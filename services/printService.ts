
import { AppData, PrintSettings, School } from '../types';

export const printStickerSingle = (number: string, location: string, school: School) => {
  const date = new Date().toLocaleDateString('en-CA');
  
  const content = `
    <!DOCTYPE html>
    <html dir="rtl" lang="ar">
    <head>
      <title>ملصق لجنة ${number}</title>
      <style>
        @import url('https://fonts.googleapis.com/css2?family=Tajawal:wght@400;700;900&display=swap');
        @page { size: A4; margin: 0; }
        body { margin: 0; padding: 0; font-family: 'Tajawal', sans-serif; background: white; -webkit-print-color-adjust: exact; width: 210mm; height: 297mm; overflow: hidden; }
        
        /* الهيدر العلوي - النصوص يمين والشعار يسار */
        .top-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 40px 60px;
            width: calc(100% - 120px);
        }
        .header-text { text-align: right; flex: 1; }
        .header-text h1 { margin: 0; font-size: 22px; font-weight: 900; color: #1e293b; }
        .header-text p { margin: 3px 0; font-size: 16px; font-weight: 700; color: #475569; }
        .header-text h2 { margin: 5px 0; font-size: 18px; font-weight: 800; color: #0f3d4e; }
        
        .logo-box { flex-shrink: 0; }
        .logo-box img { height: 90px; }

        /* شريط عنوان الملصق */
        .title-bar-container {
            display: flex;
            justify-content: center;
            width: 100%;
            margin-top: -10px;
        }
        .title-bar {
            background-color: #0f3d4e;
            color: white;
            padding: 12px 60px;
            border-radius: 50px;
            font-size: 24px;
            font-weight: 900;
        }

        /* الإطار الرئيسي */
        .main-frame {
            margin: 30px 60px;
            border: 3px solid #0f3d4e;
            border-radius: 50px;
            padding: 40px;
            height: calc(100% - 320px);
            display: flex;
            flex-direction: column;
            align-items: center;
            box-sizing: border-box;
            position: relative;
        }

        .date-text {
            font-size: 20px;
            font-weight: 900;
            margin-bottom: 40px;
            color: #1e293b;
        }

        .label-text {
            font-size: 28px;
            font-weight: 700;
            color: #64748b;
            margin-bottom: 5px;
        }

        .huge-number {
            font-size: 180px;
            font-weight: 1000;
            color: #0f3d4e;
            line-height: 1;
            margin-bottom: 40px;
        }

        .location-pill {
            background-color: #0f3d4e;
            color: white;
            padding: 18px 80px;
            border-radius: 60px;
            font-size: 32px;
            font-weight: 900;
            margin-bottom: 50px;
            display: flex;
            align-items: center;
            gap: 15px;
        }

        .qr-container {
            border: 5px solid #0f3d4e;
            padding: 15px;
            border-radius: 40px;
            background: white;
            margin-bottom: 40px;
            width: fit-content;
        }

        .footer-msg {
            font-size: 20px;
            font-weight: 800;
            color: #475569;
        }

        @media print { 
            body { width: 210mm; height: 297mm; }
            .no-print { display: none; }
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
            <div class="title-bar">ملصق لجنة ${number}</div>
        </div>

        <div class="main-frame">
            <div class="date-text">التاريخ: ${date}</div>
            
            <div class="label-text">لجنة رقم</div>
            <div class="huge-number">${number}</div>

            <div class="location-pill">${location} 📍</div>

            <div class="qr-container" id="qr-target"></div>

            <div class="footer-msg">يرجى مسح الرمز أعلاه لتسجيل الحضور والاستلام</div>
        </div>

        <script src="https://esm.sh/qrcode"></script>
        <script>
            // التعديل: توليد الباركود بدقة قبل الطباعة
            function generateQR() {
                const target = document.getElementById('qr-target');
                QRCode.toCanvas(document.createElement('canvas'), "${number}", { 
                    width: 250, 
                    margin: 1,
                    color: { dark: '#0f3d4e', light: '#ffffff' }
                }, function (error, canvas) {
                    if (error) {
                        console.error(error);
                        return;
                    }
                    target.innerHTML = ''; // تنظيف المحتوى السابق
                    target.appendChild(canvas);
                    // تأخير بسيط لضمان الرسم
                    setTimeout(() => {
                        window.print();
                    }, 500);
                });
            }
            window.onload = generateQR;
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
