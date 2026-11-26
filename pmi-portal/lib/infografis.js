// Konstanta & bentuk data Infografis Bencana (dipakai poster dan panel edit)
export const KOSONG = {
  judul: 'Bencana Hidrometeorologi Sumatera Barat',
  deskripsi: '',
  tanggal_update: '',
  status_keterangan: '',
  dampak: { meninggal:0, hilang:0, luka:0, mengungsi:0, terdampak:0, rumah_hanyut:0, jembatan_rusak:0, tempat_ibadah_rusak:0, faskes_rusak:0 },
  layanan: { distribusi_air_liter:0, distribusi_air_jiwa:0, ews_unit:0, mobile_clinic_jiwa:0, sumur_bor_unit:0, dukungan_psikososial_jiwa:0 },
  penerima_manfaat: { air_bersih_jiwa:0, bantuan_jiwa:0, total_jiwa:0 },
  sumber_daya: { ambulans:0, pickup:0, minibus:0, truk_tanki:0, personil:0 },
  kontak: [],
  rekening: { bank:'', nomor:'', atas_nama:'' },
  wilayah_status: {},
  bantuan_items: [],
  wilayah_detail: [],
}

// [kunci, ikon, label, satuan, warna, kelompok]
export const DAMPAK = [
  ['meninggal', 'orang', 'Meninggal', 'orang', '#B3261E', 'Korban jiwa'],
  ['hilang', 'cari', 'Hilang', 'orang', '#B3261E', 'Korban jiwa'],
  ['luka', 'tambah', 'Luka', 'orang', '#D98E04', 'Korban jiwa'],
  ['mengungsi', 'tenda', 'Mengungsi', 'jiwa', '#D98E04', 'Korban jiwa'],
  ['terdampak', 'orang2', 'Terdampak', 'jiwa', '#1F6FB2', 'Korban jiwa'],
  ['rumah_hanyut', 'rumah', 'Rumah Hanyut', 'unit', '#B3261E', 'Kerusakan'],
  ['jembatan_rusak', 'jembatan', 'Jembatan Rusak', 'unit', '#D98E04', 'Kerusakan'],
  ['tempat_ibadah_rusak', 'ibadah', 'Tempat Ibadah Rusak', 'unit', '#D98E04', 'Kerusakan'],
  ['faskes_rusak', 'faskes', 'Fasilitas Kesehatan Rusak', 'unit', '#D98E04', 'Kerusakan'],
]
export const LAYANAN = [
  ['distribusi_air_liter', 'tetes', 'Air Terdistribusi', 'liter'],
  ['distribusi_air_jiwa', 'orang2', 'Penerima Air', 'jiwa'],
  ['ews_unit', 'radio', 'Rambu EWS', 'unit'],
  ['mobile_clinic_jiwa', 'faskes', 'Mobile Clinic', 'jiwa'],
  ['sumur_bor_unit', 'sumur', 'Sumur Bor', 'unit'],
  ['dukungan_psikososial_jiwa', 'hati', 'Dukungan Psikososial', 'jiwa'],
]
export const PENERIMA = [
  ['air_bersih_jiwa', 'Air Bersih'],
  ['bantuan_jiwa', 'Bantuan'],
  ['total_jiwa', 'Total Layanan PMI'],
]
export const SUMBER_DAYA = [
  ['ambulans', 'ambulans', 'Ambulans'],
  ['pickup', 'truk', 'Pickup Granmax'],
  ['minibus', 'bus', 'Minibus Double Cabin'],
  ['truk_tanki', 'truk', 'Truk Tanki Air'],
  ['personil', 'perisai', 'Personil PMI'],
]
export const STATUS_LABEL = { aman: 'Aman', ringan: 'Ringan', sedang: 'Sedang', parah: 'Parah' }

// Isian khusus poster cetak: disimpan terpisah di data.poster supaya halaman Infografis dan panel edit tidak berubah
export const POSTER_KOSONG = { pukul: '', sepeda_motor: 0, alkon: 0, kebutuhan_mendesak: [], tautan_donasi: '', media_sosial: '', foto: [] }
export const POSTER_SUMBER_DAYA = [
  ['ambulans', 'ambulans', 'Ambulans'],
  ['pickup', 'truk', 'Pickup Granmax'],
  ['minibus', 'bus', 'Minibus Double Cabin'],
  ['truk_tanki', 'truk', 'Truk Tanki Air'],
  ['sepeda_motor', 'truk', 'Sepeda Motor'],
  ['alkon', 'radio', 'Alkon'],
  ['personil', 'perisai', 'Personil PMI'],
]
// Gabungkan data Infografis dengan isian khusus poster menjadi satu objek siap tampil
export function dataPoster(data) {
  const x = { ...POSTER_KOSONG, ...(data.poster || {}) }
  return { ...data, pukul_update: x.pukul, kebutuhan_mendesak: x.kebutuhan_mendesak, tautan_donasi: x.tautan_donasi, media_sosial: x.media_sosial, foto: x.foto,
    sumber_daya: { ...(data.sumber_daya || {}), sepeda_motor: x.sepeda_motor, alkon: x.alkon } }
}

