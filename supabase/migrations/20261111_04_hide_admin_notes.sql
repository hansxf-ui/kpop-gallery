-- Privasi: "catatan pribadi" admin tidak lagi bisa dibaca pengunjung.
--
-- Masalah: kolom items.note ("Catatan pribadi — cuma kamu yang lihat" di admin) ikut terkirim
-- ke setiap pengunjung, karena galeri memuat `select *` dan policy baca items terbuka untuk
-- anon. Siapa pun bisa membacanya lewat DevTools atau langsung lewat API.
--
-- Perbaikan:
--   1. Kolom baru `credit` (GENERATED, otomatis): berisi catatan HANYA jika diawali "📷"
--      (kredit foto yang memang ditampilkan publik di lightbox). Kolom lain tidak berubah.
--   2. Peran anon (pengunjung) hanya boleh membaca kolom publik. `note` dan `path` tidak termasuk.
--      Admin yang login (authenticated) tetap bisa membaca semua kolom.
--
-- Isi kolom yang sudah ada tidak diubah. Aman dijalankan ulang.
-- URUTAN: deploy kode PR ini DULU, baru jalankan file ini. Kode lama memuat `select *`
-- yang akan ditolak setelah hak baca anon dibatasi.

-- Kolom dimensi (sama dengan migrasi 02) — dibuat di sini juga kalau 02 belum dijalankan,
-- karena kolom ini masuk daftar hak baca di bawah.
alter table public.items add column if not exists width integer check (width is null or width > 0);
alter table public.items add column if not exists height integer check (height is null or height > 0);

alter table public.items add column if not exists credit text
  generated always as (case when btrim(note) like '📷%' then btrim(note) end) stored;

revoke select on public.items from anon;
grant select (id, idol, title, type, url, group_name, era, created_at, width, height, credit)
  on public.items to anon;

notify pgrst, 'reload schema';

-- Cek: harus GAGAL dengan "permission denied" kalau dijalankan sebagai anon:
--   set role anon; select note from public.items limit 1; reset role;
-- dan BERHASIL:
--   set role anon; select id, idol, credit from public.items limit 1; reset role;
