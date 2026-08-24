'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Sidebar from './Sidebar'

export default function DataPage({ table, title, desc, fields, columns }) {
  const supabase = createClient()
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState(null)
  const [form, setForm] = useState({})
  const [myRole, setMyRole] = useState('petugas')
  const [error, setError] = useState('')

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    if (userData?.user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userData.user.id).single()
      if (profile) setMyRole(profile.role)
    }
    const { data, error } = await supabase.from(table).select('*, profiles(nama_lengkap)').order('created_at', { ascending: false })
    if (!error) setRows(data || [])
    setLoading(false)
  }

  function openAdd() { setEditing(null); setForm({}); setError(''); setShowModal(true) }
  function openEdit(row) { setEditing(row); setForm(row); setError(''); setShowModal(true) }
  function closeModal() { setShowModal(false) }

  async function handleSave() {
    for (const f of fields) {
      if (f.req && !form[f.k]) { setError('Lengkapi field wajib: ' + f.label); return }
    }
    const payload = {}
    fields.forEach(f => { payload[f.k] = form[f.k] ?? null })

    if (editing) {
      const { error } = await supabase.from(table).update(payload).eq('id', editing.id)
      if (error) { setError(error.message); return }
    } else {
      const { data: userData } = await supabase.auth.getUser()
      payload.petugas_id = userData.user.id
      const { error } = await supabase.from(table).insert(payload)
      if (error) { setError(error.message); return }
    }
    setShowModal(false)
    load()
  }

  async function handleDelete(id) {
    if (!confirm('Hapus data ini? Tindakan tidak bisa dibatalkan.')) return
    const { error } = await supabase.from(table).delete().eq('id', id)
    if (error) { alert('Gagal hapus: ' + error.message + (myRole !== 'admin' ? ' (hanya admin yang bisa menghapus)' : '')); return }
    load()
  }

  function exportCSV() {
    const header = fields.map(f => f.label).join(';')
    const csvRows = filtered.map(r => fields.map(f => String(r[f.k] ?? '').replace(/;/g, ',')).join(';'))
    const csv = '\uFEFF' + [header, ...csvRows].join('\n')
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = `pmi-${table}-${new Date().toISOString().slice(0,10)}.csv`
    a.click(); URL.revokeObjectURL(url)
  }

  const filtered = rows.filter(r => JSON.stringify(r).toLowerCase().includes(search.toLowerCase()))

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div><h1>{title}</h1><p className="desc">{desc}</p></div>
          <button className="btn btn-primary" onClick={openAdd}>+ Tambah Data</button>
        </div>
        <div className="panel">
          <div className="panel-head">
            <input placeholder="Cari..." value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:260}} />
            <button className="btn btn-ghost" onClick={exportCSV}>⬇ Export Excel (CSV)</button>
          </div>
          <div style={{overflowX:'auto'}}>
            <table>
              <thead><tr>{columns.map(c=><th key={c.k}>{c.label}</th>)}<th>Petugas</th><th></th></tr></thead>
              <tbody>
                {loading ? (
                  <tr><td colSpan={columns.length+2} style={{textAlign:'center',padding:30,color:'var(--ink-soft)'}}>Memuat data...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={columns.length+2} style={{textAlign:'center',padding:30,color:'var(--ink-soft)'}}>Belum ada data. Klik "Tambah Data" untuk mulai.</td></tr>
                ) : filtered.map(r => (
                  <tr key={r.id}>
                    {columns.map(c => (
                      <td key={c.k} className={c.num ? 'num' : ''}>
                        {c.num ? Number(r[c.k]||0).toLocaleString('id-ID') : (r[c.k] ?? '-')}
                      </td>
                    ))}
                    <td>{r.profiles?.nama_lengkap || '-'}</td>
                    <td>
                      <button className="btn btn-ghost" style={{padding:'4px 8px',marginRight:4}} onClick={()=>openEdit(r)}>Edit</button>
                      <button className="btn btn-ghost" style={{padding:'4px 8px'}} onClick={()=>handleDelete(r.id)}>Hapus</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div style={{position:'fixed',inset:0,background:'rgba(0,0,0,.45)',display:'flex',alignItems:'center',justifyContent:'center',zIndex:50}} onClick={e=>{if(e.target===e.currentTarget)closeModal()}}>
          <div style={{background:'#fff',borderRadius:16,width:'100%',maxWidth:440,maxHeight:'90vh',overflowY:'auto'}}>
            <div style={{padding:'18px 22px',borderBottom:'1px solid var(--line)',display:'flex',justifyContent:'space-between'}}>
              <h3 style={{margin:0}}>{editing ? 'Edit Data' : 'Tambah Data'}</h3>
              <button onClick={closeModal} style={{border:'none',background:'none',cursor:'pointer',fontSize:16}}>✕</button>
            </div>
            <div style={{padding:'20px 22px'}}>
              {error && <div className="error-box">{error}</div>}
              {fields.map(f => (
                <div className="field" key={f.k}>
                  <label>{f.label}</label>
                  {f.type === 'select' ? (
                    <select value={form[f.k]||''} onChange={e=>setForm({...form,[f.k]:e.target.value})}>
                      {f.opts.map(o=><option key={o}>{o}</option>)}
                    </select>
                  ) : (
                    <input type={f.type} value={form[f.k]||''} placeholder={f.ph||''} onChange={e=>setForm({...form,[f.k]:e.target.value})} />
                  )}
                </div>
              ))}
            </div>
            <div style={{padding:'14px 22px',borderTop:'1px solid var(--line)',display:'flex',justifyContent:'flex-end',gap:8}}>
              <button className="btn btn-ghost" onClick={closeModal}>Batal</button>
              <button className="btn btn-primary" onClick={handleSave}>Simpan Data</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
