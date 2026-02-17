
import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Camera, RefreshCw, ShieldAlert } from 'lucide-react';

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
        const cameras = await Html5Qrcode.getCameras();
        if (cameras && cameras.length > 0) {
          setHasPermission(true);
          // اختيار الكاميرا الخلفية تلقائياً
          const backCamera = cameras.find(c => c.label.toLowerCase().includes('back')) || cameras[0];
          
          await qrCodeScannerRef.current?.start(
            backCamera.id,
            { fps: 15, qrbox: { width: 250, height: 250 } },
            (decodedText) => {
                onScanSuccess(decodedText);
            },
            (errorMessage) => {
                // Ignore silent errors
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
      if (qrCodeScannerRef.current?.isScanning) {
        qrCodeScannerRef.current.stop().catch(e => console.error(e));
      }
    };
  }, [onScanSuccess]);

  if (hasPermission === false) {
      return (
          <div className="p-10 text-center bg-slate-800 rounded-[2.5rem] space-y-4">
              <ShieldAlert className="mx-auto text-rose-500" size={48} />
              <h3 className="text-white font-black">تعذر الوصول للكاميرا</h3>
              <p className="text-slate-400 text-xs">يرجى منح إذن الكاميرا للمتصفح وتحديث الصفحة</p>
              <button onClick={() => window.location.reload()} className="bg-blue-600 text-white px-6 py-2 rounded-xl text-xs font-bold flex items-center gap-2 mx-auto">
                  <RefreshCw size={14} /> تحديث الصفحة
              </button>
          </div>
      );
  }

  return (
    <div className="relative overflow-hidden rounded-[2rem] bg-slate-900 aspect-square">
        <div id="qr-reader-comp-active" className="w-full h-full"></div>
        <div className="absolute inset-0 border-[10px] border-slate-900 pointer-events-none"></div>
    </div>
  );
};
