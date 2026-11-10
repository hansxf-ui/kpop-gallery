-- Keamanan: hanya ADMIN yang boleh mengubah galeri.
--
-- Masalah: policy tulis di items / settings / storage memakai `to authenticated using (true)`.
-- Artinya SIAPA PUN yang punya akun Supabase Auth di project ini boleh menambah, mengubah,
-- dan menghapus item, mengganti pengumuman, dan mengunggah file. Kalau pendaftaran akun
-- (sign up) masih aktif — bawaan Supabase — pengunjung bisa membuat akun sendiri lewat anon key
-- yang memang publik, lalu mengubah galeri.
--
-- Perbaikan:
--   1. Tabel public.admins berisi user_id akun admin + fungsi public.is_admin().
--   2. Setiap policy INSERT/UPDATE/DELETE/ALL untuk authenticated/public di tabel items,
--      settings, dan storage.objects ditambah syarat `and public.is_admin()`.
--      Syarat lama tiap policy DIPERTAHANKAN (hanya diperketat), policy SELECT tidak disentuh.
--
-- Data tidak diubah. Aman dijalankan ulang: policy yang sudah memuat is_admin() dilewati.
--
-- CARA MENJALANKAN (urutannya penting supaya admin tidak terkunci):
--   a. Jalankan file ini sekali. Karena tabel admins masih kosong, langkah 2 DILEWATI
--      (muncul NOTICE) — belum ada policy yang berubah.
--   b. Masukkan akun admin:
--        insert into public.admins (user_id)
--        select id from auth.users where email = 'EMAIL-ADMIN-KAMU' on conflict do nothing;
--   c. Jalankan file ini sekali lagi → policy diperketat.
--   d. Matikan pendaftaran akun baru: Dashboard → Authentication → Sign In / Providers →
--      Email → nonaktifkan "Allow new users to sign up".

-- 1. Daftar admin -----------------------------------------------------------------------
create table if not exists public.admins (
  user_id uuid primary key references auth.users (id) on delete cascade,
  created_at timestamptz not null default now()
);
-- RLS aktif tanpa policy = tabel ini tidak bisa dibaca/diubah lewat API. Isi lewat SQL Editor.
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid())
$$;

revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- 2. Perketat policy tulis --------------------------------------------------------------
do $$
declare
  p record;
  pakai text;
  cek text;
begin
  if not exists (select 1 from public.admins) then
    raise notice 'Tabel public.admins masih kosong — policy TIDAK diubah. Masukkan user_id admin (langkah b), lalu jalankan file ini lagi.';
    return;
  end if;

  for p in
    select schemaname, tablename, policyname, cmd, qual, with_check, roles
    from pg_policies
    where ((schemaname = 'public' and tablename in ('items', 'settings'))
        or (schemaname = 'storage' and tablename = 'objects'))
      and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
      and ('authenticated' = any (roles) or 'public' = any (roles))
  loop
    if coalesce(p.qual, '') like '%is_admin()%' or coalesce(p.with_check, '') like '%is_admin()%' then
      continue; -- sudah diperketat sebelumnya
    end if;

    pakai := format('((%s) and public.is_admin())', coalesce(p.qual, 'true'));
    cek := format('((%s) and public.is_admin())', coalesce(p.with_check, p.qual, 'true'));

    -- Policy FOR ALL juga mengatur SELECT. Supaya hak baca publik tidak ikut terkunci,
    -- syarat bacanya disalin dulu ke policy SELECT tersendiri dengan peran yang sama.
    if p.cmd = 'ALL' and not exists (
      select 1 from pg_policies x
      where x.schemaname = p.schemaname and x.tablename = p.tablename and x.policyname = left(p.policyname, 50) || ' (baca)'
    ) then
      execute format('create policy %I on %I.%I for select to %s using (%s)',
        left(p.policyname, 50) || ' (baca)', p.schemaname, p.tablename,
        (select string_agg(quote_ident(r), ', ') from unnest(p.roles) r),
        coalesce(p.qual, 'true'));
    end if;

    if p.cmd = 'INSERT' then
      execute format('alter policy %I on %I.%I with check %s', p.policyname, p.schemaname, p.tablename, cek);
    elsif p.cmd = 'DELETE' then
      execute format('alter policy %I on %I.%I using %s', p.policyname, p.schemaname, p.tablename, pakai);
    else -- UPDATE / ALL
      execute format('alter policy %I on %I.%I using %s with check %s', p.policyname, p.schemaname, p.tablename, pakai, cek);
    end if;

    raise notice 'Diperketat: %.% — "%" (%)', p.schemaname, p.tablename, p.policyname, p.cmd;
  end loop;
end
$$;

-- Cek hasil — semua baris tulis di items/settings/objects harus memuat is_admin():
-- select schemaname, tablename, policyname, cmd, roles, qual, with_check
-- from pg_policies
-- where tablename in ('items', 'settings', 'objects') order by tablename, cmd;
