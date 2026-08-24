'use client'
import DataPage from '@/components/DataPage'

export default function DonasiPage() {
  return (
    <DataPage
      table="donasi"
      title="Data Donasi Barang"
      desc="Pengganti digital papan DATA DONASI BARANG."
      fields={[
        { k:'tanggal', label:'Tanggal', type:'date', req:true },
        { k:'donatur', label:'Nama Donatur', type:'text', req:true, ph:'PT / Bank / Perorangan' },
        { k:'jenis_donasi', label:'Jenis Donasi', type:'text', req:true, ph:'Selimut, Hygiene Kit, dll' },
        { k:'jumlah_unit', label:'Jumlah / Satuan', type:'text', ph:'600 helai, 20 unit, dll' },
        { k:'nilai_bantuan', label:'Nilai Bantuan (Rp)', type:'number' },
      ]}
      columns={[
        { k:'tanggal', label:'Tanggal' },
        { k:'donatur', label:'Donatur' },
        { k:'jenis_donasi', label:'Jenis Donasi' },
        { k:'jumlah_unit', label:'Jumlah/Satuan' },
        { k:'nilai_bantuan', label:'Nilai Bantuan', num:true },
      ]}
    />
  )
}
