'use client'
import { useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Sidebar from '@/components/Sidebar'

export default function BackupPage() {
  const supabase = createClient()
  const [loading, setLoading] = useState(false)
  const [lastBackup, setLastBackup] = useState(null)

  async function buatBackup() {
    setLoading(true)
    try {
      const XLSX = await import('xlsx')

      const [logistik, air, donasi, barangKeluar, pengadaan, users] = await Promise.all([
        supabase.from('logistik').select('*, profiles:petugas_id(nama_lengkap)').order('tanggal', { ascending: false }),
        supabase.from('distribusi_air').select('*, profiles:petugas_id(nama_lengkap)').order('tanggal', { ascending: false }),
        supabase.from('donasi').select('*, profiles:petugas_id(nama_lengkap)').order('tanggal', { ascending: false }),
        supabase.from('barang_keluar').select('*, petugas:petugas_id(nama_lengkap)').order('tanggal', { ascending: false }),
        supabase.from('pengadaan').select('*, petugas:petugas_id(nama_lengkap)').order('tanggal_pengajuan', { ascending: false }),
        supabase.from('profiles').select('nama_lengkap, email, role, last_seen'),
      ])

      const wb = XLSX.utils.book_new()

      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((logistik.data||[]).map(r => ({
        'Tanggal': r.tanggal, 'Jenis Barang': r.jenis_barang, 'Jumlah': r.jumlah, 'Satuan': r.satuan,
        'Donatur': r.donatur, 'Petugas': r.profiles?.nama_lengkap||'', 'Link Bukti': r.file_bukti_url||'',
      }))), 'Logistik Masuk')

      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((air.data||[]).map(r => ({
        'Tanggal': r.tanggal, 'No Kendaraan': r.no_kendaraan, 'Kota': r.kota, 'Driver': r.driver,
        'Penerima Manfaat': r.penerima_manfaat, 'Liter': r.liter, 'Status': r.status, 'Petugas': r.profiles?.nama_lengkap||'',
      }))), 'Distribusi Air')

      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((donasi.data||[]).map(r => ({
        'Tanggal': r.tanggal, 'Donatur': r.donatur, 'Jenis Donasi': r.jenis_donasi,
        'Jumlah Unit': r.jumlah_unit, 'Nilai Bantuan': r.nilai_bantuan, 'Petugas': r.profiles?.nama_lengkap||'',
      }))), 'Donasi Barang')

      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((barangKeluar.data||[]).map(r => ({
        'Tanggal': r.tanggal, 'Barang': r.jenis_barang, 'Jumlah': r.jumlah, 'Satuan': r.satuan,
        'Tujuan': r.tujuan_penerima, 'No Surat Permintaan': r.nomor_surat_permintaan, 'Status': r.status,
        'Diajukan Oleh': r.petugas?.nama_lengkap||'',
      }))), 'Barang Keluar')

      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((pengadaan.data||[]).map(r => ({
        'Tgl Diajukan': r.tanggal_pengajuan, 'Barang': r.jenis_barang, 'Jumlah Dibutuhkan': r.jumlah_dibutuhkan,
        'Jumlah Diterima': r.jumlah_diterima, 'Alasan': r.alasan, 'Pemasok': r.pemasok, 'Status': r.status,
        'Diajukan Oleh': r.petugas?.nama_lengkap||'',
      }))), 'Pengadaan')

      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((users.data||[]).map(r => ({
        'Nama': r.nama_lengkap, 'Email': r.email, 'Role': r.role,
        'Terakhir Aktif': r.last_seen ? new Date(r.last_seen).toLocaleString('id-ID') : '',
      }))), 'Data User')

      const filename = `Backup-Portal-Logistik-PMI-Sumbar-${new Date().toISOString().slice(0,10)}.xlsx`
      XLSX.writeFile(wb, filename)
      setLastBackup(new Date())
    } catch (e) {
      alert('Gagal membuat backup: ' + e.message)
    }
    setLoading(false)
  }

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div><h1>Backup Data</h1><p className="desc">Unduh semua data sekaligus dalam satu file Excel, sebagai arsip cadangan.</p></div>
        </div>

        <div className="panel">
          <div className="panel-body" style={{padding:28, textAlign:'center'}}>
            <div style={{fontSize:40, marginBottom:10}}>🗄️</div>
            <h3 style={{margin:'0 0 8px'}}>Backup Lengkap Portal Logistik</h3>
            <p style={{color:'var(--ink-soft)', fontSize:13.5, maxWidth:440, margin:'0 auto 20px'}}>
              File Excel ini berisi 6 sheet: Logistik Masuk, Distribusi Air, Donasi Barang, Barang Keluar, Pengadaan, dan Data User.
              Simpan file ini secara berkala di komputer/Google Drive kantor sebagai cadangan.
            </p>
            <button className="btn btn-primary" onClick={buatBackup} disabled={loading} style={{padding:'12px 28px', fontSize:14}}>
              {loading ? 'Menyiapkan file...' : '⬇ Buat & Unduh Backup Sekarang'}
            </button>
            {lastBackup && (
              <div style={{marginTop:14, fontSize:12.5, color:'var(--stock)'}}>
                ✓ Backup terakhir dibuat: {lastBackup.toLocaleString('id-ID')}
              </div>
            )}
          </div>
        </div>

        <div style={{fontSize:12, color:'var(--ink-soft)', background:'var(--cream)', padding:12, borderRadius:10}}>
          💡 <strong>Saran:</strong> jadwalkan 1 orang untuk klik tombol ini setiap minggu, lalu simpan filenya di Google Drive bersama PMI Sumbar. Ini jaga-jaga kalau ada masalah teknis di server.
        </div>
      </div>
    </div>
  )
}
