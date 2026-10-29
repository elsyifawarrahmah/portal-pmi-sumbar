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

      const [logistik, air, donasi, barangKeluar, pengadaan, users, layananKes, kegBersih, unitPerl, alatKes, orgData, pengData, relData, unitOrg, udok, pRen, pJad, pSdm, kLay, kKap, kPas, kRen, kAkt, kPet] = await Promise.all([
        supabase.from('logistik').select('*, profiles:petugas_id(nama_lengkap)').order('tanggal', { ascending: false }),
        supabase.from('distribusi_air').select('*, profiles:petugas_id(nama_lengkap)').order('tanggal', { ascending: false }),
        supabase.from('donasi').select('*, profiles:petugas_id(nama_lengkap)').order('tanggal', { ascending: false }),
        supabase.from('barang_keluar').select('*, petugas:petugas_id(nama_lengkap)').order('tanggal', { ascending: false }),
        supabase.from('pengadaan').select('*, petugas:petugas_id(nama_lengkap)').order('tanggal_pengajuan', { ascending: false }),
        supabase.from('profiles').select('nama_lengkap, email, role, last_seen'),
        supabase.from('layanan_kesehatan').select('*, profiles:petugas_id(nama_lengkap)').order('tanggal', { ascending: false }),
        supabase.from('kegiatan_bersih').select('*, profiles:petugas_id(nama_lengkap)').order('tanggal', { ascending: false }),
        supabase.from('unit_perlengkapan').select('*, profiles:petugas_id(nama_lengkap)').order('created_at', { ascending: false }),
        supabase.from('alat_kesehatan').select('*, profiles:petugas_id(nama_lengkap)').order('created_at', { ascending: false }),
        supabase.from('pmi_organisasi').select('*').order('urut'),
        supabase.from('pmi_pengurus').select('kelompok, jabatan, nama, urut, pmi_organisasi(nama, urut, masa_bakti)'),
        supabase.from('relawan').select('*, pmi_organisasi(nama, urut)'),
        supabase.from('pmi_unit').select('*, pmi_organisasi(nama)'),
        supabase.from('unit_dokumen').select('*').order('tanggal', { ascending: false }),
        supabase.from('pusdiklat_rencana').select('*').order('tahun').order('bulan'),
        supabase.from('pusdiklat_jadwal').select('*').order('tgl_mulai'),
        supabase.from('pusdiklat_sdm_terlatih').select('*').order('tahun').order('bulan'),
        supabase.from('klinik_layanan').select('*'),
        supabase.from('klinik_kapitasi').select('*').order('tahun').order('bulan'),
        supabase.from('klinik_pasien_harian').select('*').order('tanggal').range(0, 9999),
        supabase.from('klinik_rencana_giat').select('*').order('tahun').order('bulan'),
        supabase.from('klinik_aktivitas').select('*').order('tanggal'),
        supabase.from('klinik_jadwal_petugas').select('*').order('minggu_mulai'),
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
      }))), 'Distribusi Barang Bantuan')

      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((pengadaan.data||[]).map(r => ({
        'Tgl Diajukan': r.tanggal_pengajuan, 'Barang': r.jenis_barang, 'Jumlah Dibutuhkan': r.jumlah_dibutuhkan,
        'Jumlah Diterima': r.jumlah_diterima, 'Alasan': r.alasan, 'Pemasok': r.pemasok, 'Status': r.status,
        'Diajukan Oleh': r.petugas?.nama_lengkap||'',
      }))), 'Pengadaan')

      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((layananKes.data||[]).map(r => ({
        'Tanggal': r.tanggal, 'Jenis Layanan': r.jenis_layanan, 'Kota/Kab': r.kota, 'Lokasi': r.lokasi || '',
        'Jumlah Penerima': r.jumlah_penerima ?? '', 'Jumlah Relawan': r.jumlah_relawan ?? '', 'Keterangan': r.keterangan || '',
        'Petugas': r.profiles?.nama_lengkap || '', 'Link Foto': r.file_bukti_url || '',
      }))), 'Layanan Kesehatan')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((kegBersih.data||[]).map(r => ({
        'Tanggal': r.tanggal, 'Kegiatan': r.jenis_kegiatan, 'Kota/Kab': r.kota, 'Lokasi': r.lokasi || '',
        'Jumlah Relawan': r.jumlah_relawan ?? '', 'Terlayani': r.jumlah_terlayani, 'Satuan': r.satuan || '', 'Keterangan': r.keterangan || '',
        'Petugas': r.profiles?.nama_lengkap || '', 'Link Foto': r.file_bukti_url || '',
      }))), 'Bersih-Bersih')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((unitPerl.data||[]).map(r => ({
        'Kategori': r.kategori, 'Unit / Perlengkapan': r.nama_unit, 'Jumlah': r.jumlah, 'Satuan': r.satuan || '',
        'Kondisi': r.kondisi || '', 'Lokasi Simpan': r.lokasi_simpan || '', 'Keterangan': r.keterangan || '',
        'Petugas': r.profiles?.nama_lengkap || '', 'Link Foto': r.file_bukti_url || '',
      }))), 'Produksi Unit')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((alatKes.data||[]).map(r => ({
        'Jenis': r.jenis, 'Jumlah': r.jumlah, 'Merk': r.merk || '', 'Satuan': r.satuan || '',
        'E.D (Kedaluwarsa)': r.tanggal_ed || '', 'Petugas': r.profiles?.nama_lengkap || '',
      }))), 'Alat Kesehatan')
      // Organisasi & Relawan (kosong bila tabel belum dibuat)
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((orgData.data||[]).map(r => ({
        'No': r.urut, 'Kab/Kota': r.nama, 'Ketua': r.ketua || '', 'Masa Bakti': r.masa_bakti || '', 'Tgl SK': r.tgl_sk || '', 'Ket': r.keterangan || '',
        'Kode Wilayah': r.kode_wilayah || '', 'Alamat Markas': r.markas_alamat || '', 'Telp/Fax/HP': r.markas_telp || '', 'E-mail': (r.markas_email || '').replace(/\n/g, '; '),
      }))), 'Organisasi (Ketua & Markas)')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((pengData.data||[])
        .sort((a, b) => ((a.pmi_organisasi?.urut || 0) - (b.pmi_organisasi?.urut || 0)) || ((a.urut || 0) - (b.urut || 0)))
        .map(r => ({ 'Kab/Kota': r.pmi_organisasi?.nama || '', 'Masa Bakti': r.pmi_organisasi?.masa_bakti || '', 'Kelompok': r.kelompok, 'Jabatan': r.jabatan, 'Nama': r.nama }))), 'Kepengurusan')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((relData.data||[])
        .sort((a, b) => (a.pmi_organisasi?.urut || 0) - (b.pmi_organisasi?.urut || 0))
        .map(r => ({ 'Kab/Kota': r.pmi_organisasi?.nama || '', 'KSR': r.ksr, 'TSR': r.tsr, 'DDS': r.dds, 'PMR Mula': r.pmr_mula, 'PMR Madya': r.pmr_madya, 'PMR Wira': r.pmr_wira, 'Diperbarui': r.diperbarui || '' }))), 'Relawan')
      XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet((unitOrg.data||[]).map(r => ({
        'Wilayah': r.pmi_organisasi?.nama || '', 'Jenis': r.jenis, 'Nama': r.nama, 'Alamat': r.alamat || '', 'Telepon': r.telp || '', 'E-mail': r.email || '', 'Penanggung Jawab': r.penanggung_jawab || '', 'Keterangan': r.keterangan || '',
      }))), 'Pusdiklat & Klinik')

      // Pusdiklat & Klinik (kosong bila tabel belum dibuat)
      const bln = n => ['Januari','Februari','Maret','April','Mei','Juni','Juli','Agustus','September','Oktober','November','Desember'][n - 1] || ''
      const dok = (unit, jenis) => (udok.data || []).filter(r => r.unit === unit && r.jenis === jenis)
      const sheet = (rows, nama) => XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), nama)
      sheet(dok('pusdiklat', 'sk').map(r => ({ 'Nomor': r.nomor || '', 'Perihal': r.judul, 'Tanggal': r.tanggal || '', 'Tautan': r.link || '', 'Keterangan': r.keterangan || '' })), 'Pusdiklat - SK')
      sheet((pRen.data || []).map(r => ({ 'Tahun': r.tahun, 'Bulan': bln(r.bulan), 'Pelatihan': r.nama_pelatihan, 'Sasaran': r.sasaran || '', 'Target Peserta': r.target_peserta ?? '', 'Keterangan': r.keterangan || '' })), 'Pusdiklat - Rencana')
      sheet((pJad.data || []).map(r => ({ 'Mulai': r.tgl_mulai, 'Selesai': r.tgl_selesai || '', 'Pelatihan': r.nama_pelatihan, 'Tempat': r.tempat || '', 'Peserta': r.jumlah_peserta ?? '', 'Status': r.status || '', 'Keterangan': r.keterangan || '' })), 'Pusdiklat - Jadwal')
      sheet((pSdm.data || []).map(r => ({ 'Tahun': r.tahun, 'Bulan': bln(r.bulan), 'SDM Terlatih': r.jumlah_sdm, 'Keterangan': r.keterangan || '' })), 'Pusdiklat - SDM Terlatih')
      sheet(dok('pusdiklat', 'materi').map(r => ({ 'Kategori': r.kategori || '', 'Judul Materi': r.judul, 'Tanggal': r.tanggal || '', 'Tautan': r.link || '', 'Keterangan': r.keterangan || '' })), 'Pusdiklat - Materi')
      sheet(dok('klinik', 'sk').map(r => ({ 'Nomor': r.nomor || '', 'Perihal': r.judul, 'Tanggal': r.tanggal || '', 'Tautan': r.link || '', 'Keterangan': r.keterangan || '' })), 'Klinik - SK')
      sheet((kLay.data || []).map(r => ({ 'Jenis Layanan': r.jenis, 'Tersedia': r.aktif ? 'Ya' : 'Tidak', 'Keterangan': r.keterangan || '' })), 'Klinik - Jenis Layanan')
      sheet((kKap.data || []).map(r => ({ 'Tahun': r.tahun, 'Bulan': bln(r.bulan), 'Peserta': r.jumlah_peserta ?? '', 'Total Kapitasi (Rp)': r.total_rupiah ?? '', 'Keterangan': r.keterangan || '' })), 'Klinik - Kapitasi')
      sheet((kPas.data || []).map(r => ({ 'Tanggal': r.tanggal, 'Layanan': r.jenis_layanan, 'Kunjungan': r.kunjungan, 'Rujukan': r.rujukan, 'Keterangan': r.keterangan || '' })), 'Klinik - Laporan Harian')
      sheet((kRen.data || []).map(r => ({ 'Tahun': r.tahun, 'Bulan': bln(r.bulan), 'Kegiatan': r.kegiatan, 'Penanggung Jawab': r.penanggung_jawab || '', 'Keterangan': r.keterangan || '' })), 'Klinik - Rencana Giat')
      sheet((kAkt.data || []).map(r => ({ 'Tanggal': r.tanggal, 'Aktivitas': r.kegiatan, 'Penanggung Jawab': r.penanggung_jawab || '', 'Keterangan': r.keterangan || '' })), 'Klinik - Aktivitas')
      sheet((kPet.data || []).map(r => ({ 'Awal Minggu': r.minggu_mulai, 'Hari': r.hari, 'Shift': r.shift || '', 'Petugas': r.nama, 'Peran': r.peran || '' })), 'Klinik - Jadwal Petugas')
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
            
            <h3 style={{margin:'0 0 8px'}}>Backup Lengkap Portal Logistik</h3>
            <p style={{color:'var(--ink-soft)', fontSize:13.5, maxWidth:440, margin:'0 auto 20px'}}>
              File Excel ini berisi sheet: Logistik Masuk, Distribusi Air, Donasi Barang, Distribusi Barang Bantuan, Pengadaan, Layanan Kesehatan, Bersih-Bersih, Produksi Unit, Alat Kesehatan, Organisasi (Ketua & Markas), Kepengurusan, Relawan, Pusdiklat & Klinik (lama), 5 sheet Pusdiklat, 7 sheet Klinik, dan Data User.
              Simpan file ini secara berkala di komputer/Google Drive kantor sebagai cadangan.
            </p>
            <button className="btn btn-primary" onClick={buatBackup} disabled={loading} style={{padding:'12px 28px', fontSize:14}}>
              {loading ? 'Menyiapkan file...' : 'Buat & Unduh Backup Sekarang'}
            </button>
            {lastBackup && (
              <div style={{marginTop:14, fontSize:12.5, color:'var(--stock)'}}>
                ✓ Backup terakhir dibuat: {lastBackup.toLocaleString('id-ID')}
              </div>
            )}
          </div>
        </div>

        <div style={{fontSize:12, color:'var(--ink-soft)', background:'var(--cream)', padding:12, borderRadius:10}}>
          <strong>Saran:</strong> jadwalkan 1 orang untuk klik tombol ini setiap minggu, lalu simpan filenya di Google Drive bersama PMI Sumbar. Ini jaga-jaga kalau ada masalah teknis di server.
        </div>
      </div>
    </div>
  )
}
