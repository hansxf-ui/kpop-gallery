-- Fitur 9: laporan foto dari pengunjung ("salah member", "gambar rusak", …) → antrean admin.
--
-- Tabel baru public.reports. Tabel lain tidak diubah.
-- Hak akses:
--   - pengunjung (anon) HANYA boleh mengirim laporan (item_id, reason, detail). Tidak bisa
--     membaca, mengubah, atau menghapus laporan siapa pun, dan tidak bisa mengisi status.
--   - hanya admin (public.is_admin(), migrasi 03) yang boleh membaca, menandai selesai, dan menghapus.
--
-- Butuh migrasi 03 (fungsi is_admin). Aman dijalankan ulang.

do $$
begin
  if to_regprocedure('public.is_admin()') is null then
    raise exception 'Fungsi public.is_admin() belum ada — jalankan migrasi 20261111_03_admin_only_writes.sql dulu.';
  end if;
end
$$;

create table if not exists public.reports (
  id bigint generated always as identity primary key,
  item_id uuid not null references public.items (id) on delete cascade,
  reason text not null check (reason in ('salah_member', 'gambar_rusak', 'salah_era', 'lainnya')),
  detail text check (detail is null or char_length(detail) <= 300),
  status text not null default 'baru' check (status in ('baru', 'selesai')),
  created_at timestamptz not null default now()
);

create index if not exists reports_status_created_idx on public.reports (status, created_at desc);

alter table public.reports enable row level security;

-- Hak tabel: Supabase memberi anon/authenticated semua hak di tabel baru secara bawaan —
-- dipersempit di sini, lalu RLS di bawah memeriksa tiap baris.
revoke all on public.reports from anon, authenticated;
grant insert (item_id, reason, detail) on public.reports to anon, authenticated;
grant select, delete on public.reports to authenticated;
grant update (status) on public.reports to authenticated;

drop policy if exists "pengunjung kirim laporan" on public.reports;
create policy "pengunjung kirim laporan" on public.reports
  for insert to anon, authenticated
  with check (status = 'baru');

drop policy if exists "admin baca laporan" on public.reports;
create policy "admin baca laporan" on public.reports
  for select to authenticated
  using (public.is_admin());

drop policy if exists "admin ubah laporan" on public.reports;
create policy "admin ubah laporan" on public.reports
  for update to authenticated
  using (public.is_admin())
  with check (public.is_admin());

drop policy if exists "admin hapus laporan" on public.reports;
create policy "admin hapus laporan" on public.reports
  for delete to authenticated
  using (public.is_admin());

notify pgrst, 'reload schema';

-- Cek (sebagai anon harus GAGAL / kosong):  set role anon; select * from public.reports; reset role;
