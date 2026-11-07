-- WeSplit: schema Supabase. Dán toàn bộ file này vào SQL Editor và chạy một lần.
-- Mọi dữ liệu thuộc về một nhóm (group_id) và chỉ thành viên của nhóm mới đọc/ghi được (RLS).

create extension if not exists pgcrypto;

-- ============ BẢNG ============
create table if not exists profiles (
  id uuid primary key references auth.users on delete cascade,
  display_name text not null default '',
  created_at timestamptz not null default now()
);

create table if not exists groups (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  icon text,  -- emoji đại diện nhóm
  color text, -- màu nền ảnh đại diện nhóm
  invite_code text not null unique default substr(md5(gen_random_uuid()::text), 1, 8),
  created_by uuid references auth.users,
  created_at timestamptz not null default now()
);

-- Tài khoản đăng nhập nào được vào nhóm nào
create table if not exists group_users (
  group_id uuid not null references groups on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null default 'member' check (role in ('owner', 'member')),
  primary key (group_id, user_id)
);

-- Thành viên chia bill (có thể chưa có tài khoản: chỉ cần tên/nickname). user_id liên kết khi họ tham gia nhóm.
create table if not exists members (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups on delete cascade,
  name text not null,
  color text not null default '#6366f1',
  user_id uuid references auth.users on delete set null,
  bank_bin text,
  bank_account text,
  bank_holder text,
  avatar jsonb, -- {animal, eyes, mouth, acc}
  active boolean not null default true, -- "xóa khỏi nhóm" = ẩn, vì bill cũ vẫn tham chiếu thành viên này
  created_at timestamptz not null default now()
);
create index if not exists members_group_idx on members (group_id);

create table if not exists events (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups on delete cascade,
  name text not null,
  event_date timestamptz not null default now(),
  location text,
  note text,
  status text not null default 'draft' check (status in ('draft', 'locked')),
  created_by uuid references auth.users,
  created_at timestamptz not null default now(),
  locked_at timestamptz
);
create index if not exists events_group_idx on events (group_id, event_date desc);

-- Người tham gia được chọn riêng cho từng sự kiện
create table if not exists event_participants (
  event_id uuid not null references events on delete cascade,
  member_id uuid not null references members on delete restrict,
  group_id uuid not null references groups on delete cascade,
  primary key (event_id, member_id)
);

-- Số tiền là VNĐ, lưu số nguyên.
create table if not exists bills (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups on delete cascade,
  event_id uuid not null references events on delete cascade,
  restaurant text not null default '',
  total bigint not null check (total >= 0),
  paid_by uuid not null references members on delete restrict, -- người ứng tiền, có thể khác người tạo sự kiện
  paid_at date not null default current_date,
  note text,
  -- chi phí chung = total - tổng món riêng, chia đều cho các thành viên trong mảng này
  shared_member_ids uuid[] not null default '{}',
  created_by uuid references auth.users,
  created_at timestamptz not null default now()
);
create index if not exists bills_event_idx on bills (event_id);

create table if not exists bill_personal_items (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups on delete cascade,
  bill_id uuid not null references bills on delete cascade,
  name text not null default '',
  amount bigint not null check (amount > 0),
  member_id uuid not null references members on delete restrict
);
create index if not exists bpi_bill_idx on bill_personal_items (bill_id);

create table if not exists bill_images (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups on delete cascade,
  event_id uuid not null references events on delete cascade,
  bill_id uuid references bills on delete cascade,
  path text not null,
  uploaded_by uuid references auth.users,
  created_at timestamptz not null default now()
);
create index if not exists bill_images_event_idx on bill_images (event_id);

-- Thanh toán: chỉ có hiệu lực (trừ công nợ) khi status = 'confirmed', tức người nhận đã xác nhận.
create table if not exists payments (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups on delete cascade,
  from_member uuid not null references members on delete restrict,
  to_member uuid not null references members on delete restrict,
  amount bigint not null check (amount > 0),
  status text not null default 'pending' check (status in ('pending', 'confirmed', 'rejected')),
  note text,
  created_by uuid references auth.users,
  created_at timestamptz not null default now(),
  confirmed_by uuid references auth.users,
  confirmed_at timestamptz
);
create index if not exists payments_group_idx on payments (group_id, created_at desc);

create table if not exists activity_log (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references groups on delete cascade,
  actor uuid references auth.users,
  actor_name text,
  action text not null,
  entity text,
  entity_id uuid,
  details jsonb,
  created_at timestamptz not null default now()
);
create index if not exists activity_group_idx on activity_log (group_id, created_at desc);

