# WeSplit – Chia bill cùng hội bạn

Web app responsive (mobile first) quản lý chi tiêu nhóm: nhóm bạn, sự kiện, bill (món chung và món riêng), chia tiền, công nợ có bù trừ, QR chuyển khoản, ảnh hóa đơn, lịch sử hoạt động.
Công nghệ: React + Vite, Tailwind CSS, Supabase (Postgres, Auth, Storage), triển khai Vercel.

## 1. Tạo Supabase
1. Tạo project tại supabase.com.
2. Vào **SQL Editor**, dán toàn bộ `supabase/schema.sql` rồi chạy. File tạo bảng, hàm `create_group` / `join_group`, chính sách RLS và bucket ảnh `bill-images` (riêng tư).
3. **Project Settings > API**: lấy `Project URL` và `anon public key`.
4. (Tùy chọn) **Authentication > Providers > Email**: tắt "Confirm email" nếu muốn đăng ký xong dùng ngay.

## 2. Chạy thử trên máy
```bash
npm install
cp .env.example .env     # điền VITE_SUPABASE_URL và VITE_SUPABASE_ANON_KEY
npm run dev
npm test                 # kiểm thử thuật toán chia bill và bù trừ
```

## 3. Triển khai Vercel
Đưa thư mục này lên GitHub, import vào Vercel (framework Vite), thêm 2 biến môi trường `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY`. Router dùng hash (`#/g/...`) nên không cần cấu hình rewrite.

## Cách hoạt động
- **Nhóm và thành viên:** thành viên chỉ cần tên/nickname, có thể chưa có tài khoản. Bạn bè tham gia bằng mã mời (tab Thành viên) rồi chọn đúng tên của mình.
- **Sự kiện:** người tham gia chọn riêng cho từng sự kiện.
- **Bill:** chi phí chung = tổng bill − tổng món riêng, chia đều cho người được chọn; món riêng gán thẳng cho từng người. Người ứng tiền có thể khác người tạo sự kiện, một sự kiện có nhiều bill và nhiều người ứng.
- **Phần lẻ:** chia bằng số nguyên VNĐ, phần dư cộng 1đ cho vài người (vị trí xoay theo mã bill), tổng phân bổ luôn bằng tổng hóa đơn.
- **Chốt sự kiện:** chỉ sự kiện đã chốt mới vào công nợ. Muốn sửa sau khi chốt phải "Mở lại", thao tác này và mọi lần sửa bill (giá trị trước và sau) được ghi vào tab Hoạt động. Nhật ký chỉ thêm, không sửa/xóa được.
- **Công nợ:** số dư ròng toàn nhóm rồi gợi ý chuyển khoản ít lần nhất (bù trừ chéo giữa các bill). Người nợ bấm "Tôi đã chuyển" → trạng thái *Chờ xác nhận* → người nhận bấm "Đã nhận tiền" mới trừ công nợ. Không có xác nhận thì không tự ghi nhận.
- **QR:** thêm ngân hàng và số tài khoản ở tab Thành viên; QR tạo bằng VietQR (img.vietqr.io) kèm số tiền và nội dung.
- **Ảnh bill:** chụp bằng camera hoặc tải từ thư viện, tự thu nhỏ cạnh dài 2000px, xem toàn màn hình có phóng to/thu nhỏ. Ảnh lưu ở bucket riêng tư, chỉ thành viên nhóm xem được (link tạm thời 1 giờ).

## Chưa làm (V3)
Đọc bill bằng AI/OCR và thông báo đẩy. Hiện có thông báo trong app (chấm đỏ và banner khi có khoản chờ bạn xác nhận).

## Cấu trúc
```
supabase/schema.sql     bảng, RLS, storage
src/lib/money.js        chia bill, xử lý phần lẻ
src/lib/settle.js       số dư, bù trừ công nợ
src/lib/money.test.js   kiểm thử
src/pages, components   giao diện
```
