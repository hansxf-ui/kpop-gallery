-- Deteksi foto ganda: sidik foto (dHash 64-bit, 16 karakter hex) di kolom items.phash.
--
-- Diisi otomatis saat upload foto baru dari /admin. Foto lama diisi lewat tombol
-- "Hitung sidik foto lama" di /admin (aman diulang, hanya foto yang phash-nya masih kosong).
-- Admin diberi peringatan kalau foto yang akan diunggah mirip foto yang sudah ada.
--
-- Hanya admin yang membaca kolom ini: anon (pengunjung) TIDAK diberi hak baca (hak baca per
-- kolom, migrasi 04), jadi tidak ada data yang bertambah di halaman publik.
-- Mengisinya hanya admin lewat policy insert/update yang sudah ada (is_admin(), migrasi 03).
-- Baris lama tidak diubah. Aman dijalankan ulang.

alter table public.items add column if not exists phash text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'items_phash_format' and conrelid = 'public.items'::regclass
  ) then
    alter table public.items
      add constraint items_phash_format check (phash is null or phash ~ '^[0-9a-f]{16}$');
  end if;
end
$$;

notify pgrst, 'reload schema';

-- Cek: harus GAGAL dengan "permission denied" sebagai anon:
--   set role anon; select phash from public.items limit 1; reset role;
