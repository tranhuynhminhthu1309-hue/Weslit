import { useEffect, useState } from 'react'
import { signedUrls } from './data'

/** Lấy link ảnh tạm thời (có hạn) cho danh sách bill_images. */
export function useSignedUrls(images) {
  const [urls, setUrls] = useState({})
  const key = images.map((i) => i.path).join('|')
  useEffect(() => {
    let live = true
    const need = images.map((i) => i.path).filter((p) => !urls[p])
    if (!need.length) return
    signedUrls(need)
      .then((u) => live && setUrls((x) => ({ ...x, ...u })))
      .catch(() => {})
    return () => {
      live = false
    }
  }, [key])
  return urls
}
