-- Ảnh đại diện nhóm (emoji + màu nền). Chạy một lần trong SQL Editor.
alter table groups add column if not exists icon text;
alter table groups add column if not exists color text;
