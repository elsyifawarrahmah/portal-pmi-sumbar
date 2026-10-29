-- =========================================================
-- TAMBAHAN Portal Data Digital: PUSDIKLAT & KLINIK (PMI Provinsi)
--
-- PUSDIKLAT
--   1. SK                         -> unit_dokumen (unit='pusdiklat', jenis='sk')
--   2. Rencana pelatihan          -> pusdiklat_rencana
--   3. Jadwal pelatihan per bulan -> pusdiklat_jadwal
--   4. Total SDM terlatih / bulan -> pusdiklat_sdm_terlatih
--   5. Materi pelatihan           -> unit_dokumen (unit='pusdiklat', jenis='materi')
--
-- KLINIK
--   1. SK                         -> unit_dokumen (unit='klinik', jenis='sk')
--   2. Jenis layanan (Umum/BPJS/Asuransi) -> klinik_layanan
--   3. Kapitasi (total / bulan)   -> klinik_kapitasi
--   4. Laporan layanan harian (pasien kunjungan & rujukan) -> klinik_pasien_harian
--   5. Rekap total pasien / bulan -> dihitung otomatis dari klinik_pasien_harian
--   6. Rencana giat bulanan       -> klinik_rencana_giat
--   7. Aktivitas mingguan         -> klinik_aktivitas
--   8. Jadwal petugas mingguan    -> klinik_jadwal_petugas
--
-- Jalankan SEKALI di Supabase Dashboard > SQL Editor > New query > Run.
-- Aman dijalankan ulang (tidak menghapus / menggandakan data).
-- Syarat: migrasi organisasi (tabel profiles) sudah ada.
-- =========================================================

-- ---------- Dokumen (SK & Materi) untuk Pusdiklat dan Klinik ----------
create table if not exists unit_dokumen (
  id uuid primary key default gen_random_uuid(),
  unit text not null check (unit in ('pusdiklat','klinik')),
  jenis text not null check (jenis in ('sk','materi')),
  judul text not null,            -- perihal SK / judul materi
  nomor text,                     -- nomor SK
  kategori text,                  -- mis. kategori / jenis pelatihan untuk materi
  tanggal date,
  link text,                      -- tautan file (Google Drive, dsb.)
  keterangan text,
  created_at timestamptz default now(),
  created_by uuid default auth.uid()
);
create index if not exists unit_dokumen_idx on unit_dokumen (unit, jenis);

-- ---------- PUSDIKLAT ----------
create table if not exists pusdiklat_rencana (
  id uuid primary key default gen_random_uuid(),
  tahun integer not null,
  bulan integer not null check (bulan between 1 and 12),
  nama_pelatihan text not null,
  sasaran text,
  target_peserta integer,
  keterangan text,
  created_at timestamptz default now(),
  created_by uuid default auth.uid()
);

create table if not exists pusdiklat_jadwal (
  id uuid primary key default gen_random_uuid(),
  tgl_mulai date not null,
  tgl_selesai date,
  nama_pelatihan text not null,
  tempat text,
  jumlah_peserta integer,
  status text,                    -- Terjadwal / Berlangsung / Selesai / Batal
  keterangan text,
  created_at timestamptz default now(),
  created_by uuid default auth.uid()
);

create table if not exists pusdiklat_sdm_terlatih (
  id uuid primary key default gen_random_uuid(),
  tahun integer not null,
  bulan integer not null check (bulan between 1 and 12),
  jumlah_sdm integer not null default 0,
  keterangan text,
  created_at timestamptz default now(),
  created_by uuid default auth.uid(),
  unique (tahun, bulan)
);

-- ---------- KLINIK ----------
create table if not exists klinik_layanan (
  id uuid primary key default gen_random_uuid(),
  jenis text not null unique check (jenis in ('Umum','BPJS','Asuransi')),
  aktif boolean not null default true,
  keterangan text,                -- mis. nama asuransi yang bekerja sama
  created_at timestamptz default now(),
  created_by uuid default auth.uid()
);
insert into klinik_layanan (jenis) values ('Umum'),('BPJS'),('Asuransi') on conflict (jenis) do nothing;

create table if not exists klinik_kapitasi (
  id uuid primary key default gen_random_uuid(),
  tahun integer not null,
  bulan integer not null check (bulan between 1 and 12),
  jumlah_peserta integer,
  total_rupiah numeric,
  keterangan text,
  created_at timestamptz default now(),
  created_by uuid default auth.uid(),
  unique (tahun, bulan)
);

create table if not exists klinik_pasien_harian (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  jenis_layanan text not null check (jenis_layanan in ('Umum','BPJS','Asuransi')),
  kunjungan integer not null default 0,
  rujukan integer not null default 0,
  keterangan text,
  created_at timestamptz default now(),
  created_by uuid default auth.uid(),
  unique (tanggal, jenis_layanan)
);
create index if not exists klinik_pasien_tgl_idx on klinik_pasien_harian (tanggal);

create table if not exists klinik_rencana_giat (
  id uuid primary key default gen_random_uuid(),
  tahun integer not null,
  bulan integer not null check (bulan between 1 and 12),
  kegiatan text not null,
  penanggung_jawab text,
  keterangan text,
  created_at timestamptz default now(),
  created_by uuid default auth.uid()
);

create table if not exists klinik_aktivitas (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  kegiatan text not null,
  penanggung_jawab text,
  keterangan text,
  created_at timestamptz default now(),
  created_by uuid default auth.uid()
);
create index if not exists klinik_aktivitas_tgl_idx on klinik_aktivitas (tanggal);

create table if not exists klinik_jadwal_petugas (
  id uuid primary key default gen_random_uuid(),
  minggu_mulai date not null,     -- tanggal awal minggu (Senin)
  hari text not null check (hari in ('Senin','Selasa','Rabu','Kamis','Jumat','Sabtu','Minggu')),
  shift text,                     -- mis. Pagi 08.00-14.00
  nama text not null,
  peran text,                     -- mis. Dokter Jaga, Perawat, Apoteker
  created_at timestamptz default now(),
  created_by uuid default auth.uid()
);
create index if not exists klinik_petugas_idx on klinik_jadwal_petugas (minggu_mulai);

-- ---------- Keamanan baris: semua yang login bisa melihat, hanya admin yang menambah/mengubah/menghapus ----------
do $$
declare t text;
begin
  foreach t in array array[
    'unit_dokumen','pusdiklat_rencana','pusdiklat_jadwal','pusdiklat_sdm_terlatih',
    'klinik_layanan','klinik_kapitasi','klinik_pasien_harian','klinik_rencana_giat','klinik_aktivitas','klinik_jadwal_petugas'
  ] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "Login bisa lihat %1$s" on %1$I', t);
    execute format('drop policy if exists "Admin bisa tambah %1$s" on %1$I', t);
    execute format('drop policy if exists "Admin bisa ubah %1$s" on %1$I', t);
    execute format('drop policy if exists "Admin bisa hapus %1$s" on %1$I', t);
    execute format('create policy "Login bisa lihat %1$s" on %1$I for select using (auth.role() = ''authenticated'')', t);
    execute format('create policy "Admin bisa tambah %1$s" on %1$I for insert with check (exists (select 1 from profiles where id = auth.uid() and role = ''admin''))', t);
    execute format('create policy "Admin bisa ubah %1$s" on %1$I for update using (exists (select 1 from profiles where id = auth.uid() and role = ''admin''))', t);
    execute format('create policy "Admin bisa hapus %1$s" on %1$I for delete using (exists (select 1 from profiles where id = auth.uid() and role = ''admin''))', t);
  end loop;
end $$;
