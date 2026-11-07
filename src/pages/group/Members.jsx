import { useState } from 'react'
import { supabase } from '../../lib/supabase'
import { BANKS, bankName } from '../../lib/banks'
import { logActivity, must } from '../../lib/data'
import { useGroup } from '../../lib/ctx'
import { AvatarArt, ANIMALS, EYES, MOUTHS, ACCS, randomAvatar } from '../../components/Avatar'
import { Avatar, Badge, COLORS, ErrorBox, Field, Modal } from '../../components/ui'

export default function MembersTab() {
  const { data, reload, gid, me, actor } = useGroup()
  const [edit, setEdit] = useState(null) // member | {} (mới)
  const [copied, setCopied] = useState(false)

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(data.group.invite_code)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch {
      window.prompt('Sao chép mã mời:', data.group.invite_code)
    }
  }
  const setActive = async (m, active) => {
    if (!active && !window.confirm(`Ẩn ${m.name} khỏi nhóm? Các bill cũ vẫn giữ nguyên.`)) return
    must(await supabase.from('members').update({ active }).eq('id', m.id))
    await logActivity(gid, actor, active ? 'member.restore' : 'member.hide', 'member', m.id, { name: m.name })
    reload()
  }

  return (
    <div>
      <div className="card mb-4 flex items-center justify-between gap-3 p-4">
        <div>
          <div className="text-xs text-slate-400">Mã mời bạn bè vào nhóm</div>
          <div className="num text-xl font-extrabold tracking-widest">{data.group.invite_code}</div>
        </div>
        <button className="btn-soft btn-sm" onClick={copy}>{copied ? 'Đã chép ✓' : 'Sao chép'}</button>
      </div>

      <div className="card divide-y divide-slate-50 px-4">
        {data.members.map((m) => (
          <div key={m.id} className={`flex items-center justify-between gap-2 py-3 ${m.active ? '' : 'opacity-50'}`}>
            <span className="flex min-w-0 items-center gap-3">
              <Avatar m={m} size={38} />
              <span className="min-w-0">
                <b className="block truncate">{m.name} {me?.id === m.id && <Badge tone="brand">Bạn</Badge>} {!m.active && <Badge>Đã ẩn</Badge>}</b>
                <span className="block truncate text-xs text-slate-400">
                  {m.bank_account ? `${bankName(m.bank_bin) || m.bank_bin} · ${m.bank_account}` : 'Chưa có tài khoản ngân hàng'}
                  {m.user_id ? '' : ' · chưa có tài khoản đăng nhập'}
                </span>
              </span>
            </span>
            <span className="flex shrink-0 gap-1">
              <button className="btn-ghost btn-sm" onClick={() => setEdit(m)}>Sửa</button>
              <button className="btn-ghost btn-sm" onClick={() => setActive(m, !m.active)}>{m.active ? 'Ẩn' : 'Hiện'}</button>
            </span>
          </div>
        ))}
      </div>
      <button className="btn-primary mt-4 w-full" onClick={() => setEdit({})}>+ Thêm thành viên</button>
      <p className="mt-2 text-xs text-slate-400">Thành viên chỉ cần tên hoặc nickname. Bạn bè có thể tham gia bằng mã mời rồi chọn đúng tên của mình.</p>
      {edit && <MemberForm member={edit} onClose={() => setEdit(null)} />}
    </div>
  )
}

const Chips = ({ label, opts, val, on }) => (
  <div className="mb-2">
    <span className="label">{label}</span>
    <div className="flex flex-wrap gap-1.5">
      {Object.entries(opts).map(([k, v]) => (
        <button type="button" key={k} onClick={() => on(k)} className={`rounded-full border px-3 py-1 text-xs font-semibold ${val === k ? 'border-brand-600 bg-brand-50 text-brand-700' : 'border-slate-200 text-slate-600'}`}>{v}</button>
      ))}
    </div>
  </div>
)

