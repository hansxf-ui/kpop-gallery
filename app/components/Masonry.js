'use client'
import { useEffect, useLayoutEffect, useMemo, useState } from 'react'
import { placeInColumns, heightRatio, columnsFor } from '../../lib/masonry'

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

// Jumlah kolom mengikuti lebar layar. Render pertama (server & hidrasi) selalu 2 kolom, lalu
// disesuaikan sebelum browser menggambar — tidak ada hydration mismatch.
function useColumnCount() {
  const [cols, setCols] = useState(2)
  useIsoLayoutEffect(() => {
    const update = () => setCols(columnsFor(window.innerWidth))
    update()
    window.addEventListener('resize', update)
    return () => window.removeEventListener('resize', update)
  }, [])
  return cols
}

// Grid masonry kiri-ke-kanan yang stabil saat item ditambah di belakang (lihat lib/masonry.js).
// renderItem(it, index) harus mengembalikan elemen ber-`key`.
// Catatan: urutan Tab keyboard sekarang per kolom (kolom kiri dulu), karena tiap kolom satu <div>.
export default function Masonry({ items, renderItem, className = '' }) {
  const cols = useColumnCount()
  const columns = useMemo(() => placeInColumns(items.map(heightRatio), cols), [items, cols])
  return (
    <div className={`flex items-start gap-4 ${className}`}>
      {columns.map((idxs, c) => (
        <div key={c} className="flex min-w-0 flex-1 flex-col">
          {idxs.map((i) => renderItem(items[i], i))}
        </div>
      ))}
    </div>
  )
}
