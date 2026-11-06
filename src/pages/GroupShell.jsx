import { useCallback, useEffect, useMemo, useState } from 'react'
import { supabase } from '../lib/supabase'
import { loadGroup } from '../lib/data'
import { useApp, useGroup, GroupCtx } from '../lib/ctx'
import { go } from '../lib/router'
import { ErrorBox, Spinner, Modal, Field } from '../components/ui'
import Overview from './group/Overview'
import EventsTab from './group/Events'
import SettlementTab from './group/Settlement'
import GalleryTab from './group/Gallery'
import MembersTab from './group/Members'
import ActivityTab from './group/Activity'
import EventPage from './Event'

const TABS = [
  ['overview', 'Tổng quan', '📊'],
  ['events', 'Sự kiện', '🍜'],
  ['settle', 'Công nợ', '💸'],
  ['gallery', 'Ảnh bill', '🖼️'],
  ['members', 'Thành viên', '👥'],
  ['activity', 'Hoạt động', '🕘'],
]

export default function GroupShell({ route }) {
  const { user, profile } = useApp()
  const gid = route.gid
  const [data, setData] = useState(null)
  const [err, setErr] = useState(null)
  const [tab, setTab] = useState('events')
  const [claim, setClaim] = useState(false)

  const reload = useCallback(async () => {
    try {
      setData(await loadGroup(gid))
      setErr(null)
    } catch (e) {
      setErr(e)
    }
  }, [gid])

  useEffect(() => {
    reload()
  }, [reload])

  const me = useMemo(() => data?.members.find((m) => m.user_id === user.id) || null, [data, user.id])
  const actor = useMemo(() => ({ userId: user.id, name: me?.name || profile.display_name || user.email }), [me, user, profile])
  const memberById = useMemo(() => Object.fromEntries((data?.members || []).map((m) => [m.id, m])), [data])

  if (err && !data) {
    return (
      <div className="mx-auto max-w-lg p-6">
        <ErrorBox error={err} />
        <button className="btn-ghost" onClick={() => go('/')}>← Về danh sách nhóm</button>
      </div>
    )
  }
  if (!data) return <Spinner />

  const pendingForMe = me ? data.payments.filter((p) => p.status === 'pending' && p.to_member === me.id).length : 0
  const ctx = { data, reload, me, actor, memberById, gid }

  return (
    <GroupCtx.Provider value={ctx}>
      <div className="mx-auto max-w-3xl px-4 pb-28 pt-4">
        <header className="mb-4 flex items-center gap-3">
          <button className="rounded-full p-2 text-lg hover:bg-slate-100" onClick={() => go(route.name === 'event' ? `/g/${gid}` : '/')} aria-label="Quay lại">←</button>
          <div className="min-w-0 flex-1">
            <h1 className="truncate text-xl font-extrabold">{data.group.name}</h1>
            <p className="text-xs text-slate-400">{data.members.filter((m) => m.active).length} thành viên{me ? ` · bạn là ${me.name}` : ''}</p>
          </div>
        </header>

        <ErrorBox error={err} />

        {!me && (
          <div className="card mb-4 border-amber-200 bg-amber-50 p-4">
            <div className="text-sm font-semibold text-amber-800">Chọn tên của bạn trong nhóm</div>
            <p className="mb-3 text-sm text-amber-700">Để biết bạn đã ứng và cần trả bao nhiêu, hãy liên kết tài khoản với một thành viên.</p>
            <button className="btn-primary btn-sm" onClick={() => setClaim(true)}>Chọn tên của tôi</button>
          </div>
        )}

        {route.name === 'event' ? (
          <EventPage eid={route.eid} />
        ) : (
          <>
            {pendingForMe > 0 && tab !== 'settle' && (
              <button onClick={() => setTab('settle')} className="mb-4 w-full rounded-2xl bg-amber-50 px-4 py-3 text-left text-sm font-semibold text-amber-800">
                🔔 Có {pendingForMe} khoản chuyển tiền đang chờ bạn xác nhận
              </button>
            )}
            {tab === 'overview' && <Overview />}
            {tab === 'events' && <EventsTab />}
            {tab === 'settle' && <SettlementTab />}
            {tab === 'gallery' && <GalleryTab />}
            {tab === 'members' && <MembersTab />}
            {tab === 'activity' && <ActivityTab />}
          </>
        )}
      </div>

      {route.name !== 'event' && (
        <nav className="fixed inset-x-0 bottom-0 z-40 border-t border-slate-200 bg-white/95 pb-[env(safe-area-inset-bottom)] backdrop-blur">
          <div className="mx-auto flex max-w-3xl">
            {TABS.map(([k, label, icon]) => (
              <button key={k} onClick={() => setTab(k)} className={`relative flex flex-1 flex-col items-center gap-0.5 py-2 text-[11px] font-semibold ${tab === k ? 'text-brand-600' : 'text-slate-400'}`}>
                <span className="text-lg leading-none">{icon}</span>
                {label}
                {k === 'settle' && pendingForMe > 0 && <span className="absolute right-[22%] top-1 h-2.5 w-2.5 rounded-full bg-rose-500" />}
              </button>
            ))}
          </div>
        </nav>
      )}

      {claim && <ClaimModal onClose={() => setClaim(false)} />}
    </GroupCtx.Provider>
  )
}

function ClaimModal({ onClose }) {
  const { data, reload, gid } = useGroup()
  const { user, profile } = useApp()
  const [name, setName] = useState(profile.display_name || '')
  const [err, setErr] = useState(null)
  const free = data.members.filter((m) => !m.user_id && m.active)

  async function link(id) {
    const { error } = await supabase.from('members').update({ user_id: user.id }).eq('id', id)
    if (error) return setErr(error)
    await reload()
    onClose()
  }
  async function create(e) {
    e.preventDefault()
    const { error } = await supabase.from('members').insert({ group_id: gid, name: name.trim(), user_id: user.id })
    if (error) return setErr(error)
    await reload()
    onClose()
  }
  return (
    <Modal title="Bạn là ai trong nhóm?" onClose={onClose}>
      <ErrorBox error={err} />
      {free.length > 0 && (
        <div className="mb-4">
          <div className="label">Chọn tên đã có</div>
          <div className="flex flex-wrap gap-2">
            {free.map((m) => (
              <button key={m.id} className="btn-soft btn-sm" onClick={() => link(m.id)}>{m.name}</button>
            ))}
          </div>
        </div>
      )}
      <form onSubmit={create}>
        <Field label="Hoặc thêm tên mới">
          <input className="input" required value={name} onChange={(e) => setName(e.target.value)} />
        </Field>
        <button className="btn-primary w-full">Thêm và liên kết</button>
      </form>
    </Modal>
  )
}
