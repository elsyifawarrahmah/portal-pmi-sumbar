'use client'
import { useState, useEffect } from 'react'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/infografis', label: 'Infografis Bencana' },
  { section: 'Logistik' },
  { href: '/logistik', label: 'Logistik Barang Masuk' },
  { href: '/pengadaan', label: 'Pengadaan Barang' },
  { href: '/stok', label: 'Stok Barang' },
  { href: '/donasi', label: 'Donasi Barang' },
  { section: 'Produksi' },
  { href: '/produksi', label: 'Unit & Perlengkapan' },
  { section: 'Layanan PMI' },
  { href: '/layanan-kesehatan', label: 'Layanan Kesehatan' },
  { href: '/barang-keluar', label: 'Distribusi Barang Bantuan' },
  { section: 'Bersih-Bersih' },
  { href: '/bersih-bersih', label: 'Semua Bersih-Bersih' },
  { href: '/bersih/aksi-bersih', label: 'Aksi Bersih' },
  { href: '/air', label: 'Air Bersih (Distribusi)' },
  { href: '/bersih/sanitasi', label: 'Sanitasi (MCK)' },
  { href: '/bersih/promosi-kebersihan', label: 'Promosi Kebersihan' },
  { section: 'Pengaturan' },
  { href: '/data-user', label: 'Data User' },
  { href: '/backup', label: 'Backup Data' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()
  const [collapsed, setCollapsed] = useState(false)

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
      <button className="hamburger-btn" onClick={()=>setCollapsed(c=>!c)} aria-label="Buka/tutup menu"><span></span></button>
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
      <div className="nav">
        {LINKS.map(l => l.section ? (
          <div key={l.section} className="nav-section">{l.section}</div>
        ) : (
          <a key={l.href} href={l.href} className={pathname === l.href ? 'active' : ''}>{l.label}</a>
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
