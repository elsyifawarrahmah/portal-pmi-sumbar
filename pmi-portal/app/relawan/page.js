'use client'
// Relawan PMI per kab/kota: KSR, TSR, DDS, dan PMR (Mula, Madya, Wira).
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import Sidebar from '@/components/Sidebar'
import Ikon from '@/components/Ikon'

const KOLOM = [['ksr', 'KSR'], ['tsr', 'TSR'], ['dds', 'DDS'], ['pmr_mula', 'Mula'], ['pmr_madya', 'Madya'], ['pmr_wira', 'Wira']]
const fmt = n => Number(n || 0).toLocaleString('id-ID')
const totalPmr = r => Number(r.pmr_mula || 0) + Number(r.pmr_madya || 0) + Number(r.pmr_wira || 0)
const totalBaris = r => Number(r.ksr || 0) + Number(r.tsr || 0) + Number(r.dds || 0) + totalPmr(r)

export default function RelawanPage() {
  const supabase = createClient()
  const [rows, setRows] = useState([])
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
    const { data, error: err } = await supabase.from('relawan').select('*, pmi_organisasi(nama, slug, urut)')
    if (err) {
      const belumAda = err.code === '42P01' || err.code === 'PGRST205' || /relawan/.test(err.message || '')
      setLoadError(belumAda ? 'Tabel relawan belum dibuat. Jalankan file supabase-migrasi-organisasi.sql di Supabase (SQL Editor) satu kali.' : 'Gagal memuat data: ' + err.message)
      setRows([])
    } else {
      setLoadError('')
      setRows((data || []).sort((a, b) => (a.pmi_organisasi?.urut || 0) - (b.pmi_organisasi?.urut || 0)))
    }
    setLoading(false)
  }

  const filtered = rows.filter(r => (r.pmi_organisasi?.nama || '').toLowerCase().includes(search.toLowerCase()))
  const jumlah = k => filtered.reduce((s, r) => s + Number(r[k] || 0), 0)
  const jumlahTotal = filtered.reduce((s, r) => s + totalBaris(r), 0)

  function bukaUbah(r) {
    setModal(r); setError('')
    const f = {}; KOLOM.forEach(([k]) => { f[k] = r[k] || 0 }); setForm(f)
  }
  async function simpan() {
    setSaving(true)
    const { data: userData } = await supabase.auth.getUser()
    const payload = { diperbarui: new Date().toISOString().slice(0, 10), updated_by: userData?.user?.id }
    KOLOM.forEach(([k]) => { payload[k] = Math.max(0, Number(form[k]) || 0) })
    const { error: err } = await supabase.from('relawan').update(payload).eq('id', modal.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    setModal(null); load()
  }

  function exportCSV() {
    const esc = v => `"${String(v ?? '').replace(/"/g, '""')}"`
    const header = ['No', 'Kab/Kota', 'KSR', 'TSR', 'DDS', 'PMR Mula', 'PMR Madya', 'PMR Wira', 'Total', 'Diperbarui']
    const baris = filtered.map((r, i) => [i + 1, r.pmi_organisasi?.nama, r.ksr, r.tsr, r.dds, r.pmr_mula, r.pmr_madya, r.pmr_wira, totalBaris(r), r.diperbarui || ''])
    baris.push(['', 'TOTAL', jumlah('ksr'), jumlah('tsr'), jumlah('dds'), jumlah('pmr_mula'), jumlah('pmr_madya'), jumlah('pmr_wira'), jumlahTotal, ''])
    const csv = '\uFEFF' + [header.map(esc).join(';'), ...baris.map(b => b.map(esc).join(';'))].join('\n')
    const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8;' }))
    const a = document.createElement('a'); a.href = url; a.download = `relawan-pmi-sumbar-${new Date().toISOString().slice(0, 10)}.csv`; a.click(); URL.revokeObjectURL(url)
  }

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div><h1>Relawan PMI</h1><p className="desc">Jumlah relawan per kab/kota: KSR, TSR, DDS, dan PMR (Mula, Madya, Wira).</p></div>
        </div>

        {loadError && <div className="error-box" style={{ marginBottom: 18 }}>{loadError}</div>}

        <div className="org-ringkas">
          <div className="org-stat"><div className="org-stat-angka">{fmt(jumlahTotal)}</div><div>Total relawan</div></div>
          <div className="org-stat"><div className="org-stat-angka">{fmt(jumlah('ksr') + jumlah('tsr'))}</div><div>KSR + TSR</div></div>
          <div className="org-stat"><div className="org-stat-angka">{fmt(jumlah('pmr_mula') + jumlah('pmr_madya') + jumlah('pmr_wira'))}</div><div>PMR</div></div>
        </div>

        <div className="panel">
          <div className="panel-head" style={{ flexWrap: 'wrap', gap: 8 }}>
            <input placeholder="Cari kab/kota..." value={search} onChange={e => setSearch(e.target.value)} style={{ maxWidth: 260 }} />
            <button className="btn btn-ghost" onClick={exportCSV}>Export Excel (CSV)</button>
          </div>
          <div style={{ overflowX: 'auto' }}>
            <table className="tabel-relawan">
              <thead>
                <tr>
                  <th rowSpan={2}>No</th><th rowSpan={2}>Kab/Kota</th><th rowSpan={2} className="num">KSR</th><th rowSpan={2} className="num">TSR</th><th rowSpan={2} className="num">DDS</th>
                  <th colSpan={3} style={{ textAlign: 'center' }}>PMR</th><th rowSpan={2} className="num">Total</th><th rowSpan={2}>Diperbarui</th>{isAdmin && <th rowSpan={2}></th>}
                </tr>
                <tr><th className="num">Mula</th><th className="num">Madya</th><th className="num">Wira</th></tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={11} style={{ textAlign: 'center', padding: 30 }}>Memuat...</td></tr> :
                filtered.length === 0 ? <tr><td colSpan={11} style={{ textAlign: 'center', padding: 30, color: 'var(--ink-soft)' }}>Tidak ada data.</td></tr> :
                filtered.map((r, i) => (
                  <tr key={r.id}>
                    <td data-label="No">{i + 1}</td>
                    <td data-label="Kab/Kota"><Link href={'/organisasi/' + (r.pmi_organisasi?.slug || '')} className="org-link">{r.pmi_organisasi?.nama}</Link></td>
                    {KOLOM.map(([k, l]) => <td key={k} className="num" data-label={k.startsWith('pmr') ? 'PMR ' + l : l}>{fmt(r[k])}</td>)}
                    <td className="num" data-label="Total"><strong>{fmt(totalBaris(r))}</strong></td>
                    <td data-label="Diperbarui">{r.diperbarui || '-'}</td>
                    {isAdmin && <td><button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => bukaUbah(r)}>Ubah</button></td>}
                  </tr>
                ))}
              </tbody>
              {!loading && filtered.length > 0 && (
                <tfoot>
                  <tr className="baris-total">
                    <td></td><td><strong>TOTAL</strong></td>
                    {KOLOM.map(([k]) => <td key={k} className="num"><strong>{fmt(jumlah(k))}</strong></td>)}
                    <td className="num"><strong>{fmt(jumlahTotal)}</strong></td><td></td>{isAdmin && <td></td>}
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
        <div className="org-kecil" style={{ marginTop: 4 }}>KSR: Korps Sukarela · TSR: Tenaga Sukarela · DDS: Donor Darah Sukarela · PMR: Palang Merah Remaja{!isAdmin ? ' · Akun kamu hanya bisa melihat data.' : ''}</div>
      </div>

      {modal && (
        <div className="modal-ov" onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="modal-kotak">
            <div className="modal-kepala"><h3 style={{ margin: 0 }}>Ubah Data Relawan — {modal.pmi_organisasi?.nama}</h3><button onClick={() => setModal(null)} className="modal-x"><Ikon nama="tutup" size={18} /></button></div>
            <div className="modal-isi">
              {error && <div className="error-box">{error}</div>}
              <div className="ed-grid">
                {KOLOM.map(([k, l]) => (
                  <label key={k} className="ed-field"><span className="ed-label">{k.startsWith('pmr') ? 'PMR ' + l : l}</span>
                    <input type="number" inputMode="numeric" min="0" placeholder="0" value={form[k] ? form[k] : ''} onFocus={e => e.target.select()}
                           onChange={e => setForm({ ...form, [k]: e.target.value === '' ? 0 : Number(e.target.value) })} />
                  </label>
                ))}
              </div>
            </div>
            <div className="modal-kaki"><button className="btn btn-ghost" onClick={() => setModal(null)}>Batal</button><button className="btn btn-primary" onClick={simpan} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
