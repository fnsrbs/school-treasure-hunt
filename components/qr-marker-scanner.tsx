'use client';

import { useEffect, useId, useRef, useState } from 'react';
import { Camera, ScanLine, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ScannerStatus = 'idle' | 'starting' | 'scanning' | 'error';

type QrMarkerScannerProps = {
  onDetected: (decodedText: string) => void;
};

export function QrMarkerScanner({ onDetected }: QrMarkerScannerProps) {
  const readerId = `qr-reader-${useId().replaceAll(':', '')}`;
  const scannerRef = useRef<import('html5-qrcode').Html5Qrcode | null>(null);
  const handledRef = useRef(false);
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');

  const stopScanner = async () => {
    const scanner = scannerRef.current;
    if (!scanner) return;

    try {
      if (scanner.isScanning) await scanner.stop();
      scanner.clear();
    } catch {
      // The camera may already have been released by the browser.
    } finally {
      scannerRef.current = null;
      setStatus('idle');
    }
  };

  useEffect(() => {
    return () => {
      const scanner = scannerRef.current;
      scannerRef.current = null;
      if (scanner?.isScanning) void scanner.stop().then(() => scanner.clear()).catch(() => undefined);
    };
  }, []);

  const startScanner = async () => {
    setStatus('starting');
    setErrorMessage('');
    handledRef.current = false;

    try {
      const { Html5Qrcode, Html5QrcodeSupportedFormats } = await import('html5-qrcode');
      const scanner = new Html5Qrcode(readerId, {
        formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
        verbose: false,
      });
      scannerRef.current = scanner;

      await scanner.start(
        { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 220, height: 220 }, aspectRatio: 1 },
        (decodedText) => {
          if (handledRef.current) return;
          handledRef.current = true;
          void scanner.stop().finally(() => {
            scanner.clear();
            scannerRef.current = null;
            onDetected(decodedText);
          });
        },
        () => undefined,
      );

      setStatus('scanning');
    } catch {
      scannerRef.current = null;
      setStatus('error');
      setErrorMessage('카메라를 열 수 없습니다. 브라우저의 카메라 권한과 HTTPS 연결을 확인해주세요.');
    }
  };

  return (
    <div className="qr-scanner">
      <div className={`camera-preview camera-preview-${status}`}>
        <div id={readerId} className="qr-reader" />
        {status !== 'scanning' && <ScanLine className="camera-placeholder-icon" />}
        <div className="scan-frame" aria-hidden="true" />
        <span>{status === 'scanning' ? 'QR 마커를 사각형 안에 맞춰주세요' : '카메라를 켜고 QR 마커를 비춰주세요'}</span>
      </div>

      {errorMessage && <p className="camera-error" role="alert">{errorMessage}</p>}

      {status === 'scanning' ? (
        <Button className="camera-control" variant="outline" onClick={() => void stopScanner()}>
          <Square /> 카메라 끄기
        </Button>
      ) : (
        <Button className="panel-primary" onClick={() => void startScanner()} disabled={status === 'starting'}>
          <Camera /> {status === 'starting' ? '카메라 여는 중…' : '카메라로 QR 인식하기'}
        </Button>
      )}
    </div>
  );
}
