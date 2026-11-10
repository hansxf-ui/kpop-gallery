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
Buka SQL Editor di Supabase dan jalankan (lewati baris yang errornya "already exists"):
```sql
alter table items add column if not exists group_name text;
alter table items add column if not exists era text;
alter table items add column if not exists note text;
create policy "admin ubah" on items for update to authenticated using (true) with check (true);

create table if not exists reactions (
  id bigint generated always as identity primary key,
  item_id uuid references items(id) on delete cascade,
  emoji text not null,
  created_at timestamptz default now()
);
alter table reactions enable row level security;
create policy "siapa saja lihat reaksi" on reactions for select using (true);
create policy "siapa saja kasih reaksi" on reactions for insert to anon, authenticated with check (true);

create table if not exists settings (key text primary key, value text);
alter table settings enable row level security;
create policy "publik lihat settings" on settings for select using (true);
create policy "admin ubah settings" on settings for insert to authenticated with check (true);
create policy "admin update settings" on settings for update to authenticated using (true) with check (true);
```

## Fitur
- Pencarian judul/nama idol, urutan terbaru/terlama/acak
- Filter per idol, grup, dan era/comeback (isi field-nya di admin agar filternya muncul)
- Album khusus per idol di `/idol/nama-idol`, lengkap dengan progress % dari total koleksi
- Favorit (ikon hati di tiap item) tersimpan di HP masing-masing pengunjung, lihat di `/favorit`
- Efek confetti hati kecil saat pertama kali menandai favorit
- Reaksi emoji (😍 🔥 😭 👏) di tiap item, boleh dari siapa saja yang buka situsnya
- Mode putar semua (slideshow otomatis) di galeri, album idol, dan favorit
- Tombol unduh di tampilan penuh, dan tombol "Wallpaper HP" khusus foto (crop otomatis ke rasio layar HP)
- Mode gelap (tombol 🌙/☀️ di kanan atas)
- Penghitung jumlah foto & video di header
- "Pilihan minggu ini" — carousel 5 item sampel dari seluruh koleksi di galeri, berganti tiap minggu (bukan berdasarkan reaksi)
- "Kenangan hari ini" — muncul kalau ada item yang diupload di tanggal yang sama tahun-tahun sebelumnya
- Tema "hari spesial" otomatis — warna situs berubah lebih meriah pas tanggal debut/ulang tahun member, plus banner ucapan
- Banner pengumuman comeback yang bisa diatur dari admin
- Sampul foto + jumlah koleksi di tiap chip filter idol
- Halaman `/tentang` berisi profil Hearts2Hearts dan tentang situs ini
- Kompresi otomatis untuk foto yang diupload (dimensi diperkecil kalau perlu, kualitas JPEG dijaga tinggi jadi tetap tajam)
- Upload banyak file sekaligus, drag & drop, dan putar (rotate) foto sebelum diupload — semua di halaman admin
- Import banyak link YouTube sekaligus (satu per baris) di admin
- Edit item (idol/judul/grup/era/catatan) tanpa perlu hapus lalu tambah ulang
- Catatan pribadi per item (cuma terlihat di admin)
- Statistik idol dengan koleksi terbanyak di admin
- Skeleton loading (kerangka animasi) saat galeri sedang dimuat, dan tombol "Muat lebih banyak" biar galeri besar tetap ringan dibuka
- Preview cantik saat link dibagikan ke WhatsApp/sosial media (Open Graph), favicon, dan bisa "Tambah ke layar utama" di HP
- Tombol "Ekspor backup (.json)" di halaman admin untuk menyimpan cadangan semua data
- Satu navigasi yang sama di semua halaman (Beranda, Galeri, Favoritku + jumlahnya, Jadwal, Voting, Tentang)
- Favoritkan langsung dari tampilan penuh (lightbox), plus penanda posisi "3 / 120"
- Tombol "Reset filter" saat hasil kosong, dan tombol ↑ kembali ke atas di grid panjang
- Link langsung per item (`/galeri?item=<id>`, tombol 🔗 Bagikan di lightbox) dengan preview foto saat dibagikan
- Filter galeri tersimpan di URL (`/galeri?idol=CARMEN&era=Focus&jenis=foto`) — tampilan terfilter bisa dibagikan
- Scroll tak terbatas di galeri & album idol (tombol "Muat lebih banyak" tetap ada sebagai cadangan)
- Ekspor/impor favorit lewat kode `H2H1-…` atau file .json (di halaman Favoritku)
- Mode offline: foto favorit disimpan di perangkat (service worker `public/sw.js`)
- Hitung mundur ulang tahun member & anniversary debut di beranda
- Profil singkat member di album idol (hanya data yang tercatat di repo)
- `/linimasa` — koleksi dikelompokkan per era sesuai tanggal rilis
- Tag konsep/acara (Panggung, MV, Fansign, Bandara, Di balik layar) — diisi di admin, filter `?tag=` di galeri
- Label "Baru" + bagian "Baru ditambahkan" sejak kunjungan terakhir (disimpan di perangkat)
- "Paling disukai minggu ini" dari reaksi 7 hari terakhir
- Pembuat photocard (PNG) di tampilan penuh foto
- `/koleksi` — koleksi bernama milik pengunjung, bisa dibagikan lewat kode `H2HK1-…`
- Laporan foto dari pengunjung → antrean "🚩 Laporan foto" di admin
- Reaksi bisa dibatalkan dengan aman (token rahasia per perangkat)
- `/kuis` — kuis "Tebak member" dari foto solo
- Pilihan bahasa Inggris (ID · EN di navigasi); bahasa Indonesia tetap bawaan. Kamus antarmuka di
  `lib/i18n-en.js`, kamus teks data (jadwal, voting, Tentang, ucapan hari spesial) di `lib/i18n-en-data.js`.
  **Kalau teks Indonesia di `lib/jadwal.js` / `lib/voting.js` diubah, terjemahannya ikut ditambahkan** —
  sebelum itu pengunjung EN melihat teks Indonesia (bukan terjemahan lama yang basi).
  Pengumuman banner punya kolom versi Inggris opsional di admin.
