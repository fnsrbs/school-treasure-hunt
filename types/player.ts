export type PlayerRecord={id:string;nickname:string;is_completed:boolean;coupon_number:string|null;completed_at:string|null};
export type CouponLookup={coupon_number:string;nickname:string;is_completed:boolean;completed_at:string};
export type GameDatabase={token:string;registered:boolean;completedAt?:string};
