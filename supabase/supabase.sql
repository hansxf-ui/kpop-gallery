-- ============================================================================
-- supabase.sql — SKEMA DASAR proyek Supabase "time-capsule"
--   ref lpuvkrbdctankydvmzpy · region ap-northeast-1 · Postgres 17
--   Dibuat: 12 Nov 2026 · dari introspeksi skema live (information_schema +
--   pg_catalog), BUKAN dari tebakan.
--
-- CARA PAKAI (proyek Supabase BARU):
--   1. Buat proyek Supabase baru (skema bawaan auth, storage, realtime, dsb.
--      sudah ada — file ini mengasumsikan skema itu ADA dan TIDAK membuatnya
--      ulang; file ini hanya menyentuh skema public + baris bucket storage).
--   2. Jalankan file ini sekali di SQL Editor (sebagai postgres / pemilik DB).
--      Isinya schema-only: TIDAK ada data (tidak ada baris seed).
--   3. Jalankan migrasi di supabase/migrations/ secara BERURUTAN, dari
--      20261110_01_member_counts.sql sampai 20261115_14_photo_hash.sql.
--      Migrasi 03 punya langkah dua-tahap (baca catatan DIVERGENSI di bawah).
--   4. Pulihkan data (backup ZIP / dump data-only) secara terpisah.
--
-- ISI FILE INI (skema dasar = keadaan SEBELUM migrasi 01):
--   - 10 tabel public: capsules, contributions, items, kosan_config,
--     kosan_login_attempts, kosan_residents, media, profiles, reactions,
--     settings. RLS aktif di semuanya.
--   - 3 fungsi RPC Kosan: kosan_login, kosan_register, kosan_occupants.
--   - 2 bucket storage: capsule-images, gallery (keduanya publik) + policy
--     storage.objects untuk bucket gallery.
--   - TIDAK ada view (semua view dibuat migrasi 01/07/10/11), TIDAK ada
--     tabel reports & admins (dibuat migrasi 08 & 03), TIDAK ada trigger
--     (dibuat migrasi 10), TIDAK ada kolom items.width/height/tags/alt_text/
--     phash/credit dan reactions.owner_hash (dibuat migrasi 02/04/06/09/13/14).
--
-- DIVERGENSI YANG DIKETAHUI (live DB vs rantai migrasi):
--   Migrasi 03 menginstruksikan langkah kedua: setelah satu baris dimasukkan
--   ke public.admins, jalankan lagi file itu supaya policy tulis di
--   items/settings/storage.objects diperketat dengan `and public.is_admin()`.
--   Di live DB langkah itu TIDAK pernah berefek: tabel admins berisi 1 baris,
--   tetapi policy tulis masih `using (true)` / `with check (true)` tanpa
--   is_admin(). File ini mereproduksi keadaan dasar (tanpa is_admin()) sesuai
--   aslinya; SETELAH restore + migrasi, jalankan langkah kedua migrasi 03
--   supaya hasil akhirnya LEBIH ketat dari live saat ini (itu keadaan yang
--   diinginkan, bukan bug). Pendaftaran akun baru (sign up) sudah dimatikan
--   di live, jadi celahnya terbatas pada akun yang sudah ada.
--
-- CATATAN LAIN:
--   - Migrasi 12 (20261114_12_spam_gate_strict.sql, mode ketat Turnstile)
--     bersifat OPSIONAL dan TIDAK dijalankan di live — file ini tidak
--     menerapkannya. Jalankan migrasi 12 secara terpisah HANYA kalau
--     syarat di header file itu sudah dipenuhi.
--   - FK ke auth.users(id) mengasumsikan skema auth bawaan Supabase ada
--     (di proyek baru selalu ada).
--   - TIDAK ada baris seed — termasuk kosan_config. Aplikasi Kosan
--     menganggap flag yang tidak ada sebagai false (mis. gedung_b_open
--     default TUTUP), jadi tabel kosong adalah keadaan awal yang benar.
--   - Ekstensi: pgcrypto dibutuhkan migrasi 09 (fungsi sha256() di
--     add_reaction/remove_reaction). Di proyek Supabase baru ekstensi ini
--     sudah tersedia; `if not exists` membuatnya aman diulang.
-- ============================================================================

begin;

-- ----------------------------------------------------------------------------
-- 1. Ekstensi
-- ----------------------------------------------------------------------------

create extension if not exists "pgcrypto";

