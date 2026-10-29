// Definisi bagian-bagian Pusdiklat & Klinik, mengikuti daftar kebutuhan data dari catatan tulisan tangan.
import { NAMA_BULAN, HARI, JENIS_LAYANAN, seninDari, labelMinggu, kunciBulan, labelBulan, bulanDariTanggal } from './unit'

const TAHUN = new Date().getFullYear()
const BULAN = new Date().getMonth() + 1
const hariKe = h => HARI.indexOf(h)

const perBulan = (rt, rb) => r => ({ kunci: kunciBulan(r[rt], r[rb]), label: labelBulan(r[rt], r[rb]) })
const perBulanTanggal = kol => r => { const { tahun, bulan } = bulanDariTanggal(r[kol]); return { kunci: kunciBulan(tahun, bulan), label: labelBulan(tahun, bulan) } }
const perMinggu = kol => r => { const s = seninDari(r[kol]); return { kunci: s, label: labelMinggu(s) } }

const fTahun = { key: 'tahun', label: 'Tahun', type: 'tahun', req: true, def: TAHUN }
const fBulan = { key: 'bulan', label: 'Bulan', type: 'bulan', req: true, def: BULAN }

const sk = unit => ({
  id: 'sk', label: 'SK', judul: 'Surat Keputusan (SK)', ikon: 'surat',
  bantu: 'Catat SK yang berlaku beserta tautan file-nya (mis. Google Drive).',
  table: 'unit_dokumen', where: { unit, jenis: 'sk' }, order: [['tanggal', false]],
  tahunKol: { kol: 'tanggal', tipe: 'tanggal' }, semuaTahun: true,
  fields: [
    { key: 'judul', label: 'Perihal / Judul SK', type: 'teks', req: true },
    { key: 'nomor', label: 'Nomor SK', type: 'teks' },
    { key: 'tanggal', label: 'Tanggal SK', type: 'tanggal' },
    { key: 'link', label: 'Tautan file SK', type: 'url', bantu: 'Tempel alamat Google Drive / file. Boleh dikosongkan.' },
    { key: 'keterangan', label: 'Keterangan', type: 'area' },
  ],
  kolom: [{ key: 'nomor', label: 'Nomor' }, { key: 'judul', label: 'Perihal' }, { key: 'tanggal', label: 'Tanggal', type: 'tanggal' }, { key: 'link', label: 'File', type: 'link' }, { key: 'keterangan', label: 'Keterangan' }],
})

export const PUSDIKLAT = [
  sk('pusdiklat'),
  {
    id: 'rencana', label: 'Rencana Pelatihan', judul: 'Rencana Pelatihan', ikon: 'kalender',
    bantu: 'Rencana pelatihan per bulan dalam satu tahun.',
    table: 'pusdiklat_rencana', order: [['tahun', true], ['bulan', true], ['created_at', true]],
    tahunKol: { kol: 'tahun', tipe: 'angka' }, kelompok: perBulan('tahun', 'bulan'), jumlahkan: ['target_peserta'],
    fields: [fTahun, fBulan,
      { key: 'nama_pelatihan', label: 'Nama Pelatihan', type: 'teks', req: true },
      { key: 'sasaran', label: 'Sasaran / Peserta', type: 'teks' },
      { key: 'target_peserta', label: 'Target Peserta (orang)', type: 'angka' },
      { key: 'keterangan', label: 'Keterangan', type: 'area' }],
    kolom: [{ key: 'nama_pelatihan', label: 'Pelatihan' }, { key: 'sasaran', label: 'Sasaran' }, { key: 'target_peserta', label: 'Target', type: 'angka', num: true }, { key: 'keterangan', label: 'Keterangan' }],
  },
  {
    id: 'jadwal', label: 'Jadwal Pelatihan', judul: 'Jadwal Pelatihan per Bulan', ikon: 'jam',
    bantu: 'Jadwal pelaksanaan pelatihan, dikelompokkan per bulan.',
    table: 'pusdiklat_jadwal', order: [['tgl_mulai', true]],
    tahunKol: { kol: 'tgl_mulai', tipe: 'tanggal' }, kelompok: perBulanTanggal('tgl_mulai'), jumlahkan: ['jumlah_peserta'],
    fields: [
      { key: 'nama_pelatihan', label: 'Nama Pelatihan', type: 'teks', req: true },
      { key: 'tgl_mulai', label: 'Tanggal Mulai', type: 'tanggal', req: true },
      { key: 'tgl_selesai', label: 'Tanggal Selesai', type: 'tanggal' },
      { key: 'tempat', label: 'Tempat', type: 'teks' },
      { key: 'jumlah_peserta', label: 'Jumlah Peserta', type: 'angka' },
      { key: 'status', label: 'Status', type: 'pilih', opsi: ['Terjadwal', 'Berlangsung', 'Selesai', 'Batal'] },
      { key: 'keterangan', label: 'Keterangan', type: 'area' }],
    kolom: [{ key: 'tgl_mulai', label: 'Mulai', type: 'tanggal' }, { key: 'tgl_selesai', label: 'Selesai', type: 'tanggal' }, { key: 'nama_pelatihan', label: 'Pelatihan' }, { key: 'tempat', label: 'Tempat' }, { key: 'jumlah_peserta', label: 'Peserta', type: 'angka', num: true }, { key: 'status', label: 'Status' }],
  },
  {
    id: 'sdm', label: 'SDM Terlatih', judul: 'Total SDM yang Telah Terlatih per Bulan', ikon: 'orang2',
    bantu: 'Jumlah SDM yang sudah mengikuti pelatihan pada tiap bulan. Satu baris per bulan.',
    table: 'pusdiklat_sdm_terlatih', order: [['tahun', true], ['bulan', true]],
    tahunKol: { kol: 'tahun', tipe: 'angka' }, jumlahkan: ['jumlah_sdm'], totalLabel: 'Total setahun',
    fields: [fTahun, fBulan, { key: 'jumlah_sdm', label: 'Jumlah SDM Terlatih (orang)', type: 'angka', req: true }, { key: 'keterangan', label: 'Keterangan', type: 'area' }],
    kolom: [{ key: 'bulan', label: 'Bulan', type: 'bulan' }, { key: 'jumlah_sdm', label: 'SDM Terlatih', type: 'angka', num: true }, { key: 'keterangan', label: 'Keterangan' }],
  },
  {
    id: 'materi', label: 'Materi Pelatihan', judul: 'Materi Pelatihan', ikon: 'buku',
    bantu: 'Daftar materi pelatihan beserta tautan filenya.',
    table: 'unit_dokumen', where: { unit: 'pusdiklat', jenis: 'materi' }, order: [['kategori', true], ['judul', true]], semuaTahun: true,
    fields: [
      { key: 'judul', label: 'Judul Materi', type: 'teks', req: true },
      { key: 'kategori', label: 'Kategori / Jenis Pelatihan', type: 'teks', bantu: 'mis. Pertolongan Pertama, KSR, Manajemen Bencana' },
      { key: 'tanggal', label: 'Tanggal Materi / Revisi', type: 'tanggal' },
      { key: 'link', label: 'Tautan file materi', type: 'url' },
      { key: 'keterangan', label: 'Keterangan', type: 'area' }],
    kolom: [{ key: 'kategori', label: 'Kategori' }, { key: 'judul', label: 'Judul Materi' }, { key: 'tanggal', label: 'Tanggal', type: 'tanggal' }, { key: 'link', label: 'File', type: 'link' }, { key: 'keterangan', label: 'Keterangan' }],
  },
]

