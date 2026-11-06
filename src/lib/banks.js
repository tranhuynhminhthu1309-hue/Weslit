// Ngân hàng phổ biến và mã BIN dùng cho VietQR. Nên đối chiếu lại danh sách đầy đủ tại https://api.vietqr.io/v2/banks
export const BANKS = [
  { bin: '970436', name: 'Vietcombank' },
  { bin: '970407', name: 'Techcombank' },
  { bin: '970422', name: 'MB Bank' },
  { bin: '970432', name: 'VPBank' },
  { bin: '970416', name: 'ACB' },
  { bin: '970418', name: 'BIDV' },
  { bin: '970415', name: 'VietinBank' },
  { bin: '970423', name: 'TPBank' },
  { bin: '970403', name: 'Sacombank' },
  { bin: '970441', name: 'VIB' },
  { bin: '970443', name: 'SHB' },
  { bin: '970437', name: 'HDBank' },
  { bin: '970448', name: 'OCB' },
  { bin: '970426', name: 'MSB' },
  { bin: '970440', name: 'SeABank' },
  { bin: '970405', name: 'Agribank' },
  { bin: '970431', name: 'Eximbank' },
  { bin: '970449', name: 'LPBank' },
]

export const bankName = (bin) => BANKS.find((b) => b.bin === bin)?.name || ''

export function vietQrUrl({ bin, account, holder, amount, info }) {
  const q = new URLSearchParams()
  if (amount) q.set('amount', String(Math.round(amount)))
  if (info) q.set('addInfo', info)
  if (holder) q.set('accountName', holder)
  return `https://img.vietqr.io/image/${bin}-${account}-compact2.png?${q.toString()}`
}
