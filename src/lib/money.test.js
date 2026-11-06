import test from 'node:test'
import assert from 'node:assert/strict'
import { splitEvenly, computeBill } from './money.js'
import { netBalances, applyPayments, simplifyDebts, rawObligationCount } from './settle.js'

const sum = (o) => Object.values(o).reduce((a, b) => a + b, 0)

test('ví dụ trong brief: bill 1.500.000, món riêng A 100k và B 150k, 5 người', () => {
  const b = computeBill(
    { id: 'b1', total: 1500000, paid_by: 'A', shared_member_ids: ['A', 'B', 'C', 'D', 'E'] },
    [{ amount: 100000, member_id: 'A' }, { amount: 150000, member_id: 'B' }]
  )
  assert.deepEqual(b.errors, [])
  assert.equal(b.sharedAmount, 1250000)
  assert.deepEqual(b.owed, { A: 350000, B: 400000, C: 250000, D: 250000, E: 250000 })
  assert.equal(sum(b.owed), 1500000)
})

test('chia lẻ: tổng luôn khớp, chênh lệch giữa 2 người tối đa 1đ', () => {
  for (let n = 1; n <= 9; n++) {
    for (const total of [1, 7, 100, 999999, 1000001, 1234567]) {
      const ids = Array.from({ length: n }, (_, i) => 'm' + i)
      for (const seed of ['', 'x', 'bill-42']) {
        const s = splitEvenly(total, ids, seed)
        assert.equal(sum(s), total)
        const v = Object.values(s)
        assert.ok(Math.max(...v) - Math.min(...v) <= 1)
      }
    }
  }
})

test('phần lẻ không luôn dồn cho cùng 1 người giữa các bill', () => {
  const ids = ['a', 'b', 'c']
  const who = new Set()
  for (let i = 0; i < 12; i++) {
    const s = splitEvenly(100, ids, 'bill' + i) // 100 = 33*3 + 1
    who.add(Object.keys(s).find((k) => s[k] === 34))
  }
  assert.ok(who.size > 1)
})

test('lỗi nhập liệu: món riêng vượt tổng, thiếu người chia, thiếu người trả', () => {
  assert.ok(computeBill({ total: 100, paid_by: 'A', shared_member_ids: ['A'] }, [{ amount: 200, member_id: 'A' }]).errors.length)
  assert.ok(computeBill({ total: 100, paid_by: 'A', shared_member_ids: [] }, []).errors.length)
  assert.ok(computeBill({ total: 100, shared_member_ids: ['A'] }, []).errors.length)
  // toàn bộ là món riêng thì không cần chọn người chia chung
  assert.deepEqual(computeBill({ total: 100, paid_by: 'A', shared_member_ids: [] }, [{ amount: 100, member_id: 'B' }]).errors, [])
})

test('bù trừ: A nợ B ở bill 2 nhưng được B, C, D trả ở bill 1', () => {
  const b1 = computeBill({ id: '1', total: 900, paid_by: 'A', shared_member_ids: ['A', 'B', 'C'] }) // B,C nợ A 300
  const b2 = computeBill({ id: '2', total: 600, paid_by: 'B', shared_member_ids: ['A', 'B', 'C'] }) // A,C nợ B 200
  const net = netBalances([b1, b2])
  assert.deepEqual(net, { A: 900 - 300 - 200, B: 600 - 300 - 200, C: -300 - 200 })
  const t = simplifyDebts(net)
  assert.equal(t.length, 2) // thay vì 4 khoản nợ riêng lẻ
  assert.equal(rawObligationCount([b1, b2]), 4)
  assert.equal(sum(Object.fromEntries(t.map((x, i) => [i, x.amount]))), 500)
})

test('simplifyDebts: không ai thừa, không ai thiếu, tối đa n-1 lần chuyển', () => {
  for (let run = 0; run < 300; run++) {
    const n = 2 + Math.floor(Math.random() * 8)
    const net = {}
    let s = 0
    for (let i = 0; i < n - 1; i++) { const v = Math.floor(Math.random() * 2001) - 1000; net['m' + i] = v; s += v }
    net['m' + (n - 1)] = -s
    const t = simplifyDebts(net)
    const after = { ...net }
    t.forEach((x) => { assert.ok(x.amount > 0 && x.from !== x.to); after[x.from] += x.amount; after[x.to] -= x.amount })
    Object.values(after).forEach((v) => assert.equal(v, 0))
    assert.ok(t.length <= Math.max(n - 1, 0))
  }
})

test('chỉ khoản đã xác nhận mới trừ công nợ (chờ xác nhận thì chưa)', () => {
  const net = { A: 500, B: -500 }
  assert.deepEqual(applyPayments(net, [{ from_member: 'B', to_member: 'A', amount: 500, status: 'pending' }]), net)
  assert.deepEqual(applyPayments(net, [{ from_member: 'B', to_member: 'A', amount: 200, status: 'confirmed' }]), { A: 300, B: -300 })
  assert.deepEqual(simplifyDebts(applyPayments(net, [{ from_member: 'B', to_member: 'A', amount: 500, status: 'confirmed' }])), [])
})
