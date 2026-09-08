begin;
do $test$
declare a record; b record; c record; stamp timestamptz; h text; n integer;
begin
 select * into a from public.register_player(E' \tTreasure\n',repeat('a',64));
 if a.nickname <> 'Treasure' or a.is_completed or a.coupon_number is not null or a.completed_at is not null then raise exception 'registration defaults'; end if;
 select * into b from public.register_player('treasure',repeat('a',64));
 if a.id<>b.id then raise exception 'registration not idempotent'; end if;
 if public.nickname_available(' TREASURE ',repeat('b',64)) then raise exception 'duplicate precheck'; end if;
 begin perform public.register_player(' treasure ',repeat('b',64)); raise exception 'duplicate accepted';
 exception when unique_violation then get stacked diagnostics h=constraint_name; if h<>'players_nickname_normalized_key' then raise; end if; end;
 begin perform public.register_player(E' \t\n',repeat('b',64)); raise exception 'empty accepted'; exception when invalid_parameter_value then null; end;
 begin perform public.complete_game(a.id,repeat('b',64),'123456'); raise exception 'wrong owner accepted'; exception when insufficient_privilege then null; end;
 stamp:=clock_timestamp();
 select * into b from public.complete_game(a.id,repeat('a',64),'123456');
 if b.is_completed is not true or b.coupon_number<>'123456' or b.completed_at<stamp or b.completed_at>clock_timestamp() then raise exception 'completion values'; end if;
 select * into c from public.complete_game(a.id,repeat('a',64),'654321');
 if c.coupon_number<>b.coupon_number or c.completed_at<>b.completed_at then raise exception 'completion not idempotent'; end if;
 select * into c from public.lookup_coupon(' 123456 ');
 if c.nickname<>'Treasure' then raise exception 'lookup owner'; end if;
 select count(*) into n from public.lookup_coupon('000000'); if n<>0 then raise exception 'missing lookup'; end if;
 select * into c from public.register_player('Other',repeat('c',64));
 begin perform public.complete_game(c.id,repeat('c',64),'123456'); raise exception 'coupon collision accepted';
 exception when unique_violation then get stacked diagnostics h=constraint_name; if h<>'players_coupon_number_key' then raise; end if; end;
 if (select is_completed from public.players where id=c.id) then raise exception 'non atomic collision'; end if;
 begin update public.players set is_completed=true where id=c.id; raise exception 'inconsistent complete'; exception when check_violation then null; end;
 begin update public.players set coupon_number='222222' where id=c.id; raise exception 'inconsistent incomplete'; exception when check_violation then null; end;
 select updated_at into stamp from public.players where id=c.id;
 update public.players set nickname='Other2' where id=c.id;
 if (select updated_at from public.players where id=c.id)<=stamp then raise exception 'timestamp trigger'; end if;
end;
$test$;
set local role anon;
do $test$
declare a record;
begin
 begin perform * from public.players; raise exception 'anon table read allowed'; exception when insufficient_privilege then null; end;
 begin update public.players set nickname='Stolen'; raise exception 'anon update allowed'; exception when insufficient_privilege then null; end;
 select * into a from public.register_player('AnonTest',repeat('d',64));
 perform public.complete_game(a.id,repeat('d',64),'789123');
 if not exists(select 1 from public.lookup_coupon('789123')) then raise exception 'anon rpc denied'; end if;
end;
$test$;
rollback;
select 'PASS: defaults, whitespace/case uniqueness, registration retries, ownership, completion atomicity/idempotency, coupon collision, lookup, timestamps, constraints, anon grants; all test rows rolled back' as result;
