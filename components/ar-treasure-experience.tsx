'use client';

import { useEffect } from 'react';

type ArTreasureExperienceProps = {
  mode?: 'hint' | 'treasure';
  onHintFound?: () => void;
  onCollect: () => void;
};

export function ArTreasureExperience({ mode = 'treasure', onHintFound, onCollect }: ArTreasureExperienceProps) {
  useEffect(() => {
    const receiveMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data === 'school-treasure-hunt:test-hint-found') onHintFound?.();
      if (event.data === 'school-treasure-hunt:collect-ar-treasure') onCollect();
    };
    window.addEventListener('message', receiveMessage);
    return () => window.removeEventListener('message', receiveMessage);
  }, [onCollect, onHintFound]);

  return <div className="ar-experience">
    <iframe
      className="ar-experience-frame"
      src={`/ar/treasure.html?mode=${mode}`}
      title="마커 추적 AR 보물상자"
      allow="camera"
    />
  </div>;
}
