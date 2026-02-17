
import React, { useEffect, useRef } from 'react';
import { Html5QrcodeScanner } from 'html5-qrcode';

interface ScannerProps {
  onScanSuccess: (decodedText: string) => void;
  onScanError?: (error: string) => void;
}

export const ScannerComponent: React.FC<ScannerProps> = ({ onScanSuccess, onScanError }) => {
  const scannerRef = useRef<Html5QrcodeScanner | null>(null);

  useEffect(() => {
    const scanner = new Html5QrcodeScanner(
      "qr-reader-comp",
      { fps: 10, qrbox: { width: 250, height: 250 } },
      false
    );

    scanner.render(
      (decodedText) => {
        scanner.clear().then(() => {
          onScanSuccess(decodedText);
        }).catch(e => {
          console.error("Scanner clear failed", e);
          onScanSuccess(decodedText);
        });
      },
      (error) => {
        if (onScanError) onScanError(error);
      }
    );

    scannerRef.current = scanner;

    return () => {
      if (scannerRef.current) {
        scannerRef.current.clear().catch(e => console.debug("Scanner cleanup error", e));
      }
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div id="qr-reader-comp" className="w-full"></div>
  );
};
