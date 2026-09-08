export class SupabaseRpcError extends Error {
 constructor(public code:string, message:string){super(message);this.name='SupabaseRpcError';}
}
export type RpcTransport = (name:string,args:Record<string,string>)=>Promise<unknown>;

// A small HTTP RPC client preserves the existing static-export architecture.
// Only public configuration belongs here; ownership is checked inside each RPC.
export const callRpc:RpcTransport = async (name,args) => {
 const url=process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
 const key=process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY?.trim();
 if(!url||!key)throw new SupabaseRpcError('CONFIG','Supabase configuration is missing');
 const headers:Record<string,string>={'Content-Type':'application/json',apikey:key};
 // Publishable keys use apikey; legacy anon JWTs also support Authorization.
 if(!key.startsWith('sb_publishable_'))headers.Authorization=`Bearer ${key}`;
 const response=await fetch(`${url.replace(/\/$/,'')}/rest/v1/rpc/${name}`,{
  method:'POST',headers,body:JSON.stringify(args),signal:AbortSignal.timeout(15000),cache:'no-store'
 });
 const data:unknown=await response.json();
 if(!response.ok){
  const error=data&&typeof data==='object'?data as Record<string,unknown>:{};
  throw new SupabaseRpcError(typeof error.code==='string'?error.code:String(response.status),typeof error.message==='string'?error.message:'RPC request failed');
 }
 return data;
};
