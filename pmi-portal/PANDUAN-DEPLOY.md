# Portal Data Digital — PMI Sumatera Barat
Panduan ini ditulis untuk yang **tidak perlu paham coding**. Ikuti urut dari atas, ±15 menit.

---

## BAGIAN 1 — Bikin Database (Supabase), ±5 menit

1. Buka **https://supabase.com** → klik **Start your project** → daftar pakai email PMI (misalnya email kantor/IT).
2. Klik **New project**. Isi:
   - Name: `pmi-sumbar-data`
   - Password database: buat password kuat, **simpan di tempat aman**
   - Region: pilih **Southeast Asia (Singapore)** biar cepat
3. Tunggu ±2 menit sampai project selesai dibuat.
4. Di sidebar kiri, klik **SQL Editor** → **New query**.
5. Buka file **`supabase-schema.sql`** (satu paket dengan panduan ini), copy semua isinya, paste ke kotak query, lalu klik **Run**.
   → Ini otomatis membuat semua tabel (logistik, air, donasi) dan sistem keamanan datanya.
6. Di sidebar kiri, klik **Settings** (ikon gerigi) → **API**.
   - Catat/copy **Project URL**
   - Catat/copy **anon public key**
   (Dua hal ini dibutuhkan di Bagian 3)

---

## BAGIAN 2 — Upload kode ke GitHub, ±3 menit

1. Buka **https://github.com** → daftar/login (bisa pakai email yang sama).
2. Klik **New repository** → nama bebas, misal `portal-pmi-sumbar` → **Create repository**.
3. Di halaman repo kosong itu, klik **uploading an existing file**.
4. Drag & drop **semua isi folder proyek ini** (semua file & folder yang saya kirim) ke situ.
5. Klik **Commit changes**.

---

## BAGIAN 3 — Deploy ke Vercel (biar online), ±5 menit

1. Buka **https://vercel.com** → **Sign up** → pilih **Continue with GitHub** (pakai akun GitHub tadi).
2. Klik **Add New** → **Project** → pilih repo `portal-pmi-sumbar` tadi → **Import**.
3. Sebelum klik Deploy, buka bagian **Environment Variables**, tambahkan 2 baris:
   | Name | Value |
   |---|---|
   | `NEXT_PUBLIC_SUPABASE_URL` | (Project URL dari Bagian 1) |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | (anon public key dari Bagian 1) |
4. Klik **Deploy**. Tunggu ±2 menit.
5. Selesai! Kamu akan dapat alamat seperti `portal-pmi-sumbar.vercel.app` — inilah alamat resmi yang bisa dibuka petugas kapan saja, dari HP atau laptop, tanpa perlu Claude.

---

## BAGIAN 4 — Aktifkan akunmu sebagai Admin, ±1 menit

Supaya ada 1 orang yang bisa hapus data (yang lain hanya bisa tambah/edit):

1. Buka situs kamu (`....vercel.app`) → klik **Daftar di sini** → daftar pakai email & nama kamu sendiri.
2. Balik ke **Supabase** → **SQL Editor** → **New query** → paste ini (ganti email dengan email kamu):
   ```sql
   update profiles set role = 'admin' where id = (select id from auth.users where email = 'email_kamu@contoh.com');
   ```
3. Klik **Run**. Sekarang akunmu jadi admin.

**Untuk petugas lain:** cukup suruh mereka buka situsnya dan klik **Daftar di sini** pakai email masing-masing — otomatis jadi Petugas (bisa input, tidak bisa hapus). Kalau nanti mau jadikan admin juga, ulangi langkah 2 dengan email mereka.

---

## Kalau ada yang error / bingung
Balik ke chat Claude ini, screenshot error-nya, dan tanya lagi — saya bantu troubleskan.
