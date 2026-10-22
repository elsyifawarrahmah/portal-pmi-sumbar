'use client'
import { useState, useEffect, useLayoutEffect, useRef } from 'react'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

// Menu: tautan langsung + kelompok yang bisa dibuka/ditutup (hanya kelompok aktif yang terbuka otomatis)
const MENU = [
  { href: '/dashboard', label: 'Dashboard', icon: '🏠' },
  { href: '/infografis', label: 'Infografis Bencana', icon: '🗺️' },
  { grup: 'Logistik', icon: '📦', items: [
    { href: '/logistik', label: 'Logistik Barang Masuk' },
    { href: '/pengadaan', label: 'Pengadaan Barang' },
    { href: '/stok', label: 'Stok Barang' },
    { href: '/donasi', label: 'Donasi Barang' },
  ] },
  { href: '/produksi', label: 'Produksi', icon: '🧰' },
  { grup: 'Layanan PMI', icon: '🩺', items: [
    { href: '/layanan-kesehatan', label: 'Layanan Kesehatan' },
    { href: '/alat-kesehatan', label: 'Alat Kesehatan' },
    { href: '/barang-keluar', label: 'Distribusi Barang Bantuan' },
  ] },
  { grup: 'Bersih-Bersih', icon: '🧹', items: [
    { href: '/bersih-bersih', label: 'Semua Bersih-Bersih' },
    { href: '/bersih/aksi-bersih', label: 'Aksi Bersih' },
    { href: '/air', label: 'Air Bersih (Distribusi)' },
    { href: '/bersih/sanitasi', label: 'Sanitasi (MCK)' },
    { href: '/bersih/promosi-kebersihan', label: 'Promosi Kebersihan' },
  ] },
  { grup: 'Pengaturan', icon: '⚙️', items: [
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
  function toggleMenu() {
    setCollapsed(c => { try { sessionStorage.setItem('navCollapsed', c ? '0' : '1') } catch (e) {} return !c })
  }

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
      <button className="hamburger-btn" onClick={toggleMenu} aria-label="Buka/tutup menu"><span></span></button>
      <div className={`sidebar${collapsed ? ' collapsed' : ''}`}>
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
              <span className="nav-ico">{m.icon}</span><span>{m.grup}</span><span className="chev">▸</span>
            </button>
            <div className="nav-sub">
              {m.items.map(i => (
                <Link key={i.href} href={i.href} className={path === i.href ? 'active' : ''}>{i.label}</Link>
              ))}
            </div>
          </div>
        ) : (
          <Link key={m.href} href={m.href} className={path === m.href ? 'active' : ''}>
            <span className="nav-ico">{m.icon}</span>{m.label}
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
