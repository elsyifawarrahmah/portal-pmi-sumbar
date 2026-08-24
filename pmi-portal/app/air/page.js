'use client'
import DataPage from '@/components/DataPage'

export default function AirPage() {
  return (
    <DataPage
      table="distribusi_air"
      title="Rekap Distribusi Air Bersih"
      desc="Pengganti digital papan REKAP DISTRIBUSI AIR BERSIH."
      fields={[
        { k:'tanggal', label:'Tanggal', type:'date', req:true },
        { k:'no_kendaraan', label:'Nomor Kendaraan', type:'text', req:true, ph:'B 9461 SFA' },
        { k:'kota', label:'Kota/Kabupaten', type:'text', req:true },
        { k:'driver', label:'Driver/Asisten', type:'text' },
        { k:'penerima_manfaat', label:'Penerima Manfaat', type:'text', ph:'jumlah jiwa / keterangan' },
        { k:'liter', label:'Jumlah Liter', type:'number', req:true },
        { k:'status', label:'Status Kendaraan', type:'select', opts:['Beroperasi','Perbaikan','Rusak'] },
      ]}
      columns={[
        { k:'tanggal', label:'Tanggal' },
        { k:'no_kendaraan', label:'No. Kendaraan' },
        { k:'kota', label:'Kota/Kab' },
        { k:'driver', label:'Driver' },
        { k:'penerima_manfaat', label:'Penerima Manfaat' },
        { k:'liter', label:'Liter', num:true },
        { k:'status', label:'Status' },
      ]}
    />
  )
}
