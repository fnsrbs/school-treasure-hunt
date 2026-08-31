'use client';

import { useEffect } from 'react';

type ArTreasureExperienceProps = {
  mode?: 'hint' | 'treasure';
  onHintFound?: () => void;
  onCollect: () => void;
};

export function ArTreasureExperience({ mode = 'treasure' }: ArTreasureExperienceProps) {
  useEffect(() => {
    window.location.assign(`/ar/treasure.html?mode=${mode}`);
  }, [mode]);

  return <div className="ar-experience-loading">
    <strong>전체 화면 AR 카메라를 여는 중…</strong>
    <p>잠시 후 카메라 권한을 허용해주세요.</p>
  </div>;
}
