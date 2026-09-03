'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Sidebar from '@/components/Sidebar'

export default function StokPage() {
  const supabase = createClient()
  const [stok, setStok] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [myRole, setMyRole] = useState('petugas')
  const [editingAmbang, setEditingAmbang] = useState(null)
  const [ambangValue, setAmbangValue] = useState('')

  const isAdmin = myRole === 'admin'

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    if (userData?.user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userData.user.id).single()
      if (profile) setMyRole(profile.role)
    }

    const [masukRes, keluarRes, ambangRes] = await Promise.all([
      supabase.from('logistik').select('jenis_barang, jumlah, satuan'),
      supabase.from('barang_keluar').select('jenis_barang, jumlah, satuan, status').eq('status', 'Disetujui'),
      supabase.from('ambang_stok').select('*'),
    ])

    const masuk = masukRes.data || []
    const keluar = keluarRes.data || []
    const ambangList = ambangRes.data || []
    const ambangMap = {}
    ambangList.forEach(a => { ambangMap[a.jenis_barang.trim().toLowerCase()] = a })

    const map = {}
    masuk.forEach(r => {
      const key = (r.jenis_barang || '').trim().toLowerCase()
      if (!key) return
      if (!map[key]) map[key] = { nama: r.jenis_barang.trim(), satuan: r.satuan, masuk: 0, keluar: 0 }
      map[key].masuk += Number(r.jumlah) || 0
    })
    keluar.forEach(r => {
      const key = (r.jenis_barang || '').trim().toLowerCase()
      if (!key) return
      if (!map[key]) map[key] = { nama: r.jenis_barang.trim(), satuan: r.satuan, masuk: 0, keluar: 0 }
      map[key].keluar += Number(r.jumlah) || 0
    })

    const list = Object.entries(map).map(([key, v]) => ({
      key,
      nama: v.nama,
      satuan: v.satuan,
      masuk: v.masuk,
      keluar: v.keluar,
      sisa: v.masuk - v.keluar,
      ambang: ambangMap[key]?.jumlah_minimum ?? null,
    })).sort((a, b) => a.sisa - b.sisa)

    setStok(list)
    setLoading(false)
  }

  async function saveAmbang(item) {
    const val = Number(ambangValue)
    if (isNaN(val) || val < 0) { setEditingAmbang(null); return }
    await supabase.from('ambang_stok').upsert({ jenis_barang: item.nama, jumlah_minimum: val }, { onConflict: 'jenis_barang' })
    setEditingAmbang(null)
    load()
  }

  const filtered = stok.filter(r => r.nama.toLowerCase().includes(search.toLowerCase()))
  const menipis = stok.filter(r => r.ambang !== null && r.sisa <= r.ambang)

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div><h1>Stok Barang</h1><p className="desc">Dihitung otomatis: Barang Masuk − Barang Keluar (yang sudah disetujui).</p></div>
        </div>

        {menipis.length > 0 && (
          <div style={{background:'#FBE7E7',color:'#B3261E',padding:'12px 16px',borderRadius:10,fontSize:13,fontWeight:600,marginBottom:18}}>
            ⚠ {menipis.length} jenis barang stoknya sudah menipis: {menipis.map(m=>m.nama).join(', ')}
          </div>
        )}

        <div className="panel">
          <div className="panel-head">
            <input placeholder="Cari barang..." value={search} onChange={e=>setSearch(e.target.value)} style={{maxWidth:260}} />
          </div>
          <div style={{overflowX:'auto'}}>
            <table>
              <thead><tr><th>Jenis Barang</th><th>Total Masuk</th><th>Total Keluar</th><th>Sisa Stok</th><th>Satuan</th><th>Batas Minimum</th><th>Status</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={7} style={{textAlign:'center',padding:30}}>Memuat...</td></tr> :
                filtered.length===0 ? <tr><td colSpan={7} style={{textAlign:'center',padding:30,color:'var(--ink-soft)'}}>Belum ada data barang.</td></tr> :
                filtered.map(r => {
                  const isLow = r.ambang !== null && r.sisa <= r.ambang
                  const isEmpty = r.sisa <= 0
                  return (
                    <tr key={r.key}>
                      <td><strong>{r.nama}</strong></td>
                      <td className="num">{r.masuk.toLocaleString('id-ID')}</td>
                      <td className="num">{r.keluar.toLocaleString('id-ID')}</td>
                      <td className="num" style={{fontWeight:700}}>{r.sisa.toLocaleString('id-ID')}</td>
                      <td>{r.satuan}</td>
                      <td>
                        {isAdmin ? (
                          editingAmbang === r.key ? (
                            <div style={{display:'flex',gap:4}}>
                              <input type="number" value={ambangValue} onChange={e=>setAmbangValue(e.target.value)} style={{width:70,padding:'4px 6px'}} autoFocus />
                              <button className="btn btn-ghost" style={{padding:'3px 8px',fontSize:11}} onClick={()=>saveAmbang(r)}>OK</button>
                            </div>
                          ) : (
                            <button className="btn btn-ghost" style={{padding:'3px 8px',fontSize:11}} onClick={()=>{setEditingAmbang(r.key); setAmbangValue(r.ambang ?? '')}}>
                              {r.ambang !== null ? r.ambang : 'Atur'}
                            </button>
                          )
                        ) : (r.ambang ?? '-')}
                      </td>
                      <td>
                        {isEmpty ? <span className="tag" style={{background:'#FBE7E7',color:'#B3261E'}}>Habis</span> :
                         isLow ? <span className="tag" style={{background:'var(--gold-bg)',color:'var(--gold)'}}>Menipis</span> :
                         <span className="tag" style={{background:'var(--stock-bg)',color:'var(--stock)'}}>Aman</span>}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
