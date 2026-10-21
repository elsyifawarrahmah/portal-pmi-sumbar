// Mencocokkan teks bebas (kolom "kota", "tujuan/penerima", nama wilayah) ke ID wilayah di peta.
// Cocok bila salah satu alias muncul sebagai kata utuh; alias TERPANJANG yang menang,
// jadi "Padang Pariaman" tidak salah masuk ke "Padang", dan "Kota Solok" tidak masuk "Solok".
const ALIAS = {
  mentawai: ['mentawai', 'kep mentawai', 'kepulauan mentawai', 'siberut', 'sipora', 'pagai'],
  pesisir_selatan: ['pesisir selatan', 'pessel'],
  solok_kab: ['solok', 'kab solok', 'kabupaten solok'],
  sijunjung: ['sijunjung'],
  tanah_datar: ['tanah datar', 'tanahdatar'],
  padang_pariaman: ['padang pariaman'],
  agam: ['agam'],
  limapuluh_kota: ['lima puluh kota', 'limapuluh kota', '50 kota', 'payakumbuh kab'],
  pasaman: ['pasaman'],
  solok_selatan: ['solok selatan'],
  dharmasraya: ['dharmasraya'],
  pasaman_barat: ['pasaman barat'],
  padang: ['padang', 'kota padang'],
  solok_kota: ['kota solok'],
  sawahlunto: ['sawahlunto', 'sawah lunto', 'kota sawahlunto'],
  padang_panjang: ['padang panjang', 'kota padang panjang'],
  bukittinggi: ['bukittinggi', 'bukit tinggi', 'kota bukittinggi'],
  payakumbuh: ['payakumbuh', 'kota payakumbuh'],
  kota_pariaman: ['kota pariaman', 'pariaman'],
}

function normalisasi(s) {
  return ' ' + String(s || '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim() + ' '
}

const DAFTAR = Object.entries(ALIAS)
  .flatMap(([id, list]) => list.map(a => ({ id, alias: ' ' + a + ' ', panjang: a.length })))
  .sort((a, b) => b.panjang - a.panjang)

export function cocokkanWilayah(teks) {
  const n = normalisasi(teks)
  if (n.trim() === '') return null
  for (const d of DAFTAR) if (n.includes(d.alias)) return d.id
  return null
}

// Nama wilayah (saran pengisian kolom Kota/Kabupaten supaya cocok dengan peta)
export const NAMA_WILAYAH = [
  'Kota Padang', 'Kota Bukittinggi', 'Kota Payakumbuh', 'Kota Solok', 'Kota Pariaman', 'Padang Panjang', 'Sawahlunto',
  'Agam', 'Tanah Datar', 'Limapuluh Kota', 'Padang Pariaman', 'Pasaman', 'Pasaman Barat', 'Pesisir Selatan',
  'Kab. Solok', 'Solok Selatan', 'Sijunjung', 'Dharmasraya', 'Kep. Mentawai',
]
