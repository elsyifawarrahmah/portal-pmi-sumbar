'use client'
// Organisasi PMI: daftar Ketua PMI se-Sumatera Barat. Klik satu baris untuk melihat kepengurusan & markasnya.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Sidebar from '@/components/Sidebar'
import Ikon from '@/components/Ikon'
import { statusMasaBakti } from '@/lib/organisasi'

const WARNA = { hijau: { background: 'var(--stock-bg)', color: 'var(--stock)' }, kuning: { background: 'var(--gold-bg)', color: 'var(--gold)' }, merah: { background: '#FBE7E7', color: '#B3261E' } }

export default function OrganisasiPage() {
  const supabase = createClient()
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [jumlahPengurus, setJumlahPengurus] = useState({})
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [search, setSearch] = useState('')
  const [modal, setModal] = useState(null)
  const [form, setForm] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  async function load() {
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    if (userData?.user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userData.user.id).single()
      setIsAdmin(profile?.role === 'admin')
    }
    const { data, error: err } = await supabase.from('pmi_organisasi').select('*').order('urut')
    if (err) {
      const belumAda = err.code === '42P01' || err.code === 'PGRST205' || /pmi_organisasi/.test(err.message || '')
      setLoadError(belumAda ? 'Tabel organisasi belum dibuat. Jalankan file supabase-migrasi-organisasi.sql di Supabase (SQL Editor) satu kali.' : 'Gagal memuat data: ' + err.message)
      setRows([])
    } else {
      setLoadError(''); setRows(data || [])
      const { data: p } = await supabase.from('pmi_pengurus').select('organisasi_id')
      const hitung = {}
      ;(p || []).forEach(x => { hitung[x.organisasi_id] = (hitung[x.organisasi_id] || 0) + 1 })
      setJumlahPengurus(hitung)
    }
    setLoading(false)
  }

  const filtered = rows.filter(r => [r.nama, r.ketua, r.masa_bakti, r.keterangan].join(' ').toLowerCase().includes(search.toLowerCase()))
  const berakhir = rows.filter(r => statusMasaBakti(r.masa_bakti)?.tone === 'kuning' || statusMasaBakti(r.masa_bakti)?.tone === 'merah').length
  const lengkap = rows.filter(r => jumlahPengurus[r.id] > 0).length

  function bukaUbah(r, e) {
    e.stopPropagation()
    setModal(r); setError('')
    setForm({ ketua: r.ketua || '', masa_bakti: r.masa_bakti || '', tgl_sk: r.tgl_sk || '', keterangan: r.keterangan || '' })
  }
  async function simpan() {
    if (!form.ketua.trim()) { setError('Nama ketua wajib diisi.'); return }
    setSaving(true)
    const { data: userData } = await supabase.auth.getUser()
    const { error: err } = await supabase.from('pmi_organisasi').update({
      ketua: form.ketua.trim(), masa_bakti: form.masa_bakti.trim() || null, tgl_sk: form.tgl_sk.trim() || null, keterangan: form.keterangan.trim() || null,
      updated_at: new Date().toISOString(), updated_by: userData?.user?.id,
    }).eq('id', modal.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    setModal(null); load()
  }

  function unduh(nama, header, baris) {
    const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
    const csv = '\uFEFF' + [header.map(esc).join(';'), ...baris.map(b => b.map(esc).join(';'))].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a'); a.href = url; a.download = `${nama}-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url)
  }
  const exportKetua = () => unduh('daftar-ketua-pmi-sumbar', ['No', 'Kab/Kota', 'Ketua', 'Masa Bakti', 'Tgl SK', 'Ket'],
    filtered.map((r, i) => [r.urut, r.nama, r.ketua, r.masa_bakti, r.tgl_sk, r.keterangan]))
  async function exportSemua() {
    const { data } = await supabase.from('pmi_pengurus').select('kelompok, jabatan, nama, urut, pmi_organisasi(nama, urut, masa_bakti)')
    const baris = (data || []).sort((a, b) => (a.pmi_organisasi?.urut - b.pmi_organisasi?.urut) || (a.urut - b.urut))
      .map(p => [p.pmi_organisasi?.nama, p.pmi_organisasi?.masa_bakti, p.kelompok, p.jabatan, p.nama])
    unduh('kepengurusan-pmi-sumbar', ['Kab/Kota', 'Masa Bakti', 'Kelompok', 'Jabatan', 'Nama'], baris)
  }

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div><h1>Organisasi PMI</h1><p className="desc">Daftar Ketua PMI se-Provinsi Sumatera Barat. Klik salah satu baris untuk melihat kepengurusan dan markasnya.</p></div>
        </div>

        {loadError && <div className="error-box" style={{ marginBottom: 18 }}>{loadError}</div>}

        <div className="org-ringkas">
          <div className="org-stat"><div className="org-stat-angka">{rows.length ? rows.length - 1 : 0}</div><div>Kab/Kota</div></div>
          <div className="org-stat"><div className="org-stat-angka">{lengkap}<span> / {rows.length}</span></div><div>Kepengurusan tercatat</div></div>
          <div className="org-stat" style={berakhir ? { borderColor: '#F1D79A', background: '#FFF9EA' } : undefined}><div className="org-stat-angka">{berakhir}</div><div>Masa bakti berakhir / segera berakhir</div></div>
        </div>

        <div className="panel">
          <div className="panel-head" style={{ flexWrap: 'wrap', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', flex: 1 }}>
              <input placeholder="Cari kab/kota atau nama ketua..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 300 }} />
            </div>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <button className="btn btn-ghost" onClick={exportSemua}>Unduh Seluruh Kepengurusan (CSV)</button>
              <button className="btn btn-ghost" onClick={exportKetua}>Export Daftar Ketua (CSV)</button>
            </div>
          </div>
          <div className="org-judul-tabel">Daftar Nama Ketua PMI Se-Provinsi Sumatera Barat</div>
          <div style={{ overflowX: 'auto' }}>
            <table>
              <thead><tr><th>No</th><th>Kab/Kota</th><th>Ketua</th><th>Masa Bakti</th><th>Tgl SK</th><th>Ket</th><th>Status</th><th></th></tr></thead>
              <tbody>
                {loading ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30 }}>Memuat...</td></tr> :
                filtered.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 30, color: 'var(--ink-soft)' }}>Tidak ada data.</td></tr> :
                filtered.map(r => {
                  const st = statusMasaBakti(r.masa_bakti)
                  return (
                    <tr key={r.id} className="org-baris-klik" onClick={() => router.push('/organisasi/' + r.slug)}>
                      <td data-label="No">{r.urut}</td>
                      <td data-label="Kab/Kota"><Link href={'/organisasi/' + r.slug} onClick={e => e.stopPropagation()} className="org-link">{r.nama}</Link>
                        {!jumlahPengurus[r.id] && <div className="org-kecil">Kepengurusan belum diisi</div>}</td>
                      <td data-label="Ketua"><strong>{r.ketua || '-'}</strong></td>
                      <td data-label="Masa Bakti">{r.masa_bakti || '-'}</td>
                      <td data-label="Tgl SK">{r.tgl_sk || '-'}</td>
                      <td data-label="Ket">{r.keterangan ? <span className="tag" style={WARNA.kuning}>{r.keterangan}</span> : '-'}</td>
                      <td data-label="Status">{st ? <span className="tag" style={WARNA[st.tone]}>{st.label}</span> : '-'}</td>
                      <td style={{ whiteSpace: 'nowrap' }}>
                        {isAdmin && <button className="btn btn-ghost" style={{ padding: '4px 10px', marginRight: 6, fontSize: 12 }} onClick={e => bukaUbah(r, e)}>Ubah</button>}
                        <Ikon nama="kanan" size={16} style={{ color: 'var(--ink-soft)', verticalAlign: 'middle' }} />
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
        {!isAdmin && <div className="org-kecil" style={{ marginTop: 4 }}>Akun kamu hanya bisa melihat data. Untuk mengubah, hubungi admin.</div>}
      </div>

      {modal && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,.45)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 80 }} onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div style={{ background: '#fff', borderRadius: 16, width: '100%', maxWidth: 440, margin: 12 }}>
            <div style={{ padding: '18px 22px', borderBottom: '1px solid var(--line)', display: 'flex', justifyContent: 'space-between' }}>
              <h3 style={{ margin: 0 }}>Ubah Data — {modal.nama}</h3>
              <button onClick={() => setModal(null)} style={{ border: 'none', background: 'none', cursor: 'pointer' }}><Ikon nama="tutup" size={18} /></button>
            </div>
            <div style={{ padding: '20px 22px' }}>
              {error && <div className="error-box">{error}</div>}
              <div className="field"><label>Nama Ketua (beserta gelar)</label><input value={form.ketua} onChange={e => setForm({ ...form, ketua: e.target.value })} /></div>
              <div className="field"><label>Masa Bakti</label><input value={form.masa_bakti} placeholder="2026 - 2031" onChange={e => setForm({ ...form, masa_bakti: e.target.value })} /></div>
              <div className="field"><label>Tanggal SK</label><input value={form.tgl_sk} placeholder="23 Juni" onChange={e => setForm({ ...form, tgl_sk: e.target.value })} /></div>
              <div className="field"><label>Keterangan — opsional</label><input value={form.keterangan} placeholder="MUSKAB / Pengajuan" onChange={e => setForm({ ...form, keterangan: e.target.value })} /></div>
            </div>
            <div style={{ padding: '14px 22px', borderTop: '1px solid var(--line)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
              <button className="btn btn-ghost" onClick={() => setModal(null)}>Batal</button>
              <button className="btn btn-primary" onClick={simpan} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
