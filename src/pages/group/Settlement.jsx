import { useMemo, useState } from 'react'
import { supabase } from '../../lib/supabase'
import { logActivity, must } from '../../lib/data'
import { fmt } from '../../lib/money'
import { applyPayments, netBalances, rawObligationCount, simplifyDebts } from '../../lib/settle'
import { useGroup } from '../../lib/ctx'
import { Avatar, Badge, Empty, ErrorBox, dateTimeVN } from '../../components/ui'
import QrModal from '../../components/QrModal'

export default function SettlementTab() {
  const { data, reload, gid, me, actor, memberById } = useGroup()
  const [err, setErr] = useState(null)
  const [busy, setBusy] = useState(false)
  const [qr, setQr] = useState(null)

  const calc = useMemo(() => {
    const locked = new Set(data.events.filter((e) => e.status === 'locked').map((e) => e.id))
    const lockedBills = data.computed.filter((c) => locked.has(c.event_id))
    const net = netBalances(lockedBills)
    const after = applyPayments(net, data.payments)
    const suggestions = simplifyDebts(after)
    const advanced = {}
    const cost = {}
    lockedBills.forEach((c) => {
      if (c.errors.length) return
      advanced[c.paid_by] = (advanced[c.paid_by] || 0) + c.total
      Object.entries(c.owed).forEach(([m, a]) => (cost[m] = (cost[m] || 0) + a))
    })
    const draftTotal = data.bills.filter((b) => !locked.has(b.event_id)).reduce((s, b) => s + b.total, 0)
    return { after, suggestions, advanced, cost, raw: rawObligationCount(lockedBills), draftTotal }
  }, [data])

  const pending = data.payments.filter((p) => p.status === 'pending')
  const canAct = (memberId) => me && (me.id === memberId || !memberById[memberId]?.user_id)
  const myPay = me ? calc.suggestions.filter((s) => s.from === me.id).reduce((a, s) => a + s.amount, 0) : 0
  const myGet = me ? calc.suggestions.filter((s) => s.to === me.id).reduce((a, s) => a + s.amount, 0) : 0

  async function run(fn) {
    setBusy(true)
    setErr(null)
    try {
      await fn()
      await reload()
    } catch (e) {
      setErr(e)
    } finally {
      setBusy(false)
    }
  }
  const markSent = (s) =>
    run(async () => {
      const row = must(await supabase.from('payments').insert({ group_id: gid, from_member: s.from, to_member: s.to, amount: s.amount, created_by: actor.userId }).select().single())
      await logActivity(gid, actor, 'payment.sent', 'payment', row.id, { from: memberById[s.from]?.name, to: memberById[s.to]?.name, amount: s.amount })
      setQr(null)
    })
  const confirm = (p) =>
    run(async () => {
      must(await supabase.from('payments').update({ status: 'confirmed', confirmed_by: actor.userId, confirmed_at: new Date().toISOString() }).eq('id', p.id))
      await logActivity(gid, actor, 'payment.confirm', 'payment', p.id, { from: memberById[p.from_member]?.name, to: memberById[p.to_member]?.name, amount: p.amount })
    })
  const reject = (p) =>
    run(async () => {
      must(await supabase.from('payments').update({ status: 'rejected', confirmed_by: actor.userId, confirmed_at: new Date().toISOString() }).eq('id', p.id))
      await logActivity(gid, actor, 'payment.reject', 'payment', p.id, { from: memberById[p.from_member]?.name, to: memberById[p.to_member]?.name, amount: p.amount })
    })
  const cancel = (p) =>
    run(async () => {
      must(await supabase.from('payments').delete().eq('id', p.id))
      await logActivity(gid, actor, 'payment.cancel', 'payment', p.id, { from: memberById[p.from_member]?.name, to: memberById[p.to_member]?.name, amount: p.amount })
    })

  const active = data.members.filter((m) => m.active || calc.after[m.id])
  const lockedCount = data.events.filter((e) => e.status === 'locked').length

  return (
    <div>
      <ErrorBox error={err} />
      {me && (
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="card p-4"><div className="text-xs text-slate-400">Bạn cần trả</div><div className="num text-xl font-extrabold text-rose-600">{fmt(myPay)}</div></div>
          <div className="card p-4"><div className="text-xs text-slate-400">Bạn được nhận</div><div className="num text-xl font-extrabold text-emerald-600">{fmt(myGet)}</div></div>
          <div className="card p-4"><div className="text-xs text-slate-400">Tổng đã ứng trước</div><div className="num text-lg font-bold">{fmt(calc.advanced[me.id] || 0)}</div></div>
          <div className="card p-4"><div className="text-xs text-slate-400">Tổng chi phí của bạn</div><div className="num text-lg font-bold">{fmt(calc.cost[me.id] || 0)}</div></div>
        </div>
      )}

      {pending.length > 0 && (
        <section className="mb-5">
          <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Chờ xác nhận ({pending.length})</h3>
          <div className="space-y-2">
            {pending.map((p) => (
              <div key={p.id} className="card flex flex-wrap items-center justify-between gap-2 border-amber-200 bg-amber-50/60 p-3">
                <div className="text-sm">
                  <b>{memberById[p.from_member]?.name}</b> báo đã chuyển <b className="num">{fmt(p.amount)}</b> cho <b>{memberById[p.to_member]?.name}</b>
                  <div className="text-[11px] text-slate-400">{dateTimeVN(p.created_at)}</div>
                </div>
                <div className="flex gap-2">
                  {canAct(p.to_member) && (
                    <>
                      <button className="btn-primary btn-sm" disabled={busy} onClick={() => confirm(p)}>Đã nhận tiền</button>
                      <button className="btn-danger btn-sm" disabled={busy} onClick={() => reject(p)}>Chưa nhận</button>
                    </>
                  )}
                  {canAct(p.from_member) && <button className="btn-ghost btn-sm" disabled={busy} onClick={() => cancel(p)}>Hủy</button>}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="mb-5">
        <h3 className="mb-2 flex items-baseline justify-between text-sm font-bold uppercase tracking-wide text-slate-500">
          <span>Cần chuyển khoản</span>
          {calc.raw > calc.suggestions.length && calc.suggestions.length > 0 && (
            <span className="text-[11px] font-medium normal-case text-emerald-600">Bù trừ: {calc.raw} khoản nợ → {calc.suggestions.length} lần chuyển</span>
          )}
        </h3>
        {calc.suggestions.length === 0 ? (
          <Empty icon="✅" title={lockedCount ? 'Không còn khoản nào cần chuyển' : 'Chưa có công nợ'} hint={lockedCount ? 'Mọi người đã cân bằng.' : 'Công nợ chỉ được tính từ các sự kiện đã chốt.'} />
        ) : (
          <div className="space-y-2">
            {calc.suggestions.map((s, i) => {
              const from = memberById[s.from]
              const to = memberById[s.to]
              const waiting = pending.find((p) => p.from_member === s.from && p.to_member === s.to)
              return (
                <div key={i} className="card flex flex-wrap items-center justify-between gap-3 p-3">
                  <div className="flex min-w-0 items-center gap-2 text-sm">
                    <Avatar m={from} size={30} />
                    <span className="font-semibold">{from?.name}</span>
                    <span className="text-slate-300">→</span>
                    <Avatar m={to} size={30} />
                    <span className="font-semibold">{to?.name}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <b className="num text-base text-brand-700">{fmt(s.amount)}</b>
                    {waiting ? <Badge tone="amber">Chờ xác nhận</Badge> : <Badge tone="red">Chưa thanh toán</Badge>}
                    {!waiting && <button className="btn-soft btn-sm" onClick={() => setQr(s)}>QR / Chuyển</button>}
                  </div>
                </div>
              )
            })}
          </div>
        )}
        {calc.draftTotal > 0 && <p className="mt-2 text-xs text-slate-400">Còn {fmt(calc.draftTotal)} ở các sự kiện chưa chốt, chưa tính vào công nợ.</p>}
      </section>

      <section className="mb-5">
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Số dư từng người</h3>
        <div className="card divide-y divide-slate-50 px-4">
          {active.map((m) => {
            const v = calc.after[m.id] || 0
            return (
              <div key={m.id} className="flex items-center justify-between py-2.5 text-sm">
                <span className="flex items-center gap-2"><Avatar m={m} size={26} /><span className="font-semibold">{m.name}</span></span>
                <span className="text-right">
                  <span className={`num font-bold ${v > 0 ? 'text-emerald-600' : v < 0 ? 'text-rose-600' : 'text-slate-400'}`}>{v > 0 ? '+' : ''}{fmt(v)}</span>
                  <div className="text-[11px] text-slate-400">ứng {fmt(calc.advanced[m.id] || 0)} · chịu {fmt(calc.cost[m.id] || 0)}</div>
                </span>
              </div>
            )
          })}
        </div>
      </section>

      <section>
        <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Lịch sử thanh toán</h3>
        {data.payments.filter((p) => p.status !== 'pending').length === 0 ? (
          <p className="text-sm text-slate-400">Chưa có khoản thanh toán nào được xác nhận.</p>
        ) : (
          <div className="card divide-y divide-slate-50 px-4">
            {data.payments.filter((p) => p.status !== 'pending').map((p) => (
              <div key={p.id} className="flex items-center justify-between gap-2 py-2.5 text-sm">
                <span><b>{memberById[p.from_member]?.name}</b> → <b>{memberById[p.to_member]?.name}</b><div className="text-[11px] text-slate-400">{dateTimeVN(p.confirmed_at || p.created_at)}</div></span>
                <span className="flex items-center gap-2"><b className="num">{fmt(p.amount)}</b><Badge tone={p.status === 'confirmed' ? 'green' : 'red'}>{p.status === 'confirmed' ? 'Đã thanh toán' : 'Từ chối'}</Badge></span>
              </div>
            ))}
          </div>
        )}
      </section>

      {qr && (
        <QrModal
          from={memberById[qr.from]}
          to={memberById[qr.to]}
          amount={qr.amount}
          onClose={() => setQr(null)}
          footer={
            canAct(qr.from) ? (
              <button className="btn-primary w-full" disabled={busy} onClick={() => markSent(qr)}>Tôi đã chuyển khoản</button>
            ) : (
              <p className="text-center text-xs text-slate-400">Chỉ {memberById[qr.from]?.name} mới báo đã chuyển được.</p>
            )
          }
        />
      )}
    </div>
  )
}
