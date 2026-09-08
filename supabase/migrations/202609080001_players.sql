-- Game records are accessible only through the narrowly scoped RPCs below.
create function public.trim_player_nickname(value text) returns text
language sql immutable strict set search_path = '' as $$
 select btrim(value, E' \t\n\r\f\v' || chr(160) || chr(5760) ||
 chr(8192)||chr(8193)||chr(8194)||chr(8195)||chr(8196)||chr(8197)||chr(8198)||chr(8199)||chr(8200)||chr(8201)||chr(8202)||chr(8232)||chr(8233)||chr(8239)||chr(8287)||chr(12288)||chr(65279));
$$;
create function public.normalize_player_nickname(value text) returns text
language sql immutable strict set search_path = '' as $$
 select translate(public.trim_player_nickname(value), 'ABCDEFGHIJKLMNOPQRSTUVWXYZ', 'abcdefghijklmnopqrstuvwxyz');
$$;

create table public.players (
 id uuid primary key default gen_random_uuid(),
 nickname text not null check (char_length(public.trim_player_nickname(nickname)) between 1 and 10),
 nickname_normalized text generated always as (public.normalize_player_nickname(nickname)) stored not null,
 is_completed boolean not null default false,
 coupon_number text,
 completed_at timestamptz,
 created_at timestamptz not null default now(),
 updated_at timestamptz not null default now(),
 player_token_hash text not null,
 constraint players_nickname_normalized_key unique(nickname_normalized),
 constraint players_coupon_number_key unique(coupon_number),
 constraint players_token_hash_key unique(player_token_hash),
 constraint players_coupon_format check(coupon_number is null or coupon_number ~ '^[1-9][0-9]{5}$'),
 constraint players_completion_consistent check(
  (not is_completed and coupon_number is null and completed_at is null) or
  (is_completed and coupon_number is not null and completed_at is not null))
);
alter table public.players enable row level security;
revoke all on table public.players from public, anon, authenticated;

create function public.touch_player() returns trigger
language plpgsql set search_path = '' as $$
begin
 new.nickname := public.trim_player_nickname(new.nickname);
 new.updated_at := clock_timestamp();
 return new;
end;
$$;
create trigger players_touch before insert or update on public.players
 for each row execute function public.touch_player();

-- Token permits recovery after a registration response is lost, not nickname-based takeover.
create function public.nickname_available(p_nickname text, p_token text) returns boolean
language sql stable security definer set search_path = '' as $$
 select not exists(select 1 from public.players p
 where p.nickname_normalized=public.normalize_player_nickname(p_nickname)
 and p.player_token_hash <> encode(extensions.digest(coalesce(p_token,''),'sha256'),'hex'));
$$;
create function public.register_player(p_nickname text, p_token text)
returns table(id uuid, nickname text, is_completed boolean, coupon_number text, completed_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare v_hash text; v_player public.players%rowtype;
begin
 if p_token is null or p_token !~ '^[a-f0-9]{64}$' then raise exception using errcode='22023', message='INVALID_PLAYER_TOKEN'; end if;
 if p_nickname is null or char_length(public.trim_player_nickname(p_nickname)) not between 1 and 10 then raise exception using errcode='22023', message='INVALID_NICKNAME'; end if;
 v_hash := encode(extensions.digest(p_token,'sha256'),'hex');
 -- Serializes retries of the same registration request.
 perform pg_advisory_xact_lock(hashtextextended(v_hash,0));
 select p.* into v_player from public.players p where p.player_token_hash=v_hash;
 if found then
  if v_player.nickname_normalized <> public.normalize_player_nickname(p_nickname) then raise exception using errcode='22023',message='INVALID_PLAYER_TOKEN'; end if;
 else
  insert into public.players(nickname,player_token_hash) values(public.trim_player_nickname(p_nickname),v_hash) returning * into v_player;
 end if;
 return query select v_player.id,v_player.nickname,v_player.is_completed,v_player.coupon_number,v_player.completed_at;
end;
$$;

create function public.complete_game(p_player_id uuid,p_token text,p_coupon_number text)
returns table(coupon_number text,nickname text,is_completed boolean,completed_at timestamptz)
language plpgsql security definer set search_path = '' as $$
declare v_player public.players%rowtype;
begin
 select p.* into v_player from public.players p
 where p.id=p_player_id and p.player_token_hash=encode(extensions.digest(coalesce(p_token,''),'sha256'),'hex')
 for update;
 if not found then raise exception using errcode='42501',message='PLAYER_NOT_FOUND'; end if;
 if not v_player.is_completed then
  if p_coupon_number is null or p_coupon_number !~ '^[1-9][0-9]{5}$' then raise exception using errcode='22023',message='INVALID_COUPON'; end if;
  update public.players p set is_completed=true,coupon_number=p_coupon_number,completed_at=clock_timestamp()
   where p.id=v_player.id returning p.* into v_player;
 end if;
 return query select v_player.coupon_number,v_player.nickname,v_player.is_completed,v_player.completed_at;
end;
$$;

create function public.lookup_coupon(p_coupon_number text)
returns table(coupon_number text,nickname text,is_completed boolean,completed_at timestamptz)
language sql stable security definer set search_path = '' as $$
 select p.coupon_number,p.nickname,p.is_completed,p.completed_at from public.players p
 where p.coupon_number=public.trim_player_nickname(p_coupon_number) and p.is_completed;
$$;
revoke all on function public.trim_player_nickname(text),public.normalize_player_nickname(text),
 public.touch_player(),public.nickname_available(text,text),public.register_player(text,text),
 public.complete_game(uuid,text,text),public.lookup_coupon(text) from public,anon,authenticated;
grant execute on function public.nickname_available(text,text),public.register_player(text,text),
 public.complete_game(uuid,text,text),public.lookup_coupon(text) to anon,authenticated;
comment on column public.players.player_token_hash is 'SHA-256 of a client-generated 256-bit ownership token. Never returned by public RPCs.';
comment on table public.players is 'No direct anon/authenticated access. RLS default-deny; authorized operations use limited SECURITY DEFINER RPCs.';
