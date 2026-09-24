# Stardust Gallery

## 1. Siapkan Supabase (gratis)
1. Buat project di supabase.com.
2. SQL Editor → tempel isi `supabase.sql` → Run.
3. Authentication → Users → Add user (email + password). Ini akun adminmu.
4. Project Settings → API → salin **Project URL** dan **anon public key**.

## 2. GitHub
Upload semua isi folder ini ke repo baru.

## 3. Vercel
Import repo → Environment Variables:
- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`

Deploy. Buka `/admin` untuk login dan upload.

Catatan: upload file maksimal 50MB di paket gratis Supabase. Video lebih besar: pakai link YouTube.

## Sudah punya database dari versi sebelumnya?
Buka SQL Editor di Supabase dan jalankan:
```sql
alter table items add column if not exists group_name text;
```

## Fitur
- Pencarian judul/nama idol, urutan terbaru/terlama/acak
- Filter per idol dan per grup (isi field "Grup" di admin agar filter grup muncul)
- Album khusus per idol di `/idol/nama-idol`
- Favorit (ikon hati di tiap item) tersimpan di HP masing-masing pengunjung, lihat di `/favorit`
- Mode putar semua (slideshow otomatis) di galeri, album idol, dan favorit
- Tombol unduh di tampilan penuh (untuk YouTube, tautan ke video aslinya)
- Mode gelap (tombol 🌙/☀️ di kanan atas)
- Penghitung jumlah foto & video di header
