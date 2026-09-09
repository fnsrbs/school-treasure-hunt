import {installLocationCamera} from './helpers/locationCamera.mjs';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';

// Explicit opt-in: creates one real QA player. Delete only the printed QA id after verification.
if(process.env.RUN_LIVE_SUPABASE_TEST!=='1')throw new Error('Set RUN_LIVE_SUPABASE_TEST=1 against the configured development server.');
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
await installLocationCamera(page);
const nickname='QA'+Date.now().toString().slice(-7);
console.log('QA nickname:',nickname);
try{
 await page.goto('http://localhost:3000/');
 await page.getByRole('button',{name:'새 게임',exact:true}).click();
 await page.getByLabel('① 닉네임 입력').fill(nickname);
 await page.getByRole('button',{name:'현재 위치 중앙현관',exact:true}).click();
 await page.getByRole('button',{name:'다음',exact:true}).evaluate(el=>{el.click();el.click();});
 await page.getByText('보물이 배정되었습니다!').waitFor();
 const id=await page.evaluate(()=>JSON.parse(localStorage.getItem('school-treasure-hunt-v1')).player.id);
 console.log('QA player id:',id);
 await page.getByRole('button',{name:'확인',exact:true}).click();
 for(let n=0;n<3;n++){
  await page.getByRole('button',{name:'힌트 보기',exact:true}).click();
  await page.getByRole('button',{name:'AR 마커 인식하기',exact:true}).click();
  await page.getByRole('button',{name:'확인',exact:true}).click();
  if(n<2)await page.getByRole('button',{name:'다음 보물 지도 보기',exact:true}).click();
 }
 await page.getByRole('button',{name:'최종 보물 확인하기',exact:true}).click();
 await page.getByRole('button',{name:'교환권 확인하기',exact:true}).click();
 const coupon=await page.getByTestId('coupon-number').textContent();
 assert.match(coupon,/^[1-9][0-9]{5}$/);
 await page.reload();assert.equal(await page.getByTestId('coupon-number').textContent(),coupon);
 await page.getByRole('button',{name:'메인으로',exact:true}).click();
 await page.getByRole('button',{name:'쿠폰 조회',exact:true}).click();
 await page.getByLabel('쿠폰 번호',{exact:true}).fill(' '+coupon+' ');
 await page.getByRole('button',{name:'조회하기',exact:true}).click();
 await page.locator('dd').filter({hasText:nickname}).waitFor();
 console.log('PASS: real Supabase registration, 3 treasures, completion, refresh, coupon lookup.');
}finally{await browser.close();}