-- ----------------------------------------------------------------------------
-- 2. Tabel (kolom + tipe + default; constraint menyusul di §3)
-- ----------------------------------------------------------------------------

-- Kapsul waktu (aplikasi time-capsule asli).
create table public.capsules (
  id uuid not null default gen_random_uuid(),
  user_id uuid not null,
  title text not null,
  message text not null,
  open_at timestamptz not null,
  password text,
  is_public boolean default false,
  created_at timestamptz default now(),
  image_url text
);

-- Pesan kontribusi untuk sebuah kapsul.
create table public.contributions (
  id uuid not null default gen_random_uuid(),
  capsule_id uuid,
  user_id uuid,
  message text not null,
  created_at timestamptz default now()
);

-- Galeri H2H: foto / video / youtube. Kolom width, height, tags, alt_text,
-- phash, dan credit (generated) DITAMBAH migrasi 02/04/06/13/14 — bukan di sini.
create table public.items (
  id uuid not null default gen_random_uuid(),
  created_at timestamptz default now(),
  idol text not null,
  title text,
  type text not null,
  url text not null,
  path text,
  group_name text,
  era text,
  note text
);

-- Konfigurasi Kosan (flag gedung, dst.). Nilai boolean, tanpa baris seed.
create table public.kosan_config (
  key text not null,
  value boolean not null
);

-- Percobaan login Kosan yang gagal (rate limit + lockout 15 menit).
create table public.kosan_login_attempts (
  name text not null,
  failed_count integer not null default 0,
  locked_until timestamptz
);

-- Penghuni Kosan (kamar 1-20, Gedung A 1-10, Gedung B 11-20).
create table public.kosan_residents (
  room smallint not null,
  name text not null,
  gender text not null,
  pin_hash text not null,
  created_at timestamptz not null default now()
);

-- Media lama (aplikasi time-capsule; galeri H2H memakai tabel items).
create table public.media (
  id uuid not null default gen_random_uuid(),
  title text not null,
  description text,
  type text not null,
  url text not null,
  thumbnail_url text,
  idol_name text,
  group_name text,
  tags text[],
  created_at timestamptz default now()
);

-- Profil pengguna (1 baris per akun auth.users).
create table public.profiles (
  id uuid not null,
  email text not null,
  name text not null,
  created_at timestamptz default now()
);

-- Reaksi emoji pengunjung. Kolom owner_hash DITAMBAH migrasi 09.
create table public.reactions (
  id bigint generated always as identity not null,
  item_id uuid,
  emoji text not null,
  created_at timestamptz default now()
);

-- Pengaturan situs galeri (pengumuman, dsb.).
create table public.settings (
  key text not null,
  value text
);

-- ----------------------------------------------------------------------------
-- 3. Primary key
-- ----------------------------------------------------------------------------

alter table public.capsules add constraint capsules_pkey primary key (id);
alter table public.contributions add constraint contributions_pkey primary key (id);
alter table public.items add constraint items_pkey primary key (id);
alter table public.kosan_config add constraint kosan_config_pkey primary key (key);
alter table public.kosan_login_attempts add constraint kosan_login_attempts_pkey primary key (name);
alter table public.kosan_residents add constraint kosan_residents_pkey primary key (room);
alter table public.media add constraint media_pkey primary key (id);
alter table public.profiles add constraint profiles_pkey primary key (id);
alter table public.reactions add constraint reactions_pkey primary key (id);
alter table public.settings add constraint settings_pkey primary key (key);

-- ----------------------------------------------------------------------------
-- 4. Foreign key
-- ----------------------------------------------------------------------------

alter table public.contributions add constraint contributions_capsule_id_fkey
  foreign key (capsule_id) references public.capsules (id) on delete cascade;
alter table public.contributions add constraint contributions_user_id_fkey
  foreign key (user_id) references auth.users (id) on delete cascade;
alter table public.profiles add constraint profiles_id_fkey
  foreign key (id) references auth.users (id);
alter table public.reactions add constraint reactions_item_id_fkey
  foreign key (item_id) references public.items (id) on delete cascade;

-- ----------------------------------------------------------------------------
-- 5. Check & unique
-- ----------------------------------------------------------------------------

alter table public.items add constraint items_type_check
  check (type = any (array['photo'::text, 'video'::text, 'youtube'::text]));
alter table public.media add constraint media_type_check
  check (type = any (array['photo'::text, 'video'::text]));
