export default function Skeleton({ count = 8 }) {
  return (
    <div className="columns-2 md:columns-3 lg:columns-4 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card mb-4 w-full break-inside-avoid overflow-hidden">
          <div className="skeleton rounded-2xl" style={{ height: 130 + (i % 4) * 45 }} />
          <div className="skeleton h-3 rounded mt-3 mx-2" style={{ width: '70%' }} />
          <div className="skeleton h-2.5 rounded mt-2 mb-3 mx-2" style={{ width: '40%' }} />
        </div>
      ))}
    </div>
  )
}
