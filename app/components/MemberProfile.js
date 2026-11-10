'use client'
import { PROFILES, PROFILE_NOTES, GROUP_PROFILE, birthdayOf, topEra } from '../../lib/members'

// Kartu profil di atas album idol (fitur 2). Baris yang datanya belum tercatat tidak ditampilkan.
export default function MemberProfile({ albumKey, items }) {
  const fotos = items ? items.filter((i) => i.type === 'photo').length : null
  const videos = items ? items.length - fotos : null
  const era = items ? topEra(items) : null

  let rows
  if (albumKey === 'HEARTS2HEARTS') {
    const g = GROUP_PROFILE
    rows = [['Debut', g.debut], ['Agensi', g.agency], ['Member', `${g.members} orang`], ['Fandom', g.fandom]]
  } else {
    const p = PROFILES[albumKey]
    if (!p) return null
    rows = [['Posisi', p.pos], ['Ulang tahun', birthdayOf(albumKey)], ['Asal', p.origin]]
  }
  rows.push(['Era terbanyak di galeri', era ? `${era.era} (${era.count} item)` : null])
  rows.push(['Koleksi di galeri', items ? `${fotos} foto · ${videos} video` : 'Memuat…'])
  rows = rows.filter(([, v]) => v)
  const note = PROFILE_NOTES[albumKey]

  return (
    <section aria-label="Profil" className="mx-auto mb-10 max-w-md rounded-3xl border border-rose/40 bg-white/80 p-5 dark:border-rose/20 dark:bg-white/5">
      <dl className="divide-y divide-rose/25 text-sm dark:divide-rose/15">
        {rows.map(([k, v]) => (
          <div key={k} className="flex items-baseline justify-between gap-4 py-2">
            <dt className="text-xs font-bold uppercase tracking-widest text-plum/50 dark:text-milk/50">{k}</dt>
            <dd className="text-right font-bold text-plum dark:text-milk">{v}</dd>
          </div>
        ))}
      </dl>
      {note && <p className="mt-3 text-center text-xs text-plum/60 dark:text-milk/60">{note}</p>}
    </section>
  )
}
