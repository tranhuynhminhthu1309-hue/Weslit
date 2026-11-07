import { useState } from 'react'
import { useGroup } from '../../lib/ctx'
import { go } from '../../lib/router'
import { useSignedUrls } from '../../lib/useUrls'
import { Empty, dateVN } from '../../components/ui'
import ImageViewer from '../../components/ImageViewer'

export default function GalleryTab() {
  const { data, gid } = useGroup()
  const urls = useSignedUrls(data.images)
  const [viewer, setViewer] = useState(null)
  const events = [...data.events].sort((a, b) => (a.event_date < b.event_date ? 1 : -1)).filter((e) => data.images.some((i) => i.event_id === e.id))
  if (!events.length) return <Empty icon="🖼️" title="Kho ảnh hóa đơn trống" hint="Mở một sự kiện rồi chụp hoặc tải ảnh bill để lưu ở đây." />
  return (
    <div className="space-y-5">
      {events.map((e) => (
        <section key={e.id}>
          <button className="mb-2 text-left" onClick={() => go(`/g/${gid}/e/${e.id}`)}>
            <b>{e.name}</b> <span className="text-xs text-slate-400">{dateVN(e.event_date)}</span>
          </button>
          <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
            {data.images.filter((i) => i.event_id === e.id).map((i) => (
              <div key={i.id} className="aspect-square overflow-hidden rounded-xl bg-slate-100">
                {urls[i.path] && <img loading="lazy" decoding="async" src={urls[i.path]} alt="Hóa đơn" className="h-full w-full cursor-zoom-in object-cover" onClick={() => setViewer(urls[i.path])} />}
              </div>
            ))}
          </div>
        </section>
      ))}
      {viewer && <ImageViewer src={viewer} onClose={() => setViewer(null)} />}
    </div>
  )
}
