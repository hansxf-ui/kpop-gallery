// Voting Hearts2Hearts — data diverifikasi silang Vesper 2026-10-02 (cek ulang satu per satu; cek ulang 2026-10-05; cek ulang 2026-10-09).
// Aturan: HANYA cantumkan voting/polling yang dikonfirmasi pengumuman resmi / ≥2 media kredibel.
// Status dihitung otomatis dari tanggal: buka (mulai<=now<=selesai), segera (now<mulai),
// tutup (now>selesai, otomatis disembunyikan). Entri tanpa tanggal = tunggu (belum diumumkan).
// Jangan mengarang periode. Jangan pakai klaim dari konten fan-made sebagai fakta.
//
// Sumber terverifikasi:
// - AAA 2026 Popularity Award (preliminary 16 Sep–6 Okt, final 8 Okt–4 Nov, IdolChamp):
//   starnewskorea 4 Sep 2026 (media resmi AAA) + starnewskorea 11 Sep 2026 (H2H lolos pre-vote, female group singer)
//   HASIL PRELIMINARY (cek 9 Okt 2026): H2H peringkat 5 Female Group Singer — k-hallyu.com 7 Okt 2026
//   (NMIXX 1 dgn 31.641 suara, TWICE 2, ISEGYE IDOL 3, HADES 4, H2H 5; berdasarkan data IdolChamp/StarNews)
//   + topstarnews.net 4 & 6 Okt 2026 (ranking resmi homepage AAA, urutan sama). Final dibuka 8 Okt 2026;
//   per 8 Okt 2026 H2H peringkat 1 SEMENTARA di final Female Group (topstarnews.net 8 Okt 2026).
// - KGMA Berriz Global Fans' Choice (6–19 Okt 2026, mulai 10:00 KST): notice resmi berriz.in 1 Okt 2026
//   + halaman vote resmi link.berriz.in/web/main/vote/2026kgma.
//   ✅ Nominasi H2H TERKONFIRMASI 3 Okt 2026: "Hearts2Hearts" ada di lineup resmi 41 artis di halaman
//   vote Berriz (dicek live, tanpa login) · kriteria 100% suara fans Berriz · 1 vote/hari (00:00–23:59 KST).
// - KGMA K-Wave Popularity (coogoong): jadwal resmi kgma-is.com/locales/en/vote.html (Global Overseas
//   Final 28 Sep–10 Okt 2026, coogoong Official Vote 100%, hasil = Ronde 1 50% + Final 50%)
//   + isplus.com 28 Sep 2026 (final K-Wave Popularity dimulai di coogoong, khusus pengguna luar Korea).
//   Cek ulang 5 Okt 2026. (KOREKSI: catatan lama "periode belum diumumkan" SALAH — final sudah jalan
//   sejak 28 Sep. Carmen peringkat 2 dgn 100.208 suara per feed 5 Okt 2026.)
// - MMA 2026 fan vote: koreajoongangdaily Jun 2026 ("more details on Melon's dedicated MMA page") + ajupress 30 Sep 2026
//   + allkpop 30 Sep 2026. Nominasi & periode BELUM diumumkan. Kategori baru: "Global TOP 10" (suara fans via Global-K Chart).
// - Carmen Picnic: menang 2x — koreajoongangdaily (poll 6–20 Feb 2026, 179.350 vote; poll 13–27 Mar 2026, 65.786 vote).
// - Carmen Choeaedol Image Pick: menang 2x terverifikasi — hancinema (press release CHOEAEDOL):
//   (1) diumumkan 14 Jul 2026, poll tutup 13 Jul — tema "summer concept";
//   (2) diumumkan 24 Jul 2026, poll tutup 23 Jul — tema "self-produced variety content".
//   Keduanya kalahkan Lee Ji-eun & NingNing aespa. (Koreksi 1x→2x: cek ulang 5 Okt 2026.)
// - Carmen lahir 28 Mar 2006 (namu.wiki) — member Indonesia (koreajoongangdaily).
// - M Countdown pre-vote: Sabtu 00:00 – Senin 23:59 KST, 5 vote/akun/hari (reorbit.xyz + panduan fanbase).
// - Show Champion pre-vote: Jumat 20:00 – Senin 14:00 KST via IdolChamp (reorbit.xyz + press release resmi GameOn).
// - Inkigayo: pre-vote via LiNC (5%), live-vote via Higher (Wikipedia).
// - Music Bank: pre-vote resmi via coogoong, tercermin di K-Chart (deskripsi resmi App Store coogoong).
// - IdolChamp: chamsim dari kuis (appstor.io).

