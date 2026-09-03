'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Sidebar from '@/components/Sidebar'

export default function BarangKeluarPage() {
  const supabase = createClient()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({})
  const [error, setError] = useState('')
  const [myRole, setMyRole] = useState('petugas')
  const [uploading, setUploading] = useState(false)

  const isAdmin = myRole === 'admin'

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    if (userData?.user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userData.user.id).single()
      if (profile) setMyRole(profile.role)
    }
    const { data } = await supabase.from('barang_keluar').select('*, petugas:petugas_id(nama_lengkap), penyetuju:disetujui_oleh(nama_lengkap)').order('created_at', { ascending: false })
    setRows(data || [])
    setLoading(false)
  }

  async function handleUploadBukti(e) {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    const filename = `${Date.now()}-${file.name.replace(/[^a-zA-Z0-9.\-_]/g, '_')}`
    const { error: uploadErr } = await supabase.storage.from('bukti-barang-keluar').upload(filename, file)
    if (uploadErr) { setError('Gagal upload file: ' + uploadErr.message); setUploading(false); return }
    const { data: urlData } = supabase.storage.from('bukti-barang-keluar').getPublicUrl(filename)
    setForm(f => ({ ...f, file_bukti_url: urlData.publicUrl, file_bukti_nama: file.name }))
    setUploading(false)
  }

  async function handleAjukan() {
    if (!form.tanggal || !form.jenis_barang || !form.jumlah || !form.satuan || !form.tujuan_penerima) {
      setError('Lengkapi semua field wajib.'); return
    }
    const { data: userData } = await supabase.auth.getUser()
    const { file_bukti_nama, ...payload } = form
    const { error: err } = await supabase.from('barang_keluar').insert({ ...payload, petugas_id: userData.user.id })
    if (err) { setError(err.message); return }
    setShowModal(false); setForm({}); setError('')
    load()
  }

  async function updateStatus(id, status) {
    const { data: userData } = await supabase.auth.getUser()
    const { error } = await supabase.from('barang_keluar').update({
      status, disetujui_oleh: userData.user.id, updated_at: new Date().toISOString()
    }).eq('id', id)
    if (error) { alert('Gagal: ' + error.message); return }
    load()
  }

  const filtered = rows.filter(r => JSON.stringify(r).toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div><h1>Barang Keluar</h1><p className="desc">Pengeluaran barang dari gudang, dilengkapi Surat Permintaan Barang.</p></div>
          <button className="btn btn-primary" onClick={() => { setForm({tanggal: new Date().toISOString().slice(0,10)}); setError(''); setShowModal(true) }}>+ Ajukan Barang Keluar</button>
        </div>

        <div className="panel">
          <div className="panel-head">
            <input placeholder="Cari barang / tujuan..." value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:260}} />
          </div>
          <div style={{overflowX:'auto'}}>
            <table>
              <thead><tr><th>Tanggal</th><th>Barang</th><th>Jumlah</th><th>Tujuan/Penerima</th><th>No. Surat Permintaan</th><th>Bukti</th><th>Status</th><th>Diajukan Oleh</th>{isAdmin && <th>Aksi</th>}</tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={9} style={{textAlign:'center',padding:30}}>Memuat...</td></tr> :
                filtered.length===0 ? <tr><td colSpan={9} style={{textAlign:'center',padding:30,color:'var(--ink-soft)'}}>Belum ada pengajuan barang keluar.</td></tr> :
                filtered.map(r => (
                  <tr key={r.id}>
                    <td>{r.tanggal}</td>
                    <td><strong>{r.jenis_barang}</strong></td>
                    <td className="num">{Number(r.jumlah).toLocaleString('id-ID')} {r.satuan}</td>
                    <td>{r.tujuan_penerima}</td>
                    <td className="mono">{r.nomor_surat_permintaan || '-'}</td>
                    <td>{r.file_bukti_url ? <a href={r.file_bukti_url} target="_blank" rel="noreferrer" style={{color:'var(--pmi-red)',fontWeight:600}}>📎 Lihat</a> : '-'}</td>
                    <td><span className="tag" style={statusStyle(r.status)}>{r.status}</span></td>
                    <td>{r.petugas?.nama_lengkap || '-'}</td>
                    {isAdmin && (
                      <td>
                        {r.status === 'Diajukan' ? (
                          <div style={{display:'flex',gap:4}}>
                            <button className="btn btn-primary" style={{padding:'4px 8px',fontSize:12}} onClick={()=>updateStatus(r.id,'Disetujui')}>Setujui</button>
                            <button className="btn btn-ghost" style={{padding:'4px 8px',fontSize:12}} onClick={()=>updateStatus(r.id,'Ditolak')}>Tolak</button>
                          </div>
                        ) : (
                          <span style={{fontSize:11.5,color:'var(--ink-soft)'}}>oleh {r.penyetuju?.nama_lengkap || '-'}</span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50}} onClick={e=>{if(e.target===e.currentTarget)setShowModal(false)}}>
          <div style={{background:'#fff',borderRadius:16,width:'100%',maxWidth:460,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{padding:'18px 22px',borderBottom:'1px solid var(--line)',display:'flex',justifyContent:'space-between'}}>
              <h3 style={{margin:0}}>Ajukan Barang Keluar</h3>
              <button onClick={()=>setShowModal(false)} style={{border:'none',background:'none',cursor:'pointer',fontSize:16}}>✕</button>
            </div>
            <div style={{padding:'20px 22px'}}>
              {error && <div className="error-box">{error}</div>}
              <div className="field"><label>Tanggal</label><input type="date" value={form.tanggal||''} onChange={e=>setForm({...form,tanggal:e.target.value})} /></div>
              <div className="field"><label>Jenis Barang</label><input value={form.jenis_barang||''} onChange={e=>setForm({...form,jenis_barang:e.target.value})} placeholder="Sama seperti nama di Logistik Masuk, cth: Gula" /></div>
              <div className="field"><label>Jumlah</label><input type="number" value={form.jumlah||''} onChange={e=>setForm({...form,jumlah:e.target.value})} /></div>
              <div className="field"><label>Satuan</label><input value={form.satuan||''} onChange={e=>setForm({...form,satuan:e.target.value})} placeholder="kg / pcs / karung" /></div>
              <div className="field"><label>Tujuan / Penerima</label><input value={form.tujuan_penerima||''} onChange={e=>setForm({...form,tujuan_penerima:e.target.value})} placeholder="Posko Bencana Padang Pariaman" /></div>
              <div className="field"><label>Nomor Surat Permintaan Barang</label><input value={form.nomor_surat_permintaan||''} onChange={e=>setForm({...form,nomor_surat_permintaan:e.target.value})} placeholder="opsional" /></div>
              <div className="field">
                <label>Foto/PDF Surat Permintaan — opsional</label>
                <input type="file" accept=".pdf,.jpg,.jpeg,.png" onChange={handleUploadBukti} />
                {uploading && <div style={{fontSize:12,color:'var(--ink-soft)',marginTop:4}}>Mengunggah...</div>}
                {form.file_bukti_nama && <div style={{fontSize:12,color:'var(--stock)',marginTop:4}}>✓ {form.file_bukti_nama} terunggah</div>}
              </div>
              <div style={{fontSize:12,color:'var(--ink-soft)',background:'var(--cream)',padding:10,borderRadius:8}}>
                ℹ️ Barang baru akan dikeluarkan dari stok setelah diajukan <strong>disetujui admin</strong>.
              </div>
            </div>
            <div style={{padding:'14px 22px',borderTop:'1px solid var(--line)',display:'flex',justifyContent:'flex-end',gap:8}}>
              <button className="btn btn-ghost" onClick={()=>setShowModal(false)}>Batal</button>
              <button className="btn btn-primary" onClick={handleAjukan} disabled={uploading}>Ajukan</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function statusStyle(s) {
  if (s === 'Disetujui') return { background: 'var(--stock-bg)', color: 'var(--stock)' }
  if (s === 'Ditolak') return { background: '#FBE7E7', color: '#B3261E' }
  return { background: 'var(--gold-bg)', color: 'var(--gold)' }
}
