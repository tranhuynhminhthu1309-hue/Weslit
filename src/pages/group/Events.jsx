import { useState } from 'react'
import { fmt } from '../../lib/money'
import { go } from '../../lib/router'
import { useGroup } from '../../lib/ctx'
import { AvatarStack, Badge, Empty, Fab, Icon, dateTimeVN } from '../../components/ui'
import EventForm from '../../components/EventForm'

export default function EventsTab() {
  const { data, gid, memberById } = useGroup()
  const [form, setForm] = useState(false)
  const events = [...data.events].sort((a, b) => (a.event_date < b.event_date ? 1 : -1))
  const hasMembers = data.members.filter((m) => m.active).length > 0

  return (
    <div>
      {events.length === 0 ? (
        <Empty icon="🍜" title="Chưa có sự kiện nào" hint={hasMembers ? 'Mỗi lần đi ăn hay đi chơi là một sự kiện riêng.' : 'Hãy thêm thành viên trước.'} />
      ) : (
        <div className="space-y-3">
          {events.map((e) => {
            const total = data.bills.filter((b) => b.event_id === e.id).reduce((s, b) => s + b.total, 0)
            const people = data.participants.filter((p) => p.event_id === e.id).map((p) => memberById[p.member_id]).filter(Boolean)
            const nBills = data.bills.filter((b) => b.event_id === e.id).length
            return (
              <button key={e.id} onClick={() => go(`/g/${gid}/e/${e.id}`)} className="card block w-full p-4 text-left transition hover:shadow-md">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <div className="truncate font-bold">{e.name}</div>
                    <div className="text-xs text-slate-500">{dateTimeVN(e.event_date)}{e.location ? ` · ${e.location}` : ''}</div>
                  </div>
                  <Badge tone={e.status === 'locked' ? 'green' : 'amber'}>{e.status === 'locked' ? 'Đã chốt' : 'Đang nhập'}</Badge>
                </div>
                <div className="mt-3 flex items-center justify-between">
                  <AvatarStack list={people} />
                  <div className="text-right">
                    <div className="num font-extrabold text-brand-700">{fmt(total)}</div>
                    <div className="text-[11px] text-slate-400">{nBills} bill</div>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}
      <Fab onClick={() => setForm(true)}><Icon name="plus" size={18} /> Tạo sự kiện</Fab>
      {form && <EventForm onClose={() => setForm(false)} onSaved={(id) => go(`/g/${gid}/e/${id}`)} />}
    </div>
  )
}
