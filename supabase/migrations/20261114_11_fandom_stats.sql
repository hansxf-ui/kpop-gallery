-- Fitur 8: statistik fandom kecil — foto paling disukai sepanjang masa & member dengan reaksi
-- terbanyak minggu ini. Hanya DUA VIEW baru (baca saja) di atas tabel reactions & items yang sudah ada.
-- Tidak mengubah data. Aman dijalankan ulang.
--
-- Syarat hitungan sama dengan top_reacted_week (migrasi 10): hanya 4 emoji situs, tanpa tanggal masa
-- depan. security_invoker = on → ikut hak baca pengunjung (kolom reactions & items yang memang publik).
-- Tanpa view ini situs menghitung sendiri dari baris reaksi (lebih berat), jadi urutan menjalankan bebas.

create or replace view public.top_reacted_all
with (security_invoker = on)
as
select item_id, count(*)::int as jumlah
from public.reactions
where item_id is not null
  and emoji in ('😍', '🔥', '😭', '👏')
  and created_at <= now()
group by item_id
order by jumlah desc, item_id
limit 5;

-- Reaksi 7 hari terakhir per member. Item unit ("JUUN & CARMEN") dihitung untuk tiap member di
-- dalamnya — aturan pecah nama sama dengan view member_counts (migrasi 01).
create or replace view public.member_reactions_week
with (security_invoker = on)
as
select upper(trim(nama)) as member, count(*)::int as jumlah
from public.reactions r
join public.items i on i.id = r.item_id,
     lateral regexp_split_to_table(coalesce(i.idol, ''), '[,&]') as nama
where trim(nama) <> ''
  and r.emoji in ('😍', '🔥', '😭', '👏')
  and r.created_at >= now() - interval '7 days'
  and r.created_at <= now()
group by 1;

grant select on public.top_reacted_all to anon, authenticated;
grant select on public.member_reactions_week to anon, authenticated;

-- Cek: select * from public.top_reacted_all; select * from public.member_reactions_week order by jumlah desc;
