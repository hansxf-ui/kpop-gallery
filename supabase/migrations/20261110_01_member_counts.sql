-- Fitur 2: hitungan item per member dihitung di database.
-- Beranda dulu mengambil kolom idol dari SELURUH item (~1.159 baris, 2 request) hanya untuk
-- menghitung jumlah per member. View ini mengembalikan 9-an baris saja.
--
-- Aturan pecah nama SAMA dengan namesOf() di lib/gallery.js:
--   "JUUN & CARMEN" / "CARMEN, YUHA" -> dipecah di "," dan "&", di-trim, di-UPPERCASE.
-- Item unit dihitung untuk tiap member di dalamnya (konsisten dengan filter /galeri).
--
-- Aman dijalankan ulang (create or replace). Tidak mengubah data apa pun.

create or replace view public.member_counts
with (security_invoker = on) -- ikut RLS tabel items ("siapa saja boleh lihat"), bukan hak pemilik view
as
select upper(trim(nama)) as member, count(*)::int as jumlah
from public.items,
     lateral regexp_split_to_table(coalesce(idol, ''), '[,&]') as nama
where trim(nama) <> ''
group by 1;

grant select on public.member_counts to anon, authenticated;

-- Cek hasil (harus berisi JIWOO, CARMEN, ..., HEARTS2HEARTS beserta jumlahnya):
-- select * from public.member_counts order by jumlah desc;
