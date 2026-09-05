import {ArrowLeft} from 'lucide-react';
export function Panel({children,onBack,backLabel='메인',className=''}:{children:React.ReactNode;onBack?:()=>void;backLabel?:string;className?:string}){return <section className={`parchment panel ${className}`}>{onBack&&<button className="back" onClick={onBack}><ArrowLeft size={15}/>{backLabel}</button>}{children}</section>}
export function Badge({children}:{children:React.ReactNode}){return <div className="badge">{children}</div>}
export function GoldButton({children,onClick,disabled=false}:{children:React.ReactNode;onClick?:()=>void;disabled?:boolean}){return <button className="gold" onClick={onClick} disabled={disabled}>{children}</button>}
