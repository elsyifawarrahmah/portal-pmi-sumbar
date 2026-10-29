'use client'
import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

// Ikon garis (gaya seragam, warna mengikuti teks)
const IKON = {
  home: <><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></>,
  peta: <><polygon points="1 6 1 22 8 18 16 22 23 18 23 2 16 6 8 2 1 6"/><line x1="8" y1="2" x2="8" y2="18"/><line x1="16" y1="6" x2="16" y2="22"/></>,
  paket: <><line x1="16.5" y1="9.4" x2="7.5" y2="4.21"/><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/><polyline points="3.27 6.96 12 12.01 20.73 6.96"/><line x1="12" y1="22.08" x2="12" y2="12"/></>,
  alat: <path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94l-3.76 3.76z"/>,
  hati: <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/>,
  tetes: <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/>,
  gedung: <><rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01M12 6h.01M16 6h.01M8 10h.01M12 10h.01M16 10h.01M8 14h.01M12 14h.01M16 14h.01"/></>,
  orang2: <><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></>,
  atur: <><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/></>,
}
function Ikon({ nama }) {
  return (
    <svg className="nav-ico" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
      {IKON[nama]}
    </svg>
  )
}

// Menu: tautan langsung + kelompok yang bisa dibuka/ditutup (hanya kelompok aktif yang terbuka otomatis)
const MENU = [
  { href: '/dashboard', label: 'Dashboard', icon: 'home' },
  { href: '/infografis', label: 'Infografis Bencana', icon: 'peta' },
  { href: '/organisasi', label: 'Organisasi', icon: 'gedung' },
  { href: '/relawan', label: 'Relawan', icon: 'orang2' },
  { grup: 'Logistik', icon: 'paket', items: [
    { href: '/logistik', label: 'Logistik Barang Masuk' },
    { href: '/pengadaan', label: 'Pengadaan Barang' },
    { href: '/stok', label: 'Stok Barang' },
    { href: '/donasi', label: 'Donasi Barang' },
  ] },
  { href: '/produksi', label: 'Produksi', icon: 'alat' },
  { grup: 'Layanan PMI', icon: 'hati', items: [
    { href: '/layanan-kesehatan', label: 'Layanan Kesehatan' },
    { href: '/alat-kesehatan', label: 'Alat Kesehatan' },
    { href: '/barang-keluar', label: 'Distribusi Barang Bantuan' },
  ] },
  { grup: 'Bersih-Bersih', icon: 'tetes', items: [
    { href: '/bersih-bersih', label: 'Semua Bersih-Bersih' },
    { href: '/bersih/aksi-bersih', label: 'Aksi Bersih' },
    { href: '/air', label: 'Air Bersih (Distribusi)' },
    { href: '/bersih/sanitasi', label: 'Sanitasi (MCK)' },
    { href: '/bersih/promosi-kebersihan', label: 'Promosi Kebersihan' },
  ] },
  { grup: 'Pengaturan', icon: 'atur', items: [
    { href: '/data-user', label: 'Data User' },
    { href: '/backup', label: 'Backup Data' },
  ] },
]

const useIsoLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [collapsed, setCollapsed] = useState(false)
  const [mobOpen, setMobOpen] = useState(false) // laci menu di HP
  const path = pathname || ''
  const grupAktif = MENU.find(x => x.grup && x.items.some(i => i.href === path))?.grup
  const [buka, setBuka] = useState(grupAktif ? [grupAktif] : [])
  const navRef = useRef(null)

  // Ingat posisi scroll menu & status menu tertutup antar halaman, pastikan menu aktif terlihat
  useIsoLayoutEffect(() => {
    try {
      if (sessionStorage.getItem('navCollapsed') === '1') setCollapsed(true)
      const y = Number(sessionStorage.getItem('navScroll') || 0)
      if (navRef.current) {
        navRef.current.scrollTop = y
        const aktif = navRef.current.querySelector('a.active')
        if (aktif) aktif.scrollIntoView({ block: 'nearest' })
      }
    } catch (e) {}
  }, [])

  function toggleGrup(g) { setBuka(b => b.includes(g) ? b.filter(x => x !== g) : [...b, g]) }
  const diHp = () => typeof window !== 'undefined' && window.matchMedia('(max-width: 768px)').matches
  function toggleMenu() {
    if (diHp()) { setMobOpen(o => !o); return }
    setCollapsed(c => { try { sessionStorage.setItem('navCollapsed', c ? '0' : '1') } catch (e) {} return !c })
  }

  // HP: laci menu menutup sendiri setelah pindah halaman, bisa ditutup dengan tombol Esc, dan halaman di belakangnya tidak ikut bergulir
  useEffect(() => { setMobOpen(false) }, [pathname])
  useEffect(() => {
    if (!mobOpen) return
    const tutupEsc = e => { if (e.key === 'Escape') setMobOpen(false) }
    document.addEventListener('keydown', tutupEsc)
    const lama = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => { document.removeEventListener('keydown', tutupEsc); document.body.style.overflow = lama }
  }, [mobOpen])

  useEffect(() => {
    // catat "terakhir online" tiap 30 detik selagi aplikasi terbuka
    async function ping() {
      const { data: userData } = await supabase.auth.getUser()
      if (userData?.user) {
        await supabase.from('profiles').update({ last_seen: new Date().toISOString() }).eq('id', userData.user.id)
      }
    }
    ping()
    const interval = setInterval(ping, 30000)
    return () => clearInterval(interval)
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <>
      <button className="hamburger-btn" onClick={toggleMenu} aria-label="Buka/tutup menu" aria-expanded={mobOpen}><span></span></button>
      <div className={`sidebar-scrim${mobOpen ? ' show' : ''}`} onClick={() => setMobOpen(false)} aria-hidden="true" />
      <div className={`sidebar${collapsed ? ' collapsed' : ''}${mobOpen ? ' mobile-open' : ''}`}>
      <div className="brand">
        <div className="brand-logo">
          <img src="/logo-pmi.png?v=3" alt="Lambang Palang Merah Indonesia" width={40} height={40} />
          <div className="brand-name">Palang<br />Merah<br />Indonesia</div>
          <div className="brand-vline" />
          <div className="brand-prov">Provinsi<br />Sumatera Barat</div>
        </div>
        <div style={{fontSize:10.5,opacity:.65,marginTop:10,letterSpacing:'.03em',textTransform:'uppercase'}}>Portal Data Digital</div>
      </div>
      <div className="nav" ref={navRef} onScroll={e => { try { sessionStorage.setItem('navScroll', String(e.currentTarget.scrollTop)) } catch (err) {} }}>
        {MENU.map(m => m.grup ? (
          <div key={m.grup} className={`nav-group${buka.includes(m.grup) ? ' open' : ''}${m.grup === grupAktif ? ' has-active' : ''}`}>
            <button type="button" className="nav-group-btn" onClick={() => toggleGrup(m.grup)} aria-expanded={buka.includes(m.grup)}>
              <Ikon nama={m.icon} /><span>{m.grup}</span><span className="chev">▸</span>
            </button>
            <div className="nav-sub">
              {m.items.map(i => (
                <Link key={i.href} href={i.href} className={path === i.href ? 'active' : ''}>{i.label}</Link>
              ))}
            </div>
          </div>
        ) : (
          <Link key={m.href} href={m.href} className={path === m.href || path.startsWith(m.href + '/') ? 'active' : ''}>
            <Ikon nama={m.icon} />{m.label}
          </Link>
        ))}
      </div>
      <div className="sidebar-foot">
        <button onClick={handleLogout} className="btn btn-ghost" style={{width:'100%',marginBottom:8}}>Keluar</button>
        Data tersimpan di database resmi PMI Sumbar.
      </div>
      </div>
    </>
  )
}
