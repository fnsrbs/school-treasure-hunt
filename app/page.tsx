'use client';

import { useEffect, useMemo, useState, type FormEvent } from 'react';
import { ArrowLeft, Beaker, BookOpen, Camera, CheckCircle2, CircleHelp, Computer, Gamepad2, Lightbulb, Map, MapPin, Medal, Music2, Trophy, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { TestArMarkerScanner } from '@/components/test-ar-marker-scanner';
import { QrMarkerScanner } from '@/components/qr-marker-scanner';
import { parseMarkerPayload } from '@/lib/ar/marker-code';
import { assignTreasures, findLocation, markerIdFor, type LocationId, type MarkerStage } from '@/lib/treasure-data';
import { clearGame, loadGame, saveGame, type SavedGame } from '@/lib/game-storage';

type Screen = 'home' | 'setup' | 'assignment' | 'map' | 'hint' | 'marker' | 'ar' | 'ar-test' | 'wrong' | 'found' | 'final' | 'coupon' | 'ranking' | 'exit';
const iconFor: Partial<Record<LocationId, typeof BookOpen>> = { classroom: MapPin, library: BookOpen, computer: Computer, science: Beaker, music: Music2, gym: Trophy };

const coupon = () => `${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}-${Math.floor(1000 + Math.random() * 9000)}`;
const TreasureChestMark = () => <img className="treasure-map-icon" src="/reward-treasure-chest.png" alt="보물상자" />;

export default function Home() {
  const [screen, setScreen] = useState<Screen>('home');
  const [game, setGame] = useState<SavedGame | null>(null);
  const [nickname, setNickname] = useState('');
  const [currentLocation, setCurrentLocation] = useState<LocationId>('classroom');
  const [draft, setDraft] = useState<SavedGame | null>(null);

  useEffect(() => {
    const savedGame = loadGame();
    setGame(savedGame);
    if (savedGame && new URLSearchParams(window.location.search).has('ar-return')) {
      setScreen(savedGame.screen as Screen);
      window.history.replaceState({}, '', '/');
    }
  }, []);
  const target = useMemo(() => game ? findLocation(game.assignedTreasures[game.step]) : null, [game]);
  const persist = (next: SavedGame, nextScreen: Screen) => { const saved = { ...next, screen: nextScreen }; setGame(saved); saveGame(saved); setScreen(nextScreen); };
  const newGame = () => { clearGame(); setGame(null); setNickname(''); setCurrentLocation('classroom'); setScreen('setup'); };
  const createAssignment = (event: FormEvent) => {
    event.preventDefault(); const name = nickname.trim().slice(0, 10); if (!name) return;
    setDraft({ nickname: name, currentLocation, assignedTreasures: assignTreasures(currentLocation), collectedTreasures: [], step: 0, hintLevel: 1, screen: 'assignment' }); setScreen('assignment');
  };
  const startAssignedGame = () => { if (draft) persist(draft, 'map'); };
  const continueGame = () => { if (game) setScreen((game.screen as Screen) === 'home' ? 'map' : game.screen as Screen); };
  const openMarker = () => game && persist(game, 'marker');
  const openTestArMarker = () => game && persist(game, 'ar-test');
  const scanMarker = (markerId: string) => {
    if (!game || !target) return;
    const stage = game.hintLevel as MarkerStage;
    if (markerId === markerIdFor(target.id, 3)) {
      const collectedTreasures = [...new Set([...(game.collectedTreasures ?? []), target.id])];
      persist({ ...game, collectedTreasures }, 'ar');
      return;
    }
    if (stage < 3 && markerId === markerIdFor(target.id, stage)) { persist({ ...game, hintLevel: stage + 1 }, 'hint'); return; }
    persist(game, 'wrong');
  };
  const scanMarkerCode = (decodedText: string) => scanMarker(parseMarkerPayload(decodedText) ?? 'invalid-marker');
  const collectTestTreasure = () => {
    if (!game || !target) return;
    const collectedTreasures = [...new Set([...(game.collectedTreasures ?? []), target.id])];
    persist({ ...game, collectedTreasures }, 'found');
  };
  const nextTreasure = () => { if (!game) return; const collectedTreasures = [...new Set([...(game.collectedTreasures ?? []), game.assignedTreasures[game.step]])]; const isLast = game.step === game.assignedTreasures.length - 1; if (isLast) persist({ ...game, collectedTreasures, coupon: game.coupon ?? coupon() }, 'final'); else persist({ ...game, collectedTreasures, step: game.step + 1, hintLevel: 1 }, 'map'); };
  const backToMap = () => game && persist(game, 'map');

  return <main className="game-shell"><section className="game-screen festival-game" aria-label="학교 축제 AR 보물찾기">
    <div className="parchment hero-scroll"><p className="eyebrow">학교 곳곳에 숨겨진</p><h1><span>AR</span> 보물찾기</h1><div className="title-rule" /><p className="hero-copy">힌트를 따라 보물을 찾아<br />현실의 상품과 교환하세요!</p></div>
    <nav className="start-actions" aria-label="게임 메뉴">
      <Button className="menu-button menu-button-primary" onClick={newGame}><Gamepad2 /> 새 게임</Button>
      <Button className="menu-button" variant="outline" disabled={!game} onClick={continueGame}><MapPin /> 이어서 하기</Button>
      <Button className="menu-button" variant="outline" onClick={() => setScreen('exit')}><X /> 종료</Button>
    </nav><div className="adventure-art" /><p className="edition-label">학교 축제 · AR 탐험대</p>

    {screen !== 'home' && <div className="panel-backdrop"><section className="game-panel festival-panel" aria-live="polite"><Button className="back-button" variant="ghost" onClick={() => setScreen(['hint', 'marker', 'ar', 'ar-test', 'wrong', 'found'].includes(screen) ? 'map' : 'home')}><ArrowLeft /> {['hint', 'marker', 'ar', 'ar-test', 'wrong', 'found'].includes(screen) ? '지도로' : '메인'}</Button>
      {screen === 'setup' && <form onSubmit={createAssignment}><p className="panel-label">새 게임 설정</p><h2>탐험을 시작하기 전에<br />정보를 입력해주세요</h2><label className="field-label">① 닉네임 입력<input value={nickname} onChange={(event) => setNickname(event.target.value)} maxLength={10} placeholder="닉네임 10자 이내" autoFocus /></label><p className="field-label">② 현재 위치 선택</p><p className="map-picker-help">아래 학교 도면에서 현재 있는 장소를 직접 눌러주세요.</p><FacilityMapPicker selected={currentLocation} onSelect={setCurrentLocation} /><Button className="panel-primary" type="submit">다음</Button></form>}

      {screen === 'assignment' && draft && <><p className="panel-label">보물 배정</p><img className="assigned-treasure-chest" src="/assigned-treasure-chest.png" alt="잠긴 보물상자" /><h2>보물이 배정되었습니다!</h2><p><b>{draft.nickname}</b> 탐험대만의 보물 순서가 정해졌어요. 위치는 힌트를 따라 찾아야 합니다.</p><ol className="assignment-list">{draft.assignedTreasures.map((id, index) => <li key={id}><b>{index + 1}</b>보물 {index + 1}<small>위치 비공개</small></li>)}</ol><Button className="panel-primary" onClick={startAssignedGame}>확인</Button></>}

      {screen === 'map' && game && target && <><p className="panel-label">학교 지도 · 보물 찾기 {game.step + 1} / 3</p><div className="player-strip"><MapPin /><span>{game.nickname}</span><small>현재 위치: {findLocation(game.currentLocation).name}</small></div><h2>학교 곳곳의 AR 마커를 찾아<br />보물을 획득하세요!</h2><SchoolMap current={game.currentLocation} collected={game.collectedTreasures ?? []} /><div className="progress-card"><Lightbulb /><div><small>현재 힌트 ({game.hintLevel}/3)</small><strong>{target.hints[game.hintLevel - 1]}</strong></div></div><Button className="panel-primary" onClick={() => persist(game, 'hint')}>힌트 보기</Button></>}

      {screen === 'hint' && game && target && <><p className="panel-label">힌트 보기 · {game.step + 1} / 3</p><h2>단서를 따라<br />AR 마커를 찾아보세요</h2><div className="hint-stack">{target.hints.map((hint, index) => <article key={hint} className={index < game.hintLevel ? 'hint-open' : 'hint-locked'}><b>{index + 1}단계 힌트</b><p>{index < game.hintLevel ? hint : '이전 마커를 인식하면 열립니다.'}</p></article>)}</div><p className="marker-flow-note">마커를 인식하면 다음 단서가 열립니다. 보물 마커를 바로 찾으면 즉시 보물을 획득할 수 있어요.</p><Button className="panel-primary" onClick={openTestArMarker}><Camera /> 테스트용 AR 마커 인식</Button><Button className="qr-flow-button" variant="outline" onClick={openMarker}>기존 QR 마커 인식</Button></>}

      {screen === 'marker' && game && target && <><p className="panel-label">AR 마커 인식 · {game.step + 1}/3</p><QrMarkerScanner onDetected={scanMarkerCode} /><p className="marker-camera-help">카메라는 QR 마커 인식에만 사용되며 영상은 저장되지 않습니다.</p>{process.env.NODE_ENV === 'development' && <div className="marker-test-mode"><small>개발용 인식 테스트</small><div className="marker-buttons"><button onClick={() => scanMarker(markerIdFor(target.id, game.hintLevel as MarkerStage))}>현재 단서</button><button onClick={() => scanMarker(markerIdFor(target.id, 3))}>보물 발견</button><button onClick={() => scanMarker('other-marker')}>다른 마커</button></div></div>}</>}

      {screen === 'ar' && game && target && <><p className="panel-label">진짜 AR 보물 발견 · {game.step + 1}/3</p><h2>추적 마커 위에<br />보물을 소환하세요!</h2><TestArMarkerScanner mode="treasure" onHintFound={() => undefined} onCollect={() => persist(game, 'found')} /></>}

      {screen === 'ar-test' && game && target && <><p className="panel-label">단일 마커 AR 테스트 · 힌트 {game.hintLevel}/3</p><h2>{game.hintLevel < 3 ? '테스트 마커를 찾아\n다음 힌트를 여세요!' : '테스트 마커 위에\n보물을 소환하세요!'}</h2><TestArMarkerScanner mode={game.hintLevel < 3 ? 'hint' : 'treasure'} onHintFound={() => scanMarker(markerIdFor(target.id, game.hintLevel as MarkerStage))} onCollect={collectTestTreasure} /></>}

      {screen === 'wrong' && game && <><p className="panel-label">다시 찾아보세요</p><CircleHelp className="panel-icon" /><h2>현재 찾고 있는<br />보물 마커가 아닙니다.</h2><p>기존 힌트를 다시 확인하고 탐험을 계속하세요. 게임 단계와 힌트는 바뀌지 않습니다.</p><Button className="panel-primary" onClick={() => persist(game, 'hint')}>힌트 다시 보기</Button></>}

      {screen === 'found' && game && target && <><p className="panel-label">보물을 찾았습니다!</p><div className={`treasure-found-scene ${game.step < 2 ? 'regular-treasure-found' : ''}`}><span>✦ 보물 발견 ✦</span><img src={game.step < 2 ? '/reward-treasure-small.png' : '/reward-treasure-chest.png'} alt="빛나는 보물상자" /></div><div className="treasure-found-card"><small>{game.step + 1}번째 보물 획득</small><strong>{target.name}의 보물을 찾았어요!</strong><p>{game.step < 2 ? '지도에 획득한 보물 표시가 남습니다.' : '세 개의 보물이 모두 모였습니다!'}</p></div><Button className="panel-primary" onClick={nextTreasure}>{game.step < 2 ? '다음 보물 지도 보기' : '최종 보물 열기'}</Button></>}

      {screen === 'final' && game && <><div className="final-treasure-scene"><span>✦ 보물 발견! ✦</span><h2>세 개의 보물이<br />하나로 모였습니다</h2><p>마지막 빛을 따라가면 현실의 보상이 나타납니다.</p><img src="/reward-treasure-chest.png" alt="최종 보물상자" /><strong>최종 보물 등장!</strong></div><Button className="panel-primary" onClick={() => persist(game, 'coupon')}>교환권 확인하기</Button></>}

      {screen === 'coupon' && game && <><p className="panel-label">상품 교환권 획득</p><Trophy className="reward-icon" /><h2>모든 보물을 찾았습니다!</h2><p>운영 부스에서 아래 교환권 번호를 보여주고 현실의 상품과 교환하세요.</p><div className="coupon-card"><small>상품 교환권 · 쿠폰 번호</small><strong>{game.coupon}</strong></div><Button className="panel-primary" onClick={backToMap}><CheckCircle2 /> 확인</Button></>}

      {screen === 'ranking' && <><p className="panel-label">탐험 랭킹</p><Medal className="panel-icon" /><h2>명예의 탐험대</h2><p>공동 랭킹은 축제 서버 연결 단계에서 제공됩니다.</p><div className="ranking-empty">현재는 각 기기의 게임 진행과 쿠폰이 저장됩니다.</div></>}
      {screen === 'exit' && <><p className="panel-label">게임 종료</p><X className="panel-icon" /><h2>탐험을 잠시 멈췄어요</h2><p>진행 중인 게임은 자동 저장됩니다. 다음에 다시 열면 ‘이어서 하기’로 계속할 수 있어요.</p><Button className="panel-primary" onClick={() => setScreen('home')}>메인 화면으로</Button></>}
    </section></div>}
  </section></main>;
}

function SchoolMap({ current, collected }: { current: LocationId; collected: LocationId[] }) {
  type MapView = 'full' | 'floor1' | 'floor2' | 'floor3' | 'floor4' | 'annex';
  const [view, setView] = useState<MapView>('full');
  const labels: Record<MapView, string> = { full: '전체', floor1: '1층', floor2: '2층', floor3: '3층', floor4: '4층', annex: '별관' };
  return <div className="mission-map-control"><nav className="map-view-tabs" aria-label="지도 보기 방식">{(Object.keys(labels) as MapView[]).map((id) => <button key={id} type="button" onClick={() => setView(id)} className={view === id ? 'active' : ''}>{labels[id]}</button>)}</nav>{view === 'full' ? <FacilityMapPicker selected={current} onSelect={() => undefined} mode="mission" collected={collected} /> : <FloorDetailMap floor={view} current={current} collected={collected} />}</div>;
}

function FloorDetailMap({ floor, current, collected }: { floor: 'floor1' | 'floor2' | 'floor3' | 'floor4' | 'annex'; current: LocationId; collected: LocationId[] }) {
  const plans = {
    floor4: { title: '4층', rooms: [['music', '음악실'], ['g3-1', '3-1'], ['g3-2', '3-2'], ['g3-3', '3-3'], ['g3-office', '3학년\n교무실'], ['g3-4', '3-4'], ['g3-5', '3-5'], ['weclass-career', '특별실']] },
    floor3: { title: '3층', rooms: [['computer', '컴퓨터실'], ['g2-1', '2-1'], ['g2-2', '2-2'], ['g2-3', '2-3'], ['g2-office', '2학년\n교무실'], ['g2-4', '2-4'], ['g2-5', '2-5'], ['science', '과학실2']] },
    floor2: { title: '2층', rooms: [['art', '미술실'], ['classroom', '1-1'], ['g1-2', '1-2'], ['g1-3', '1-3'], ['g1-office', '1학년\n교무실'], ['g1-4', '1-4'], ['g1-5', '1-5'], ['science-1', '과학실1']] },
    floor1: { title: '1층', rooms: [['archive', '보건실'], ['main-office', '본교무실'], ['admin', '행정실'], ['central', '중앙현관'], ['principal', '교장실'], ['transition', '전환반']] },
    annex: { title: '별관 · 야외 시설', rooms: [['gym', '체육관'], ['warehouse', '창고'], ['field', '운동장'], ['library', '도서관'], ['cafeteria', '식당']] },
  } as const;
  const plan = plans[floor];
  const room = ([id, label]: readonly [LocationId | 'weclass-career' | 'central', string]) => { if (id === 'weclass-career') { const weclassOrder = collected.indexOf('weclass'); const careerOrder = collected.indexOf('career'); return <div key={id} className="detail-room room-weclass-career"><div className={`half-room ${current === 'weclass' ? 'current-room' : ''} ${weclassOrder >= 0 ? 'collected-room' : ''}`}>{current === 'weclass' ? <MapPin /> : weclassOrder >= 0 ? <><TreasureChestMark /><small>{weclassOrder + 1}</small></> : null}<span>위클래스</span></div><div className={`half-room ${current === 'career' ? 'current-room' : ''} ${careerOrder >= 0 ? 'collected-room' : ''}`}>{current === 'career' ? <MapPin /> : careerOrder >= 0 ? <><TreasureChestMark /><small>{careerOrder + 1}</small></> : null}<span>진로활동실</span></div></div>; } const order = id === 'central' ? -1 : collected.indexOf(id); return <div key={id} className={`detail-room ${current === id ? 'current-room' : ''} ${order >= 0 ? 'collected-room' : ''} room-${id}`}>{current === id ? <MapPin /> : order >= 0 ? <><TreasureChestMark /><small>{order + 1}번째 보물 획득</small></> : null}<span>{label.split('\n').map((line) => <>{line}<br /></>)}</span></div>; };
  const isAnnex = floor === 'annex';
  return <div className="floor-detail-map"><div className="floor-detail-heading"><b>{plan.title}</b><span>{isAnnex ? '본관 밖의 시설과 야외 공간을 살펴보세요' : '중앙 계단을 기준으로 주변 공간을 살펴보세요'}</span></div><div className={`floor-plan floor-plan-${floor}`}>{!isAnnex && <div className="stair stair-left">↕</div>}{plan.rooms.slice(0, 4).map(room)}{!isAnnex && <div className="central-stair">중앙 계단<br />↕</div>}{plan.rooms.slice(4).map(room)}{!isAnnex && <div className="stair stair-right">↕</div>}</div><div className="floor-map-legend"><span><MapPin /> 현재 위치</span><span><TreasureChestMark /> 획득한 보물</span></div></div>;
}

function FacilityMapPicker({ selected, onSelect, mode = 'select', collected = [], mapView = 'full' }: { selected: LocationId; onSelect: (location: LocationId) => void; mode?: 'select' | 'mission'; collected?: LocationId[]; mapView?: 'full' | 'floor1' | 'floor2' | 'floor3' | 'floor4' }) {
  const rooms: Array<{ id: LocationId; label: string; x: number; y: number; w: number; h: number }> = [
    { id: 'music', label: '음악실', x: 15.3, y: 24.8, w: 9.7, h: 8.1 }, { id: 'g3-1', label: '3학년 1반', x: 25, y: 24.8, w: 6.9, h: 8.1 }, { id: 'g3-2', label: '3학년 2반', x: 31.9, y: 24.8, w: 6.6, h: 8.1 }, { id: 'g3-3', label: '3학년 3반', x: 38.5, y: 24.8, w: 6.8, h: 8.1 }, { id: 'g3-office', label: '3학년 교무실', x: 45.3, y: 24.8, w: 8.7, h: 8.1 }, { id: 'g3-4', label: '3학년 4반', x: 54, y: 24.8, w: 7, h: 8.1 }, { id: 'g3-5', label: '3학년 5반', x: 61, y: 24.8, w: 6.9, h: 8.1 }, { id: 'weclass', label: '위클래스', x: 67.9, y: 24.8, w: 7.2, h: 8.1 }, { id: 'career', label: '진로활동실', x: 75.1, y: 24.8, w: 6.9, h: 8.1 },
    { id: 'computer', label: '컴퓨터실', x: 15.3, y: 36.5, w: 9.7, h: 8.1 }, { id: 'g2-1', label: '2학년 1반', x: 25, y: 36.5, w: 6.9, h: 8.1 }, { id: 'g2-2', label: '2학년 2반', x: 31.9, y: 36.5, w: 6.6, h: 8.1 }, { id: 'g2-3', label: '2학년 3반', x: 38.5, y: 36.5, w: 6.8, h: 8.1 }, { id: 'g2-office', label: '2학년 교무실', x: 45.3, y: 36.5, w: 8.7, h: 8.1 }, { id: 'g2-4', label: '2학년 4반', x: 54, y: 36.5, w: 7, h: 8.1 }, { id: 'g2-5', label: '2학년 5반', x: 61, y: 36.5, w: 6.9, h: 8.1 }, { id: 'science', label: '과학실', x: 67.9, y: 36.5, w: 14.2, h: 8.1 },
    { id: 'art', label: '미술실', x: 15.3, y: 47.2, w: 9.7, h: 8.2 }, { id: 'classroom', label: '1학년 1반', x: 25, y: 47.2, w: 6.9, h: 8.2 }, { id: 'g1-2', label: '1학년 2반', x: 31.9, y: 47.2, w: 6.6, h: 8.2 }, { id: 'g1-3', label: '1학년 3반', x: 38.5, y: 47.2, w: 6.8, h: 8.2 }, { id: 'g1-office', label: '1학년 교무실', x: 45.3, y: 47.2, w: 8.7, h: 8.2 }, { id: 'g1-4', label: '1학년 4반', x: 54, y: 47.2, w: 7, h: 8.2 }, { id: 'g1-5', label: '1학년 5반', x: 61, y: 47.2, w: 6.9, h: 8.2 }, { id: 'science-1', label: '과학실1', x: 67.9, y: 47.2, w: 14.2, h: 8.2 },
    { id: 'archive', label: '보건실', x: 15.3, y: 57.4, w: 9.7, h: 7.7 }, { id: 'main-office', label: '본교무실', x: 25, y: 57.4, w: 13, h: 7.7 }, { id: 'admin', label: '행정실', x: 38, y: 57.4, w: 9.8, h: 7.7 }, { id: 'principal', label: '교장실', x: 57.7, y: 57.4, w: 9.8, h: 7.7 }, { id: 'transition', label: '전환반', x: 67.5, y: 57.4, w: 12.3, h: 7.7 },
    { id: 'gym', label: '체육관', x: 8.8, y: 7.2, w: 27.5, h: 13.5 }, { id: 'warehouse', label: '창고', x: 50.4, y: 14.3, w: 11.5, h: 5.5 }, { id: 'field', label: '운동장', x: 34, y: 71.5, w: 14.5, h: 18.2 }, { id: 'library', label: '도서관', x: 58.6, y: 72.4, w: 24.7, h: 9 }, { id: 'cafeteria', label: '식당', x: 58.6, y: 81.4, w: 24.7, h: 10.2 },
  ];
  return <div className={`real-school-map ${mode === 'mission' ? 'mission-map' : ''} map-view-${mapView}`}><div className="real-map-note">{mode === 'mission' ? '파란 핀은 현재 위치 · 금색 표시는 획득한 보물' : '지도에서 현재 있는 장소를 눌러주세요'}</div><div className="map-crop-window"><div className="real-map-image map-crop-canvas"><img src="/school-treasure-map-v2.png" alt="용인고등학교 보물찾기 학교 지도" />{rooms.map((room) => { const order = collected.indexOf(room.id); const isCollected = order >= 0; return <button key={room.id} type="button" title={room.label} onClick={() => mode === 'select' && onSelect(room.id)} className={`map-hotspot ${selected === room.id ? 'selected' : ''} ${isCollected ? 'treasure-signal' : ''}`} style={{ left: `${room.x}%`, top: `${room.y}%`, width: `${room.w}%`, height: `${room.h}%` }} aria-label={`${room.label}${selected === room.id ? ', 현재 위치' : ''}${isCollected ? `, ${order + 1}번째 보물 획득` : ''}`}>{selected === room.id ? <MapPin /> : isCollected ? <><TreasureChestMark /><small>{order + 1}</small></> : null}</button>; })}</div></div><p className="facility-selection">{mode === 'mission' ? <>현재 위치: <b>{findLocation(selected).name}</b></> : <>선택한 위치: <b>{findLocation(selected).name}</b></>}</p></div>;
}
