'use client'
import { usePathname, useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

const LINKS = [
  { href: '/dashboard', label: 'Dashboard' },
  { href: '/logistik', label: 'Logistik Barang Masuk' },
  { href: '/air', label: 'Distribusi Air Bersih' },
  { href: '/donasi', label: 'Donasi Barang' },
]

export default function Sidebar() {
  const pathname = usePathname()
  const router = useRouter()
  const supabase = createClient()

  async function handleLogout() {
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  return (
    <div className="sidebar">
      <div className="brand">
        <div className="cross">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="none"><path d="M10 3H14V10H21V14H14V21H10V14H3V10H10V3Z" fill="#C8102E"/></svg>
        </div>
        <div className="title">Portal Data Digital</div>
        <div className="sub">PMI Provinsi Sumatera Barat</div>
      </div>
      <div className="nav">
        {LINKS.map(l => (
          <a key={l.href} href={l.href} className={pathname === l.href ? 'active' : ''}>{l.label}</a>
        ))}
      </div>
      <div className="sidebar-foot">
        <button onClick={handleLogout} className="btn btn-ghost" style={{width:'100%',marginBottom:8}}>Keluar</button>
        Data tersimpan di database resmi PMI Sumbar.
      </div>
    </div>
  )
}
