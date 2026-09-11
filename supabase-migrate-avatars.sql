-- 简书 · 头像功能需要的存储桶（一次性，几秒钟跑完）
-- 用法：Supabase Dashboard → SQL Editor → 新建查询 → 粘贴 → Run
-- 可重复执行

-- 1. 建公开的「头像」存储桶
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

-- 2. 权限：所有人可看；只能读写自己目录（<user_id>/avatar.jpg）
drop policy if exists "avatars read"   on storage.objects;
drop policy if exists "avatars insert" on storage.objects;
drop policy if exists "avatars update" on storage.objects;
drop policy if exists "avatars delete" on storage.objects;

create policy "avatars read"
  on storage.objects for select
  using (bucket_id = 'avatars');

create policy "avatars insert"
  on storage.objects for insert
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars update"
  on storage.objects for update
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  )
  with check (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

create policy "avatars delete"
  on storage.objects for delete
  using (
    bucket_id = 'avatars'
    and auth.uid()::text = (storage.foldername(name))[1]
  );

-- 3. 头像上限 2MB，防止误传原图
update storage.buckets
   set file_size_limit = 2097152,
       allowed_mime_types = array['image/jpeg', 'image/png', 'image/webp']
 where id = 'avatars';
