'use client';

import { useEffect, useRef, useState } from 'react';
import { Camera, ScanLine, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

type ScannerStatus = 'idle' | 'starting' | 'scanning' | 'error';
type CameraOption = { id: string; label: string };
type QrMarkerScannerProps = { onDetected: (decodedText: string) => void };

function cameraErrorMessage(error: unknown): string {
  if (!window.isSecureContext) return '카메라는 HTTPS에서만 사용할 수 있습니다. Vercel의 https:// 주소로 접속해주세요.';
  if (!(error instanceof DOMException)) return '카메라를 시작하지 못했습니다. Chrome을 완전히 종료한 뒤 다시 시도해주세요.';
  switch (error.name) {
    case 'NotAllowedError':
    case 'SecurityError': return '카메라가 차단됐습니다. 주소창의 사이트 설정에서 카메라를 허용하고 새로고침해주세요.';
    case 'NotFoundError': return '사용 가능한 카메라를 찾지 못했습니다.';
    case 'NotReadableError':
    case 'AbortError': return '다른 앱이 카메라를 사용 중입니다. 카메라 앱, Zoom, Teams 등을 종료하고 다시 시도해주세요.';
    default: return `카메라 오류가 발생했습니다. (${error.name})`;
  }
}

export function QrMarkerScanner({ onDetected }: QrMarkerScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<import('qr-scanner').default | null>(null);
  const handledRef = useRef(false);
  const [status, setStatus] = useState<ScannerStatus>('idle');
  const [errorMessage, setErrorMessage] = useState('');
  const [cameras, setCameras] = useState<CameraOption[]>([]);
  const [cameraId, setCameraId] = useState('environment');

  const stopScanner = () => {
    scannerRef.current?.stop();
    scannerRef.current?.destroy();
    scannerRef.current = null;
    const stream = videoRef.current?.srcObject;
    if (stream instanceof MediaStream) stream.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setStatus('idle');
  };

  useEffect(() => () => {
    scannerRef.current?.destroy();
    scannerRef.current = null;
  }, []);

  const startScanner = async () => {
    setStatus('starting');
    setErrorMessage('');
    handledRef.current = false;
    try {
      if (!window.isSecureContext) throw new DOMException('Insecure context', 'SecurityError');
      if (!videoRef.current) throw new Error('Video element is unavailable');
      const { default: QrScanner } = await import('qr-scanner');
      const scanner = new QrScanner(videoRef.current, (result) => {
        if (handledRef.current) return;
        handledRef.current = true;
        stopScanner();
        onDetected(result.data);
      }, {
        preferredCamera: cameraId,
        maxScansPerSecond: 10,
        returnDetailedScanResult: true,
        highlightScanRegion: false,
        highlightCodeOutline: false,
      });
      scannerRef.current = scanner;
      await scanner.start();
      const detectedCameras = await QrScanner.listCameras(true);
      setCameras(detectedCameras);
      const track = (videoRef.current.srcObject as MediaStream | null)?.getVideoTracks()[0];
      const selectedDeviceId = track?.getSettings().deviceId;
      if (selectedDeviceId) setCameraId(selectedDeviceId);
      setStatus('scanning');
    } catch (error) {
      scannerRef.current?.destroy();
      scannerRef.current = null;
      setStatus('error');
      setErrorMessage(cameraErrorMessage(error));
    }
  };

  const changeCamera = async (nextCameraId: string) => {
    setCameraId(nextCameraId);
    try { await scannerRef.current?.setCamera(nextCameraId); }
    catch (error) { setErrorMessage(cameraErrorMessage(error)); }
  };

  return <div className="qr-scanner">
    <div className={`camera-preview camera-preview-${status}`}>
      <video ref={videoRef} className="qr-camera-video" autoPlay muted playsInline />
      {status !== 'scanning' && <ScanLine className="camera-placeholder-icon" />}
      <div className="scan-frame" aria-hidden="true" />
      <span>{status === 'scanning' ? 'QR 마커를 사각형 안에 맞춰주세요' : '카메라를 켜고 QR 마커를 비춰주세요'}</span>
    </div>
    {errorMessage && <p className="camera-error" role="alert">{errorMessage}</p>}
    {cameras.length > 1 && <label className="camera-picker">사용할 카메라<select value={cameraId} onChange={(event) => void changeCamera(event.target.value)}>{cameras.map((camera, index) => <option key={camera.id} value={camera.id}>{camera.label || `카메라 ${index + 1}`}</option>)}</select></label>}
    {status === 'scanning'
      ? <Button className="camera-control" variant="outline" onClick={stopScanner}><Square /> 카메라 끄기</Button>
      : <Button className="panel-primary" onClick={() => void startScanner()} disabled={status === 'starting'}><Camera /> {status === 'starting' ? '카메라 여는 중…' : '카메라로 QR 인식하기'}</Button>}
  </div>;
}
