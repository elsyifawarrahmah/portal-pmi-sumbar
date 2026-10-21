'use client'
// Satu jenis kegiatan bersih-bersih (Aksi Bersih, Sanitasi, Promosi Kebersihan).
// Datanya sama dengan "Semua Bersih-Bersih" (tabel kegiatan_bersih), hanya disaring per jenis.
import { useParams } from 'next/navigation'
import DataPage from '@/components/DataPage'
import Sidebar from '@/components/Sidebar'
import { NAMA_WILAYAH } from '@/lib/wilayah'

const JENIS = {
  'aksi-bersih': {
    jenis: 'Aksi Bersih', satuan: 'unit',
    desc: 'Aksi bersih lingkungan oleh PMI dan relawan (sungai, pasar, pantai, sekolah, pasca bencana).',
  },
  'sanitasi': {
    jenis: 'Sanitasi', satuan: 'unit',
    desc: 'Pembangunan dan perbaikan sarana sanitasi: MCK, septic tank komunal, fasilitas cuci tangan.',
  },
  'promosi-kebersihan': {
    jenis: 'Promosi Kebersihan', satuan: 'jiwa',
    desc: 'Penyuluhan kebersihan dan perilaku hidup bersih dan sehat (cuci tangan, kebersihan lingkungan) untuk masyarakat dan sekolah.',
  },
}

export default function BersihJenisPage() {
  const { jenis } = useParams()
  const cfg = JENIS[jenis]
  if (!cfg) {
    return (
      <div className="app"><Sidebar /><div className="main"><div className="topbar"><div><h1>Halaman tidak ditemukan</h1><p className="desc">Pilih menu Bersih-Bersih dari sidebar.</p></div></div></div></div>
    )
  }
  return (
    <DataPage
      key={jenis}
      table="kegiatan_bersih"
      title={cfg.jenis}
      desc={cfg.desc}
      fixed={{ jenis_kegiatan: cfg.jenis }}
      defaults={{ satuan: cfg.satuan }}
      fields={[
        { k:'jenis_kegiatan', label:'Jenis Kegiatan', type:'text' },
        { k:'tanggal', label:'Tanggal', type:'date', req:true },
        { k:'kota', label:'Kota/Kabupaten', type:'text', req:true, saran:NAMA_WILAYAH },
        { k:'lokasi', label:'Lokasi', type:'text', ph:'Nama nagari, sekolah, pasar, dll' },
        { k:'jumlah_relawan', label:'Jumlah Relawan', type:'number' },
        { k:'jumlah_terlayani', label:'Jumlah Terlayani / Hasil', type:'number', req:true },
        { k:'satuan', label:'Satuan', type:'select', opts:['jiwa','unit','titik lokasi','kg sampah'] },
        { k:'keterangan', label:'Keterangan', type:'text' },
        { k:'file_bukti_url', label:'Foto Kegiatan — opsional', type:'file', bucket:'bukti-logistik' },
      ]}
      columns={[
        { k:'tanggal', label:'Tanggal' },
        { k:'kota', label:'Kota/Kab' },
        { k:'lokasi', label:'Lokasi' },
        { k:'jumlah_relawan', label:'Relawan', num:true },
        { k:'jumlah_terlayani', label:'Terlayani', num:true },
        { k:'satuan', label:'Satuan' },
        { k:'file_bukti_url', label:'Foto', file:true },
      ]}
    />
  )
}
