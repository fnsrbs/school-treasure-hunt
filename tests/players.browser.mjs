import {installLocationCamera} from './helpers/locationCamera.mjs';
import {chromium} from '@playwright/test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';

// UI fault injection. The companion SQL suite separately verifies real database behavior.
const browser=await chromium.launch({channel:'chrome',headless:true});
const page=await browser.newPage({viewport:{width:390,height:844}});
await installLocationCamera(page);
let registrations=0,completions=0,lookups=0,failComplete=true,mode='ok',issued='';
await page.route('**/rest/v1/rpc/**',async route=>{
 const name=route.request().url().split('/').pop(),args=route.request().postDataJSON();
 const reply=(body,status=200)=>route.fulfill({status,contentType:'application/json',body:JSON.stringify(body)});
 if(mode==='offline')return route.abort('failed');
 if(name==='nickname_available')return reply(mode!=='duplicate');
 if(name==='register_player'){
  registrations++;await new Promise(r=>setTimeout(r,350));
  return reply([{id:'11111111-1111-4111-8111-111111111111',nickname:args.p_nickname,is_completed:false,coupon_number:null,completed_at:null}]);
 }
 if(name==='complete_game'){
  completions++;if(failComplete)return reply({code:'503',message:'temporary failure'},503);
  issued ||= args.p_coupon_number;
  return reply([{coupon_number:issued,nickname:'BrowserQA',is_completed:true,completed_at:'2026-09-08T00:00:00Z'}]);
 }
 if(name==='lookup_coupon'){
  lookups++;await new Promise(r=>setTimeout(r,200));
  return reply(args.p_coupon_number===issued?[{coupon_number:issued,nickname:'BrowserQA',is_completed:true,completed_at:'2026-09-08T00:00:00Z'}]:[]);
 }
 throw new Error('Unexpected RPC '+name);
});
try{
 await page.goto('http://localhost:3000/');
 await page.getByRole('button',{name:'새 게임',exact:true}).click();
 await page.getByRole('button',{name:'현재 위치 중앙현관',exact:true}).click();
 await page.getByRole('button',{name:'다음',exact:true}).click();
 await page.getByRole('status').filter({hasText:'닉네임을 입력해 주세요.'}).waitFor();
 await page.getByLabel('① 닉네임 입력').fill('  BrowserQA  ');
 mode='duplicate';
 await page.getByRole('button',{name:'다음',exact:true}).click();
 await page.getByRole('status').filter({hasText:'이미 사용 중인 닉네임'}).waitFor();
 assert.equal(registrations,0);
 mode='offline';
 await page.getByRole('button',{name:'다음',exact:true}).click();
 await page.getByRole('status').filter({hasText:'인터넷 연결을 확인'}).waitFor();
 assert.match(page.url(),/setup/);
 mode='ok';
 await page.getByRole('button',{name:'다음',exact:true}).evaluate(el=>{el.click();el.click();el.click();});
 await page.getByText('보물이 배정되었습니다!').waitFor();
 assert.equal(registrations,1);
 await page.getByRole('button',{name:'확인',exact:true}).click();
 for(let n=0;n<3;n++){
  await page.getByRole('button',{name:'힌트 보기',exact:true}).click();
  await page.getByRole('button',{name:'AR 마커 인식하기',exact:true}).click();
  await page.getByRole('button',{name:'확인',exact:true}).click();
  if(n<2)await page.getByRole('button',{name:'다음 보물 지도 보기',exact:true}).click();
 }
 await page.getByRole('alert').filter({hasText:'게임 완료 정보를 저장하지 못했습니다'}).waitFor();
 assert.match(page.url(),/result/);
 const candidate=await page.evaluate(()=>JSON.parse(localStorage.getItem('school-treasure-hunt-v1')).coupon.number);
 await page.reload();
 await page.getByRole('button',{name:'최종 보물 확인하기',exact:true}).waitFor();
 assert.equal(await page.evaluate(()=>JSON.parse(localStorage.getItem('school-treasure-hunt-v1')).coupon.number),candidate);
 failComplete=false;
 await page.getByRole('button',{name:'최종 보물 확인하기',exact:true}).click();
 await page.getByRole('button',{name:'교환권 확인하기',exact:true}).click();
 assert.equal(await page.getByTestId('coupon-number').textContent(),candidate);
 await page.reload();assert.equal(await page.getByTestId('coupon-number').textContent(),candidate);
 await page.getByRole('button',{name:'메인으로',exact:true}).click();
 await page.getByRole('button',{name:'쿠폰 조회',exact:true}).click();
 await page.getByLabel('쿠폰 번호',{exact:true}).fill(' '+candidate+' ');
 await page.getByRole('button',{name:'조회하기',exact:true}).evaluate(el=>{el.click();el.click();});
 await page.locator('dd').filter({hasText:'BrowserQA'}).waitFor();
 assert.equal(lookups,1);
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
 await fs.mkdir('test-results',{recursive:true});
 await page.screenshot({path:'test-results/coupon-lookup-mobile.png',fullPage:true});
 await page.getByLabel('쿠폰 번호',{exact:true}).fill('000000');
 await page.getByRole('button',{name:'조회하기',exact:true}).click();
 await page.getByRole('status').filter({hasText:'등록되지 않은 쿠폰 번호입니다.'}).waitFor();
 mode='offline';await page.getByRole('button',{name:'조회하기',exact:true}).click();
 await page.getByRole('status').filter({hasText:'쿠폰 정보를 조회하지 못했습니다.'}).waitFor();
 mode='ok';
 await page.evaluate(()=>{const key='school-treasure-hunt-v1';const game=JSON.parse(localStorage.getItem(key));delete game.database;game.status='complete';game.screen='coupon';localStorage.setItem(key,JSON.stringify(game));});
 await page.goto('http://localhost:3000/game/coupon/');
 await page.getByRole('button',{name:'최종 보물 확인하기',exact:true}).click();
 await page.getByRole('button',{name:'교환권 확인하기',exact:true}).click();
 assert.equal(await page.getByTestId('coupon-number').textContent(),candidate);
 assert.equal(registrations,2);
 await page.setViewportSize({width:1280,height:900});
 assert.equal(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth),true);
 console.log('PASS: mobile/desktop, empty/duplicate/offline registration, repeated clicks, 3 treasure flow, completion failure/reload/retry, stable coupon, lookup/missing/error.',{registrations,completions,lookups});
}finally{await browser.close();}
