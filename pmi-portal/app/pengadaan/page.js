'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Sidebar from '@/components/Sidebar'

const TAHAP = ['Diajukan', 'Disetujui', 'Sedang Dipesan', 'Barang Diterima', 'Selesai']

export default function PengadaanPage() {
  const supabase = createClient()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({})
  const [error, setError] = useState('')
  const [myRole, setMyRole] = useState('petugas')
  const [uploading, setUploading] = useState(false)
  const [showTerimaModal, setShowTerimaModal] = useState(null)
  const [terimaForm, setTerimaForm] = useState({})

  const isAdmin = myRole === 'admin'

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    if (userData?.user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userData.user.id).single()
      if (profile) setMyRole(profile.role)
    }
    const { data } = await supabase.from('pengadaan').select('*, petugas:petugas_id(nama_lengkap)').order('created_at', { ascending: false })
    setRows(data || [])
    setLoading(false)
  }

  async function uploadTo(bucket, file) {
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
    const { error: uploadErr } = await supabase.storage.from(bucket).upload(filename, file)
    if (uploadErr) throw uploadErr
    const { data: urlData } = supabase.storage.from(bucket).getPublicUrl(filename)
    return urlData.publicUrl
  }

  async function handleAjukan() {
    if (!form.jenis_barang || !form.jumlah_dibutuhkan || !form.satuan || !form.alasan) {
      setError('Lengkapi semua field wajib.'); return
    }
    const { data: userData } = await supabase.auth.getUser()
    const { error: err } = await supabase.from('pengadaan').insert({
      jenis_barang: form.jenis_barang, jumlah_dibutuhkan: form.jumlah_dibutuhkan,
      satuan: form.satuan, alasan: form.alasan, pemasok: form.pemasok || null,
      status: 'Diajukan', petugas_id: userData.user.id,
      tanggal_pengajuan: new Date().toISOString().slice(0,10),
    })
    if (err) { setError(err.message); return }
    setShowModal(false); setForm({}); setError('')
    load()
  }

  async function updateStatus(id, status) {
    await supabase.from('pengadaan').update({ status }).eq('id', id)
    load()
  }

  function openTerima(row) {
    setShowTerimaModal(row)
    setTerimaForm({ jumlah_diterima: row.jumlah_dibutuhkan })
  }

  async function handleUploadFotoTerima(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadTo('bukti-pengadaan', file)
      setTerimaForm(f => ({ ...f, foto_terima_url: url, foto_terima_nama: file.name }))
    } catch (err) { alert('Gagal upload: ' + err.message) }
    setUploading(false)
  }

  async function handleUploadNota(e, forForm) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      const url = await uploadTo('bukti-pengadaan', file)
      forForm(f => ({ ...f, nota_pembelian_url: url, nota_pembelian_nama: file.name }))
    } catch (err) { alert('Gagal upload: ' + err.message) }
    setUploading(false)
  }

  async function konfirmasiTerima() {
    if (!terimaForm.jumlah_diterima) { alert('Isi jumlah yang diterima.'); return }
    const row = showTerimaModal
    const { data: userData } = await supabase.auth.getUser()

    // 1. tandai pengadaan selesai + simpan bukti
    await supabase.from('pengadaan').update({
      status: 'Barang Diterima',
      jumlah_diterima: terimaForm.jumlah_diterima,
      foto_terima_url: terimaForm.foto_terima_url || null,
      tanggal_diterima: new Date().toISOString().slice(0,10),
    }).eq('id', row.id)

    // 2. otomatis catat sebagai Barang Masuk di Logistik, biar Stok ikut nambah
    await supabase.from('logistik').insert({
      tanggal: new Date().toISOString().slice(0,10),
      jenis_barang: row.jenis_barang,
      jumlah: terimaForm.jumlah_diterima,
      satuan: row.satuan,
      donatur: `Pengadaan${row.pemasok ? ' — ' + row.pemasok : ''}`,
      file_bukti_url: terimaForm.foto_terima_url || null,
      petugas_id: userData.user.id,
    })

    await supabase.from('pengadaan').update({ status: 'Selesai' }).eq('id', row.id)

    setShowTerimaModal(null); setTerimaForm({})
    load()
  }

  const filtered = rows.filter(r => JSON.stringify(r).toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div><h1>Pengadaan Barang</h1><p className="desc">Ajukan pembelian/pengadaan barang baru saat stok habis atau tidak cukup.</p></div>
          <button className="btn btn-primary" onClick={() => { setForm({}); setError(''); setShowModal(true) }}>+ Ajukan Pengadaan</button>
        </div>

        <div className="panel">
          <div className="panel-head">
            <input placeholder="Cari barang..." value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:260}} />
          </div>
          <div style={{overflowX:'auto'}}>
            <table>
              <thead><tr><th>Tgl Diajukan</th><th>Barang</th><th>Jumlah Dibutuhkan</th><th>Alasan</th><th>Pemasok</th><th>Status</th><th>Diajukan Oleh</th><th>Aksi</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={8} style={{textAlign:'center',padding:30}}>Memuat...</td></tr> :
                filtered.length===0 ? <tr><td colSpan={8} style={{textAlign:'center',padding:30,color:'var(--ink-soft)'}}>Belum ada pengajuan pengadaan.</td></tr> :
                filtered.map(r => (
                  <tr key={r.id}>
                    <td>{r.tanggal_pengajuan}</td>
                    <td><strong>{r.jenis_barang}</strong></td>
                    <td className="num">{Number(r.jumlah_dibutuhkan).toLocaleString('id-ID')} {r.satuan}</td>
                    <td>{r.alasan}</td>
                    <td>{r.pemasok || '-'}</td>
                    <td><span className="tag" style={statusStyle(r.status)}>{r.status}</span></td>
                    <td>{r.petugas?.nama_lengkap || '-'}</td>
                    <td>
                      {isAdmin && r.status === 'Diajukan' && (
                        <div style={{display:'flex',gap:4}}>
                          <button className="btn btn-primary" style={{padding:'4px 8px',fontSize:12}} onClick={()=>updateStatus(r.id,'Disetujui')}>Setujui</button>
                          <button className="btn btn-ghost" style={{padding:'4px 8px',fontSize:12}} onClick={()=>updateStatus(r.id,'Ditolak')}>Tolak</button>
                        </div>
                      )}
                      {isAdmin && r.status === 'Disetujui' && (
                        <button className="btn btn-ghost" style={{padding:'4px 8px',fontSize:12}} onClick={()=>updateStatus(r.id,'Sedang Dipesan')}>Tandai Sedang Dipesan</button>
                      )}
                      {isAdmin && r.status === 'Sedang Dipesan' && (
                        <button className="btn btn-primary" style={{padding:'4px 8px',fontSize:12}} onClick={()=>openTerima(r)}>Barang Sudah Datang</button>
                      )}
                      {(r.status === 'Barang Diterima' || r.status === 'Selesai') && (
                        <span style={{fontSize:11.5,color:'var(--stock)',fontWeight:600}}>✓ Sudah masuk stok</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal Ajukan */}
      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50}} onClick={e=>{if(e.target===e.currentTarget)setShowModal(false)}}>
          <div style={{background:'#fff',borderRadius:16,width:'100%',maxWidth:440,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{padding:'18px 22px',borderBottom:'1px solid var(--line)',display:'flex',justifyContent:'space-between'}}>
              <h3 style={{margin:0}}>Ajukan Pengadaan Barang</h3>
              <button onClick={()=>setShowModal(false)} style={{border:'none',background:'none',cursor:'pointer',fontSize:16}}>✕</button>
            </div>
            <div style={{padding:'20px 22px'}}>
              {error && <div className="error-box">{error}</div>}
              <div className="field"><label>Jenis Barang</label><input value={form.jenis_barang||''} onChange={e=>setForm({...form,jenis_barang:e.target.value})} placeholder="Sama seperti nama di Stok, cth: Gula" /></div>
              <div className="field"><label>Jumlah Dibutuhkan</label><input type="number" value={form.jumlah_dibutuhkan||''} onChange={e=>setForm({...form,jumlah_dibutuhkan:e.target.value})} /></div>
              <div className="field"><label>Satuan</label><input value={form.satuan||''} onChange={e=>setForm({...form,satuan:e.target.value})} placeholder="kg / pcs / karung" /></div>
              <div className="field"><label>Alasan Pengadaan</label><input value={form.alasan||''} onChange={e=>setForm({...form,alasan:e.target.value})} placeholder="Stok habis / permintaan tidak terpenuhi" /></div>
              <div className="field"><label>Pemasok/Vendor — opsional</label><input value={form.pemasok||''} onChange={e=>setForm({...form,pemasok:e.target.value})} /></div>
            </div>
            <div style={{padding:'14px 22px',borderTop:'1px solid var(--line)',display:'flex',justifyContent:'flex-end',gap:8}}>
              <button className="btn btn-ghost" onClick={()=>setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleAjukan}>Ajukan</button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Konfirmasi Barang Diterima */}
      {showTerimaModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50}} onClick={e=>{if(e.target===e.currentTarget)setShowTerimaModal(null)}}>
          <div style={{background:'#fff',borderRadius:16,width:'100%',maxWidth:440,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{padding:'18px 22px',borderBottom:'1px solid var(--line)',display:'flex',justifyContent:'space-between'}}>
              <h3 style={{margin:0}}>Konfirmasi Barang Diterima</h3>
              <button onClick={()=>setShowTerimaModal(null)} style={{border:'none',background:'none',cursor:'pointer',fontSize:16}}>✕</button>
            </div>
            <div style={{padding:'20px 22px'}}>
              <div style={{fontSize:13,marginBottom:14}}><strong>{showTerimaModal.jenis_barang}</strong> — dipesan {Number(showTerimaModal.jumlah_dibutuhkan).toLocaleString('id-ID')} {showTerimaModal.satuan}</div>
              <div className="field"><label>Jumlah yang Benar-Benar Diterima</label><input type="number" value={terimaForm.jumlah_diterima||''} onChange={e=>setTerimaForm({...terimaForm,jumlah_diterima:e.target.value})} /></div>
              <div className="field">
                <label>Foto Bukti Barang Fisik Diterima</label>
                <input type="file" accept=".jpg,.jpeg,.png,.pdf" onChange={handleUploadFotoTerima} />
                {uploading && <div style={{fontSize:12,color:'var(--ink-soft)',marginTop:4}}>Mengunggah...</div>}
                {terimaForm.foto_terima_nama && <div style={{fontSize:12,color:'var(--stock)',marginTop:4}}>✓ {terimaForm.foto_terima_nama} terunggah</div>}
              </div>
              <div style={{fontSize:12,color:'var(--ink-soft)',background:'var(--cream)',padding:10,borderRadius:8}}>
                ℹ️ Setelah dikonfirmasi, barang ini <strong>otomatis tercatat di Logistik Barang Masuk</strong> dan Stok akan bertambah.
              </div>
            </div>
            <div style={{padding:'14px 22px',borderTop:'1px solid var(--line)',display:'flex',justifyContent:'flex-end',gap:8}}>
              <button className="btn btn-ghost" onClick={()=>setShowTerimaModal(null)}>Batal</button>
              <button className="btn btn-primary" onClick={konfirmasiTerima} disabled={uploading}>Konfirmasi & Masukkan ke Stok</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function statusStyle(s) {
  if (s === 'Selesai' || s === 'Barang Diterima') return { background: 'var(--stock-bg)', color: 'var(--stock)' }
  if (s === 'Ditolak') return { background: '#FBE7E7', color: '#B3261E' }
  if (s === 'Sedang Dipesan') return { background: 'var(--water-bg)', color: 'var(--water)' }
  if (s === 'Disetujui') return { background: 'var(--gold-bg)', color: 'var(--gold)' }
  return { background: 'var(--cream)', color: 'var(--ink-soft)' }
}
