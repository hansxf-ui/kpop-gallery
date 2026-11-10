-- Keamanan: tabel reactions hanya menerima 4 emoji yang ada di situs.
--
-- Masalah: policy "siapa saja kasih reaksi" mengizinkan anon menyisipkan baris dengan kolom
-- emoji berisi teks APA PUN (panjang bebas), langsung lewat API. Tampilan situs hanya menghitung
-- 4 emoji, tapi tabel bisa diisi sampah.
--
-- Perbaikan: CHECK constraint dengan opsi NOT VALID — baris lama TIDAK diperiksa dan tidak
-- diubah; hanya sisipan baru yang wajib salah satu dari 😍 🔥 😭 👏.
-- Aman dijalankan ulang.

do $$
begin
  if not exists (
    select 1 from pg_constraint
    where conname = 'reactions_emoji_valid' and conrelid = 'public.reactions'::regclass
  ) then
    alter table public.reactions
      add constraint reactions_emoji_valid check (emoji in ('😍', '🔥', '😭', '👏')) not valid;
  end if;
end
$$;

-- Catatan (tidak diubah oleh file ini): cek policy hapus reaksi dengan
--   select policyname, cmd, roles, qual from pg_policies where tablename = 'reactions';
-- Kalau ada policy DELETE untuk anon dengan qual "true", siapa pun bisa menghapus reaksi siapa pun.
-- Kalau TIDAK ada policy DELETE, membatalkan reaksi memang tidak bisa — situs sekarang
-- memberi tahu pengunjung alih-alih pura-pura berhasil (lihat Reactions.js).
