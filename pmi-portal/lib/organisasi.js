// Fungsi bantu untuk menu Organisasi & Relawan

export const SARAN_JABATAN = [
  'Ketua', 'Wakil Ketua', 'Sekretaris', 'Wakil Sekretaris', 'Bendahara', 'Bendahara I', 'Bendahara II', 'Anggota',
  'Ketua Bidang Organisasi', 'Ketua Bidang Penanggulangan Bencana dan Logistik', 'Ketua Bidang Pelayanan Kesehatan dan Sosial',
  'Ketua Bidang Donor Darah', 'Ketua Bidang Relawan dan Diklat', 'Ketua Bidang Sumber Daya Manusia dan Diklat',
  'Ketua Bidang Pengembangan Sumber Daya', 'Ketua Bidang Humas dan Hubungan Antar Lembaga', 'Ketua Bidang Kerjasama dan Kemitraan',
]

// Status berdasarkan tahun akhir masa bakti, mis. "2021 - 2026"
export function statusMasaBakti(masa, tahunSekarang = new Date().getFullYear()) {
  const m = String(masa || '').match(/(\d{4})\D+(\d{4})/)
  if (!m) return null
  const akhir = Number(m[2])
  if (akhir < tahunSekarang) return { label: 'Masa bakti berakhir', tone: 'merah' }
  if (akhir === tahunSekarang) return { label: 'Berakhir tahun ini', tone: 'kuning' }
  return { label: 'Aktif', tone: 'hijau' }
}

// Gabungkan baris berurutan yang jabatannya sama (mis. beberapa "Anggota") jadi satu baris dengan banyak nama
export function kelompokkanJabatan(rows) {
  const hasil = []
  rows.forEach(r => {
    const akhir = hasil[hasil.length - 1]
    if (akhir && akhir.jabatan === r.jabatan) akhir.nama.push(r.nama)
    else hasil.push({ jabatan: r.jabatan, nama: [r.nama] })
  })
  return hasil
}

export const pecahBaris = teks => String(teks || '').split(/\r?\n|;/).map(x => x.trim()).filter(Boolean)

export const LABEL_UNIT = {
  pusdiklat: { judul: 'Pusdiklat', nama: 'Nama Pusdiklat', pj: 'Kepala / Penanggung Jawab', ket: 'Program / Keterangan', tombol: 'Tambah Pusdiklat' },
  klinik: { judul: 'Klinik', nama: 'Nama Klinik', pj: 'Dokter Penanggung Jawab', ket: 'Layanan / Keterangan', tombol: 'Tambah Klinik' },
}
