import test from 'node:test';
import assert from 'node:assert/strict';
import {PHASE_PRODUCTION_BUILD,PHASE_DEVELOPMENT_SERVER} from 'next/constants';
import nextConfig from '../next.config';

test('Vercel refuses a build with absent or blank Supabase public configuration',()=>{
 const names=['VERCEL','NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY'] as const;
 const previous=names.map(name=>process.env[name]);
 try{
  process.env.VERCEL='1';
  delete process.env.NEXT_PUBLIC_SUPABASE_URL;
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='  ';
  assert.throws(()=>nextConfig(PHASE_PRODUCTION_BUILD),/NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY/);
  process.env.NEXT_PUBLIC_SUPABASE_URL='https://example.supabase.co';
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY='test-public-key';
  assert.equal(nextConfig(PHASE_PRODUCTION_BUILD).output,'export');
  delete process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  assert.doesNotThrow(()=>nextConfig(PHASE_DEVELOPMENT_SERVER));
  delete process.env.VERCEL;
  assert.doesNotThrow(()=>nextConfig(PHASE_PRODUCTION_BUILD));
 }finally{
  names.forEach((name,index)=>{if(previous[index]===undefined)delete process.env[name];else process.env[name]=previous[index];});
 }
});
