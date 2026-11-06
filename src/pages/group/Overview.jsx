import { useMemo, useState } from 'react'
import { fmt } from '../../lib/money'
import { groupSettlement } from '../../lib/settle'
import { go } from '../../lib/router'
import { useGroup } from '../../lib/ctx'
import { Avatar, Badge, Empty, dateTimeVN, monthKey } from '../../components/ui'

export default function Overview() {
  const { data, gid, memberById } = useGroup()
  const months = useMemo(() => {
    const s = new Set(data.events.map((e) => monthKey(e.event_date)))
    s.add(monthKey(new Date()))
    return [...s].sort().reverse()
  }, [data.events])
  const [month, setMonth] = useState(months[0])
  const [member, setMember] = useState('all')
  const [type, setType] = useState('all') // all | shared | personal

  const view = useMemo(() => {
    const evs = data.events.filter((e) => month === 'all' || monthKey(e.event_date) === month)
    const ids = new Set(evs.map((e) => e.id))
    const cs = data.computed.filter((c) => ids.has(c.event_id) && !c.errors.length)
    // phần chịu của từng người, tách chi phí chung / chi phí riêng
    const spent = {}
    const paid = {}
    let total = 0
    cs.forEach((c) => {
      const myItems = (m) => data.items.filter((i) => i.bill_id === c.id && i.member_id === m).reduce((s, i) => s + i.amount, 0)
      paid[c.paid_by] = (paid[c.paid_by] || 0) + c.total
      Object.entries(c.owed).forEach(([m, a]) => {
        const personal = myItems(m)
        const part = type === 'personal' ? personal : type === 'shared' ? a - personal : a
        spent[m] = (spent[m] || 0) + part
        if (member === 'all' || member === m) total += part
      })
    })
    const rank = Object.entries(spent).filter(([, v]) => v > 0).sort((a, b) => b[1] - a[1]).slice(0, 5)
    return { evs, spent, paid, total, rank, nBills: cs.length }
  }, [data, month, member, type])

  const st = useMemo(() => groupSettlement(data.events, data.computed, data.payments), [data])
  const unpaid = st.suggestions.reduce((s, x) => s + x.amount, 0)
  const maxRank = view.rank[0]?.[1] || 1
  const recent = [...data.events].sort((a, b) => (a.event_date < b.event_date ? 1 : -1)).slice(0, 5)

  if (!data.events.length) return <Empty icon="📊" title="Chưa có dữ liệu" hint="Tạo sự kiện và thêm bill để xem thống kê." />

  return (
    <div>
      <div className="mb-4 grid grid-cols-3 gap-2">
        <select className="input !py-2" value={month} onChange={(e) => setMonth(e.target.value)}>
          <option value="all">Mọi thời gian</option>
          {months.map((m) => <option key={m} value={m}>Tháng {m.slice(5)}/{m.slice(0, 4)}</option>)}
        </select>
        <select className="input !py-2" value={member} onChange={(e) => setMember(e.target.value)}>
          <option value="all">Mọi người</option>
          {data.members.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
        </select>
        <select className="input !py-2" value={type} onChange={(e) => setType(e.target.value)}>
          <option value="all">Mọi loại chi</option>
          <option value="shared">Chi phí chung</option>
          <option value="personal">Chi phí riêng</option>
        </select>
      </div>

      <div className="mb-4 grid grid-cols-2 gap-3">
        <div className="card col-span-2 bg-gradient-to-br from-brand-600 to-fuchsia-500 p-4 text-white">
          <div className="text-xs opacity-80">{member === 'all' ? 'Tổng chi tiêu' : `Chi tiêu của ${memberById[member]?.name}`}</div>
          <div className="num text-3xl font-extrabold">{fmt(view.total)}</div>
          <div className="text-xs opacity-80">{view.nBills} bill</div>
        </div>
        <div className="card p-4"><div className="text-xs text-slate-400">Số sự kiện</div><div className="num text-2xl font-extrabold">{view.evs.length}</div></div>
        <div className="card p-4"><div className="text-xs text-slate-400">Công nợ chưa thanh toán</div><div className="num text-xl font-extrabold text-rose-600">{fmt(unpaid)}</div></div>
      </div>

      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Top chi tiêu</h3>
      <div className="card mb-4 space-y-3 p-4">
        {view.rank.length === 0 && <p className="text-sm text-slate-400">Chưa có dữ liệu trong bộ lọc này.</p>}
        {view.rank.map(([m, v], i) => (
          <div key={m}>
            <div className="mb-1 flex items-center justify-between text-sm">
              <span className="flex items-center gap-2"><span className="w-4 text-xs text-slate-400">{i + 1}</span><Avatar m={memberById[m]} size={22} /><b>{memberById[m]?.name}</b></span>
              <b className="num">{fmt(v)}</b>
            </div>
            <div className="h-2 rounded-full bg-slate-100"><div className="h-2 rounded-full" style={{ width: `${(v / maxRank) * 100}%`, background: memberById[m]?.color || '#6366f1' }} /></div>
          </div>
        ))}
      </div>

      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Tổng tiền đã ứng của từng người</h3>
      <div className="card mb-4 divide-y divide-slate-50 px-4">
        {data.members.filter((m) => view.paid[m.id]).map((m) => (
          <div key={m.id} className="flex items-center justify-between py-2.5 text-sm"><span className="flex items-center gap-2"><Avatar m={m} size={24} />{m.name}</span><b className="num">{fmt(view.paid[m.id])}</b></div>
        ))}
        {!Object.keys(view.paid).length && <p className="py-3 text-sm text-slate-400">Chưa có bill.</p>}
      </div>

      <h3 className="mb-2 text-sm font-bold uppercase tracking-wide text-slate-500">Sự kiện gần đây</h3>
      <div className="space-y-2">
        {recent.map((e) => (
          <button key={e.id} className="card flex w-full items-center justify-between p-3 text-left" onClick={() => go(`/g/${gid}/e/${e.id}`)}>
            <span><b className="block text-sm">{e.name}</b><span className="text-xs text-slate-400">{dateTimeVN(e.event_date)}</span></span>
            <Badge tone={e.status === 'locked' ? 'green' : 'amber'}>{e.status === 'locked' ? 'Đã chốt' : 'Đang nhập'}</Badge>
          </button>
        ))}
      </div>
    </div>
  )
}
