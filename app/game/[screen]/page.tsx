import GameApp from '@/components/GameApp';
export function generateStaticParams(){return ['setup','assignment','map','hint','ar','result','final','coupon','lookup'].map(screen=>({screen}));}
export default async function Page({params}:{params:Promise<{screen:string}>}){const {screen}=await params;return <GameApp initialScreen={screen}/>}
