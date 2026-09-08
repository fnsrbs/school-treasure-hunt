import {createPlayerToken,normalizeNickname,PLAYER_ERROR} from './players';
const KEY='school-treasure-hunt-pending-player';
// Retain the same token across timeouts/reloads until the game is durably saved.
export function registrationToken(nickname:string):string{
 try{
  const saved:unknown=JSON.parse(localStorage.getItem(KEY)||'null');
  if(saved&&typeof saved==='object'){
   const r=saved as Record<string,unknown>;
   if(r.nickname===normalizeNickname(nickname)&&typeof r.token==='string'&&/^[a-f0-9]{64}$/.test(r.token))return r.token;
  }
  const token=createPlayerToken();
  localStorage.setItem(KEY,JSON.stringify({nickname:normalizeNickname(nickname),token}));
  return token;
 }catch{throw new Error(PLAYER_ERROR);}
}
export function clearRegistration(){try{localStorage.removeItem(KEY);}catch{/* The saved game still owns its token. */}}
