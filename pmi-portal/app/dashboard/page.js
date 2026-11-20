'use client'
// Beranda gaya SATRIA: sapaan, kotak menu besar yang mudah disentuh di HP, ringkasan angka, grafik, dan aktivitas terbaru.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import Sidebar, { MENU, IKON } from '@/components/Sidebar'
import { Bar, Doughnut } from 'react-chartjs-2'
import { Chart as ChartJS, BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend } from 'chart.js'
ChartJS.register(BarElement, ArcElement, CategoryScale, LinearScale, Tooltip, Legend)

// Ikon tambahan khusus kotak menu (gaya garis yang sama dengan menu samping)
const EXTRA = {
  tumpuk: <><polygon points="12 2 2 7 12 12 22 7 12 2" /><polyline points="2 17 12 22 22 17" /><polyline points="2 12 12 17 22 12" /></>,
  truk: <><rect x="1" y="3" width="15" height="13" /><polygon points="16 8 20 8 23 11 23 16 16 16 16 8" /><circle cx="5.5" cy="18.5" r="2.5" /><circle cx="18.5" cy="18.5" r="2.5" /></>,
}
const ikon = n => IKON[n] || EXTRA[n] || IKON.paket

// Kotak menu utama (yang paling sering dipakai petugas). Sisanya otomatis masuk "Menu Lainnya".
const INTI = [
  { href: '/infografis', label: 'Infografis Bencana', ikon: 'peta', tone: '#1F5E99', pale: '#E3EBF8' },
  { href: '/organisasi', label: 'Organisasi', ikon: 'gedung', tone: '#6B3FB5', pale: '#EBE3FB' },
  { href: '/relawan', label: 'Relawan', ikon: 'orang2', tone: '#C2570C', pale: '#FEE9D8' },
  { href: '/logistik', label: 'Logistik', ikon: 'paket', tone: '#2E7D32', pale: '#E5F1E7' },
  { href: '/stok', label: 'Stok Barang', ikon: 'tumpuk', tone: '#B7791F', pale: '#FDEFD5' },
  { href: '/barang-keluar', label: 'Distribusi Bantuan', ikon: 'truk', tone: '#B3261E', pale: '#FAE8E6' },
  { href: '/air', label: 'Air Bersih', ikon: 'tetes', tone: '#1F5E99', pale: '#E3EBF8' },
  { href: '/layanan-kesehatan', label: 'Layanan Kesehatan', ikon: 'hati', tone: '#B3261E', pale: '#FAE8E6' },
]
const PALET = [['#1F5E99', '#E3EBF8'], ['#2E7D32', '#E5F1E7'], ['#C2570C', '#FEE9D8'], ['#B7791F', '#FDEFD5'], ['#6B3FB5', '#EBE3FB'], ['#B3261E', '#FAE8E6']]

const sapaan = () => { const j = new Date().getHours(); return j < 11 ? 'Selamat pagi' : j < 15 ? 'Selamat siang' : j < 18 ? 'Selamat sore' : 'Selamat malam' }
const rp = n => n >= 1e9 ? `Rp ${(n / 1e9).toLocaleString('id-ID', { maximumFractionDigits: 1 })} M` : n >= 1e6 ? `Rp ${(n / 1e6).toLocaleString('id-ID', { maximumFractionDigits: 1 })} jt` : `Rp ${n.toLocaleString('id-ID')}`

function Angka({ href, angka, judul, ket, warna, title }) {
  return (
    <Link href={href} className="angka-kotak" style={{ '--warna': warna }} title={title}>
      <div className="angka-nilai">{angka}</div>
      <div className="angka-judul">{judul}</div>
      <div className="angka-ket">{ket}</div>
    </Link>
  )
}

