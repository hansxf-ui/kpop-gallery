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
Buka SQL Editor di Supabase dan jalankan (lewati baris yang errornya "column already exists"):
```sql
alter table items add column if not exists group_name text;
alter table items add column if not exists era text;
alter table items add column if not exists note text;
create policy "admin ubah" on items for update to authenticated using (true) with check (true);
```

## Fitur
- Pencarian judul/nama idol, urutan terbaru/terlama/acak
- Filter per idol, grup, dan era/comeback (isi field-nya di admin agar filternya muncul)
- Album khusus per idol di `/idol/nama-idol`, lengkap dengan progress % dari total koleksi
- Favorit (ikon hati di tiap item) tersimpan di HP masing-masing pengunjung, lihat di `/favorit`
- Efek confetti hati kecil saat pertama kali menandai favorit
- Mode putar semua (slideshow otomatis) di galeri, album idol, dan favorit
- Tombol unduh di tampilan penuh, dan tombol "🖼 Wallpaper HP" khusus foto (crop otomatis ke rasio layar HP)
- Mode gelap (tombol 🌙/☀️ di kanan atas)
- Penghitung jumlah foto & video di header
- "Sorotan Minggu Ini" — satu item ditonjolkan besar di beranda, otomatis berganti tiap minggu
- "Kenangan hari ini" — muncul kalau ada item yang diupload di tanggal yang sama tahun-tahun sebelumnya
- Sampul foto + jumlah koleksi di tiap chip filter idol
- Halaman `/tentang` berisi profil Hearts2Hearts dan tentang situs ini
- Kompresi otomatis untuk foto yang diupload (dimensi diperkecil kalau perlu, kualitas JPEG dijaga tinggi jadi tetap tajam)
- Upload banyak file sekaligus, drag & drop, dan putar (rotate) foto sebelum diupload — semua di halaman admin
- Edit item (idol/judul/grup/era/catatan) tanpa perlu hapus lalu tambah ulang
- Catatan pribadi per item (cuma terlihat di admin)
- Statistik idol dengan koleksi terbanyak di admin
- Skeleton loading (kerangka animasi) saat galeri sedang dimuat
- Preview cantik saat link dibagikan ke WhatsApp/sosial media (Open Graph), favicon, dan bisa "Tambah ke layar utama" di HP
- Tombol "Ekspor backup (.json)" di halaman admin untuk menyimpan cadangan semua data

## Pasang domain sendiri (opsional)
Kalau punya domain sendiri (mis. dari Niagahoster/Namecheap): buka project di Vercel → tab **Domains** → tambahkan domainmu, lalu ikuti instruksi untuk mengarahkan DNS-nya. Vercel akan otomatis pasang HTTPS.
