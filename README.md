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