export default function Dashboard() {
  const supabase = createClient()
  const [logistik, setLogistik] = useState([])
  const [air, setAir] = useState([])
  const [donasi, setDonasi] = useState([])
  const [profil, setProfil] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => { load() }, [])

  async function load() {
    const [l, a, d, u] = await Promise.all([
      supabase.from('logistik').select('*, profiles(nama_lengkap)').order('created_at', { ascending: false }),
      supabase.from('distribusi_air').select('*, profiles(nama_lengkap)').order('created_at', { ascending: false }),
      supabase.from('donasi').select('*, profiles(nama_lengkap)').order('created_at', { ascending: false }),
      supabase.auth.getUser(),
    ])
    setLogistik(l.data || []); setAir(a.data || []); setDonasi(d.data || [])
    const uid = u.data?.user?.id
    if (uid) {
      const p = await supabase.from('profiles').select('nama_lengkap, role').eq('id', uid).maybeSingle()
      setProfil(p.data || null)
    }
    setLoading(false)
  }

  const isAdmin = profil?.role === 'admin'
  const totalLiter = air.reduce((s, r) => s + (Number(r.liter) || 0), 0)
  const totalDonasi = donasi.reduce((s, r) => s + (Number(r.nilai_bantuan) || 0), 0)
  const donaturSet = new Set([...logistik.map(r => r.donatur), ...donasi.map(r => r.donatur)].filter(Boolean))

  const barangMap = {}
  logistik.forEach(r => { barangMap[r.jenis_barang] = (barangMap[r.jenis_barang] || 0) + Number(r.jumlah || 0) })
  const topBarang = Object.entries(barangMap).sort((a, b) => b[1] - a[1]).slice(0, 8)

  const kotaMap = {}
  air.forEach(r => { kotaMap[r.kota] = (kotaMap[r.kota] || 0) + Number(r.liter || 0) })
  const topKota = Object.entries(kotaMap).sort((a, b) => b[1] - a[1]).slice(0, 6)

  const recent = [
    ...logistik.map(r => ({ ...r, sec: 'Logistik', warna: '#2E7D32', sum: `${r.jenis_barang} — ${Number(r.jumlah).toLocaleString('id-ID')} ${r.satuan}` })),
    ...air.map(r => ({ ...r, sec: 'Air Bersih', warna: '#1F5E99', sum: `${r.kota} — ${Number(r.liter).toLocaleString('id-ID')} liter` })),
    ...donasi.map(r => ({ ...r, sec: 'Donasi', warna: '#B7791F', sum: `${r.donatur} — ${r.jenis_donasi}` })),
  ].sort((a, b) => new Date(b.created_at) - new Date(a.created_at)).slice(0, 8)

  // "Menu Lainnya": semua menu selain yang sudah jadi kotak utama (menu Pengaturan hanya untuk admin)
  const dipakai = new Set(INTI.map(t => t.href))
  const lain = []
  MENU.forEach(m => {
    if (m.grup) {
      if (m.grup === 'Pengaturan' && !isAdmin) return
      m.items.forEach(i => { if (!dipakai.has(i.href)) lain.push({ href: i.href, label: i.label.replace(' (Distribusi)', '').replace(' (MCK)', ''), ikon: m.icon }) })
    } else if (m.href !== '/dashboard' && !dipakai.has(m.href)) lain.push({ href: m.href, label: m.label, ikon: m.icon })
  })
  const lainBerwarna = lain.map((t, i) => ({ ...t, tone: PALET[i % 6][0], pale: PALET[i % 6][1] }))

  const kartu = t => (
    <Link key={t.href} href={t.href} className="tile" style={{ '--tone': t.tone, '--pale': t.pale }}>
      <span className="tile-ikon"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ikon(t.ikon)}</svg></span>
      <span className="tile-label">{t.label}</span>
    </Link>
  )

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="beranda">
          <div className="hero">
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div className="hero-sapa">{sapaan()}</div>
              <h1>Halo, {(profil?.nama_lengkap || '...').split(' ')[0]}</h1>
              <p>{profil ? (isAdmin ? 'Admin' : 'Petugas') : ''}{profil ? ' · ' : ''}Portal Data Digital</p>
            </div>
            <img src="/logo-pmi.png?v=3" alt="Lambang Palang Merah Indonesia" className="hero-logo" />
          </div>

          <div className="tiles">{INTI.map(kartu)}</div>
          {lainBerwarna.length > 0 && <>
            <h2 className="tiles-judul">Menu Lainnya</h2>
            <div className="tiles tiles-lain">{lainBerwarna.map(kartu)}</div>
          </>}

          <h2 className="tiles-judul">Ringkasan Operasi</h2>
          <div className="angka-grid">
            <Angka href="/logistik" angka={loading ? '…' : logistik.length.toLocaleString('id-ID')} judul="Item logistik" ket="Barang yang tercatat masuk" warna="#2D6A4F" />
            <Angka href="/air" angka={loading ? '…' : totalLiter.toLocaleString('id-ID')} judul="Air bersih (liter)" ket="Total yang didistribusikan" warna="#1F6FB2" />
            <Angka href="/donasi" angka={loading ? '…' : rp(totalDonasi)} judul="Nilai donasi" ket="Total nilai bantuan" warna="#B5820E" title={`Rp ${totalDonasi.toLocaleString('id-ID')}`} />
            <Angka href="/donasi" angka={loading ? '…' : donaturSet.size.toLocaleString('id-ID')} judul="Donatur" ket="Pemberi bantuan tercatat" warna="#C8102E" />
          </div>

          <div className="stack-hp" style={{ display: 'grid', gridTemplateColumns: '1.3fr 1fr', gap: 16 }}>
            <div className="panel"><div className="panel-head"><h3>Top 8 Barang Logistik</h3></div>
              <div className="panel-body">
                {topBarang.length === 0 ? <div className="kosong">Belum ada data logistik.</div> :
                  <div className="grafik"><Bar data={{ labels: topBarang.map(x => x[0]), datasets: [{ data: topBarang.map(x => x[1]), backgroundColor: '#2D6A4F', borderRadius: 6 }] }} options={{ maintainAspectRatio: false, plugins: { legend: { display: false } } }} /></div>}
              </div>
            </div>
            <div className="panel"><div className="panel-head"><h3>Air per Kota/Kab</h3></div>
              <div className="panel-body">
                {topKota.length === 0 ? <div className="kosong">Belum ada data distribusi air.</div> :
                  <div className="grafik"><Doughnut data={{ labels: topKota.map(x => x[0]), datasets: [{ data: topKota.map(x => x[1]), backgroundColor: ['#1F6FB2', '#4C9BD9', '#8BC1E8', '#B5820E', '#2D6A4F', '#C8102E'] }] }} options={{ maintainAspectRatio: false, plugins: { legend: { position: 'bottom' } } }} /></div>}
              </div>
            </div>
          </div>

          <h2 className="tiles-judul">Aktivitas Input Terbaru</h2>
          {loading ? <div className="kosong">Memuat...</div> : recent.length === 0 ? <div className="kosong">Belum ada aktivitas.</div> : (
            <div className="aktivitas">
              {recent.map(r => (
                <div key={r.sec + r.id} className="akt-baris" style={{ '--warna': r.warna }}>
                  <div className="akt-atas"><span className="akt-chip">{r.sec}</span><span className="akt-waktu">{new Date(r.created_at).toLocaleString('id-ID', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}</span></div>
                  <div className="akt-isi">{r.sum}</div>
                  <div className="akt-oleh">oleh {r.profiles?.nama_lengkap || '-'}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
