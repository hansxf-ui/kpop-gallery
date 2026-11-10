-- Fitur 10: reaksi bisa dibatalkan dengan aman — hanya oleh perangkat yang mengirimnya.
--
-- Cara kerja:
--   - Saat memberi reaksi, perangkat membuat token acak rahasia (disimpan di perangkat itu saja)
--     dan memanggil RPC add_reaction. Database hanya menyimpan HASH SHA-256 token (owner_hash),
--     bukan tokennya.
--   - Membatalkan = RPC remove_reaction(id, token): baris dihapus hanya kalau hash token cocok.
--   - Hak hapus langsung (DELETE) untuk pengunjung dicabut: tidak ada lagi yang bisa menghapus
--     reaksi milik orang lain, apa pun isi policy DELETE lama di tabel ini.
--   - owner_hash tidak bisa dibaca pengunjung (hak baca per kolom).
--
-- Baris reaksi lama tidak diubah (owner_hash kosong → reaksi lama tidak bisa dibatalkan, seperti
-- sebelumnya). Butuh migrasi 05 (constraint emoji) — emoji juga diperiksa di fungsi.
-- Aman dijalankan ulang.

alter table public.reactions add column if not exists owner_hash text;

create or replace function public.add_reaction(p_item uuid, p_emoji text, p_token text)
returns bigint
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id bigint;
begin
  if p_emoji not in ('😍', '🔥', '😭', '👏') then
    raise exception 'emoji tidak dikenal' using errcode = '22023';
  end if;
  if p_token is null or char_length(p_token) < 32 or char_length(p_token) > 128 then
    raise exception 'token tidak valid' using errcode = '22023';
  end if;
  insert into public.reactions (item_id, emoji, owner_hash)
  values (p_item, p_emoji, encode(sha256(convert_to(p_token, 'UTF8')), 'hex'))
  returning id into new_id;
  return new_id;
end
$$;

create or replace function public.remove_reaction(p_id bigint, p_token text)
returns boolean
language plpgsql
security definer
set search_path = public
as $$
declare
  n int;
begin
  if p_token is null or char_length(p_token) < 32 or char_length(p_token) > 128 then
    return false;
  end if;
  delete from public.reactions
  where id = p_id
    and owner_hash is not null
    and owner_hash = encode(sha256(convert_to(p_token, 'UTF8')), 'hex');
  get diagnostics n = row_count;
  return n > 0;
end
$$;

revoke all on function public.add_reaction(uuid, text, text) from public;
revoke all on function public.remove_reaction(bigint, text) from public;
grant execute on function public.add_reaction(uuid, text, text) to anon, authenticated;
grant execute on function public.remove_reaction(bigint, text) to anon, authenticated;

-- Pengunjung: tidak bisa menghapus/mengubah langsung, dan tidak bisa membaca owner_hash.
-- (Sisipan langsung lama tetap diizinkan policy yang ada, supaya versi situs lama di cache tidak rusak.)
revoke delete, update on public.reactions from anon;
revoke select on public.reactions from anon;
grant select (id, item_id, emoji, created_at) on public.reactions to anon;

notify pgrst, 'reload schema';

-- Cek:
--   select public.add_reaction('<id item>', '😍', repeat('a', 32));     -- → id baru
--   select public.remove_reaction(<id tadi>, repeat('b', 32));            -- → false (token salah)
--   select public.remove_reaction(<id tadi>, repeat('a', 32));            -- → true