export const STATUS_WARNA = { parah: '#C8102E', sedang: '#E0A020', ringan: '#2D6A4F', aman: '#B9D6C4' }

// Ukuran kertas (mm, landscape) untuk cetak poster
export const KERTAS = { A4: [297, 210], A3: [420, 297], A2: [594, 420], A1: [841, 594] }
export const POSTER_W = 1754
export const POSTER_H = 1240

// Pilihan ukuran cetak (mm). "kustom" = lebar x tinggi diisi sendiri (cm).
export const UKURAN = [
  { id: 'A4', grup: 'Kertas', label: 'A4  (29,7 × 21 cm)', w: 297, h: 210 },
  { id: 'A3', grup: 'Kertas', label: 'A3  (42 × 29,7 cm)', w: 420, h: 297 },
  { id: 'A2', grup: 'Kertas', label: 'A2  (59,4 × 42 cm)', w: 594, h: 420 },
  { id: 'A1', grup: 'Kertas', label: 'A1  (84,1 × 59,4 cm)', w: 841, h: 594 },
  { id: 'S200', grup: 'Spanduk', label: 'Spanduk 200 × 100 cm', w: 2000, h: 1000 },
  { id: 'S230', grup: 'Spanduk', label: 'Spanduk 230 × 100 cm', w: 2300, h: 1000 },
  { id: 'S300', grup: 'Spanduk', label: 'Spanduk 300 × 130 cm', w: 3000, h: 1300 },
  { id: 'S400', grup: 'Spanduk', label: 'Spanduk 400 × 170 cm', w: 4000, h: 1700 },
]
export const RASIO_MIN = POSTER_W / POSTER_H
export const RASIO_MAX = 2.6
// Lebar rancangan poster (px) mengikuti rasio kertas: makin lebar ukurannya, makin lebar susunan isinya
export const lebarRancangan = rasio => Math.round(POSTER_H * Math.min(Math.max(rasio || RASIO_MIN, RASIO_MIN), RASIO_MAX))

const BULAN = ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember']
export function tglID(s) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(s || '')
  return m ? `${Number(m[3])} ${BULAN[Number(m[2]) - 1]} ${m[1]}` : (s || '')
}
export const angkaID = n => Number(n || 0).toLocaleString('id-ID')

// Nama wilayah seperti di papan: "Kab. Agam" / "Kota Padang"
export function namaWilayah(f) {
  const nama = f.properties.nama || ''
  if (/^(kab\.?|kota|kabupaten)\s/i.test(nama)) return nama
  return (String(f.properties.kode || '').startsWith('13.7') ? 'Kota ' : 'Kab. ') + nama
}

// Teks ringkasan siap kirim lewat WhatsApp (format tebal pakai *...*)
export function ringkasanTeks(d, wilayah = []) {
  const L = []
  L.push(`*${d.judul || 'Infografis Bencana'}*`)
  const waktu = [tglID(d.tanggal_update), d.pukul_update].filter(Boolean).join(' pukul ')
  if (waktu) L.push(`Update: ${waktu}`)
  if (d.status_keterangan) L.push(d.status_keterangan)
  if (d.deskripsi) L.push('', d.deskripsi)
  const dampak = DAMPAK.filter(([k]) => Number(d.dampak?.[k]) > 0).map(([k, , lb, st]) => `• ${lb}: ${angkaID(d.dampak[k])} ${st}`)
  if (dampak.length) L.push('', '*Dampak*', ...dampak)
  if (wilayah.length) L.push('', '*Wilayah terdampak*', ...wilayah.map(w => `• ${w}`))
  const lay = LAYANAN.filter(([k]) => Number(d.layanan?.[k]) > 0).map(([k, , lb, st]) => `• ${lb}: ${angkaID(d.layanan[k])} ${st}`)
  if (lay.length) L.push('', '*Layanan PMI*', ...lay)
  const ban = (d.bantuan_items || []).filter(b => b.nama).map(b => `• ${b.nama}${b.jumlah ? ': ' + angkaID(b.jumlah) : ''}${b.satuan ? ' ' + b.satuan : ''}`)
  if (ban.length) L.push('', '*Bantuan PMI*', ...ban)
  const mend = (d.kebutuhan_mendesak || []).map(x => String(x).trim()).filter(Boolean)
  if (mend.length) L.push('', '*Kebutuhan mendesak*', ...mend.map(x => `• ${x}`))
  const sd = POSTER_SUMBER_DAYA.filter(([k]) => Number(d.sumber_daya?.[k]) > 0).map(([k, , lb]) => `• ${lb}: ${angkaID(d.sumber_daya[k])}`)
  if (sd.length) L.push('', '*Sumber daya*', ...sd)
  const r = d.rekening || {}
  if (r.nomor) L.push('', `*Salurkan donasi*`, `${r.bank || 'Rekening'} ${r.nomor}${r.atas_nama ? ' a.n. ' + r.atas_nama : ''}`)
  const kon = (d.kontak || []).filter(k => k.nama || k.nomor).map(k => `• ${k.nama}${k.nomor ? ' ' + k.nomor : ''}`)
  if (kon.length) L.push('', '*Contact person*', ...kon)
  if (d.media_sosial) L.push('', d.media_sosial)
  return L.join('\n')
}
