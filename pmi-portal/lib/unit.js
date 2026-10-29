// Fungsi bantu untuk bagian Pusdiklat & Klinik (PMI Provinsi)

export const NAMA_BULAN = ['Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni', 'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember']
export const HARI = ['Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu', 'Minggu']
export const JENIS_LAYANAN = ['Umum', 'BPJS', 'Asuransi']

const iso = d => d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0')
const tgl = s => new Date(String(s).slice(0, 10) + 'T00:00:00')

export const fmtTanggal = s => (s ? tgl(s).toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' }) : '-')
export const fmtAngka = n => (n === null || n === undefined || n === '' ? '-' : Number(n).toLocaleString('id-ID'))
export const fmtRupiah = n => (n === null || n === undefined || n === '' ? '-' : 'Rp ' + Number(n).toLocaleString('id-ID'))

// Senin pada minggu dari tanggal tsb (format YYYY-MM-DD)
export function seninDari(s) {
  const d = tgl(s)
  d.setDate(d.getDate() - ((d.getDay() + 6) % 7))
  return iso(d)
}
export function labelMinggu(seninIso) {
  const a = tgl(seninIso)
  const b = new Date(a); b.setDate(b.getDate() + 6)
  const f = d => d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short' })
  return `Minggu ${f(a)} – ${f(b)} ${b.getFullYear()}`
}
export const kunciBulan = (tahun, bulan) => `${tahun}-${String(bulan).padStart(2, '0')}`
export const labelBulan = (tahun, bulan) => `${NAMA_BULAN[bulan - 1]} ${tahun}`
export const bulanDariTanggal = s => ({ tahun: tgl(s).getFullYear(), bulan: tgl(s).getMonth() + 1 })
export const tautanAman = v => /^https?:\/\//i.test(String(v || ''))