function MemberForm({ member, onClose }) {
  const { data, reload, gid, actor } = useGroup()
  const isNew = !member.id
  const [f, setF] = useState({
    name: member.name || '',
    color: member.color || COLORS[data.members.length % COLORS.length],
    bank_bin: member.bank_bin || '',
    bank_account: member.bank_account || '',
    bank_holder: member.bank_holder || '',
    avatar: member.avatar || (member.id ? null : randomAvatar()),
  })
  const av = f.avatar
  const setAv = (k, v) => setF({ ...f, avatar: { ...(av || randomAvatar()), [k]: v } })
  const [err, setErr] = useState(null)

  async function save(e) {
    e.preventDefault()
    try {
      const row = { name: f.name.trim(), color: f.color, bank_bin: f.bank_bin || null, bank_account: f.bank_account.trim() || null, bank_holder: f.bank_holder.trim() || null, avatar: f.avatar }
      if (row.bank_account && !row.bank_bin) throw new Error('Chọn ngân hàng cho số tài khoản')
      if (isNew) {
        const r = must(await supabase.from('members').insert({ ...row, group_id: gid }).select().single())
        await logActivity(gid, actor, 'member.add', 'member', r.id, { name: row.name })
      } else {
        must(await supabase.from('members').update(row).eq('id', member.id))
        await logActivity(gid, actor, 'member.update', 'member', member.id, { name: row.name })
      }
      await reload()
      onClose()
    } catch (e2) {
      setErr(e2)
    }
  }

  return (
    <Modal title={isNew ? 'Thêm thành viên' : 'Sửa thành viên'} onClose={onClose}>
      <form onSubmit={save}>
        <ErrorBox error={err} />
        <Field label="Tên / nickname"><input className="input" required autoFocus value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></Field>
        <div className="mb-3 rounded-2xl bg-slate-50 p-3">
          <div className="mb-2 flex items-center gap-3">
            {av ? <AvatarArt spec={av} color={f.color} size={72} /> : <Avatar m={{ name: f.name, color: f.color }} size={72} />}
            <div className="flex flex-col gap-1.5">
              <button type="button" className="btn-soft btn-sm" onClick={() => setF({ ...f, avatar: randomAvatar() })}>🎲 Ngẫu nhiên</button>
              {av && <button type="button" className="btn-ghost btn-sm" onClick={() => setF({ ...f, avatar: null })}>Dùng chữ cái</button>}
            </div>
          </div>
          <Chips label="Con vật" opts={ANIMALS} val={av?.animal} on={(v) => setAv('animal', v)} />
          <Chips label="Mắt" opts={EYES} val={av?.eyes} on={(v) => setAv('eyes', v)} />
          <Chips label="Miệng" opts={MOUTHS} val={av?.mouth} on={(v) => setAv('mouth', v)} />
          <Chips label="Phụ kiện" opts={ACCS} val={av?.acc} on={(v) => setAv('acc', v)} />
        </div>
        <div className="mb-3">
          <span className="label">Màu nền</span>
          <div className="flex flex-wrap gap-2">
            {COLORS.map((c) => (
              <button type="button" key={c} onClick={() => setF({ ...f, color: c })} className={`h-8 w-8 rounded-full ring-offset-2 ${f.color === c ? 'ring-2 ring-slate-800' : ''}`} style={{ background: c }} aria-label={c} />
            ))}
          </div>
        </div>
        <div className="mb-1 mt-4 text-sm font-bold">Tài khoản nhận tiền (để tạo QR)</div>
        <Field label="Ngân hàng">
          <select className="input" value={f.bank_bin} onChange={(e) => setF({ ...f, bank_bin: e.target.value })}>
            <option value="">Chưa chọn</option>
            {BANKS.map((b) => <option key={b.bin} value={b.bin}>{b.name}</option>)}
          </select>
        </Field>
        <Field label="Số tài khoản"><input className="input num" inputMode="numeric" value={f.bank_account} onChange={(e) => setF({ ...f, bank_account: e.target.value.replace(/\s/g, '') })} /></Field>
        <Field label="Tên chủ tài khoản"><input className="input" value={f.bank_holder} onChange={(e) => setF({ ...f, bank_holder: e.target.value.toUpperCase() })} /></Field>
        <button className="btn-primary w-full">Lưu</button>
      </form>
    </Modal>
  )
}
