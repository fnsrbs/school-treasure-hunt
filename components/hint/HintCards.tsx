import {generateHints} from '@/lib/game/generateHints';
import type {GameState} from '@/types/game';
export default function HintCards({game}:{game:GameState}){const hints=generateHints(game.currentRoute);return <div className="hint-cards">{hints.map((hint,i)=><div key={i} className={`hint-card ${i>=game.hintStage?'locked':''}`}><small>{i+1}단계 힌트</small><p>{i<game.hintStage?hint:'이전 마커를 인식하면 열립니다.'}</p></div>)}</div>}
