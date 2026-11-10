-- Fitur 9 — MODE KETAT anti-spam (OPSIONAL). JANGAN dijalankan sebelum langkah di bawah selesai.
--
-- Tanpa file ini, Turnstile melindungi laporan & reaksi yang dikirim LEWAT SITUS, tetapi orang yang
-- memanggil API Supabase langsung (dengan anon key yang memang publik) masih bisa melewatinya.
-- File ini menutup jalan langsung itu: pengunjung tidak bisa lagi mengirim laporan / memberi reaksi
-- sendiri — hanya server situs (/api/lindung, setelah token Turnstile lolos) dengan service-role key.
-- Membatalkan reaksi (remove_reaction) tetap langsung dan tetap butuh token rahasia perangkat.
--
-- WAJIB sebelum menjalankan file ini (kalau tidak, laporan & reaksi BERHENTI berfungsi):
--   1. NEXT_PUBLIC_TURNSTILE_SITE_KEY dan TURNSTILE_SECRET_KEY terpasang di Vercel, sudah di-redeploy,
--      dan laporan + reaksi sudah dicoba berhasil di situs live.
--   2. SUPABASE_SERVICE_ROLE_KEY terpasang di Vercel (Environment Variables, BUKAN NEXT_PUBLIC_),
--      lalu redeploy.
-- Tidak mengubah data. Aman dijalankan ulang.
-- Untuk mengembalikan ke mode biasa: jalankan bagian "KEMBALIKAN" di bawah (dikomentari).

revoke insert on public.reports from anon, authenticated;
revoke insert on public.reactions from anon, authenticated;
revoke execute on function public.add_reaction(uuid, text, text) from anon, authenticated;
grant execute on function public.add_reaction(uuid, text, text) to service_role;

notify pgrst, 'reload schema';

-- KEMBALIKAN (mode biasa, seperti migrasi 08–10):
--   grant insert (item_id, reason, detail) on public.reports to anon, authenticated;
--   grant insert (item_id, emoji) on public.reactions to anon, authenticated;
--   grant execute on function public.add_reaction(uuid, text, text) to anon, authenticated;
--   notify pgrst, 'reload schema';
