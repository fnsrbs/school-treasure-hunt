import type { NextConfig } from 'next';
import { PHASE_PRODUCTION_BUILD } from 'next/constants';
const config: NextConfig = { output: 'export', images: { unoptimized: true }, trailingSlash: true };
export default function nextConfig(phase:string):NextConfig {
 if(phase===PHASE_PRODUCTION_BUILD&&process.env.VERCEL==='1'){
  const missing=['NEXT_PUBLIC_SUPABASE_URL','NEXT_PUBLIC_SUPABASE_ANON_KEY'].filter(name=>!process.env[name]?.trim());
  if(missing.length)throw new Error(`Vercel Supabase configuration is missing: ${missing.join(', ')}. Set these variables for this deployment environment and redeploy.`);
 }
 return config;
}
