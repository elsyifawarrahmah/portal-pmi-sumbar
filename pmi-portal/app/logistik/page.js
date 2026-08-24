'use client'
import DataPage from '@/components/DataPage'

export default function LogistikPage() {
  return (
    <DataPage
      table="logistik"
      title="Data Logistik — Penerimaan Barang Bantuan"
      desc="Pengganti digital papan DATA LOGISTIK Penerimaan Barang Bantuan."
      fields={[
        { k:'tanggal', label:'Tanggal', type:'date', req:true },
        { k:'jenis_barang', label:'Jenis Barang', type:'text', req:true, ph:'contoh: Gula' },
        { k:'jumlah', label:'Jumlah', type:'number', req:true },
        { k:'satuan', label:'Satuan', type:'text', req:true, ph:'kg / pcs / karung' },
        { k:'donatur', label:'Donatur (opsional)', type:'text' },
      ]}
      columns={[
        { k:'tanggal', label:'Tanggal' },
        { k:'jenis_barang', label:'Jenis Barang' },
        { k:'jumlah', label:'Jumlah', num:true },
        { k:'satuan', label:'Satuan' },
        { k:'donatur', label:'Donatur' },
      ]}
    />
  )
}
