'use client'
import DataPage from '@/components/DataPage'

export default function ProduksiPage() {
  return (
    <DataPage
      table="unit_perlengkapan"
      title="Produksi — Unit & Perlengkapan"
      desc="Seluruh unit dan perlengkapan PMI: logistik, lapangan, dan kesehatan."
      filterField={{ k: 'kategori', label: 'Semua kategori', opts: ['Logistik', 'Lapangan', 'Kesehatan'] }}
      fields={[
        { k:'kategori', label:'Kategori', type:'select', opts:['Logistik', 'Lapangan', 'Kesehatan'], req:true },
        { k:'nama_unit', label:'Nama Unit / Perlengkapan', type:'text', req:true, ph:'Tenda keluarga, truk tangki air, tandu, dll' },
        { k:'jumlah', label:'Jumlah', type:'number', req:true },
        { k:'satuan', label:'Satuan', type:'text', ph:'unit / buah / set', saran:['unit', 'buah', 'set', 'pasang', 'lembar'] },
        { k:'kondisi', label:'Kondisi', type:'select', opts:['Baik', 'Rusak Ringan', 'Rusak Berat'] },
        { k:'lokasi_simpan', label:'Lokasi Simpan', type:'text', ph:'Gudang / posko / kendaraan' },
        { k:'keterangan', label:'Keterangan', type:'text' },
        { k:'file_bukti_url', label:'Foto — opsional', type:'file', bucket:'bukti-logistik' },
      ]}
      columns={[
        { k:'kategori', label:'Kategori' },
        { k:'nama_unit', label:'Unit / Perlengkapan' },
        { k:'jumlah', label:'Jumlah', num:true },
        { k:'satuan', label:'Satuan' },
        { k:'kondisi', label:'Kondisi' },
        { k:'lokasi_simpan', label:'Lokasi Simpan' },
        { k:'file_bukti_url', label:'Foto', file:true },
      ]}
    />
  )
}
