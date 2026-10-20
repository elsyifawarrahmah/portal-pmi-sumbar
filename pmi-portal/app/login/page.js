'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'

export default function LoginPage() {
  const [mode, setMode] = useState('signin') // 'signin' | 'signup'
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [nama, setNama] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()
  const supabase = createClient()

  async function handleSubmit(e) {
    e.preventDefault()
    setError(''); setLoading(true)
    if (mode === 'signin') {
      const { error } = await supabase.auth.signInWithPassword({ email, password })
      if (error) { setError('Email atau password salah.'); setLoading(false); return }
    } else {
      const { error } = await supabase.auth.signUp({
        email, password,
        options: { data: { nama_lengkap: nama } }
      })
      if (error) { setError(error.message); setLoading(false); return }
    }
    router.push('/dashboard')
    router.refresh()
  }

  return (
    <div className="login-wrap">
      <div className="login-card">
        <div style={{marginBottom:18}}>
          <div className="brand-logo" style={{gap:10}}>
            <img src="/logo-pmi.png?v=3" alt="Lambang Palang Merah Indonesia" width={52} height={52} />
            <div className="brand-name" style={{color:'#000',fontSize:19}}>Palang<br />Merah<br />Indonesia</div>
            <div className="brand-vline" style={{color:'#000'}} />
            <div className="brand-prov" style={{color:'#000',fontSize:14.5}}>Provinsi<br />Sumatera Barat</div>
          </div>
          <div style={{fontSize:10,color:'var(--ink-soft)',textTransform:'uppercase',letterSpacing:'.04em',marginTop:10}}>Portal Data Digital</div>
        </div>
        <h1 style={{fontSize:19,margin:'0 0 4px'}}>{mode==='signin' ? 'Masuk Akun Petugas' : 'Daftar Akun Petugas Baru'}</h1>
        <p style={{fontSize:13,color:'var(--ink-soft)',margin:'0 0 18px'}}>
          {mode==='signin' ? 'Gunakan email yang terdaftar untuk tim PMI.' : 'Akun baru otomatis hanya bisa melihat data (viewer).'}
        </p>
        {error && <div className="error-box">{error}</div>}
        <form onSubmit={handleSubmit}>
          {mode==='signup' && (
            <div className="field">
              <label>Nama Lengkap</label>
              <input value={nama} onChange={e=>setNama(e.target.value)} required placeholder="cth: Rina Andayani" />
            </div>
          )}
          <div className="field">
            <label>Email</label>
            <input type="email" value={email} onChange={e=>setEmail(e.target.value)} required placeholder="nama@pmisumbar.org" />
          </div>
          <div className="field">
            <label>Password</label>
            <input type="password" value={password} onChange={e=>setPassword(e.target.value)} required minLength={6} placeholder="minimal 6 karakter" />
          </div>
          <button className="btn btn-primary" style={{width:'100%',marginTop:6}} disabled={loading}>
            {loading ? 'Memproses...' : (mode==='signin' ? 'Masuk' : 'Daftar')}
          </button>
        </form>
        <div style={{textAlign:'center',marginTop:16,fontSize:12.5}}>
          {mode==='signin' ? (
            <>Belum punya akun? <a href="#" onClick={e=>{e.preventDefault();setMode('signup');setError('')}} style={{color:'var(--pmi-red)',fontWeight:600}}>Daftar di sini</a></>
          ) : (
            <>Sudah punya akun? <a href="#" onClick={e=>{e.preventDefault();setMode('signin');setError('')}} style={{color:'var(--pmi-red)',fontWeight:600}}>Masuk di sini</a></>
          )}
        </div>
      </div>
    </div>
  )
}
