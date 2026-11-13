// Emoji ekspresif sebagai gambar SVG Twemoji yang disimpan di situs sendiri (public/emoji/<kode>.svg),
// supaya tampil sama di Android & iPhone dan tidak bergantung CDN luar. Dipakai hanya untuk hal yang
// memang "seru": tombol reaksi, banner & hitung mundur hari spesial, hati favorit.
// Ikon fungsi (tombol, label) memakai Icon.js.
//
// Grafis: Twemoji (https://github.com/jdecked/twemoji, v17.0.3) © Twitter, Inc. dan kontributor,
// lisensi CC-BY 4.0 (https://creativecommons.org/licenses/by/4.0/). Kredit juga ada di halaman Tentang.
export const EMOJI = {
  '😍': '1f60d', '🔥': '1f525', '😭': '1f62d', '👏': '1f44f',
  '❤': '2764', '🎉': '1f389', '🎂': '1f382', '📣': '1f4e3',
}

// label kosong = hiasan (disembunyikan dari pembaca layar).
export default function Emoji({ char, size = 20, label = '', className = '' }) {
  const code = EMOJI[String(char).replace(/\uFE0F/g, '')]
  if (!code) return <span aria-hidden={!label || undefined} aria-label={label || undefined}>{char}</span>
  return (
    <img src={`/emoji/${code}.svg`} width={size} height={size} alt={label} aria-hidden={label ? undefined : true}
      draggable={false} decoding="async" className={`inline-block shrink-0 select-none align-[-0.2em] ${className}`} />
  )
}