- Tombol "Tambah ke kalender" (.ics) di setiap acara `/jadwal`
- `/kredit` — daftar sumber/kredit foto dari kolom credit

## Migrasi database (jalankan sekali di Supabase → SQL Editor)
File di `supabase/migrations/`, jalankan berurutan. Keduanya aman diulang dan tidak mengubah data yang ada.
1. `20261110_01_member_counts.sql` — view `member_counts` untuk jumlah item per member di beranda.
   Sebelum dijalankan, beranda tetap memakai cara hitung lama.
2. `20261110_02_item_dimensions.sql` — kolom `width`/`height` foto. Sesudahnya, buka `/admin` →
   "Ukur dimensi foto lama" untuk mengisi foto yang sudah ada (upload baru terisi otomatis).
3. `20261111_03_admin_only_writes.sql` — hanya akun di tabel `admins` yang boleh mengubah galeri.
   Jalankan sekali, masukkan akun admin (`insert into public.admins ...`, contoh ada di file), lalu
   jalankan sekali lagi. Matikan juga pendaftaran akun baru di Authentication → Email.
4. `20261111_04_hide_admin_notes.sql` — catatan pribadi admin tidak bisa dibaca pengunjung.
   **Deploy kode terbaru dulu**, baru jalankan file ini.
5. `20261111_05_reactions_emoji_check.sql` — reaksi baru hanya boleh 😍 🔥 😭 👏.
6. `20261112_06_item_tags.sql` — kolom `tags` (tag konsep/acara). Butuh migrasi 04.
7. `20261112_07_top_reacted_week.sql` — view "Paling disukai minggu ini".
8. `20261112_08_reports.sql` — tabel laporan foto (pengunjung hanya kirim, admin baca). Butuh migrasi 03.
9. `20261112_09_reaction_tokens.sql` — reaksi dengan token + RPC `add_reaction`/`remove_reaction`. Butuh migrasi 05.

## Tes
`npm test` — logika kuis (tanpa foto ganda dalam satu ronde) dan kelengkapan kamus bahasa Inggris
(memakai `node:test` bawaan Node, tanpa paket tambahan).

## Pasang domain sendiri (opsional)
Kalau punya domain sendiri (mis. dari Niagahoster/Namecheap): buka project di Vercel → tab **Domains** → tambahkan domainmu, lalu ikuti instruksi untuk mengarahkan DNS-nya. Vercel akan otomatis pasang HTTPS.
