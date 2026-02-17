
import { Html5Qrcode } from 'html5-qrcode';
import { RefreshCw, ShieldAlert } from 'lucide-react';
import React, { useEffect, useRef, useState } from 'react';

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
}

export const ScannerComponent: React.FC<ScannerProps> = ({ onScanSuccess, onScanError }) => {
  const qrCodeScannerRef = useRef<Html5Qrcode | null>(null);
  const [hasPermission, setHasPermission] = useState<boolean | null>(null);

  useEffect(() => {
    const scannerId = "qr-reader-comp-active";
    qrCodeScannerRef.current = new Html5Qrcode(scannerId);

    const startScanner = async () => {
      try {
        // نطلب الكاميرات أولاً للتأكد من وجود الصلاحية
        const cameras = await Html5Qrcode.getCameras();
        
        if (cameras && cameras.length > 0) {
          setHasPermission(true);
          
          // نستخدم خاصية facingMode: "environment" لضمان فتح الكاميرا الخلفية مباشرة
          await qrCodeScannerRef.current?.start(
            { facingMode: "environment" }, 
            { 
              fps: 15, 
              qrbox: { width: 250, height: 250 },
              aspectRatio: 1.0 
            },
            (decodedText) => {
                onScanSuccess(decodedText);
            },
            (errorMessage) => {
                // تجاهل أخطاء المسح اللحظية
            }
          );
        } else {
            setHasPermission(false);
        }
      } catch (err) {
        console.error("Camera access error", err);
        setHasPermission(false);
      }
    };

    startScanner();

    return () => {
      // إيقاف الكاميرا عند مغادرة الصفحة أو إغلاق المكون
      if (qrCodeScannerRef.current?.isScanning) {
        qrCodeScannerRef.current.stop().catch(e => console.error("Stop error", e));
      }
    };
  }, [onScanSuccess]);

  if (hasPermission === false) {
      return (
          <div className="p-10 text-center bg-slate-800 rounded-[2.5rem] space-y-4 shadow-2xl">
              <ShieldAlert className="mx-auto text-rose-500" size={48} />
              <h3 className="text-white font-black text-lg">تعذر الوصول للكاميرا الخلفية</h3>
              <p className="text-slate-400 text-xs">يرجى التأكد من منح المتصفح صلاحية الوصول للكاميرا وتحديث الصفحة.</p>
              <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-8 py-3 rounded-2xl text-xs font-black flex items-center gap-2 mx-auto active:scale-95 transition-all">
                  <RefreshCw size={14} /> تحديث الصفحة
              </button>
          </div>
      );
  }

  return (
    <div className="relative overflow-hidden rounded-[2.5rem] bg-slate-900 aspect-square shadow-2xl ring-4 ring-slate-100">
        <div id="qr-reader-comp-active" className="w-full h-full object-cover"></div>
        {/* إطار بصري للتركيز (Focus UI) */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-64 h-64 border-2 border-blue-500/50 rounded-3xl relative">
                <div className="absolute top-0 left-0 w-8 h-8 border-t-4 border-l-4 border-blue-500 rounded-tl-xl"></div>
                <div className="absolute top-0 right-0 w-8 h-8 border-t-4 border-r-4 border-blue-500 rounded-tr-xl"></div>
                <div className="absolute bottom-0 left-0 w-8 h-8 border-b-4 border-l-4 border-blue-500 rounded-bl-xl"></div>
                <div className="absolute bottom-0 right-0 w-8 h-8 border-b-4 border-r-4 border-blue-500 rounded-br-xl"></div>
            </div>
        </div>
        <div className="absolute top-4 right-4 bg-slate-900/60 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10 flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            <span className="text-[9px] font-black text-white uppercase tracking-widest">Rear Camera Active</span>
        </div>
    </div>
  );
};
