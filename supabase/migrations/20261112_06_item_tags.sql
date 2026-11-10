-- Fitur 4: tag konsep/acara per item (stage, mv, fansign, airport, behind).
--
-- Menambah kolom items.tags (array teks, bawaan kosong). Isi kolom lain tidak diubah;
-- baris lama mendapat tags kosong '{}'. Tag hanya boleh salah satu dari 5 nilai di bawah.
-- Pengunjung (anon) boleh MEMBACA tags; mengisinya hanya admin lewat policy update yang
-- sudah ada (diperketat is_admin() oleh migrasi 03).
--
-- Butuh migrasi 04 sudah dijalankan (hak baca anon per kolom). Aman dijalankan ulang.

alter table public.items add column if not exists tags text[] not null default '{}';

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'items_tags_valid' and conrelid = 'public.items'::regclass
  ) then
    alter table public.items
      add constraint items_tags_valid
      check (tags <@ array['stage', 'mv', 'fansign', 'airport', 'behind']::text[]);
  end if;
end
$$;

create index if not exists items_tags_idx on public.items using gin (tags);

grant select (tags) on public.items to anon;

notify pgrst, 'reload schema';
