-- Fitur 6: "Paling disukai minggu ini" — 12 item dengan reaksi terbanyak dalam 7 hari terakhir.
--
-- View di atas tabel reactions yang sudah ada. Tidak mengubah data.
-- security_invoker = on → ikut RLS reactions (policy baca publik yang sudah ada).
-- Tanpa view ini, situs menghitung sendiri dari baris reaksi 7 hari terakhir (lebih berat).
-- Aman dijalankan ulang.

create or replace view public.top_reacted_week
with (security_invoker = on)
as
select item_id, count(*)::int as jumlah
from public.reactions
where item_id is not null
  and created_at >= now() - interval '7 days'
group by item_id
order by jumlah desc, item_id
limit 12;

grant select on public.top_reacted_week to anon, authenticated;

-- Cek: select * from public.top_reacted_week;
