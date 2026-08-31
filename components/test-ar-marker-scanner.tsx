'use client';

import { useEffect, useRef, useState } from 'react';
import Image from 'next/image';
import { Camera, Square } from 'lucide-react';
import { Button } from '@/components/ui/button';

const TEST_MARKER_PAYLOAD = 'school-treasure-hunt:ar-test';

type TestArMarkerScannerProps = {
  mode: 'hint' | 'treasure';
  onHintFound: () => void;
  onCollect: () => void;
};

export function TestArMarkerScanner({ mode, onHintFound, onCollect }: TestArMarkerScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<import('qr-scanner').default | null>(null);
  const hintHandledRef = useRef(false);
  const [running, setRunning] = useState(false);
  const [found, setFound] = useState(false);
  const [error, setError] = useState('');
  const [anchor, setAnchor] = useState({ left: 50, top: 50, size: 42 });

  const stop = () => {
    scannerRef.current?.destroy();
    scannerRef.current = null;
    const stream = videoRef.current?.srcObject;
    if (stream instanceof MediaStream) stream.getTracks().forEach((track) => track.stop());
    if (videoRef.current) videoRef.current.srcObject = null;
    setRunning(false);
  };

  useEffect(() => () => scannerRef.current?.destroy(), []);

  const start = async () => {
    setError('');
    setFound(false);
    hintHandledRef.current = false;
    try {
      if (!videoRef.current) throw new Error('video unavailable');
      const { default: QrScanner } = await import('qr-scanner');
      const scanner = new QrScanner(videoRef.current, (result) => {
        if (result.data.trim() !== TEST_MARKER_PAYLOAD) return;
        const width = videoRef.current?.videoWidth || 1;
        const height = videoRef.current?.videoHeight || 1;
        const xs = result.cornerPoints.map((point) => point.x);
        const ys = result.cornerPoints.map((point) => point.y);
        const markerWidth = Math.max(...xs) - Math.min(...xs);
        setAnchor({
          left: ((Math.min(...xs) + Math.max(...xs)) / 2 / width) * 100,
          top: ((Math.min(...ys) + Math.max(...ys)) / 2 / height) * 100,
          size: Math.max(24, Math.min(70, (markerWidth / width) * 145)),
        });
        setFound(true);
        if (mode === 'hint' && !hintHandledRef.current) {
          hintHandledRef.current = true;
          setTimeout(() => { stop(); onHintFound(); }, 700);
        }
      }, {
        preferredCamera: 'environment',
        maxScansPerSecond: 15,
        returnDetailedScanResult: true,
        highlightScanRegion: false,
        highlightCodeOutline: false,
      });
      scannerRef.current = scanner;
      await scanner.start();
      setRunning(true);
    } catch {
      stop();
      setError('카메라를 열 수 없습니다. Chrome 카메라 권한과 HTTPS 연결을 확인해주세요.');
    }
  };

  return <div className="test-ar-scanner">
    <div className="test-ar-camera">
      <video ref={videoRef} autoPlay muted playsInline />
      {!running && <div className="test-ar-placeholder"><Camera /><span>테스트 AR 카메라</span></div>}
      {found && <div className="test-ar-anchor" style={{ left: `${anchor.left}%`, top: `${anchor.top}%`, width: `${anchor.size}%` }}>
        {mode === 'treasure' ? <Image src="/reward-treasure-chest.png" alt="AR 보물상자" width={300} height={300} /> : <span>✦ 힌트 발견 ✦</span>}
      </div>}
      {running && !found && <p className="test-ar-guide">테스트 마커를 비춰주세요</p>}
    </div>
    {error && <p className="camera-error" role="alert">{error}</p>}
    {found && mode === 'treasure' && <Button className="panel-primary" onClick={() => { stop(); onCollect(); }}>보물 획득하기</Button>}
    {!running ? <Button className="panel-primary" onClick={() => void start()}><Camera /> 테스트 AR 카메라 시작</Button> : <Button className="camera-control" variant="outline" onClick={stop}><Square /> 카메라 끄기</Button>}
    <code className="test-marker-code">{TEST_MARKER_PAYLOAD}</code>
  </div>;
}
