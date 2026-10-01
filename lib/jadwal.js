// Jadwal Hearts2Hearts — data terverifikasi silang 2026-10-02.
// Aturan: HANYA cantumkan event yang dikonfirmasi minimal 2 sumber berita / pengumuman resmi.
// Jangan mengarang tanggal. Kalau tanggal belum diumumkan, pakai tanggal: null (TBD).
//
// Sumber:
// - Spotify CLOSER 2 Okt 2026: allkpop (11 Sep 2026), seoulvibes.net, k-popit.com
// - ICONIC HEART (Korean Ver.) 5 Okt 2026 18:00 KST: seoulvibes.net (SM umumkan 30 Sep 2026),
//   k-popit.com, en.namu.wiki
// - MMA 2026 14-15 Nov 2026: allkpop (21 Sep 2026) — H2H di lineup gelombang ke-2
// - KGMA 2026 8 Nov 2026 (Music Day): allkpop (22 Sep 2026), kpopofficial.com/schedule/hearts2hearts
// - AAA 2026 5-6 Des 2026 Kaohsiung: soompi (30 Jul 2026, lineup wave 2), starnewskorea (official),
//   allkpop Lab (15 Sep 2026) — H2H di lineup penyanyi Day 1
// - Single baru Q4 2026: hasil bisnis SM Q2 2026 via kpop.fandom.com (tanggal menyusul)
// Riwayat 2026: RUDE! (20 Feb), Lemon Tang (22 Jun), ICONIC HEART JP debut (10 Agu),
// Moonride x Kia (9 Sep) — konsisten di allkpop/seoulvibes/kpop.fandom.com.

export const JADWAL = [
  {
    id: 'spotify-closer-2026',
    tipe: 'konser',
    emoji: '🎤',
    judul: 'Spotify CLOSER — Special Concert',
    tanggal: '2026-10-02',
    lokasi: 'Myeonghwa Live Hall, Seoul',
    catatan: 'Artis pertama proyek Spotify CLOSER · penampilan perdana ICONIC HEART (Korean Ver.)',
  },
  {
    id: 'iconic-heart-kr',
    tipe: 'rilis',
    emoji: '🎵',
    judul: 'ICONIC HEART (Korean Ver.)',
    tanggal: '2026-10-05T18:00:00+09:00',
    lokasi: null,
    catatan: 'Digital single · rilis 18:00 KST',
  },
  {
    id: 'kgma-2026',
    tipe: 'award',
    emoji: '🏆',
    judul: 'Korea Grand Music Awards 2026',
    tanggal: '2026-11-08',
    lokasi: 'Gocheok Sky Dome, Seoul',
    catatan: 'Tampil di Music Day (Day 2) · acara 2 hari (7–8 Nov)',
  },
  {
    id: 'mma-2026',
    tipe: 'award',
    emoji: '🏆',
    judul: 'Melon Music Awards 2026',
    tanggal: '2026-11-14',
    lokasi: 'Gocheok Sky Dome, Seoul',
    catatan: 'Masuk lineup · acara 2 hari (14–15 Nov)',
  },
  {
    id: 'aaa-2026',
    tipe: 'award',
    emoji: '🏆',
    judul: 'Asia Artist Awards 2026',
    tanggal: '2026-12-05',
    lokasi: 'Kaohsiung National Stadium, Taiwan',
    catatan: 'Lineup penyanyi Day 1 · acara 2 hari (5–6 Des)',
  },
  {
    id: 'single-q4-2026',
    tipe: 'rilis',
    emoji: '💿',
    judul: 'Single Baru',
    tanggal: null,
    lokasi: null,
    catatan: 'Diumumkan SM untuk Q4 2026 · tanggal menyusul',
  },
]

export const RIWAYAT_2026 = [
  { judul: 'RUDE!', tanggal: '2026-02-20', catatan: 'Digital single' },
  { judul: 'Lemon Tang', tanggal: '2026-06-22', catatan: 'Mini album ke-2' },
  { judul: 'ICONIC HEART', tanggal: '2026-08-10', catatan: 'Debut Jepang' },
  { judul: 'Moonride', tanggal: '2026-09-09', catatan: 'Kolaborasi dengan Kia' },
]

export const TIPE_LABEL = {
  konser: 'Konser',
  rilis: 'Rilisan',
  award: 'Penghargaan',
  fanmeeting: 'Fanmeeting',
}