-- ============ HÀM ============
create or replace function is_group_member(gid uuid)
returns boolean language sql security definer stable set search_path = public as $$
  select exists (select 1 from group_users where group_id = gid and user_id = auth.uid());
$$;

-- Tự tạo profile khi có tài khoản mới
create or replace function handle_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data ->> 'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function handle_new_user();

-- Tạo nhóm: người tạo thành chủ nhóm và có sẵn một thành viên mang tên mình
create or replace function create_group(p_name text)
returns uuid language plpgsql security definer set search_path = public as $$
declare gid uuid; uname text;
begin
  if auth.uid() is null then raise exception 'Chưa đăng nhập'; end if;
  insert into groups (name, created_by) values (trim(p_name), auth.uid()) returning id into gid;
  insert into group_users (group_id, user_id, role) values (gid, auth.uid(), 'owner');
  select coalesce(nullif(display_name, ''), 'Tôi') into uname from profiles where id = auth.uid();
  insert into members (group_id, name, user_id, color)
  values (gid, coalesce(uname, 'Tôi'), auth.uid(), '#6366f1');
  return gid;
end;
$$;

-- Tham gia nhóm bằng mã mời
create or replace function join_group(p_code text)
returns uuid language plpgsql security definer set search_path = public as $$
declare gid uuid;
begin
  if auth.uid() is null then raise exception 'Chưa đăng nhập'; end if;
  select id into gid from groups where invite_code = lower(trim(p_code));
  if gid is null then raise exception 'Mã mời không đúng'; end if;
  insert into group_users (group_id, user_id) values (gid, auth.uid()) on conflict do nothing;
  return gid;
end;
$$;

grant execute on function create_group(text) to authenticated;
grant execute on function join_group(text) to authenticated;
grant execute on function is_group_member(uuid) to authenticated;

-- ============ RLS ============
alter table profiles enable row level security;
alter table groups enable row level security;
alter table group_users enable row level security;
alter table members enable row level security;
alter table events enable row level security;
alter table event_participants enable row level security;
alter table bills enable row level security;
alter table bill_personal_items enable row level security;
alter table bill_images enable row level security;
alter table payments enable row level security;
alter table activity_log enable row level security;

drop policy if exists profiles_self on profiles;
create policy profiles_self on profiles for all using (id = auth.uid()) with check (id = auth.uid());

drop policy if exists groups_select on groups;
create policy groups_select on groups for select using (is_group_member(id));
drop policy if exists groups_update on groups;
create policy groups_update on groups for update using (is_group_member(id));

drop policy if exists group_users_select on group_users;
create policy group_users_select on group_users for select using (is_group_member(group_id));
drop policy if exists group_users_leave on group_users;
create policy group_users_leave on group_users for delete using (user_id = auth.uid());

do $$
declare t text;
begin
  foreach t in array array['members','events','event_participants','bills','bill_personal_items','bill_images','payments','activity_log']
  loop
    execute format('drop policy if exists %I_all on %I', t, t);
    execute format('create policy %I_all on %I for all using (is_group_member(group_id)) with check (is_group_member(group_id))', t, t);
  end loop;
end $$;

-- Nhật ký hoạt động chỉ được thêm, không sửa/xóa, để làm bằng chứng khi nhiều người cùng quản lý
drop policy if exists activity_log_all on activity_log;
drop policy if exists activity_log_select on activity_log;
drop policy if exists activity_log_insert on activity_log;
create policy activity_log_select on activity_log for select using (is_group_member(group_id));
create policy activity_log_insert on activity_log for insert with check (is_group_member(group_id));

-- ============ STORAGE (ảnh hóa đơn) ============
-- Đường dẫn file: <group_id>/<event_id>/<tên file>, nên chỉ thành viên của nhóm đó mới xem được.
insert into storage.buckets (id, name, public) values ('bill-images', 'bill-images', false)
on conflict (id) do nothing;

drop policy if exists bill_images_read on storage.objects;
create policy bill_images_read on storage.objects for select
  using (bucket_id = 'bill-images' and is_group_member(((storage.foldername(name))[1])::uuid));
drop policy if exists bill_images_write on storage.objects;
create policy bill_images_write on storage.objects for insert
  with check (bucket_id = 'bill-images' and is_group_member(((storage.foldername(name))[1])::uuid));
drop policy if exists bill_images_update on storage.objects;
create policy bill_images_update on storage.objects for update
  using (bucket_id = 'bill-images' and is_group_member(((storage.foldername(name))[1])::uuid));
drop policy if exists bill_images_delete on storage.objects;
create policy bill_images_delete on storage.objects for delete
  using (bucket_id = 'bill-images' and is_group_member(((storage.foldername(name))[1])::uuid));
