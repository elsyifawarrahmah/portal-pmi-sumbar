-- =========================================================
-- PORTAL DATA DIGITAL PMI SUMATERA BARAT — SKEMA DATABASE
-- Jalankan file ini di: Supabase Dashboard > SQL Editor > New query > Run
-- =========================================================

-- Profil petugas (menyimpan nama & role, terhubung ke akun login Supabase Auth)
create table if not exists profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  nama_lengkap text not null,
  role text not null default 'petugas' check (role in ('admin','petugas')),
  created_at timestamptz default now()
);

-- Data Logistik — Penerimaan Barang Bantuan
create table if not exists logistik (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  jenis_barang text not null,
  jumlah numeric not null,
  satuan text not null,
  donatur text,
  petugas_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- Rekap Distribusi Air Bersih
create table if not exists distribusi_air (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  no_kendaraan text not null,
  kota text not null,
  driver text,
  penerima_manfaat text,
  liter numeric not null,
  status text default 'Beroperasi' check (status in ('Beroperasi','Perbaikan','Rusak')),
  petugas_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- Data Donasi Barang
create table if not exists donasi (
  id uuid primary key default gen_random_uuid(),
  tanggal date not null,
  donatur text not null,
  jenis_donasi text not null,
  jumlah_unit text,
  nilai_bantuan numeric,
  petugas_id uuid references profiles(id),
  created_at timestamptz default now()
);

-- =========================================================
-- ROW LEVEL SECURITY (RLS) — hanya petugas yang login bisa akses
-- =========================================================
alter table profiles enable row level security;
alter table logistik enable row level security;
alter table distribusi_air enable row level security;
alter table donasi enable row level security;

-- semua user yang sudah login boleh baca & tulis (petugas lapangan)
create policy "Petugas login bisa lihat semua profil" on profiles for select using (auth.role() = 'authenticated');
create policy "User bisa update profil sendiri" on profiles for update using (auth.uid() = id);

create policy "Login bisa lihat logistik" on logistik for select using (auth.role() = 'authenticated');
create policy "Login bisa tambah logistik" on logistik for insert with check (auth.role() = 'authenticated');
create policy "Login bisa update logistik" on logistik for update using (auth.role() = 'authenticated');
create policy "Hanya admin hapus logistik" on logistik for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "Login bisa lihat air" on distribusi_air for select using (auth.role() = 'authenticated');
create policy "Login bisa tambah air" on distribusi_air for insert with check (auth.role() = 'authenticated');
create policy "Login bisa update air" on distribusi_air for update using (auth.role() = 'authenticated');
create policy "Hanya admin hapus air" on distribusi_air for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

create policy "Login bisa lihat donasi" on donasi for select using (auth.role() = 'authenticated');
create policy "Login bisa tambah donasi" on donasi for insert with check (auth.role() = 'authenticated');
create policy "Login bisa update donasi" on donasi for update using (auth.role() = 'authenticated');
create policy "Hanya admin hapus donasi" on donasi for delete using (
  exists (select 1 from profiles where id = auth.uid() and role = 'admin')
);

-- Otomatis buat baris profil setiap ada akun baru daftar
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, nama_lengkap, role)
  values (new.id, coalesce(new.raw_user_meta_data->>'nama_lengkap', new.email), 'petugas');
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
