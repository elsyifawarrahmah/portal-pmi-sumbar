-- =========================================================
-- TAMBAHAN Portal Data Digital:
--   1) Layanan Kesehatan (termasuk Dukungan PSS)
--   2) Bersih-Bersih (Aksi Bersih, Promosi Kebersihan, dll)
--   3) Produksi: Unit & Perlengkapan (logistik, lapangan, kesehatan)
-- Jalankan SEKALI di Supabase Dashboard > SQL Editor > New query > Run.
-- Aman dijalankan ulang. Upload foto memakai bucket "bukti-logistik" yang sudah ada.
-- =========================================================

create table if not exists layanan_kesehatan (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  jenis_layanan text not null,        -- mis. Dukungan PSS, Layanan Kesehatan Umum
  kota text not null,                 -- kota/kabupaten (dicocokkan ke peta)
  lokasi text,
  jumlah_penerima integer,
  jumlah_relawan integer,
  keterangan text,
  file_bukti_url text,
  petugas_id uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists kegiatan_bersih (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  jenis_kegiatan text not null,       -- mis. Aksi Bersih, Promosi Kebersihan
  kota text not null,
  lokasi text,
  jumlah_relawan integer,
  jumlah_terlayani integer not null,
  satuan text default 'jiwa',         -- jiwa / unit / titik lokasi / kg sampah
  keterangan text,
  file_bukti_url text,
  petugas_id uuid references profiles(id),
  created_at timestamptz default now()
);

create table if not exists unit_perlengkapan (
  id uuid primary key default gen_random_uuid(),
  kategori text not null default 'Logistik',   -- Logistik / Lapangan / Kesehatan
  nama_unit text not null,
  jumlah integer not null default 1,
  satuan text,
  kondisi text default 'Baik',                 -- Baik / Rusak Ringan / Rusak Berat
  lokasi_simpan text,
  keterangan text,
  file_bukti_url text,
  petugas_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- Keamanan baris (sama seperti tabel donasi): semua yang login bisa lihat/tambah/ubah, hanya admin yang menghapus
do $$
declare t text;
begin
  foreach t in array array['layanan_kesehatan','kegiatan_bersih','unit_perlengkapan'] loop
    execute format('alter table %I enable row level security', t);
    execute format('drop policy if exists "Login bisa lihat %1$s" on %1$I', t);
    execute format('drop policy if exists "Login bisa tambah %1$s" on %1$I', t);
    execute format('drop policy if exists "Login bisa ubah %1$s" on %1$I', t);
    execute format('drop policy if exists "Hanya admin hapus %1$s" on %1$I', t);
    execute format('create policy "Login bisa lihat %1$s" on %1$I for select using (auth.role() = ''authenticated'')', t);
    execute format('create policy "Login bisa tambah %1$s" on %1$I for insert with check (auth.role() = ''authenticated'')', t);
    execute format('create policy "Login bisa ubah %1$s" on %1$I for update using (auth.role() = ''authenticated'')', t);
    execute format('create policy "Hanya admin hapus %1$s" on %1$I for delete using (exists (select 1 from profiles where id = auth.uid() and role = ''admin''))', t);
  end loop;
end $$;
