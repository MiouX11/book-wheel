-- 读书转盘 Supabase 表结构
-- 在 Supabase Dashboard → SQL Editor 里粘贴运行一次即可
-- 已经存在时可先 drop table reads;

create table if not exists reads (
  user_id    uuid        references auth.users(id) on delete cascade,
  book_id    text        not null,
  created_at timestamptz default now(),
  primary key (user_id, book_id)
);

alter table reads enable row level security;

drop policy if exists "own reads read"   on reads;
drop policy if exists "own reads insert" on reads;
drop policy if exists "own reads delete" on reads;

create policy "own reads read"
  on reads for select
  using (auth.uid() = user_id);

create policy "own reads insert"
  on reads for insert
  with check (auth.uid() = user_id);

create policy "own reads delete"
  on reads for delete
  using (auth.uid() = user_id);
