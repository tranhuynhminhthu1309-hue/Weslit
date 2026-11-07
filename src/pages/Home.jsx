import { GroupAvatar } from '../components/Avatar'
import { useEffect, useState } from 'react'
import { supabase } from '../lib/supabase'
import { useApp } from '../lib/ctx'
import { go } from '../lib/router'
import { Empty, ErrorBox, Field, Icon, Modal, Spinner } from '../components/ui'

export default function HomePage() {
  const { user, profile, setProfile } = useApp()
  const [groups, setGroups] = useState(null)
  const [err, setErr] = useState(null)
  const [modal, setModal] = useState(null) // 'create' | 'join' | 'profile'
  const [text, setText] = useState('')
  const [busy, setBusy] = useState(false)

  async function load() {
    const { data, error } = await supabase.from('group_users').select('role, groups(id, name, invite_code, created_at, icon, color)').eq('user_id', user.id)
    if (error) return setErr(error)
    setGroups((data || []).map((r) => ({ ...r.groups, role: r.role })).filter((g) => g.id).sort((a, b) => (a.created_at < b.created_at ? 1 : -1)))
  }
  useEffect(() => {
    load()
  }, [])

  async function submit(e) {
    e.preventDefault()
    setErr(null)
    setBusy(true)
    try {
      if (modal === 'create') {
        const { data, error } = await supabase.rpc('create_group', { p_name: text })
        if (error) throw error
        go(`/g/${data}`)
      } else if (modal === 'join') {
        const { data, error } = await supabase.rpc('join_group', { p_code: text })
        if (error) throw error
        go(`/g/${data}`)
      } else if (modal === 'profile') {
        const { error } = await supabase.from('profiles').update({ display_name: text }).eq('id', user.id)
        if (error) throw error
        setProfile({ ...profile, display_name: text })
        setModal(null)
      }
    } catch (e2) {
      setErr(e2)
    } finally {
      setBusy(false)
    }
  }

  const open = (m, v = '') => {
    setErr(null)
    setText(v)
    setModal(m)
  }

  return (
    <div className="mx-auto max-w-2xl px-4 pb-24 pt-5">
      <header className="mb-5 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-extrabold">Nhóm của tôi</h1>
          <p className="text-sm text-slate-500">Xin chào, {profile.display_name || user.email}</p>
        </div>
        <div className="flex gap-2">
          <button className="btn-ghost btn-sm" onClick={() => open('profile', profile.display_name)}>Hồ sơ</button>
          <button className="btn-ghost btn-sm" onClick={() => supabase.auth.signOut()}>Đăng xuất</button>
        </div>
      </header>
      <ErrorBox error={!modal && err} />
      {groups === null ? (
        <Spinner />
      ) : groups.length === 0 ? (
        <Empty icon="👥" title="Chưa có nhóm nào" hint="Tạo nhóm mới hoặc nhập mã mời từ bạn bè.">
          <div className="flex justify-center gap-2">
            <button className="btn-primary" onClick={() => open('create')}>Tạo nhóm</button>
            <button className="btn-ghost" onClick={() => open('join')}>Nhập mã mời</button>
          </div>
        </Empty>
      ) : (
        <>
          <div className="space-y-3">
            {groups.map((g) => (
              <button key={g.id} onClick={() => go(`/g/${g.id}`)} className="card flex w-full items-center gap-3 p-4 text-left transition hover:shadow-md">
                <GroupAvatar g={g} size={48} />
                <span className="flex-1">
                  <span className="block font-bold">{g.name}</span>
                  <span className="text-xs text-slate-400">{g.role === 'owner' ? 'Chủ nhóm' : 'Thành viên'}</span>
                </span>
                <span className="text-slate-300">›</span>
              </button>
            ))}
          </div>
          <div className="mt-5 flex gap-2">
            <button className="btn-primary flex-1" onClick={() => open('create')}>+ Tạo nhóm</button>
            <button className="btn-ghost flex-1" onClick={() => open('join')}>Nhập mã mời</button>
          </div>
        </>
      )}

      {modal && (
        <Modal title={modal === 'create' ? 'Tạo nhóm mới' : modal === 'join' ? 'Tham gia nhóm' : 'Hồ sơ của tôi'} onClose={() => setModal(null)}>
          <form onSubmit={submit}>
            <ErrorBox error={err} />
            <Field label={modal === 'create' ? 'Tên nhóm' : modal === 'join' ? 'Mã mời' : 'Tên hiển thị'}>
              <input className="input" autoFocus required value={text} onChange={(e) => setText(e.target.value)} placeholder={modal === 'create' ? 'Hội bạn thân, Team công ty...' : modal === 'join' ? '8 ký tự' : ''} />
            </Field>
            <button className="btn-primary w-full" disabled={busy}>{busy ? 'Đang xử lý...' : 'Xác nhận'}</button>
          </form>
        </Modal>
      )}
    </div>
  )
}
