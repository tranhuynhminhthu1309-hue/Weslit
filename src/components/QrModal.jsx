import { bankName, vietQrUrl } from '../lib/banks'
import { fmt } from '../lib/money'
import { Avatar, Modal } from './ui'

const ascii = (s) => s.normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D').replace(/[^\w ]/g, '')

/** QR chuyển khoản VietQR (ảnh từ img.vietqr.io) kèm số tiền và nội dung chuyển khoản. */
export default function QrModal({ from, to, amount, onClose, footer }) {
  const ok = to?.bank_bin && to?.bank_account
  const info = `WeSplit ${ascii(from?.name || '')} tra ${ascii(to?.name || '')}`.slice(0, 50)
  return (
    <Modal title="Chuyển khoản" onClose={onClose}>
      <div className="mb-3 flex items-center justify-center gap-3 text-sm">
        <Avatar m={from} size={30} /> <span className="font-semibold">{from?.name}</span> <span className="text-slate-400">→</span>
        <Avatar m={to} size={30} /> <span className="font-semibold">{to?.name}</span>
      </div>
      <div className="num mb-3 text-center text-3xl font-extrabold text-brand-700">{fmt(amount)}</div>
      {ok ? (
        <>
          <img className="mx-auto w-64 max-w-full rounded-2xl border border-slate-100" alt="Mã QR chuyển khoản" src={vietQrUrl({ bin: to.bank_bin, account: to.bank_account, holder: to.bank_holder, amount, info })} />
          <div className="mt-3 rounded-xl bg-slate-50 p-3 text-center text-sm">
            <div className="font-semibold">{to.bank_holder || to.name}</div>
            <div className="num text-slate-600">{bankName(to.bank_bin) || to.bank_bin} · {to.bank_account}</div>
            <div className="mt-1 text-xs text-slate-400">Nội dung: {info}</div>
          </div>
        </>
      ) : (
        <p className="rounded-xl bg-amber-50 p-3 text-sm text-amber-800">{to?.name} chưa thêm tài khoản ngân hàng. Vào tab Thành viên để bổ sung, khi đó mã QR sẽ hiện ở đây.</p>
      )}
      {footer && <div className="mt-4">{footer}</div>}
    </Modal>
  )
}
