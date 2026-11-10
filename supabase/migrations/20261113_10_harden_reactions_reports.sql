-- Audit final: perketat tulis pengunjung di reactions & reports. Tidak mengubah/menghapus data.
--
-- Masalah 1 — reactions: policy lama "siapa saja kasih reaksi" (insert anon, with check true)
--   masih mengizinkan sisipan LANGSUNG dengan kolom apa pun, termasuk created_at dan owner_hash.
--   created_at di masa depan selalu lolos syarat `created_at >= now() - 7 days`, jadi satu baris
--   palsu bisa menempel di "Paling disukai minggu ini" selamanya.
--   Perbaikan: pengunjung hanya boleh mengisi (item_id, emoji) saat sisip langsung (versi situs lama
--   di cache masih memakai cara ini). Situs sekarang memakai RPC add_reaction (security definer),
--   yang tidak butuh hak sisip tabel.
--
-- Masalah 2 — view top_reacted_week ikut menghitung baris dengan emoji di luar 4 emoji situs
--   (baris lama sebelum CHECK migrasi 05) dan baris bertanggal masa depan.
--   Perbaikan: view hanya menghitung 4 emoji dan created_at <= now(). Kolom view tidak berubah.
--
-- Masalah 3 — reports: tidak ada batas, jadi antrean admin bisa dibanjiri laporan untuk satu item.
--   Perbaikan: trigger menolak laporan baru kalau item itu sudah punya 10 laporan berstatus 'baru'.
--   Admin yang menandai selesai/menghapus laporan membuka slot lagi.
--
-- Butuh migrasi 05, 07, 08, 09. Aman dijalankan ulang.

-- 1. reactions: hak sisip langsung hanya untuk item_id & emoji -----------------------------
revoke insert on public.reactions from anon, authenticated;
grant insert (item_id, emoji) on public.reactions to anon, authenticated;

-- 2. view "Paling disukai minggu ini" --------------------------------------------------------
create or replace view public.top_reacted_week
with (security_invoker = on)
as
select item_id, count(*)::int as jumlah
from public.reactions
where item_id is not null
  and emoji in ('😍', '🔥', '😭', '👏')
  and created_at >= now() - interval '7 days'
  and created_at <= now()
group by item_id
order by jumlah desc, item_id
limit 12;

grant select on public.top_reacted_week to anon, authenticated;

-- 3. reports: maks. 10 laporan terbuka per item ----------------------------------------------
create or replace function public.reports_limit_open()
returns trigger
language plpgsql
security definer           -- pengunjung tidak bisa membaca reports; hitungan dilakukan sebagai pemilik
set search_path = public
as $$
begin
  if (select count(*) from public.reports where item_id = new.item_id and status = 'baru') >= 10 then
    raise exception 'Laporan untuk item ini sudah banyak dan sedang ditinjau.' using errcode = 'P0001';
  end if;
  return new;
end
$$;

revoke all on function public.reports_limit_open() from public;

drop trigger if exists reports_limit_open on public.reports;
create trigger reports_limit_open
  before insert on public.reports
  for each row execute function public.reports_limit_open();

notify pgrst, 'reload schema';

-- Cek:
--   set role anon;
--   insert into public.reactions (item_id, emoji, created_at) values ('<id item>', '😍', now() + interval '1 year');
--     → harus GAGAL: permission denied for table reactions (kolom created_at)
--   reset role;
--   select * from public.top_reacted_week;
