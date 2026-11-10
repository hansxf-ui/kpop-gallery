-- Fitur 4: lebar/tinggi foto disimpan, supaya grid tahu rasio tiap foto sebelum gambarnya
-- dimuat (next/image width/height) — tidak ada lompatan layout.
--
-- Hanya MENAMBAH dua kolom kosong (nullable). Baris yang sudah ada tidak diubah.
-- Selama kolom masih kosong, grid memakai cara lama (bingkai cadangan 3/4).
--
-- Kolom diisi oleh:
--   - halaman admin saat upload foto baru (dimensi file yang diupload), dan
--   - tombol "Ukur dimensi foto lama" di admin (opsional, dijalankan manual). Nilai dari tombol
--     ini diukur dari versi 600px foto — yang dipakai hanya RASIONYA, bukan ukuran aslinya.
--
-- Aman dijalankan ulang.

alter table public.items add column if not exists width integer check (width is null or width > 0);
alter table public.items add column if not exists height integer check (height is null or height > 0);

-- Update kolom ini dari admin memakai policy "admin ubah" yang sudah ada (authenticated).
-- Supaya PostgREST langsung mengenali kolom baru:
notify pgrst, 'reload schema';
