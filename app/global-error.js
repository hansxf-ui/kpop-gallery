'use client'

// Cadangan terakhir: error di layout utama (app/layout.js) itu sendiri. Di titik ini layout,
// CSS, dan pilihan bahasa belum tentu jalan, jadi halaman ini berdiri sendiri (gaya inline,
// teks dua bahasa). Error di halaman biasa ditangani app/error.js.
export default function GlobalError({ reset }) {
  const btn = { padding: '10px 20px', borderRadius: 999, border: 'none', background: '#173A56', color: '#F5FAFE', fontWeight: 700, cursor: 'pointer' }
  return (
    <html lang="id">
      <body style={{ margin: 0, minHeight: '100vh', display: 'grid', placeItems: 'center', background: '#F5FAFE', color: '#173A56', fontFamily: 'system-ui, sans-serif', textAlign: 'center', padding: 16 }}>
        <div role="alert">
          <p style={{ fontSize: 24, margin: 0 }} aria-hidden>✦ ✧ ✦</p>
          <h1 style={{ margin: '12px 0 8px' }}>Hearts2Hearts Gallery</h1>
          <p style={{ margin: 0 }}>Situs sedang bermasalah. Coba lagi sebentar lagi.</p>
          <p lang="en" style={{ margin: '4px 0 20px', opacity: 0.7 }}>Something went wrong. Please try again shortly.</p>
          <button onClick={() => reset()} style={btn}>Coba lagi · Try again</button>
        </div>
      </body>
    </html>
  )
}
