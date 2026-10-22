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
