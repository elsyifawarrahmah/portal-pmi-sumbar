-- =========================================================
-- TAMBAHAN: SURAT MASUK & KELUAR (dengan lacak tahapan/alur)
-- Jalankan file ini TERPISAH di SQL Editor Supabase, setelah schema utama.
-- =========================================================

-- Surat Masuk — data induk suratnya
create table if not exists surat_masuk (
  id uuid primary key default gen_random_uuid(),
  nomor_surat text not null,
  tanggal_surat date not null,          -- tanggal yang tertulis di surat
  tanggal_diterima_kantor date not null, -- tanggal surat BENAR-BENAR sampai di kantor PMI
  asal_surat text not null,
  perihal text not null,
  sifat text default 'Biasa' check (sifat in ('Biasa','Penting','Segera','Rahasia')),
  petugas_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- Tahapan/alur perjalanan surat — 1 surat bisa punya banyak baris tahapan
create table if not exists surat_tahapan (
  id uuid primary key default gen_random_uuid(),
  surat_id uuid references surat_masuk(id) on delete cascade,
  nama_tahap text not null,          -- contoh: Resepsionis, Sekretaris, Pimpinan, Divisi Tujuan
  urutan int not null,               -- 1, 2, 3, 4 ... urutan alurnya
  penerima_nama text,                -- siapa yang pegang di tahap ini
  tanggal_diterima timestamptz,      -- kapan tahap ini menerima suratnya
  tanggal_diteruskan timestamptz,    -- kapan tahap ini meneruskan ke tahap berikutnya (kosong = masih ditahan di sini)
  catatan text,
  created_at timestamptz default now()
);

-- Surat Keluar — lebih sederhana, cukup 1 tabel log
create table if not exists surat_keluar (
  id uuid primary key default gen_random_uuid(),
  nomor_surat text not null,
  tanggal_surat date not null,
  tujuan_surat text not null,
  perihal text not null,
  sifat text default 'Biasa' check (sifat in ('Biasa','Penting','Segera','Rahasia')),
  petugas_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- RLS: sama seperti tabel lain, semua yang login boleh baca/tulis, hanya admin boleh hapus
alter table surat_masuk enable row level security;
alter table surat_tahapan enable row level security;
alter table surat_keluar enable row level security;

create policy "Login bisa lihat surat masuk" on surat_masuk for select using (auth.role() = 'authenticated');
create policy "Login bisa tambah surat masuk" on surat_masuk for insert with check (auth.role() = 'authenticated');
create policy "Login bisa update surat masuk" on surat_masuk for update using (auth.role() = 'authenticated');
create policy "Hanya admin hapus surat masuk" on surat_masuk for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "Login bisa lihat tahapan" on surat_tahapan for select using (auth.role() = 'authenticated');
create policy "Login bisa tambah tahapan" on surat_tahapan for insert with check (auth.role() = 'authenticated');
create policy "Login bisa update tahapan" on surat_tahapan for update using (auth.role() = 'authenticated');
create policy "Hanya admin hapus tahapan" on surat_tahapan for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "Login bisa lihat surat keluar" on surat_keluar for select using (auth.role() = 'authenticated');
create policy "Login bisa tambah surat keluar" on surat_keluar for insert with check (auth.role() = 'authenticated');
create policy "Login bisa update surat keluar" on surat_keluar for update using (auth.role() = 'authenticated');
create policy "Hanya admin hapus surat keluar" on surat_keluar for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);
