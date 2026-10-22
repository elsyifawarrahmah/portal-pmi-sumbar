-- =========================================================
-- TAMBAHAN Portal Data Digital:
--   1) Menu Alat Kesehatan (Jenis, Jumlah, Merk, Satuan, E.D)
--   2) Penyesuaian daftar jenis Layanan Kesehatan (data lama ikut diganti namanya)
-- Jalankan SEKALI di Supabase Dashboard > SQL Editor > New query > Run.
-- Aman dijalankan ulang.
-- =========================================================

create table if not exists alat_kesehatan (
  id uuid primary key default gen_random_uuid(),
  jenis text not null,                 -- jenis alat kesehatan
  jumlah integer not null default 1,   -- jlh
  merk text,
  satuan text,
  tanggal_ed date,                     -- e.d = expired date (kedaluwarsa)
  petugas_id uuid references profiles(id),
  created_at timestamptz default now()
);

alter table alat_kesehatan enable row level security;

drop policy if exists "Login bisa lihat alat_kesehatan" on alat_kesehatan;
drop policy if exists "Login bisa tambah alat_kesehatan" on alat_kesehatan;
drop policy if exists "Login bisa ubah alat_kesehatan" on alat_kesehatan;
drop policy if exists "Hanya admin hapus alat_kesehatan" on alat_kesehatan;

create policy "Login bisa lihat alat_kesehatan" on alat_kesehatan
  for select using (auth.role() = 'authenticated');
create policy "Login bisa tambah alat_kesehatan" on alat_kesehatan
  for insert with check (auth.role() = 'authenticated');
create policy "Login bisa ubah alat_kesehatan" on alat_kesehatan
  for update using (auth.role() = 'authenticated');
create policy "Hanya admin hapus alat_kesehatan" on alat_kesehatan
  for delete using (exists (select 1 from profiles where id = auth.uid() and role = 'admin'));

-- Data Layanan Kesehatan yang sudah terlanjur diisi dengan nama lama -> nama baru
-- (aman: kalau tabelnya belum ada atau tidak ada datanya, tidak terjadi apa-apa)
do $$
begin
  if to_regclass('public.layanan_kesehatan') is not null then
    update layanan_kesehatan set jenis_layanan = 'Mobile Clinic' where jenis_layanan = 'Layanan Kesehatan Umum';
    update layanan_kesehatan set jenis_layanan = 'Ambulans Rujukan' where jenis_layanan = 'Ambulans';
  end if;
end $$;