export const KLINIK = [
  sk('klinik'),
  {
    id: 'layanan', label: 'Jenis Layanan', judul: 'Jenis Layanan', ikon: 'faskes',
    bantu: 'Jenis layanan yang tersedia: Umum, BPJS, dan Asuransi.',
    table: 'klinik_layanan', order: [['created_at', true]], semuaTahun: true,
    fields: [
      { key: 'jenis', label: 'Jenis Layanan', type: 'pilih', opsi: JENIS_LAYANAN, req: true },
      { key: 'aktif', label: 'Tersedia?', type: 'yatidak', req: true, def: 'true' },
      { key: 'keterangan', label: 'Keterangan', type: 'area', bantu: 'mis. nama asuransi yang bekerja sama' }],
    kolom: [{ key: 'jenis', label: 'Jenis Layanan' }, { key: 'aktif', label: 'Tersedia', type: 'yatidak' }, { key: 'keterangan', label: 'Keterangan' }],
  },
  {
    id: 'kapitasi', label: 'Kapitasi', judul: 'Kapitasi (Total per Bulan)', ikon: 'bank',
    bantu: 'Dana kapitasi yang diterima tiap bulan. Satu baris per bulan.',
    table: 'klinik_kapitasi', order: [['tahun', true], ['bulan', true]],
    tahunKol: { kol: 'tahun', tipe: 'angka' }, jumlahkan: ['total_rupiah'], totalLabel: 'Total setahun',
    fields: [fTahun, fBulan,
      { key: 'jumlah_peserta', label: 'Jumlah Peserta Terdaftar', type: 'angka' },
      { key: 'total_rupiah', label: 'Total Kapitasi (Rp)', type: 'angka', req: true },
      { key: 'keterangan', label: 'Keterangan', type: 'area' }],
    kolom: [{ key: 'bulan', label: 'Bulan', type: 'bulan' }, { key: 'jumlah_peserta', label: 'Peserta', type: 'angka', num: true }, { key: 'total_rupiah', label: 'Total Kapitasi', type: 'rupiah', num: true }, { key: 'keterangan', label: 'Keterangan' }],
  },
  {
    id: 'laporan', label: 'Laporan Harian', judul: 'Laporan Layanan Harian', ikon: 'aktivitas',
    bantu: 'Jumlah pasien kunjungan dan pasien rujukan tiap hari, per jenis layanan.',
    table: 'klinik_pasien_harian', order: [['tanggal', false]],
    tahunKol: { kol: 'tanggal', tipe: 'tanggal' }, kelompok: perBulanTanggal('tanggal'), grupTurun: true, jumlahkan: ['kunjungan', 'rujukan'], totalLabel: 'Total bulan ini',
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'tanggal', req: true, def: new Date().toISOString().slice(0, 10) },
      { key: 'jenis_layanan', label: 'Jenis Layanan', type: 'pilih', opsi: JENIS_LAYANAN, req: true },
      { key: 'kunjungan', label: 'Pasien Kunjungan', type: 'angka', req: true, def: '0' },
      { key: 'rujukan', label: 'Pasien Rujukan', type: 'angka', req: true, def: '0' },
      { key: 'keterangan', label: 'Keterangan', type: 'area' }],
    kolom: [{ key: 'tanggal', label: 'Tanggal', type: 'tanggal' }, { key: 'jenis_layanan', label: 'Layanan' }, { key: 'kunjungan', label: 'Kunjungan', type: 'angka', num: true }, { key: 'rujukan', label: 'Rujukan', type: 'angka', num: true }, { key: 'keterangan', label: 'Keterangan' }],
  },
  { id: 'rekap', label: 'Rekap Pasien', judul: 'Rekap Total Pasien per Bulan', ikon: 'info', khusus: 'rekap' },
  {
    id: 'rencana', label: 'Rencana Giat', judul: 'Rencana Giat Bulanan', ikon: 'kalender',
    bantu: 'Rencana kegiatan klinik untuk tiap bulan.',
    table: 'klinik_rencana_giat', order: [['tahun', true], ['bulan', true], ['created_at', true]],
    tahunKol: { kol: 'tahun', tipe: 'angka' }, kelompok: perBulan('tahun', 'bulan'),
    fields: [fTahun, fBulan,
      { key: 'kegiatan', label: 'Kegiatan', type: 'teks', req: true },
      { key: 'penanggung_jawab', label: 'Penanggung Jawab', type: 'teks' },
      { key: 'keterangan', label: 'Keterangan', type: 'area' }],
    kolom: [{ key: 'kegiatan', label: 'Kegiatan' }, { key: 'penanggung_jawab', label: 'Penanggung Jawab' }, { key: 'keterangan', label: 'Keterangan' }],
  },
  {
    id: 'aktivitas', label: 'Aktivitas Mingguan', judul: 'Aktivitas Mingguan', ikon: 'aktivitas',
    bantu: 'Kegiatan yang dilakukan, dikelompokkan per minggu (Senin–Minggu).',
    table: 'klinik_aktivitas', order: [['tanggal', true]],
    tahunKol: { kol: 'tanggal', tipe: 'tanggal' }, kelompok: perMinggu('tanggal'), grupTurun: true,
    fields: [
      { key: 'tanggal', label: 'Tanggal', type: 'tanggal', req: true, def: new Date().toISOString().slice(0, 10) },
      { key: 'kegiatan', label: 'Aktivitas / Kegiatan', type: 'teks', req: true },
      { key: 'penanggung_jawab', label: 'Penanggung Jawab', type: 'teks' },
      { key: 'keterangan', label: 'Keterangan', type: 'area' }],
    kolom: [{ key: 'tanggal', label: 'Tanggal', type: 'tanggal' }, { key: 'kegiatan', label: 'Aktivitas' }, { key: 'penanggung_jawab', label: 'Penanggung Jawab' }, { key: 'keterangan', label: 'Keterangan' }],
  },
  {
    id: 'petugas', label: 'Jadwal Petugas', judul: 'Jadwal Petugas Mingguan', ikon: 'orang2',
    bantu: 'Siapa bertugas pada hari dan shift apa, per minggu. Isi “Awal minggu” dengan tanggal hari Senin.',
    table: 'klinik_jadwal_petugas', order: [['minggu_mulai', false]],
    tahunKol: { kol: 'minggu_mulai', tipe: 'tanggal' }, kelompok: r => { const s = seninDari(r.minggu_mulai); return { kunci: s, label: labelMinggu(s) } }, grupTurun: true,
    urutBaris: (a, b) => hariKe(a.hari) - hariKe(b.hari) || String(a.shift || '').localeCompare(String(b.shift || '')),
    fields: [
      { key: 'minggu_mulai', label: 'Awal Minggu (tanggal Senin)', type: 'tanggal', req: true },
      { key: 'hari', label: 'Hari', type: 'pilih', opsi: HARI, req: true },
      { key: 'shift', label: 'Shift / Jam', type: 'teks', bantu: 'mis. Pagi 08.00–14.00' },
      { key: 'nama', label: 'Nama Petugas', type: 'teks', req: true },
      { key: 'peran', label: 'Peran', type: 'teks', bantu: 'mis. Dokter Jaga, Perawat, Apoteker' }],
    kolom: [{ key: 'hari', label: 'Hari' }, { key: 'shift', label: 'Shift / Jam' }, { key: 'nama', label: 'Petugas' }, { key: 'peran', label: 'Peran' }],
  },
]

export { NAMA_BULAN }
