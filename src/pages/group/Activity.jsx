import { useGroup } from '../../lib/ctx'
import { fmt } from '../../lib/money'
import { Empty, dateTimeVN } from '../../components/ui'

function describe(a, nameOf) {
  const d = a.details || {}
  const money = (n) => (n != null ? ` ${fmt(n)}` : '')
  switch (a.action) {
    case 'event.create': return `tạo sự kiện “${d.name}”`
    case 'event.update': return `sửa sự kiện “${d.name}”`
    case 'event.lock': return `chốt sự kiện “${d.name}”${money(d.total)}`
    case 'event.unlock': return `mở lại sự kiện “${d.name}” để chỉnh sửa`
    case 'event.delete': return `xóa sự kiện “${d.name}”`
    case 'bill.create': return `thêm bill${d.after?.restaurant ? ` “${d.after.restaurant}”` : ''}${money(d.after?.total)} vào “${d.event}”`
    case 'bill.update': {
      const b = d.before
      const ch = b && b.total !== d.after.total ? ` (tổng ${fmt(b.total)} → ${fmt(d.after.total)})` : b && b.paid_by !== d.after.paid_by ? ` (người ứng ${nameOf(b.paid_by)} → ${nameOf(d.after.paid_by)})` : ''
      return `sửa bill${d.after?.restaurant ? ` “${d.after.restaurant}”` : ''} trong “${d.event}”${ch}`
    }
    case 'bill.delete': return `xóa bill${d.restaurant ? ` “${d.restaurant}”` : ''}${money(d.total)} khỏi “${d.event}”`
    case 'image.add': return `thêm ${d.count} ảnh vào “${d.event}”`
    case 'image.delete': return `xóa 1 ảnh của “${d.event}”`
    case 'payment.sent': return `báo ${d.from} đã chuyển${money(d.amount)} cho ${d.to}`
    case 'payment.confirm': return `xác nhận ${d.to} đã nhận${money(d.amount)} từ ${d.from}`
    case 'payment.reject': return `từ chối khoản${money(d.amount)} của ${d.from} (chưa nhận được)`
    case 'payment.cancel': return `hủy báo chuyển${money(d.amount)} của ${d.from}`
    case 'member.add': return `thêm thành viên ${d.name}`
    case 'member.update': return `sửa thông tin ${d.name}`
    case 'member.hide': return `ẩn thành viên ${d.name}`
    case 'member.restore': return `hiện lại thành viên ${d.name}`
    default: return a.action
  }
}

export default function ActivityTab() {
  const { data, memberById } = useGroup()
  const nameOf = (id) => memberById[id]?.name || '?'
  if (!data.activity.length) return <Empty icon="🕘" title="Chưa có hoạt động" hint="Ai tạo, sửa bill, chuyển khoản và xác nhận đều được ghi lại ở đây." />
  return (
    <div className="card divide-y divide-slate-50 px-4">
      {data.activity.map((a) => (
        <div key={a.id} className="py-3 text-sm">
          <b>{a.actor_name || 'Ai đó'}</b> {describe(a, nameOf)}
          <div className="text-[11px] text-slate-400">{dateTimeVN(a.created_at)}</div>
        </div>
      ))}
    </div>
  )
}
