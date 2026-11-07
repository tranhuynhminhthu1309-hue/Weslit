-- Thêm ảnh đại diện nhân vật cho thành viên. Chạy một lần trong SQL Editor.
alter table members add column if not exists avatar jsonb;

create or replace function create_group(p_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare gid uuid; uname text;
  animals text[] := array['cat','dog','bear','rabbit','fox','frog','pig','chick','fish','octopus','snail','clam','leopard','tiger','sloth','snake'];
  eyes text[] := array['dot','happy','wink','star'];
  mouths text[] := array['smile','open','cat','o'];
begin
  if auth.uid() is null then raise exception 'Chưa đăng nhập'; end if;
  insert into groups (name, created_by) values (trim(p_name), auth.uid()) returning id into gid;
  insert into group_users (group_id, user_id, role) values (gid, auth.uid(), 'owner');
  select coalesce(nullif(display_name, ''), 'Tôi') into uname from profiles where id = auth.uid();
  insert into members (group_id, name, user_id, color, avatar)
  values (gid, coalesce(uname, 'Tôi'), auth.uid(), '#6366f1',
    jsonb_build_object('animal', animals[1 + floor(random()*16)::int], 'eyes', eyes[1 + floor(random()*4)::int], 'mouth', mouths[1 + floor(random()*4)::int], 'acc', 'none'));
  return gid;
end;
$$;

-- Tặng nhân vật ngẫu nhiên cho các thành viên đã có
update members set avatar = jsonb_build_object(
  'animal', (array['cat','dog','bear','rabbit','fox','frog','pig','chick','fish','octopus','snail','clam','leopard','tiger','sloth','snake'])[1 + floor(random()*16)::int],
  'eyes', (array['dot','happy','wink','star'])[1 + floor(random()*4)::int],
  'mouth', (array['smile','open','cat','o'])[1 + floor(random()*4)::int],
  'acc', 'none') where avatar is null;
