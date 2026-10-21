'use client'
import DataPage from '@/components/DataPage'
import { NAMA_WILAYAH } from '@/lib/wilayah'

export default function LayananKesehatanPage() {
  return (
    <DataPage
      table="layanan_kesehatan"
      title="Layanan Kesehatan"
      desc="Layanan kesehatan PMI, termasuk Dukungan Psikososial (PSS), pos kesehatan, dan layanan lapangan lainnya."
      filterField={{ k: 'jenis_layanan', label: 'Semua jenis layanan', opts: ['Dukungan PSS', 'Layanan Kesehatan Umum', 'Pos Kesehatan', 'Ambulans', 'Pemeriksaan Kesehatan'] }}
      fields={[
        { k:'tanggal', label:'Tanggal', type:'date', req:true },
        { k:'jenis_layanan', label:'Jenis Layanan', type:'text', req:true, ph:'Dukungan PSS, Pos Kesehatan, dll', saran:['Dukungan PSS', 'Layanan Kesehatan Umum', 'Pos Kesehatan', 'Ambulans', 'Pemeriksaan Kesehatan'] },
        { k:'kota', label:'Kota/Kabupaten', type:'text', req:true, saran:NAMA_WILAYAH },
        { k:'lokasi', label:'Lokasi / Posko', type:'text', ph:'Nama posko, nagari, atau lokasi' },
        { k:'jumlah_penerima', label:'Jumlah Penerima Layanan (orang)', type:'number' },
        { k:'jumlah_relawan', label:'Jumlah Relawan / Tenaga yang Bertugas', type:'number' },
        { k:'keterangan', label:'Keterangan', type:'text' },
        { k:'file_bukti_url', label:'Foto Kegiatan — opsional', type:'file', bucket:'bukti-logistik' },
      ]}
      columns={[
        { k:'tanggal', label:'Tanggal' },
        { k:'jenis_layanan', label:'Jenis Layanan' },
        { k:'kota', label:'Kota/Kab' },
        { k:'lokasi', label:'Lokasi' },
        { k:'jumlah_penerima', label:'Penerima', num:true },
        { k:'jumlah_relawan', label:'Relawan', num:true },
        { k:'file_bukti_url', label:'Foto', file:true },
      ]}
    />
  )
}
