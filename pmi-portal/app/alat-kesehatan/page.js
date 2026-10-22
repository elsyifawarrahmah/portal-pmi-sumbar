'use client'
import DataPage from '@/components/DataPage'

// Peringatan kedaluwarsa dari kolom E.D
function statusED(tanggal) {
  if (!tanggal) return <span style={{ color: 'var(--ink-soft)' }}>-</span>
  const sisa = Math.ceil((new Date(tanggal + 'T23:59:59') - new Date()) / 86400000)
  if (sisa < 0) return <span className="tag" style={{ background: '#FBE7E7', color: '#B3261E' }}>Kedaluwarsa</span>
  if (sisa <= 90) return <span className="tag" style={{ background: 'var(--gold-bg)', color: 'var(--gold)' }}>Sisa {sisa} hari</span>
  return <span className="tag" style={{ background: 'var(--stock-bg)', color: 'var(--stock)' }}>Aman</span>
}

export default function AlatKesehatanPage() {
  return (
    <DataPage
      table="alat_kesehatan"
      title="Alat Kesehatan"
      desc="Daftar alat kesehatan PMI: jenis, jumlah, merk, satuan, dan tanggal kedaluwarsa (E.D)."
      fields={[
        { k:'jenis', label:'Jenis', type:'text', req:true, ph:'Tensimeter, termometer, kasa steril, dll' },
        { k:'jumlah', label:'Jumlah', type:'number', req:true },
        { k:'merk', label:'Merk', type:'text' },
        { k:'satuan', label:'Satuan', type:'text', ph:'pcs / box / botol', saran:['pcs', 'box', 'buah', 'set', 'botol', 'strip', 'ampul'] },
        { k:'tanggal_ed', label:'E.D (Tanggal Kedaluwarsa)', type:'date' },
      ]}
      columns={[
        { k:'jenis', label:'Jenis' },
        { k:'jumlah', label:'Jlh', num:true },
        { k:'merk', label:'Merk' },
        { k:'satuan', label:'Satuan' },
        { k:'tanggal_ed', label:'E.D' },
        { k:'_status_ed', label:'Status E.D', render: r => statusED(r.tanggal_ed) },
      ]}
    />
  )
}
