-- Fitur 14: teks alternatif (alt) foto yang lebih deskriptif, diisi admin (opsional).
--
-- Menambah SATU kolom nullable items.alt_text. Baris lama tidak diubah (alt_text kosong → situs
-- memakai judul seperti sekarang). Maks. 300 karakter.
-- Pengunjung (anon) boleh MEMBACA kolom ini (hak baca per kolom, migrasi 04); mengisinya hanya admin
-- lewat policy update yang sudah ada (is_admin(), migrasi 03).
-- Aman dijalankan ulang.

alter table public.items add column if not exists alt_text text;

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'items_alt_text_len' and conrelid = 'public.items'::regclass
  ) then
    alter table public.items
      add constraint items_alt_text_len check (alt_text is null or char_length(alt_text) <= 300);
  end if;
end
$$;

grant select (alt_text) on public.items to anon;

notify pgrst, 'reload schema';

-- Cek: set role anon; select id, alt_text from public.items limit 1; reset role;
