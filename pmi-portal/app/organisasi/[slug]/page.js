'use client'
// Rincian satu wilayah: Kepengurusan, Markas, (khusus Provinsi) Pusdiklat dan Klinik (lihat components/UnitPanel.js).
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Sidebar from '@/components/Sidebar'
import Ikon from '@/components/Ikon'
import EditorPengurus from '@/components/EditorPengurus'
import UnitPanel from '@/components/UnitPanel'
import { statusMasaBakti, kelompokkanJabatan, pecahBaris } from '@/lib/organisasi'

const WARNA = { hijau: { background: 'var(--stock-bg)', color: 'var(--stock)' }, kuning: { background: 'var(--gold-bg)', color: 'var(--gold)' }, merah: { background: '#FBE7E7', color: '#B3261E' } }

function Baris({ label, children }) {
  return <div className="org-row"><div className="org-row-label">{label}</div><div className="org-row-isi">{children}</div></div>
}

export default function OrganisasiDetailPage() {
  const { slug } = useParams()
  const supabase = createClient()
  const [org, setOrg] = useState(null)
  const [pengurus, setPengurus] = useState([])
  const [loading, setLoading] = useState(true)
  const [pesan, setPesan] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [tabPilih, setTab] = useState('kepengurusan')
  const [editPengurus, setEditPengurus] = useState(false)
  const [markasModal, setMarkasModal] = useState(false)
  const [markasForm, setMarkasForm] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [slug])

  // Tautan langsung ke tab, mis. /organisasi/agam#markas
  const TAB_ID = ['kepengurusan', 'markas', 'pusdiklat', 'klinik']
  useEffect(() => {
    const dariHash = () => { const h = (window.location.hash || '').replace('#', ''); if (TAB_ID.includes(h)) setTab(h) }
    dariHash()
    window.addEventListener('hashchange', dariHash)
    return () => window.removeEventListener('hashchange', dariHash)
  }, [slug])
  const pilihTab = id => { setTab(id); try { window.history.replaceState(null, '', '#' + id) } catch (e) {} }

  async function load() {
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    if (userData?.user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userData.user.id).single()
      setIsAdmin(profile?.role === 'admin')
    }
    const { data: o, error: err } = await supabase.from('pmi_organisasi').select('*').eq('slug', slug).maybeSingle()
    if (err) {
      const belumAda = err.code === '42P01' || err.code === 'PGRST205' || /pmi_organisasi/.test(err.message || '')
      setPesan(belumAda ? 'Tabel organisasi belum dibuat. Jalankan file supabase-migrasi-organisasi.sql di Supabase (SQL Editor) satu kali.' : 'Gagal memuat data: ' + err.message)
      setLoading(false); return
    }
    if (!o) { setPesan('Wilayah tidak ditemukan.'); setLoading(false); return }
    setPesan(''); setOrg(o)
    const { data: p } = await supabase.from('pmi_pengurus').select('*').eq('organisasi_id', o.id).order('urut')
    setPengurus(p || [])
    setLoading(false)
  }

  if (loading) return <div className="app"><Sidebar /><div className="main">Memuat...</div></div>
  if (!org) return (
    <div className="app"><Sidebar /><div className="main">
      <div className="topbar"><div><h1>Organisasi PMI</h1></div></div>
      <div className="error-box">{pesan}</div>
      <p><Link href="/organisasi" className="org-link">← Kembali ke daftar Ketua PMI</Link></p>
    </div></div>
  )

  const provinsi = org.jenis === 'provinsi'
  // Pusdiklat & Klinik hanya ada untuk Provinsi; untuk kab/kota kembali ke Kepengurusan
  const tab = (provinsi || ['kepengurusan', 'markas'].includes(tabPilih)) ? tabPilih : 'kepengurusan'
  const tabs = [['kepengurusan', 'Kepengurusan', 'orang2'], ['markas', 'Markas', 'gedung'], ...(provinsi ? [['pusdiklat', 'Pusdiklat', 'buku'], ['klinik', 'Klinik', 'faskes']] : [])]
  const st = statusMasaBakti(org.masa_bakti)
  const per = k => pengurus.filter(x => x.kelompok === k)

  function bukaMarkas() {
    setError('')
    setMarkasForm({ kode_wilayah: org.kode_wilayah || '', markas_alamat: org.markas_alamat || '', markas_telp: org.markas_telp || '', markas_email: org.markas_email || '' })
    setMarkasModal(true)
  }
  async function simpanMarkas() {
    setSaving(true)
    const { data: userData } = await supabase.auth.getUser()
    const { error: err } = await supabase.from('pmi_organisasi').update({
      kode_wilayah: markasForm.kode_wilayah.trim() || null, markas_alamat: markasForm.markas_alamat.trim() || null,
      markas_telp: markasForm.markas_telp.trim() || null, markas_email: markasForm.markas_email.trim() || null,
      updated_at: new Date().toISOString(), updated_by: userData?.user?.id,
    }).eq('id', org.id)
    setSaving(false)
    if (err) { setError(err.message); return }
    setMarkasModal(false); load()
  }

  const jenisUnit = provinsi && (tab === 'pusdiklat' || tab === 'klinik') ? tab : null

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div>
            <Link href="/organisasi" className="org-kembali"><Ikon nama="kiri" size={16} /> Daftar Ketua PMI</Link>
            <h1>{provinsi ? org.nama : 'PMI ' + org.nama}</h1>
            <p className="desc">Ketua: <strong>{org.ketua || '-'}</strong></p>
          </div>
          {isAdmin && tab === 'kepengurusan' && (
            <button className="btn btn-primary" onClick={() => setEditPengurus(true)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Ikon nama="edit" size={16} /> Edit Kepengurusan</button>
          )}
          {isAdmin && tab === 'markas' && (
            <button className="btn btn-primary" onClick={bukaMarkas} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Ikon nama="edit" size={16} /> Ubah Data Markas</button>
          )}
        </div>

        <div className="org-info">
          <span className="org-pil"><Ikon nama="kalender" size={15} /> Masa bakti {org.masa_bakti || '-'}</span>
          {st && <span className="tag" style={WARNA[st.tone]}>{st.label}</span>}
          {org.tgl_sk && <span className="org-pil">Tgl SK: {org.tgl_sk}</span>}
          {org.keterangan && <span className="tag" style={WARNA.kuning}>{org.keterangan}</span>}
          {org.catatan_pengurus && <span className="org-pil">{org.catatan_pengurus}</span>}
        </div>

        <div className="org-tabs" role="tablist">
          {tabs.map(([id, label, ikon]) => (
            <button key={id} type="button" role="tab" aria-selected={tab === id} className={'org-tab' + (tab === id ? ' on' : '')} onClick={() => pilihTab(id)}>
              <Ikon nama={ikon} size={17} /> {label}
            </button>
          ))}
        </div>

        {/* ===== KEPENGURUSAN ===== */}
        {tab === 'kepengurusan' && (
          pengurus.length === 0 ? (
            <div className="org-kosong">
              <div className="org-kosong-judul">Kepengurusan {org.nama} belum diisi</div>
              <div>{isAdmin ? 'Klik “Edit Kepengurusan” untuk mengisi nama-nama pengurus.' : 'Data akan tampil setelah diisi oleh admin.'}</div>
            </div>
          ) : (
            <>
              {per('Pelindung').length > 0 && (
                <div className="panel org-kartu">
                  <h3 className="org-kartu-judul">Pelindung</h3>
                  {per('Pelindung').map(x => <Baris key={x.id} label="Pelindung">{x.nama}</Baris>)}
                </div>
              )}
              {per('Dewan Kehormatan').length > 0 && (
                <div className="panel org-kartu">
                  <h3 className="org-kartu-judul">Dewan Kehormatan</h3>
                  {kelompokkanJabatan(per('Dewan Kehormatan')).map((g, i) => (
                    <Baris key={i} label={g.jabatan}>
                      {g.nama.length === 1 ? g.nama[0] : <ol className="org-daftar">{g.nama.map((n, k) => <li key={k}>{n}</li>)}</ol>}
                    </Baris>
                  ))}
                </div>
              )}
              {per('Pengurus').length > 0 && (
                <div className="panel org-kartu">
                  <h3 className="org-kartu-judul">Pengurus {provinsi ? 'Provinsi' : org.nama}</h3>
                  {kelompokkanJabatan(per('Pengurus')).map((g, i) => (
                    <Baris key={i} label={g.jabatan}>
                      {g.nama.length === 1 ? <span className={g.jabatan === 'Ketua' ? 'org-ketua' : ''}>{g.nama[0]}</span> : <ol className="org-daftar">{g.nama.map((n, k) => <li key={k}>{n}</li>)}</ol>}
                    </Baris>
                  ))}
                </div>
              )}
            </>
          )
        )}

        {/* ===== MARKAS ===== */}
        {tab === 'markas' && (
          <div className="panel org-kartu">
            <h3 className="org-kartu-judul">Markas {provinsi ? 'PMI Provinsi' : 'PMI ' + org.nama}</h3>
            <Baris label="Kode Wilayah">{org.kode_wilayah || '-'}</Baris>
            <Baris label="Alamat Markas">{org.markas_alamat || '-'}</Baris>
            <Baris label="Telp / Fax / HP">{org.markas_telp || '-'}</Baris>
            <Baris label="E-mail">
              {pecahBaris(org.markas_email).length === 0 ? '-' : pecahBaris(org.markas_email).map(m => <div key={m}><a className="org-link" href={'mailto:' + m}>{m}</a></div>)}
            </Baris>
          </div>
        )}

        {/* ===== PUSDIKLAT / KLINIK ===== */}
        {jenisUnit && <UnitPanel key={jenisUnit} jenis={jenisUnit} supabase={supabase} isAdmin={isAdmin} />}
      </div>

      {editPengurus && (
        <EditorPengurus org={org} rows={pengurus} supabase={supabase} onTutup={() => setEditPengurus(false)} onTersimpan={() => { setEditPengurus(false); load() }} />
      )}

      {markasModal && (
        <div className="modal-ov" onClick={e => { if (e.target === e.currentTarget) setMarkasModal(false) }}>
          <div className="modal-kotak">
            <div className="modal-kepala"><h3 style={{ margin: 0 }}>Ubah Data Markas</h3><button onClick={() => setMarkasModal(false)} className="modal-x"><Ikon nama="tutup" size={18} /></button></div>
            <div className="modal-isi">
              {error && <div className="error-box">{error}</div>}
              <div className="field"><label>Kode Wilayah</label><input value={markasForm.kode_wilayah} onChange={e => setMarkasForm({ ...markasForm, kode_wilayah: e.target.value })} placeholder="01.04.01" /></div>
              <div className="field"><label>Alamat Markas</label><textarea rows={3} value={markasForm.markas_alamat} onChange={e => setMarkasForm({ ...markasForm, markas_alamat: e.target.value })} /></div>
              <div className="field"><label>Telp / Fax / HP</label><input value={markasForm.markas_telp} onChange={e => setMarkasForm({ ...markasForm, markas_telp: e.target.value })} /></div>
              <div className="field"><label>E-mail — satu baris satu e-mail</label><textarea rows={3} value={markasForm.markas_email} onChange={e => setMarkasForm({ ...markasForm, markas_email: e.target.value })} /></div>
            </div>
            <div className="modal-kaki"><button className="btn btn-ghost" onClick={() => setMarkasModal(false)}>Batal</button><button className="btn btn-primary" onClick={simpanMarkas} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button></div>
          </div>
        </div>
      )}

    </div>
  )
}
