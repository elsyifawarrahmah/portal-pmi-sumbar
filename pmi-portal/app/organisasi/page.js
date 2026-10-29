'use client'
// Organisasi PMI: daftar Ketua PMI se-Sumatera Barat. Klik satu baris untuk melihat kepengurusan & markasnya.
import { useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import SQL_ORGANISASI from '@/lib/sqlOrganisasi'
import { muatDataAwal } from '@/lib/muatDataAwal'
import { pecahBaris } from '@/lib/organisasi'
import { createClient } from '@/lib/supabase-browser'
import Sidebar from '@/components/Sidebar'
import Ikon from '@/components/Ikon'

// Sorotan baris seperti di Excel: merah muda = Pengajuan, kuning = MUSKAB atau tanggal SK belum ada
function sorotan(r) {
  const ket = String(r.keterangan || '').toLowerCase()
  if (ket.includes('pengajuan')) return 'sorot-pink'
  if (ket.includes('muskab') || !String(r.tgl_sk || '').trim()) return 'sorot-kuning'
  return ''
}

export default function OrganisasiPage() {
  const supabase = createClient()
  const router = useRouter()
  const [rows, setRows] = useState([])
  const [jumlahPengurus, setJumlahPengurus] = useState({})
  const [unitProv, setUnitProv] = useState({ pusdiklat: 0, klinik: 0 })
  const [tabelBelumAda, setTabelBelumAda] = useState(false)
  const [memuatAwal, setMemuatAwal] = useState(false)
  const [progres, setProgres] = useState('')
  const [hasilMuat, setHasilMuat] = useState(null)
  const [tersalin, setTersalin] = useState(false)
  const [cariMarkas, setCariMarkas] = useState('')
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
      setTabelBelumAda(belumAda)
      setLoadError(belumAda ? 'Tabel organisasi belum dibuat.' : 'Gagal memuat data: ' + err.message)
      setRows([])
    } else {
      setLoadError(''); setTabelBelumAda(false); setRows(data || [])
      const { data: p } = await supabase.from('pmi_pengurus').select('organisasi_id')
      const hitung = {}
      ;(p || []).forEach(x => { hitung[x.organisasi_id] = (hitung[x.organisasi_id] || 0) + 1 })
      setJumlahPengurus(hitung)
      // Jumlah data Pusdiklat & Klinik (0 bila tabel belum dibuat)
      const hitungData = async (tabel, unit) => {
        let q = supabase.from(tabel).select('id', { count: 'exact', head: true })
        if (unit) q = q.eq('unit', unit)
        const { count, error: e } = await q
        return e ? 0 : count || 0
      }
      const [pd, pj, ps, kd, kl, kp] = await Promise.all([
        hitungData('unit_dokumen', 'pusdiklat'), hitungData('pusdiklat_jadwal'), hitungData('pusdiklat_sdm_terlatih'),
        hitungData('unit_dokumen', 'klinik'), hitungData('klinik_layanan'), hitungData('klinik_pasien_harian'),
      ])
      setUnitProv({ pusdiklat: pd + pj + ps, klinik: kd + kp })
    }
    setLoading(false)
  }

  const filtered = rows.filter(r => [r.nama, r.ketua, r.masa_bakti, r.keterangan].join(' ').toLowerCase().includes(search.toLowerCase()))

  async function salinSql() {
    let berhasil = false
    try { await window.navigator.clipboard.writeText(SQL_ORGANISASI); berhasil = true } catch (e) { /* coba cara cadangan */ }
    if (!berhasil) {
      try {
        const ta = document.createElement('textarea'); ta.value = SQL_ORGANISASI; ta.style.position = 'fixed'; ta.style.opacity = '0'
        document.body.appendChild(ta); ta.select(); document.execCommand('copy'); ta.remove()
      } catch (e) { /* biarkan: pengguna masih bisa memilih manual lewat "Lihat isi SQL" */ }
    }
    setTersalin(true); setTimeout(() => setTersalin(false), 3000)
  }
  async function jalankanMuatAwal() {
    setMemuatAwal(true); setError(''); setHasilMuat(null)
    try {
      const hasil = await muatDataAwal(supabase, setProgres)
      setHasilMuat(hasil)
      await load()
    } catch (e) {
      setHasilMuat({ gagal: e.message || String(e) })
    }
    setMemuatAwal(false); setProgres('')
  }

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
  const markasUrut = [...rows].sort((a, b) => String(a.kode_wilayah || '').localeCompare(String(b.kode_wilayah || '')))
  const markasTampil = markasUrut.filter(r => [r.nama, r.markas_alamat, r.markas_telp, r.markas_email].join(' ').toLowerCase().includes(cariMarkas.toLowerCase()))
  const exportMarkas = () => unduh('alamat-markas-pmi-sumbar', ['No', 'Kode', 'Kab/Kota', 'Alamat Markas', 'Telp/Fax/HP', 'E-mail'],
    markasTampil.map(r => [markasUrut.indexOf(r) + 1, r.kode_wilayah, r.nama, r.markas_alamat, r.markas_telp, pecahBaris(r.markas_email).join('; ')]))
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
          <div><h1>Organisasi PMI</h1><p className="desc">Daftar Ketua PMI se-Provinsi Sumatera Barat, lalu kepengurusan dan markas tiap kab/kota di bagian bawah.</p></div>
        </div>

        {hasilMuat && !hasilMuat.gagal && (
          <div className="org-sukses">Data awal berhasil dimuat: {hasilMuat.organisasi} wilayah, {hasilMuat.pengurus} nama kepengurusan, {hasilMuat.relawan} baris relawan.</div>
        )}
        {hasilMuat?.gagal && <div className="error-box" style={{ marginBottom: 18 }}>Gagal memuat data awal: {hasilMuat.gagal}</div>}

        {tabelBelumAda ? (
          <div className="org-setup">
            <div className="org-setup-judul">Langkah 1 dari 2 — Buat tabel di Supabase (cukup sekali)</div>
            <ol className="org-setup-langkah">
              <li>Klik tombol <strong>Salin SQL</strong> di bawah.</li>
              <li>Buka <strong>Supabase</strong> lalu <strong>SQL Editor</strong>. Klik tombol <strong>+</strong> (query baru), tempel, lalu klik <strong>Run</strong>. Hasil yang benar: tulisan <em>Success</em>.</li>
              <li>Kembali ke halaman ini dan tekan <strong>Ctrl+Shift+R</strong>. Tombol <strong>Muat Data Awal</strong> akan muncul.</li>
            </ol>
            <div style={{ display: 'flex', gap: 10, alignItems: 'center', flexWrap: 'wrap' }}>
              <button className="btn btn-primary" onClick={salinSql}><Ikon nama="simpan" size={16} /> Salin SQL</button>
              {tersalin && <span className="org-sukses-kecil">Tersalin. Sekarang tempel di Supabase.</span>}
            </div>
            <details className="org-setup-detail"><summary>Lihat isi SQL</summary><pre>{SQL_ORGANISASI}</pre></details>
          </div>
        ) : loadError && <div className="error-box" style={{ marginBottom: 18 }}>{loadError}</div>}

        {!loading && !loadError && rows.length === 0 && (
          <div className="org-setup">
            <div className="org-setup-judul">Langkah 2 dari 2 — Muat data awal</div>
            <p style={{ margin: '0 0 12px', fontSize: 15 }}>Tabel sudah siap tetapi masih kosong. Klik tombol di bawah untuk memasukkan daftar ketua PMI, alamat markas, dan kepengurusan kab/kota. Cukup sekali dan aman diulang.</p>
            {isAdmin ? (
              <div style={{ display: 'flex', gap: 12, alignItems: 'center', flexWrap: 'wrap' }}>
                <button className="btn btn-primary" onClick={jalankanMuatAwal} disabled={memuatAwal}>{memuatAwal ? 'Memuat...' : 'Muat Data Awal'}</button>
                {progres && <span className="org-kecil">{progres}</span>}
              </div>
            ) : <p className="org-kecil">Hubungi admin untuk memuat data awal.</p>}
          </div>
        )}


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

          <div className="excel-wrap">
            <table className="tabel-excel">
              <thead>
                <tr className="excel-judul"><th colSpan={6}>Daftar Nama Ketua PMI</th>{isAdmin && <th className="aksi" />}</tr>
                <tr className="excel-judul"><th colSpan={6}>Se- Provinsi Sumatera Barat</th>{isAdmin && <th className="aksi" />}</tr>
                <tr className="excel-kepala">
                  <th style={{ width: 52 }}>No</th><th>Kab/Kota</th><th>Ketua</th><th style={{ width: 130 }}>Masa Bakti</th><th style={{ width: 120 }}>Tgl SK</th><th style={{ width: 130 }}>Ket</th>
                  {isAdmin && <th className="aksi" />}
                </tr>
              </thead>
              <tbody>
                {loading ? <tr><td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: 30 }}>Memuat...</td></tr> :
                filtered.length === 0 ? <tr><td colSpan={isAdmin ? 7 : 6} style={{ textAlign: 'center', padding: 30, color: 'var(--ink-soft)' }}>Tidak ada data.</td></tr> :
                filtered.map(r => (
                  <tr key={r.id} className={'excel-baris ' + sorotan(r)} onClick={() => router.push('/organisasi/' + r.slug)} title="Klik untuk melihat kepengurusan dan markas">
                    <td className="c">{r.urut}</td>
                    <td><Link href={'/organisasi/' + r.slug} onClick={e => e.stopPropagation()} className="excel-link">{r.nama}</Link>
                      {!jumlahPengurus[r.id] && <div className="org-kecil">kepengurusan belum diisi</div>}</td>
                    <td>{r.ketua || ''}</td>
                    <td className="c">{r.masa_bakti || ''}</td>
                    <td className="c">{r.tgl_sk || ''}</td>
                    <td className="c">{r.keterangan || ''}</td>
                    {isAdmin && <td className="aksi"><button type="button" className="excel-ubah" onClick={e => bukaUbah(r, e)} aria-label={'Ubah ' + r.nama} title="Ubah"><Ikon nama="edit" size={16} /></button></td>}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="excel-legenda">
            <span><i className="kotak kuning" /> MUSKAB / tanggal SK belum ada</span>
            <span><i className="kotak pink" /> Pengajuan</span>
            <span>Klik nama Kab/Kota untuk melihat kepengurusan dan markasnya.</span>
          </div>
        </div>
        {!loading && rows.length > 0 && (() => {
          const kabKota = rows.filter(r => r.jenis !== 'provinsi')
          const prov = rows.find(r => r.jenis === 'provinsi')
          const nPeng = prov ? (jumlahPengurus[prov.id] || 0) : 0
          return (
            <>
              <section className="org-bagian">
                <h2 className="org-bagian-judul"><span className="org-no">1</span> Kepengurusan dan Markas Kab/Kota</h2>
                <p className="org-bagian-bantu">Pilih kab/kota, lalu pilih <strong>Kepengurusan</strong> (daftar nama pengurus) atau <strong>Markas</strong> (alamat dan kontak).</p>
                {[['Kota', kabKota.filter(r => r.jenis === 'kota')], ['Kabupaten', kabKota.filter(r => r.jenis === 'kabupaten')]].map(([judul, daftar]) => (
                  <div key={judul} className="org-kelompok">
                    <div className="org-kelompok-judul">{judul}<span>{daftar.length}</span></div>
                    <div className="org-kabgrid">
                      {daftar.map(r => {
                        const n = jumlahPengurus[r.id] || 0
                        return (
                          <div key={r.id} className={'org-kab' + (n ? '' : ' kosong')}>
                            <div className="org-kab-info">
                              <div className="org-kab-nama">{r.nama}</div>
                              <div className="org-kab-meta">{n ? `${n} nama · masa bakti ${r.masa_bakti || '-'}` : 'Kepengurusan belum diisi'}</div>
                            </div>
                            <div className="org-kab-aksi">
                              <Link href={'/organisasi/' + r.slug + '#kepengurusan'} className={'org-aksi' + (n ? '' : ' kosong')}><Ikon nama="orang2" size={15} /> Kepengurusan</Link>
                              <Link href={'/organisasi/' + r.slug + '#markas'} className="org-aksi"><Ikon nama="gedung" size={15} /> Markas</Link>
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                ))}
              </section>

              {prov && (
                <section className="org-bagian">
                  <h2 className="org-bagian-judul"><span className="org-no">2</span> PMI Provinsi Sumatera Barat</h2>
                  <div className="org-provgrid">
                    <Link href="/organisasi/provinsi#kepengurusan" className="org-provkartu">
                      <span className="org-provikon"><Ikon nama="orang2" size={24} /></span>
                      <span className="org-provjudul">Kepengurusan</span>
                      <span className="org-provsub">Ketua: {prov.ketua || '-'}<br />Masa bakti {prov.masa_bakti || '-'}{nPeng ? ' · ' + nPeng + ' nama' : ''}</span>
                    </Link>
                    <Link href="/organisasi/provinsi#markas" className="org-provkartu">
                      <span className="org-provikon"><Ikon nama="gedung" size={24} /></span>
                      <span className="org-provjudul">Markas</span>
                      <span className="org-provsub">{prov.markas_alamat || 'Belum diisi'}</span>
                    </Link>
                    <Link href="/organisasi/provinsi#pusdiklat" className="org-provkartu">
                      <span className="org-provikon"><Ikon nama="buku" size={24} /></span>
                      <span className="org-provjudul">Pusdiklat</span>
                      <span className="org-provsub">{unitProv.pusdiklat ? unitProv.pusdiklat + ' data tercatat' : 'Belum diisi'}</span>
                    </Link>
                    <Link href="/organisasi/provinsi#klinik" className="org-provkartu">
                      <span className="org-provikon"><Ikon nama="faskes" size={24} /></span>
                      <span className="org-provjudul">Klinik</span>
                      <span className="org-provsub">{unitProv.klinik ? unitProv.klinik + ' data tercatat' : 'Belum diisi'}</span>
                    </Link>
                  </div>
                </section>
              )}
            </>
          )
        })()}

        {!loading && rows.length > 0 && (
          <section className="org-bagian">
            <h2 className="org-bagian-judul"><span className="org-no">3</span> Alamat Markas PMI se-Sumatera Barat</h2>
            <p className="org-bagian-bantu">Alamat, telepon, dan e-mail markas tiap kab/kota. Klik e-mail untuk menulis surat; klik nama untuk membuka rinciannya.</p>
            <div className="panel">
              <div className="panel-head" style={{ flexWrap: 'wrap', gap: 8 }}>
                <input placeholder="Cari kab/kota, alamat, atau e-mail..." value={cariMarkas} onChange={e => setCariMarkas(e.target.value)} style={{ maxWidth: 320 }} />
                <button className="btn btn-ghost" onClick={exportMarkas}>Export Alamat Markas (CSV)</button>
              </div>
              <div className="excel-wrap">
                <table className="tabel-markas">
                  <thead>
                    <tr className="markas-judul"><th colSpan={8}>PMI PROVINSI SUMATERA BARAT</th></tr>
                    <tr className="markas-kepala">
                      <th style={{ width: 44 }}>No</th><th style={{ width: 52 }}>Kode Reg.</th><th style={{ width: 52 }}>Kode Prov.</th><th style={{ width: 62 }}>Kode Kab/Kota</th>
                      <th>Kab/Kota</th><th>Alamat Markas</th><th>Telp/Fax/HP</th><th>e-mail</th>
                    </tr>
                  </thead>
                  <tbody>
                    {markasTampil.length === 0 ? <tr><td colSpan={8} style={{ textAlign: 'center', padding: 24 }}>Tidak ada data.</td></tr> : markasTampil.map(r => {
                      const kode = String(r.kode_wilayah || '').split('.')
                      return (
                        <tr key={r.id}>
                          <td className="c">{markasUrut.indexOf(r) + 1}</td>
                          <td className="c">{kode[0] || ''}</td><td className="c">{kode[1] || ''}</td><td className="c">{kode[2] || ''}</td>
                          <td><Link href={'/organisasi/' + r.slug + '#markas'} className="excel-link">{r.nama}</Link></td>
                          <td>{r.markas_alamat || ''}</td>
                          <td className="c">{String(r.markas_telp || '').split(' | ').map((t, i) => <div key={i}>{t}</div>)}</td>
                          <td className="c">{pecahBaris(r.markas_email).map(m => <div key={m}><a className="mail-link" href={'mailto:' + m}>{m}</a></div>)}</td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </section>
        )}

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
