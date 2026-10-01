module.exports = {
  darkMode: 'class',
  content: ['./app/**/*.{js,jsx}'],
  theme: { extend: {
    // Palet "biru-putih-pink" Hearts2Hearts (nama token dipertahankan supaya className lama tetap jalan):
    // milk = putih sejuk, rose = biru langit, lilac = biru es, gold = pink, plum = biru laut dalam
    colors: { milk: '#F5FAFE', rose: '#7FC4E8', lilac: '#C9E6F7', gold: '#EA93BB', plum: '#173A56' },
    fontFamily: { display: ['"Playfair Display"', 'serif'], body: ['Quicksand', 'sans-serif'] }
  } },
  plugins: []
}