export const VOTING = [
  {
    id: 'aaa-2026-popularity-prelim',
    event: 'AAA 2026 — Popularity Award',
    kategori: 'Female Group Singer · babak Preliminary',
    platform: 'IdolChamp',
    mulai: '2026-09-16T10:00:00+09:00',
    selesai: '2026-10-06T23:59:00+09:00',
    catatan: 'Hasil preliminary: H2H peringkat 5 Female Group Singer · top 20 lolos ke final (hasil preliminary berbobot 30%)',
    cara: [
      'Download IdolChamp (gratis, iOS/Android)',
      'Daftar akun, kumpulkan chamsim dari check-in harian & kuis',
      'Buka polling AAA 2026 Popularity Award',
      'Vote Hearts2Hearts di kategori Female Group Singer',
    ],
    link: { label: 'Pengumuman resmi', url: 'https://www.starnewskorea.com/en/star/2026/09/04/2026090414043351811' },
  },
  {
    id: 'aaa-2026-popularity-final',
    event: 'AAA 2026 — Popularity Award',
    kategori: 'Female Group Singer · babak Final',
    platform: 'IdolChamp',
    mulai: '2026-10-08T10:00:00+09:00',
    selesai: '2026-11-04T23:59:00+09:00',
    catatan: 'H2H masuk final dari peringkat 5 preliminary · per 8 Okt 2026 peringkat 1 sementara di final · bobot 70% penentu pemenang · juara tiap kategori dapat trofi Popularity Award',
    cara: [
      'Download IdolChamp (gratis, iOS/Android)',
      'Daftar akun, kumpulkan chamsim dari check-in harian & kuis',
      'Buka polling AAA 2026 Popularity Award',
      'Vote Hearts2Hearts di kategori Female Group Singer',
    ],
    link: { label: 'Pengumuman resmi', url: 'https://www.starnewskorea.com/en/star/2026/09/04/2026090414043351811' },
  },
  {
    id: 'kgma-2026-berriz',
    event: 'KGMA 2026 — Berriz Global Fans\u2019 Choice',
    kategori: 'Global Fans\u2019 Choice',
    platform: 'Berriz',
    mulai: '2026-10-06T10:00:00+09:00',
    selesai: '2026-10-19T23:59:00+09:00',
    catatan: 'Hearts2Hearts TERKONFIRMASI masuk nominasi (lineup resmi Berriz, dicek 3 Okt 2026) · penentu 100% suara fans · pemenang diumumkan di acara KGMA 7–8 Nov 2026',
    cara: [
      'Download Berriz (platform fandom Kakao, gratis)',
      'Buka halaman vote 2026 KGMA — Berriz Global Fans’ Choice',
      'Vote Hearts2Hearts — bisa 1 vote per hari (00:00–23:59 KST)',
      'Periode vote 6–19 Okt 2026, mulai 6 Okt 10:00 KST',
    ],
    link: { label: 'Halaman vote Berriz', url: 'https://link.berriz.in/web/main/vote/2026kgma' },
  },
  {
    id: 'mma-2026-fanvote',
    event: 'MMA 2026 — Fan Vote',
    kategori: 'Fan vote (nominasi menyusul)',
    platform: 'Melon',
    mulai: null,
    selesai: null,
    catatan: 'Nominasi & periode voting belum diumumkan · info resmi menyusul di halaman khusus MMA di aplikasi Melon · kategori baru tahun ini: "Global TOP 10" (suara fans via Global-K Chart)',
    cara: null,
    link: null,
  },
  {
    id: 'kgma-2026-coogoong',
    event: 'KGMA 2026 — K-Wave Popularity',
    kategori: 'K-Wave Popularity (Overseas) · Carmen · babak Final',
    platform: 'coogoong',
    mulai: '2026-09-28T00:00:00+09:00',
    selesai: '2026-10-10T23:59:00+09:00',
    catatan: 'Babak Final SEDANG BERJALAN (28 Sep–10 Okt 2026) · 100% suara fans via coogoong · khusus pengguna di luar Korea · Carmen peringkat 2 dengan 100.208 suara (5 Okt 2026) · hasil akhir = Ronde 1 (50%) + Final (50%)',
    cara: [
      'Download coogoong (gratis, iOS/Android)',
      'Daftar akun, kumpulkan Blue Hearts gratis dari check-in harian, roulette & nonton iklan',
      'Buka seksi KGMA — K-Wave Popularity',
      'Vote Carmen — panduan fanbase: 200 hearts = 1 vote',
    ],
    link: { label: 'Jadwal vote resmi KGMA', url: 'https://kgma-is.com/locales/en/vote.html' },
  },
]

export const VOTING_CARMEN = {
  status: 'Ada polling individu yang SEDANG BUKA: Carmen di KGMA K-Wave Popularity (final s/d 10 Okt 2026, peringkat 2).',
  daftar: [
    { platform: 'coogoong', info: 'KGMA K-Wave Popularity — Carmen nominasi individu, final 28 Sep–10 Okt 2026, 100% fan vote, khusus overseas. Blue Hearts dari check-in/roulette/iklan.' },
    { platform: 'Choeaedol', info: 'Image Pick — tema berganti terus, cek tab Image Pick di aplikasi. Carmen pernah menang 2x (Jul 2026: tema summer concept & self-produced variety content — kalahkan Lee Ji-eun & NingNing aespa).' },
    { platform: 'Picnic', info: 'Polling mingguan — Carmen pernah menang 2x (Feb & Mar 2026).' },
    { platform: 'DuckAd', info: 'Iklan ultah — ultah Carmen 28 Maret; proyek fanbase biasanya dibuka sekitar Feb 2027.' },
  ],
}

export const PANDUAN_APLIKASI = [
  { aplikasi: 'Mnet Plus', acara: 'M Countdown', info: 'Pre-vote Sabtu 00:00 – Senin 23:59 KST · 5 vote/hari/akun' },
  { aplikasi: 'Idol Champ', acara: 'Show Champion', info: 'Pre-vote Jumat 20:00 – Senin 14:00 KST' },
  { aplikasi: 'Star Planet', acara: 'The Show', info: 'Vote via Star Planet (pre-vote + live vote; cek periode di aplikasi)' },
  { aplikasi: 'LiNC', acara: 'Inkigayo', info: 'Pre-vote 5% via LiNC, live-vote via Higher (cek periode di aplikasi)' },
  { aplikasi: 'coogoong', acara: 'Music Bank', info: 'Pre-vote resmi, tercermin di K-Chart' },
]
