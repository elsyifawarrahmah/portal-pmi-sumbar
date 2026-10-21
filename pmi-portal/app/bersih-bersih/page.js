'use client'
import DataPage from '@/components/DataPage'
import { NAMA_WILAYAH } from '@/lib/wilayah'

const JENIS = ['Aksi Bersih', 'Promosi Kebersihan', 'Pembersihan Pasca Bencana', 'Penghijauan']

export default function BersihBersihPage() {
  return (
    <DataPage
      table="kegiatan_bersih"
      title="Bersih-Bersih"
      desc="Semua kegiatan kebersihan PMI: aksi bersih, promosi kebersihan, pembersihan pasca bencana, dan lainnya. (Distribusi air bersih ada di menu tersendiri.)"
      filterField={{ k: 'jenis_kegiatan', label: 'Semua kegiatan', opts: JENIS }}
      fields={[
        { k:'tanggal', label:'Tanggal', type:'date', req:true },
        { k:'jenis_kegiatan', label:'Jenis Kegiatan', type:'text', req:true, ph:'Aksi Bersih, Promosi Kebersihan, dll', saran:JENIS },
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
        { k:'jenis_kegiatan', label:'Kegiatan' },
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