alter table public.kosan_residents add constraint kosan_residents_name_key
  unique (name);
alter table public.kosan_residents add constraint kosan_residents_gender_check
  check (gender = any (array['Cewek'::text, 'Cowok'::text]));
alter table public.kosan_residents add constraint kosan_residents_pin_hash_check
  check (pin_hash ~ '^[0-9a-f]{8}$'::text);
alter table public.kosan_residents add constraint kosan_residents_room_check
  check (room >= 1 and room <= 20);

-- ----------------------------------------------------------------------------
-- 6. Index
-- ----------------------------------------------------------------------------

-- Skema dasar tidak punya index selain index primary key (otomatis).
-- Index tambahan dibuat migrasi: items_tags_idx (06),
-- reports_status_created_idx (08, beserta tabel reports).

-- ----------------------------------------------------------------------------
-- 7. View
-- ----------------------------------------------------------------------------

-- Skema dasar tidak punya view. Semua view dibuat migrasi:
--   member_counts (01), top_reacted_week (07, diganti 10),
--   top_reacted_all + member_reactions_week (11).

-- ----------------------------------------------------------------------------
-- 8. Function (RPC Kosan; fungsi galeri dibuat migrasi 03/09/10)
-- ----------------------------------------------------------------------------

CREATE OR REPLACE FUNCTION public.kosan_login(p_name text, p_pin_hash text)
 RETURNS TABLE(room smallint, gender text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_name text := trim(ltrim(lower(trim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g'))), '@'));
  v_row public.kosan_residents%rowtype;
  v_att public.kosan_login_attempts%rowtype;
begin
  select * into v_row from kosan_residents where name = v_name;
  if v_row is not null and v_row.pin_hash = p_pin_hash then
    -- PIN benar: cek kunci dulu — akun terkunci tetap ditolak.
    select * into v_att from kosan_login_attempts where name = v_name;
    if v_att is not null and v_att.locked_until is not null and v_att.locked_until > now() then
      raise exception 'Terlalu banyak percobaan — coba lagi 15 menit lagi';
    end if;
    delete from kosan_login_attempts where name = v_name;
    room := v_row.room;
    gender := v_row.gender;
    return next;
    return;
  end if;
  -- PIN salah ATAU nama tidak ada: perilaku luar SAMA (0 baris).
  -- Hanya nama yang ADA yang dicatat kegagalannya.
  if v_row is not null then
    select * into v_att from kosan_login_attempts where name = v_name;
    if v_att is null then
      insert into kosan_login_attempts (name, failed_count) values (v_name, 1);
    elsif v_att.locked_until is not null and v_att.locked_until > now() then
      -- Masih terkunci: JANGAN perpanjang kunci (tebakan salah tidak
      -- boleh memperpanjang lock korban).
      null;
    elsif v_att.locked_until is not null then
      -- Kunci lama sudah kedaluwarsa: mulai hitung dari awal.
      update kosan_login_attempts set failed_count = 1, locked_until = null where name = v_name;
    elsif v_att.failed_count + 1 >= 5 then
      update kosan_login_attempts set failed_count = v_att.failed_count + 1, locked_until = now() + interval '15 minutes' where name = v_name;
    else
      update kosan_login_attempts set failed_count = v_att.failed_count + 1 where name = v_name;
    end if;
  end if;
  return;
end;
$function$;

CREATE OR REPLACE FUNCTION public.kosan_occupants()
 RETURNS TABLE(room smallint, name text)
 LANGUAGE sql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  select r.room, r.name from kosan_residents r order by r.room;
$function$;

CREATE OR REPLACE FUNCTION public.kosan_register(p_name text, p_gender text, p_key text, p_pin_hash text, p_room smallint)
 RETURNS smallint
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
  v_name text := lower(trim(regexp_replace(coalesce(p_name, ''), '\s+', ' ', 'g')));
  v_room smallint;
  v_range_lo smallint;
  v_range_hi smallint;
  v_attempt int;
begin
  -- Ronde 54 — username: buang "@" di depan (ketik "@rina" = "rina";
  -- pertahanan lapis kedua — klien juga membuang "@" di normalize()).
  v_name := trim(ltrim(v_name, '@'));
  -- Ronde 61 — kunci memilih gedung (urutan cek tetap: kunci dicek
  -- pertama seperti sebelumnya, hanya kini menerima dua kunci).
  -- Null-safe: `NOT IN` bernilai NULL saat p_key NULL (lolos diam-diam);
  -- `is distinct from` menutup celah itu (temuan review Task 8).
  if p_key is distinct from 'KOSAN' and p_key is distinct from 'KOSANBARU' then
    raise exception 'kunci salah';
  end if;
  -- Ronde 61 fix (Task 9, I1): Gedung B hanya dibuka lewat flag server
  -- (kosan_config.gedung_b_open, default OFF). Dicek tepat sesudah kunci
  -- divalidasi — gedung yang belum dibuka menolak siapa pun, apa pun
  -- nama/gender/PIN-nya. KOSAN (Gedung A) tidak terpengaruh flag ini.
  -- Pesan sengaja TIDAK mengandung 'kosan penuh' / 'Gedung A penuh'
  -- supaya tidak ke-shadow cabang catch klien yang sudah ada.
  if p_key = 'KOSANBARU' and not coalesce(
    (select value from kosan_config where key = 'gedung_b_open'), false) then
    raise exception 'Gedung B belum dibuka — tunggu video terbaru';
  end if;
  if v_name = '' or length(v_name) > 30 then
    raise exception 'nama tidak valid';
  end if;
  -- Ronde 54 — audit keamanan: batasi charset username (anti-homoglyph:
  -- huruf Cyrillic/Arab/dll yang mirip huruf Latin tidak boleh dipakai
  -- untuk meniru username orang lain). Hanya a-z, 0-9, spasi, _ . -
  -- plus minimal 1 huruf/angka.
  if v_name !~ '^[a-z0-9 _.-]+$' or v_name !~ '[a-z0-9]' then
    raise exception 'username tidak valid';
  end if;
  -- Ronde 61 fix (Task 9, M1): NULL lolos `NOT IN` / `!~` (bernilai NULL,
  -- IF tidak jalan) lalu meledak 23502 mentah di INSERT. `is null`
  -- menutupnya — NULL kini melempar pesan validasi bersih.
  if p_gender is null or p_gender not in ('Cewek', 'Cowok') then
    raise exception 'gender tidak valid';
  end if;
  if p_pin_hash is null or p_pin_hash !~ '^[0-9a-f]{8}$' then
    raise exception 'pin tidak valid';
  end if;
  if exists (select 1 from kosan_residents where name = v_name) then
    raise exception 'nama sudah terdaftar';
  end if;
  -- Ronde 61 — rentang kamar ditentukan dari kunci, SESUDAH cek
  -- nama/gender/pin di atas (urutan cek yang sudah ada tidak diubah):
  -- KOSAN → Gedung A (1..10), KOSANBARU → Gedung B (11..20).
  if p_key = 'KOSAN' then
    v_range_lo := 1; v_range_hi := 10;
  else -- KOSANBARU (sudah divalidasi di atas)
    v_range_lo := 11; v_range_hi := 20;
  end if;
  if p_room between v_range_lo and v_range_hi
     and not exists (select 1 from kosan_residents where room = p_room) then
    v_room := p_room;
  else
    select r into v_room from generate_series(v_range_lo::int, v_range_hi::int) as r
    where not exists (select 1 from kosan_residents where room = r)
    order by r limit 1;
  end if;
  if v_room is null then
    -- Ronde 61 fix (Task 9, I3): bedakan gedung yang penuh. Bila rentang
    -- yang diminta penuh TAPI gedung lain masih ada yang kosong, pesan
    -- spesifik gedung itu (supaya pendaftar tidak disuruh menunggu
    -- padahal masih bisa daftar di gedung lain). Bila keduanya penuh =
    -- 'kosan penuh' (benar-benar penuh).
    if p_key = 'KOSAN' then
      if (select count(*) from kosan_residents where room between 11 and 20) < 10 then
        raise exception 'Gedung A penuh — kode Gedung B ada di caption video terbaru';
      else
        raise exception 'kosan penuh';
      end if;
    else
      if (select count(*) from kosan_residents where room between 1 and 10) < 10 then
        raise exception 'Gedung B penuh — kode Gedung A ada di caption video terbaru';
      else
        raise exception 'kosan penuh';
      end if;
    end if;
  end if;
  -- Ronde 54 — audit keamanan: balapan dua pendaftaran ke kamar yang sama
  -- harus gagal bersih (PK room) tanpa merusak data — tangkap
  -- unique_violation dan ubah jadi pesan yang jelas (bukan error mentah
  -- Postgres ke browser).
  -- Ronde 61 fix (Task 9, M3): yang kalah balapan tidak langsung menyerah
  -- — probe ulang kamar kosong berikutnya di rentang yang sama (maks 3x
  -- percobaan INSERT) sebelum melempar 'kamar sudah terisi'. Perilaku
  -- normal tidak berubah: satu pendaftar tetap dapat kamar terendah
  -- yang kosong.
  for v_attempt in 1..3 loop
    begin
      insert into kosan_residents (room, name, gender, pin_hash)
      values (v_room, v_name, p_gender, p_pin_hash);
      return v_room;
    exception when unique_violation then
      if exists (select 1 from kosan_residents where name = v_name) then
        raise exception 'nama sudah terdaftar';
      end if;
      -- Kamar direbut pendaftar lain di detik yang sama: cari lagi.
      select r into v_room from generate_series(v_range_lo::int, v_range_hi::int) as r
      where not exists (select 1 from kosan_residents where room = r)
      order by r limit 1;
      if v_room is null then
        raise exception 'kamar sudah terisi';
      end if;
    end;
  end loop;
  raise exception 'kamar sudah terisi';
end;
$function$;

-- ----------------------------------------------------------------------------
-- 9. Trigger
-- ----------------------------------------------------------------------------

-- Skema dasar tidak punya trigger. Satu-satunya trigger dibuat migrasi 10
-- (reports_limit_open pada public.reports).

-- ----------------------------------------------------------------------------
-- 10. Row Level Security + policy
--     (keadaan dasar: policy tulis items/settings/storage.objects BELUM
--     mengandung is_admin() — lihat catatan DIVERGENSI di header)
-- ----------------------------------------------------------------------------

alter table public.capsules enable row level security;
alter table public.contributions enable row level security;
alter table public.items enable row level security;
alter table public.kosan_config enable row level security;
alter table public.kosan_login_attempts enable row level security;
alter table public.kosan_residents enable row level security;
alter table public.media enable row level security;
alter table public.profiles enable row level security;
alter table public.reactions enable row level security;
alter table public.settings enable row level security;

-- capsules -------------------------------------------------------------------
create policy "Enable all for authenticated users" on public.capsules
  for all to public using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Enable read access for all users" on public.capsules
  for select to public using (true);
create policy "Users can see own capsules" on public.capsules
  for select to public using (auth.uid() = user_id);

-- contributions --------------------------------------------------------------
-- (ekspresi USING / WITH CHECK di bawah disalin verbatim dari live DB —
--  pg_policies — hanya baris baru yang dilipat jadi spasi.)
create policy "Anyone can view contributions after capsule opens" on public.contributions
  for select to anon, authenticated using (((EXISTS ( SELECT 1 FROM capsules c WHERE ((c.id = contributions.capsule_id) AND (c.is_public = true) AND (c.open_at <= now())))) OR (auth.uid() = user_id) OR (EXISTS ( SELECT 1 FROM capsules c WHERE ((c.id = contributions.capsule_id) AND (c.user_id = auth.uid()))))));
create policy "Contributor can insert one message" on public.contributions
  for insert to authenticated with check ((( SELECT auth.uid() AS uid) = user_id) AND (EXISTS ( SELECT 1 FROM capsules c WHERE ((c.id = contributions.capsule_id) AND (c.is_public = true) AND (c.open_at > now())))));
create policy "Logged in users can contribute to public locked capsules" on public.contributions
  for insert to authenticated with check ((auth.uid() = user_id) AND (EXISTS ( SELECT 1 FROM capsules c WHERE ((c.id = contributions.capsule_id) AND (c.is_public = true) AND (c.open_at > now())))));
create policy "Owner and contributor can view contributions" on public.contributions
  for select to authenticated using ((( SELECT auth.uid() AS uid) = user_id) OR (EXISTS ( SELECT 1 FROM capsules c WHERE ((c.id = contributions.capsule_id) AND (c.user_id = ( SELECT auth.uid() AS uid))))));
create policy "Public can view unlocked contributions" on public.contributions
  for select to anon, authenticated using (EXISTS ( SELECT 1 FROM capsules c WHERE ((c.id = contributions.capsule_id) AND (c.is_public = true) AND (c.open_at <= now()))));
create policy "Users can delete their own contributions" on public.contributions
  for delete to authenticated using (auth.uid() = user_id);
create policy "Users can insert own contributions" on public.contributions
  for insert to public with check (auth.uid() = user_id);
create policy "Users can view contributions" on public.contributions
  for select to public using (true);

-- items ----------------------------------------------------------------------
create policy "admin hapus" on public.items
  for delete to authenticated using (true);
create policy "admin tambah" on public.items
  for insert to authenticated with check (true);
create policy "admin ubah" on public.items
  for update to authenticated using (true) with check (true);
create policy "publik boleh lihat" on public.items
  for select to public using (true);

-- kosan_config / kosan_login_attempts / kosan_residents -----------------------
-- RLS aktif TANPA policy: tidak ada akses langsung lewat API. Semua akses
-- lewat fungsi security definer kosan_login / kosan_register / kosan_occupants
-- (atau service_role key dari server). Sengaja begitu.

-- media ----------------------------------------------------------------------
create policy "Public Read Media" on public.media
  for select to public using (true);
create policy "public read" on public.media
  for select to public using (true);

-- profiles -------------------------------------------------------------------
create policy "Users can insert own profile" on public.profiles
  for insert to public with check (auth.uid() = id);
create policy "Users can see own profile" on public.profiles
  for select to public using (auth.uid() = id);

-- reactions ------------------------------------------------------------------
create policy "siapa saja kasih reaksi" on public.reactions
  for insert to anon, authenticated with check (true);
create policy "siapa saja lihat reaksi" on public.reactions
  for select to public using (true);

-- settings -------------------------------------------------------------------
create policy "admin ubah settings" on public.settings
  for insert to authenticated with check (true);
create policy "admin update settings" on public.settings
  for update to authenticated using (true) with check (true);
create policy "publik lihat settings" on public.settings
  for select to public using (true);

-- ----------------------------------------------------------------------------
-- 11. Storage: bucket + policy (skema storage sudah ada di proyek baru;
--     file ini hanya menambah bucket khusus proyek + policynya)
-- ----------------------------------------------------------------------------

insert into storage.buckets (id, name, public) values
  ('capsule-images', 'capsule-images', true),
  ('gallery', 'gallery', true)
on conflict (id) do nothing;

-- RLS sudah aktif di storage.objects (bawaan Supabase). Policy di bawah
-- hanya untuk bucket gallery; bucket capsule-images tidak punya policy
-- khusus di live (akses lewat service_role).
create policy "admin hapus file" on storage.objects
  for delete to authenticated using (bucket_id = 'gallery'::text);
create policy "admin upload file" on storage.objects
  for insert to authenticated with check (bucket_id = 'gallery'::text);
create policy "publik lihat file" on storage.objects
  for select to public using (bucket_id = 'gallery'::text);

-- ----------------------------------------------------------------------------
-- 12. Grant
--     (bawaan Supabase saat tabel dibuat lewat Table Editor: anon /
--     authenticated / service_role mendapat semua hak, RLS yang membatasi.
--     Tabel Kosan sengaja HANYA service_role — akses anon/authenticated
--     lewat RPC security definer.)
-- ----------------------------------------------------------------------------

grant all on table public.capsules to anon, authenticated, service_role;
grant all on table public.contributions to anon, authenticated, service_role;
grant all on table public.items to anon, authenticated, service_role;
grant all on table public.media to anon, authenticated, service_role;
grant all on table public.profiles to anon, authenticated, service_role;
grant all on table public.reactions to anon, authenticated, service_role;
grant all on table public.settings to anon, authenticated, service_role;
grant all on table public.kosan_config to service_role;
grant all on table public.kosan_login_attempts to service_role;
grant all on table public.kosan_residents to service_role;

grant execute on function public.kosan_login(text, text) to anon, authenticated, service_role;
grant execute on function public.kosan_register(text, text, text, text, smallint) to anon, authenticated, service_role;
grant execute on function public.kosan_occupants() to anon, authenticated, service_role;

-- Beri tahu PostgREST untuk memuat ulang skema (seperti yang dilakukan
-- migrasi-migrasi sesudah file ini).
notify pgrst, 'reload schema';

commit;

-- ============================================================================
-- Akhir skema dasar. Langkah berikut: jalankan migrasi 01-14 berurutan,
-- lalu pulihkan data. Cek cepat sesudah restore:
--   select schemaname, tablename from pg_tables
--     where schemaname = 'public' order by tablename;
--   -- harus ada 12 tabel (10 di sini + admins + reports dari migrasi).
-- ============================================================================
