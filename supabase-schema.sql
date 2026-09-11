-- 简书 · 纯净高知学习社区 —— Supabase 表结构
-- 用法：Supabase Dashboard → SQL Editor → 新建查询 → 整份粘贴 → Run
-- 可重复执行（都是 if not exists / drop policy if exists）
--
-- 包含两部分：
--   1) reads        已读记录（原有）
--   2) reflections  读者感悟（新增：文字 + 图片），配套 Storage 桶 reflections

-- ============================================================
-- 1. 已读记录
-- ============================================================
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


-- ============================================================
-- 2. 读者感悟
--    所有人可读；只有本人能发、能删自己的
-- ============================================================
create table if not exists reflections (
  id          uuid        primary key default gen_random_uuid(),
  user_id     uuid        references auth.users(id) on delete cascade not null,
  author_name text,
  book_id     text        not null,
  content     text        not null default '',
  image_urls  text[]      not null default '{}',
  created_at  timestamptz not null default now()
);

-- 首页社区按时间倒序；书详情页按 (book_id, 时间) 倒序
create index if not exists reflections_time_idx on reflections (created_at desc);
create index if not exists reflections_book_idx on reflections (book_id, created_at desc);

alter table reflections enable row level security;

drop policy if exists "reflections read"   on reflections;
drop policy if exists "reflections insert" on reflections;
drop policy if exists "reflections delete" on reflections;

-- 社区是公开的：任何人都能读到所有感悟
create policy "reflections read"
  on reflections for select
  using (true);

create policy "reflections insert"
  on reflections for insert
  with check (auth.uid() = user_id);

create policy "reflections delete"
  on reflections for delete
  using (auth.uid() = user_id);


-- ============================================================
-- 3. 图片存储桶
--    公开读；写/删只能在自己的目录（<user_id>/xxx.jpg）下
-- ============================================================
insert into storage.buckets (id, name, public)
values ('reflections', 'reflections', true)
on conflict (id) do nothing;

drop policy if exists "reflections img read"   on storage.objects;
drop policy if exists "reflections img insert" on storage.objects;
drop policy if exists "reflections img delete" on storage.objects;

create policy "reflections img read"
  on storage.objects for select
  using (bucket_id = 'reflections');

create policy "reflections img insert"
  on storage.objects for insert
  with check (
    bucket_id = 'reflections'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "reflections img delete"
  on storage.objects for delete
  using (
    bucket_id = 'reflections'
    and auth.uid()::text = (storage.foldername(name))[1]
  );
