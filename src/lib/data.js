import { supabase, BUCKET } from './supabase'
import { computeBill } from './money'

const must = (r) => {
  if (r.error) throw r.error
  return r.data
}

/** Tải toàn bộ dữ liệu của 1 nhóm (nhóm bạn nhỏ nên tải một lần rồi tính ở client). */
export async function loadGroup(gid) {
  const q = (t, order) => {
    let s = supabase.from(t).select('*').eq('group_id', gid)
    if (order) s = s.order(order.col, { ascending: !!order.asc })
    return s
  }
  const [group, members, events, participants, bills, items, payments, images, activity] = await Promise.all([
    supabase.from('groups').select('*').eq('id', gid).single(),
    q('members', { col: 'created_at', asc: true }),
    q('events', { col: 'event_date' }),
    q('event_participants'),
    q('bills', { col: 'created_at', asc: true }),
    q('bill_personal_items'),
    q('payments', { col: 'created_at' }),
    q('bill_images', { col: 'created_at' }),
    supabase.from('activity_log').select('*').eq('group_id', gid).order('created_at', { ascending: false }).limit(200),
  ])
  const d = {
    group: must(group),
    members: must(members),
    events: must(events),
    participants: must(participants),
    bills: must(bills),
    items: must(items),
    payments: must(payments),
    images: must(images),
    activity: must(activity),
  }
  d.computed = computeAll(d)
  return d
}

export function computeAll(d) {
  return d.bills.map((b) => ({
    ...computeBill(b, d.items.filter((i) => i.bill_id === b.id)),
    event_id: b.event_id,
  }))
}

export async function logActivity(gid, actor, action, entity, entityId, details) {
  await supabase.from('activity_log').insert({
    group_id: gid,
    actor: actor?.userId ?? null,
    actor_name: actor?.name ?? '',
    action,
    entity,
    entity_id: entityId ?? null,
    details: details ?? null,
  })
}

/** Thu nhỏ ảnh chụp từ điện thoại (cạnh dài tối đa 2000px) để tiết kiệm dung lượng, vẫn đủ rõ để đối chiếu. */
async function shrinkImage(file, max = 2000) {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file
  try {
    const bmp = await createImageBitmap(file)
    const scale = Math.min(1, max / Math.max(bmp.width, bmp.height))
    if (scale === 1 && file.size < 1.5e6) return file
    const c = document.createElement('canvas')
    c.width = Math.round(bmp.width * scale)
    c.height = Math.round(bmp.height * scale)
    c.getContext('2d').drawImage(bmp, 0, 0, c.width, c.height)
    const blob = await new Promise((res) => c.toBlob(res, 'image/jpeg', 0.9))
    return blob || file
  } catch {
    return file
  }
}

export async function uploadBillImage({ gid, eid, billId, file, userId }) {
  const blob = await shrinkImage(file)
  const ext = blob.type === 'image/png' ? 'png' : 'jpg'
  const path = `${gid}/${eid}/${crypto.randomUUID()}.${ext}`
  const up = await supabase.storage.from(BUCKET).upload(path, blob, { contentType: blob.type || 'image/jpeg' })
  if (up.error) throw up.error
  const row = must(
    await supabase
      .from('bill_images')
      .insert({ group_id: gid, event_id: eid, bill_id: billId || null, path, uploaded_by: userId })
      .select()
      .single()
  )
  return row
}

export async function deleteBillImage(img) {
  await supabase.storage.from(BUCKET).remove([img.path])
  must(await supabase.from('bill_images').delete().eq('id', img.id))
}

export async function signedUrls(paths) {
  if (!paths.length) return {}
  const { data, error } = await supabase.storage.from(BUCKET).createSignedUrls(paths, 3600)
  if (error) throw error
  const out = {}
  data.forEach((x) => {
    if (x.signedUrl) out[x.path] = x.signedUrl
  })
  return out
}

export { must }
