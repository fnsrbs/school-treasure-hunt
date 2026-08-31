'use client';

import { useEffect } from 'react';

type ArTreasureExperienceProps = {
  onCollect: () => void;
};

export function ArTreasureExperience({ onCollect }: ArTreasureExperienceProps) {
  useEffect(() => {
    const receiveMessage = (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return;
      if (event.data === 'school-treasure-hunt:collect-ar-treasure') onCollect();
    };
    window.addEventListener('message', receiveMessage);
    return () => window.removeEventListener('message', receiveMessage);
  }, [onCollect]);

  return <div className="ar-experience">
    <iframe
      className="ar-experience-frame"
      src="/ar/treasure.html"
      title="마커 추적 AR 보물상자"
      allow="camera"
    />
  </div>;
}
