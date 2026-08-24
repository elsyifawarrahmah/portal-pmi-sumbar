'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Sidebar from '@/components/Sidebar'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
ChartJS.register(BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend)

export default function Dashboard() {
  const supabase = createClient()
  const [logistik, setLogistik] = useState([])
  const [air, setAir] = useState([])
  const [donasi, setDonasi] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const [l, a, d] = await Promise.all([
      supabase.from('logistik').select('*, profiles(nama_lengkap)').order('created_at', { ascending: false }),
      supabase.from('distribusi_air').select('*, profiles(nama_lengkap)').order('created_at', { ascending: false }),
      supabase.from('donasi').select('*, profiles(nama_lengkap)').order('created_at', { ascending: false }),
    ])
    setLogistik(l.data || []); setAir(a.data || []); setDonasi(d.data || [])
    setLoading(false)
  }

  const totalLiter = air.reduce((s, r) => s + (Number(r.liter) || 0), 0)
  const totalDonasi = donasi.reduce((s, r) => s + (Number(r.nilai_bantuan) || 0), 0)
  const donaturSet = new Set([...logistik.map(r=>r.donatur), ...donasi.map(r=>r.donatur)].filter(Boolean))

  const barangMap = {}
  logistik.forEach(r => { barangMap[r.jenis_barang] = (barangMap[r.jenis_barang]||0) + Number(r.jumlah||0) })
  const topBarang = Object.entries(barangMap).sort((a,b)=>b[1]-a[1]).slice(0,8)

  const kotaMap = {}
  air.forEach(r => { kotaMap[r.kota] = (kotaMap[r.kota]||0) + Number(r.liter||0) })
  const topKota = Object.entries(kotaMap).sort((a,b)=>b[1]-a[1]).slice(0,6)

  const recent = [
    ...logistik.map(r=>({...r, sec:'Logistik', sum:`${r.jenis_barang} — ${Number(r.jumlah).toLocaleString('id-ID')} ${r.satuan}`})),
    ...air.map(r=>({...r, sec:'Air Bersih', sum:`${r.kota} — ${Number(r.liter).toLocaleString('id-ID')} liter`})),
    ...donasi.map(r=>({...r, sec:'Donasi', sum:`${r.donatur} — ${r.jenis_donasi}`})),
  ].sort((a,b)=>new Date(b.created_at)-new Date(a.created_at)).slice(0,8)

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div><h1>Ringkasan Operasi</h1><p className="desc">Data langsung dari database — otomatis update tiap ada input baru.</p></div>
        </div>
        <div className="grid4">
          <div className="stat" style={{'--accent':'var(--stock)'}}><div className="lbl">Total Item Logistik</div><div className="val">{logistik.length}</div></div>
          <div className="stat" style={{'--accent':'var(--water)'}}><div className="lbl">Total Air (Liter)</div><div className="val">{totalLiter.toLocaleString('id-ID')}</div></div>
          <div className="stat" style={{'--accent':'var(--gold)'}}><div className="lbl">Total Nilai Donasi</div><div className="val">Rp {totalDonasi.toLocaleString('id-ID')}</div></div>
          <div className="stat" style={{'--accent':'var(--pmi-red)'}}><div className="lbl">Total Donatur</div><div className="val">{donaturSet.size}</div></div>
        </div>

        <div style={{display:'grid',gridTemplateColumns:'1.3fr 1fr',gap:16}}>
          <div className="panel"><div className="panel-head"><h3>Top 8 Barang Logistik</h3></div>
            <div className="panel-body"><Bar data={{labels:topBarang.map(x=>x[0]), datasets:[{data:topBarang.map(x=>x[1]), backgroundColor:'#2D6A4F', borderRadius:6}]}} options={{plugins:{legend:{display:false}}}} /></div>
          </div>
          <div className="panel"><div className="panel-head"><h3>Air per Kota/Kab</h3></div>
            <div className="panel-body"><Doughnut data={{labels:topKota.map(x=>x[0]), datasets:[{data:topKota.map(x=>x[1]), backgroundColor:['#1F6FB2','#4C9BD9','#8BC1E8','#B5820E','#2D6A4F','#C8102E']}]}} options={{plugins:{legend:{position:'bottom'}}}} /></div>
          </div>
        </div>

        <div className="panel">
          <div className="panel-head"><h3>Aktivitas Input Terbaru</h3></div>
          <div style={{overflowX:'auto'}}>
            <table>
              <thead><tr><th>Waktu</th><th>Kategori</th><th>Ringkasan</th><th>Petugas</th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={4} style={{textAlign:'center',padding:24}}>Memuat...</td></tr> :
                recent.length===0 ? <tr><td colSpan={4} style={{textAlign:'center',padding:24,color:'var(--ink-soft)'}}>Belum ada aktivitas.</td></tr> :
                recent.map(r => <tr key={r.id}><td className="mono">{new Date(r.created_at).toLocaleString('id-ID')}</td><td>{r.sec}</td><td>{r.sum}</td><td>{r.profiles?.nama_lengkap||'-'}</td></tr>)}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  )
}
