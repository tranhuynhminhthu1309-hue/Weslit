// Tính tiền theo VNĐ (số nguyên). Mọi hàm ở đây là hàm thuần, có test trong money.test.js.

export const fmt = (n) => new Intl.NumberFormat('vi-VN').format(Math.round(n || 0)) + 'đ'

export function parseMoney(s) {
  const d = String(s ?? '').replace(/[^\d]/g, '')
  return d ? parseInt(d, 10) : 0
}

function hash(str) {
  let h = 0
  for (const c of String(str)) h = (h * 31 + c.charCodeAt(0)) >>> 0
  return h
}

/**
 * Chia đều `total` cho `ids` bằng số nguyên. Phần lẻ (total mod n) được cộng thêm 1đ cho
 * một số người, vị trí bắt đầu phụ thuộc `seed` (mã bill) để không luôn dồn phần lẻ cho cùng một người.
 * Luôn đảm bảo tổng các phần == total.
 */
export function splitEvenly(total, ids, seed = '') {
  const list = [...new Set(ids)].sort()
  const n = list.length
  const out = {}
  if (!n) return out
  const base = Math.floor(total / n)
  const rem = total - base * n
  const start = hash(seed) % n
  list.forEach((id) => (out[id] = base))
  for (let k = 0; k < rem; k++) out[list[(start + k) % n]] += 1
  return out
}

/**
 * Phân bổ 1 bill.
 *  bill: { id, total, paid_by, shared_member_ids }
 *  personalItems: [{ amount, member_id }]
 * Chi phí chung = total - tổng món riêng, chia đều cho shared_member_ids.
 * Trả về { total, sharedAmount, personalSum, paid_by, owed: {memberId: số tiền}, errors: [] }
 * Khi không có lỗi: tổng owed luôn == total.
 */
export function computeBill(bill, personalItems = []) {
  const errors = []
  const total = Math.round(bill.total || 0)
  const personalSum = personalItems.reduce((s, i) => s + Math.round(i.amount || 0), 0)
  const sharedAmount = total - personalSum
  const sharedIds = bill.shared_member_ids || []
  if (!bill.paid_by) errors.push('Chưa chọn người thanh toán')
  if (sharedAmount < 0) errors.push('Tổng món riêng vượt quá tổng hóa đơn')
  if (sharedAmount > 0 && sharedIds.length === 0) errors.push('Chưa chọn ai chia khoản chi chung')
  if (personalItems.some((i) => !i.member_id)) errors.push('Có món riêng chưa gán người dùng')
  const owed = {}
  if (!errors.length) {
    const shares = splitEvenly(sharedAmount, sharedIds, bill.id || '')
    Object.entries(shares).forEach(([m, a]) => (owed[m] = (owed[m] || 0) + a))
    personalItems.forEach((i) => (owed[i.member_id] = (owed[i.member_id] || 0) + Math.round(i.amount)))
  }
  return { id: bill.id, total, sharedAmount, personalSum, paid_by: bill.paid_by, owed, errors }
}
