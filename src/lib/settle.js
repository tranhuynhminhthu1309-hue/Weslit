// Công nợ: số dư ròng, trừ các khoản đã xác nhận, gợi ý chuyển khoản tối giản (bù trừ).

/** net[m] = đã ứng - phải chịu. Dương: được nhận lại. Âm: phải trả. */
export function netBalances(computedBills) {
  const net = {}
  for (const b of computedBills) {
    if (b.errors?.length) continue
    net[b.paid_by] = (net[b.paid_by] || 0) + b.total
    for (const [m, a] of Object.entries(b.owed)) net[m] = (net[m] || 0) - a
  }
  return net
}

/** Chỉ các khoản status === 'confirmed' mới làm thay đổi công nợ. */
export function applyPayments(net, payments) {
  const out = { ...net }
  for (const p of payments) {
    if (p.status !== 'confirmed') continue
    out[p.from_member] = (out[p.from_member] || 0) + p.amount
    out[p.to_member] = (out[p.to_member] || 0) - p.amount
  }
  return out
}

/**
 * Gợi ý chuyển khoản ít lần nhất có thể theo số dư ròng:
 * ghép các cặp bằng đúng nhau trước, sau đó ghép người nợ nhiều nhất với người được nhận nhiều nhất.
 * Tối đa (số người có số dư khác 0) - 1 lần chuyển.
 */
export function simplifyDebts(net) {
  const cr = []
  const db = []
  Object.entries(net).forEach(([id, v]) => {
    if (v > 0) cr.push({ id, amt: v })
    else if (v < 0) db.push({ id, amt: -v })
  })
  const byAmt = (a, b) => b.amt - a.amt || (a.id < b.id ? -1 : 1)
  cr.sort(byAmt)
  db.sort(byAmt)
  const out = []
  // 1) cặp bằng nhau -> 1 lần chuyển giải quyết cả hai
  for (const c of cr) {
    if (!c.amt) continue
    const d = db.find((x) => x.amt === c.amt)
    if (d) {
      out.push({ from: d.id, to: c.id, amount: c.amt })
      c.amt = 0
      d.amt = 0
    }
  }
  // 2) ghép lớn nhất với lớn nhất
  const c2 = cr.filter((x) => x.amt > 0).sort(byAmt)
  const d2 = db.filter((x) => x.amt > 0).sort(byAmt)
  let i = 0
  let j = 0
  while (i < c2.length && j < d2.length) {
    const t = Math.min(c2[i].amt, d2[j].amt)
    out.push({ from: d2[j].id, to: c2[i].id, amount: t })
    c2[i].amt -= t
    d2[j].amt -= t
    if (c2[i].amt === 0) i++
    if (d2[j].amt === 0) j++
  }
  return out
}

/** Số khoản nợ riêng lẻ (người nợ × bill) nếu không bù trừ, dùng để hiển thị "tiết kiệm được bao nhiêu lần chuyển". */
export function rawObligationCount(computedBills) {
  let n = 0
  for (const b of computedBills) {
    if (b.errors?.length) continue
    for (const [m, a] of Object.entries(b.owed)) if (m !== b.paid_by && a > 0) n++
  }
  return n
}

/** Gộp toàn bộ tính toán công nợ của nhóm: chỉ sự kiện đã chốt, trừ các khoản thanh toán đã xác nhận. */
export function groupSettlement(events, computed, payments) {
  const locked = new Set(events.filter((e) => e.status === 'locked').map((e) => e.id))
  const lockedBills = computed.filter((c) => locked.has(c.event_id))
  const after = applyPayments(netBalances(lockedBills), payments)
  return { after, suggestions: simplifyDebts(after), raw: rawObligationCount(lockedBills) }
}
