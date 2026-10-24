'use client'
// Rincian satu wilayah: Kepengurusan, Markas, (khusus Provinsi) Pusdiklat dan Klinik.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useParams } from 'next/navigation'
import { createClient } from '@/lib/supabase-browser'
import Sidebar from '@/components/Sidebar'
import Ikon from '@/components/Ikon'
import EditorPengurus from '@/components/EditorPengurus'
import { statusMasaBakti, kelompokkanJabatan, pecahBaris, LABEL_UNIT } from '@/lib/organisasi'

const WARNA = { hijau: { background: 'var(--stock-bg)', color: 'var(--stock)' }, kuning: { background: 'var(--gold-bg)', color: 'var(--gold)' }, merah: { background: '#FBE7E7', color: '#B3261E' } }

function Baris({ label, children }) {
  return <div className="org-row"><div className="org-row-label">{label}</div><div className="org-row-isi">{children}</div></div>
}

export default function OrganisasiDetailPage() {
  const { slug } = useParams()
  const supabase = createClient()
  const [org, setOrg] = useState(null)
  const [pengurus, setPengurus] = useState([])
  const [unit, setUnit] = useState([])
  const [loading, setLoading] = useState(true)
  const [pesan, setPesan] = useState('')
  const [isAdmin, setIsAdmin] = useState(false)
  const [tab, setTab] = useState('kepengurusan')
  const [editPengurus, setEditPengurus] = useState(false)
  const [markasModal, setMarkasModal] = useState(false)
  const [markasForm, setMarkasForm] = useState({})
  const [unitModal, setUnitModal] = useState(null) // { jenis, data }
  const [unitForm, setUnitForm] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [slug])

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
    if (o.jenis === 'provinsi') {
      const { data: u } = await supabase.from('pmi_unit').select('*').eq('organisasi_id', o.id).order('created_at')
      setUnit(u || [])
    } else setUnit([])
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

  function bukaUnit(jenis, data) {
    setError(''); setUnitModal({ jenis, data })
    setUnitForm({ nama: data?.nama || '', alamat: data?.alamat || '', telp: data?.telp || '', email: data?.email || '', penanggung_jawab: data?.penanggung_jawab || '', keterangan: data?.keterangan || '' })
  }
  async function simpanUnit() {
    if (!unitForm.nama.trim()) { setError('Nama wajib diisi.'); return }
    setSaving(true)
    const payload = { nama: unitForm.nama.trim(), alamat: unitForm.alamat.trim() || null, telp: unitForm.telp.trim() || null, email: unitForm.email.trim() || null, penanggung_jawab: unitForm.penanggung_jawab.trim() || null, keterangan: unitForm.keterangan.trim() || null }
    const q = unitModal.data
      ? supabase.from('pmi_unit').update(payload).eq('id', unitModal.data.id)
      : supabase.from('pmi_unit').insert({ ...payload, organisasi_id: org.id, jenis: unitModal.jenis })
    const { error: err } = await q
    setSaving(false)
    if (err) { setError(err.message); return }
    setUnitModal(null); load()
  }
  async function hapusUnit(u) {
    if (!confirm(`Hapus “${u.nama}”?`)) return
    const { error: err } = await supabase.from('pmi_unit').delete().eq('id', u.id)
    if (err) { alert('Gagal menghapus: ' + err.message); return }
    load()
  }

  const jenisUnit = tab === 'pusdiklat' || tab === 'klinik' ? tab : null

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
          {isAdmin && jenisUnit && (
            <button className="btn btn-primary" onClick={() => bukaUnit(jenisUnit, null)} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Ikon nama="tambahKecil" size={16} /> {LABEL_UNIT[jenisUnit].tombol}</button>
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
            <button key={id} type="button" role="tab" aria-selected={tab === id} className={'org-tab' + (tab === id ? ' on' : '')} onClick={() => setTab(id)}>
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
        {jenisUnit && (() => {
          const L = LABEL_UNIT[jenisUnit]
          const daftar = unit.filter(u => u.jenis === jenisUnit)
          return daftar.length === 0 ? (
            <div className="org-kosong">
              <div className="org-kosong-judul">Data {L.judul} belum diisi</div>
              <div>{isAdmin ? `Klik “${L.tombol}” untuk menambahkan.` : 'Data akan tampil setelah diisi oleh admin.'}</div>
            </div>
          ) : daftar.map(u => (
            <div key={u.id} className="panel org-kartu">
              <div className="org-kartu-bar"><h3 className="org-kartu-judul" style={{ margin: 0 }}>{u.nama}</h3>
                {isAdmin && <div><button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12, marginRight: 6 }} onClick={() => bukaUnit(jenisUnit, u)}>Ubah</button>
                  <button className="btn btn-ghost" style={{ padding: '4px 10px', fontSize: 12 }} onClick={() => hapusUnit(u)}>Hapus</button></div>}
              </div>
              <Baris label="Alamat">{u.alamat || '-'}</Baris>
              <Baris label="Telepon">{u.telp || '-'}</Baris>
              <Baris label="E-mail">{u.email ? <a className="org-link" href={'mailto:' + u.email}>{u.email}</a> : '-'}</Baris>
              <Baris label={L.pj}>{u.penanggung_jawab || '-'}</Baris>
              <Baris label={L.ket}>{u.keterangan || '-'}</Baris>
            </div>
          ))
        })()}
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

      {unitModal && (() => {
        const L = LABEL_UNIT[unitModal.jenis]
        return (
          <div className="modal-ov" onClick={e => { if (e.target === e.currentTarget) setUnitModal(null) }}>
            <div className="modal-kotak">
              <div className="modal-kepala"><h3 style={{ margin: 0 }}>{unitModal.data ? 'Ubah' : 'Tambah'} {L.judul}</h3><button onClick={() => setUnitModal(null)} className="modal-x"><Ikon nama="tutup" size={18} /></button></div>
              <div className="modal-isi">
                {error && <div className="error-box">{error}</div>}
                <div className="field"><label>{L.nama}</label><input value={unitForm.nama} onChange={e => setUnitForm({ ...unitForm, nama: e.target.value })} /></div>
                <div className="field"><label>Alamat — opsional</label><textarea rows={2} value={unitForm.alamat} onChange={e => setUnitForm({ ...unitForm, alamat: e.target.value })} /></div>
                <div className="field"><label>Telepon — opsional</label><input value={unitForm.telp} onChange={e => setUnitForm({ ...unitForm, telp: e.target.value })} /></div>
                <div className="field"><label>E-mail — opsional</label><input value={unitForm.email} onChange={e => setUnitForm({ ...unitForm, email: e.target.value })} /></div>
                <div className="field"><label>{L.pj} — opsional</label><input value={unitForm.penanggung_jawab} onChange={e => setUnitForm({ ...unitForm, penanggung_jawab: e.target.value })} /></div>
                <div className="field"><label>{L.ket} — opsional</label><textarea rows={3} value={unitForm.keterangan} onChange={e => setUnitForm({ ...unitForm, keterangan: e.target.value })} /></div>
              </div>
              <div className="modal-kaki"><button className="btn btn-ghost" onClick={() => setUnitModal(null)}>Batal</button><button className="btn btn-primary" onClick={simpanUnit} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button></div>
            </div>
          </div>
        )
      })()}
    </div>
  )
}
