import type { Metadata, Viewport } from 'next';
import './globals.css';
export const metadata:Metadata={title:'학교 AR 보물찾기',description:'힌트를 따라 학교 곳곳에 숨겨진 세 개의 보물을 찾아보세요.'};
export const viewport:Viewport={width:'device-width',initialScale:1,themeColor:'#263318'};
export default function RootLayout({children}:{children:React.ReactNode}){return <html lang="ko"><body>{children}</body></html>}
