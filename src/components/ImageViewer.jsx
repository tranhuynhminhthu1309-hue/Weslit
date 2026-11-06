import { useState } from 'react'

/** Xem ảnh toàn màn hình, phóng to / thu nhỏ. */
export default function ImageViewer({ src, onClose }) {
  const [z, setZ] = useState(1)
  return (
    <div className="fixed inset-0 z-[60] flex flex-col bg-black/90">
      <div className="flex items-center justify-between p-3 text-white">
        <div className="flex gap-2">
          <button className="rounded-lg bg-white/15 px-3 py-1.5 text-lg" onClick={() => setZ((v) => Math.max(0.5, +(v - 0.5).toFixed(1)))}>−</button>
          <button className="rounded-lg bg-white/15 px-3 py-1.5 text-sm" onClick={() => setZ(1)}>{Math.round(z * 100)}%</button>
          <button className="rounded-lg bg-white/15 px-3 py-1.5 text-lg" onClick={() => setZ((v) => Math.min(4, +(v + 0.5).toFixed(1)))}>+</button>
        </div>
        <button className="rounded-lg bg-white/15 px-3 py-1.5 text-sm" onClick={onClose}>Đóng ✕</button>
      </div>
      <div className="flex-1 overflow-auto p-2" onClick={(e) => e.target === e.currentTarget && onClose()}>
        <img src={src} alt="Hóa đơn" style={{ width: `${z * 100}%`, maxWidth: 'none' }} className="mx-auto block" />
      </div>
    </div>
  )
}
