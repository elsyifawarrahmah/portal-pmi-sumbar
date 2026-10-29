'use client'
// Satu bagian data (tabel + tambah/ubah/hapus) untuk Pusdiklat & Klinik, digerakkan oleh konfigurasi di lib/unitConfig.js
import { useEffect, useMemo, useState } from 'react'
import Ikon from '@/components/Ikon'
import { NAMA_BULAN, fmtTanggal, fmtAngka, fmtRupiah, tautanAman } from '@/lib/unit'

const TABEL_BELUM_ADA = e => e && (e.code === '42P01' || e.code === 'PGRST205' || /does not exist|schema cache/i.test(e.message || ''))

function Sel({ kol, baris }) {
  const v = baris[kol.key]
  if (v === null || v === undefined || v === '') return <span className="unit-kosong">-</span>
  switch (kol.type) {
    case 'tanggal': return fmtTanggal(v)
    case 'rupiah': return fmtRupiah(v)
    case 'angka': return fmtAngka(v)
    case 'bulan': return NAMA_BULAN[v - 1] || v
    case 'yatidak': return <span className={'unit-badge ' + (v ? 'ya' : 'tidak')}>{v ? 'Ya' : 'Tidak'}</span>
    case 'link': return tautanAman(v) ? <a className="org-link" href={v} target="_blank" rel="noopener noreferrer">Buka file</a> : '-'
    default: return String(v)
  }
}

function Isian({ f, value, onChange }) {
  const v = value ?? ''
  const set = e => onChange(e.target.value)
  if (f.type === 'area') return <textarea rows={3} value={v} onChange={set} />
  if (f.type === 'pilih') return <select value={v} onChange={set}><option value="">— pilih —</option>{f.opsi.map(o => <option key={o} value={o}>{o}</option>)}</select>
  if (f.type === 'bulan') return <select value={v} onChange={set}>{NAMA_BULAN.map((n, i) => <option key={n} value={i + 1}>{n}</option>)}</select>
  if (f.type === 'yatidak') return <select value={v} onChange={set}><option value="true">Ya</option><option value="false">Tidak</option></select>
  if (f.type === 'tanggal') return <input type="date" value={v} onChange={set} />
  if (f.type === 'angka' || f.type === 'tahun') return <input type="number" min="0" inputMode="numeric" value={v} onChange={set} />
  return <input value={v} onChange={set} placeholder={f.type === 'url' ? 'https://...' : ''} />
}

function formAwal(cfg, data) {
  const f = {}
  cfg.fields.forEach(fl => {
    const v = data ? data[fl.key] : undefined
    if (data) f[fl.key] = fl.type === 'yatidak' ? String(!!v) : v ?? ''
    else f[fl.key] = fl.def !== undefined ? String(fl.def) : ''
  })
  return f
}

function keBaris(cfg, form) {
  const out = {}
  for (const f of cfg.fields) {
    const mentah = form[f.key]
    if (mentah === '' || mentah === undefined || mentah === null) {
      if (f.req) throw new Error(`${f.label} wajib diisi.`)
      out[f.key] = null; continue
    }
    if (['angka', 'tahun', 'bulan'].includes(f.type)) {
      const n = Number(mentah)
      if (!Number.isFinite(n) || n < 0) throw new Error(`${f.label} harus berupa angka.`)
      out[f.key] = n
    } else if (f.type === 'yatidak') out[f.key] = mentah === 'true'
    else if (f.type === 'url') { const u = String(mentah).trim(); out[f.key] = /^https?:\/\//i.test(u) ? u : 'https://' + u }
    else out[f.key] = String(mentah).trim()
  }
  return { ...out, ...(cfg.where || {}) }
}

export default function UnitSeksi({ cfg, supabase, isAdmin }) {
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [pesan, setPesan] = useState('')
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [modal, setModal] = useState(null) // { data }
  const [form, setForm] = useState({})
  const [error, setError] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [cfg.id, tahun])

  async function load() {
    setLoading(true)
    let q = supabase.from(cfg.table).select('*')
    Object.entries(cfg.where || {}).forEach(([k, v]) => { q = q.eq(k, v) })
    if (cfg.tahunKol && !cfg.semuaTahun) {
      const { kol, tipe } = cfg.tahunKol
      q = tipe === 'tanggal' ? q.gte(kol, `${tahun}-01-01`).lte(kol, `${tahun}-12-31`) : q.eq(kol, tahun)
    }
    ;(cfg.order || []).forEach(([c, asc]) => { q = q.order(c, { ascending: asc }) })
    const { data, error: err } = await q.range(0, 4999)
    if (err) {
      setPesan(TABEL_BELUM_ADA(err) ? 'Tabel belum dibuat. Jalankan file supabase-migrasi-pusdiklat-klinik.sql di Supabase (SQL Editor) satu kali.' : 'Gagal memuat data: ' + err.message)
      setRows([])
    } else { setPesan(''); setRows(data || []) }
    setLoading(false)
  }

  const grup = useMemo(() => {
    if (!cfg.kelompok) return [{ kunci: 'semua', label: null, rows: [...rows] }]
    const m = new Map()
    rows.forEach(r => { const g = cfg.kelompok(r); if (!m.has(g.kunci)) m.set(g.kunci, { ...g, rows: [] }); m.get(g.kunci).rows.push(r) })
    const arr = [...m.values()].sort((a, b) => (a.kunci < b.kunci ? -1 : 1))
    if (cfg.grupTurun) arr.reverse()
    return arr
  }, [rows, cfg])
  grup.forEach(g => { if (cfg.urutBaris) g.rows.sort(cfg.urutBaris) })

  const buka = data => { setError(''); setForm(formAwal(cfg, data)); setModal({ data }) }
  async function simpan() {
    setError('')
    let payload
    try { payload = keBaris(cfg, form) } catch (e) { setError(e.message); return }
    setSaving(true)
    const q = modal.data ? supabase.from(cfg.table).update(payload).eq('id', modal.data.id) : supabase.from(cfg.table).insert(payload)
    const { error: err } = await q
    setSaving(false)
    if (err) { setError(err.code === '23505' ? 'Data untuk periode / jenis ini sudah ada. Ubah baris yang sudah ada.' : err.message); return }
    setModal(null); load()
  }
  async function hapus(r) {
    if (!confirm('Hapus baris ini?')) return
    const { error: err } = await supabase.from(cfg.table).delete().eq('id', r.id)
    if (err) { alert('Gagal menghapus: ' + err.message); return }
    load()
  }

  const jumlah = (list, k) => list.reduce((s, r) => s + (Number(r[k]) || 0), 0)
  const kolJumlah = cfg.jumlahkan || []
  const labelJumlah = cfg.totalLabel || 'Total'

  function Tabel({ list }) {
    return (
      <div className="unit-scroll">
        <table className="unit-tabel">
          <thead><tr>{cfg.kolom.map(k => <th key={k.key} className={k.num ? 'num' : ''}>{k.label}</th>)}{isAdmin && <th className="unit-aksi" />}</tr></thead>
          <tbody>
            {list.map(r => (
              <tr key={r.id}>
                {cfg.kolom.map(k => <td key={k.key} className={k.num ? 'num' : ''}><Sel kol={k} baris={r} /></td>)}
                {isAdmin && <td className="unit-aksi"><button className="btn btn-ghost unit-mini" onClick={() => buka(r)}>Ubah</button><button className="btn btn-ghost unit-mini" onClick={() => hapus(r)}>Hapus</button></td>}
              </tr>
            ))}
          </tbody>
          {kolJumlah.length > 0 && (
            <tfoot><tr>
              {cfg.kolom.map((k, i) => <td key={k.key} className={k.num ? 'num' : ''}>{kolJumlah.includes(k.key) ? (k.type === 'rupiah' ? fmtRupiah(jumlah(list, k.key)) : fmtAngka(jumlah(list, k.key))) : (i === 0 ? labelJumlah : '')}</td>)}
              {isAdmin && <td className="unit-aksi" />}
            </tr></tfoot>
          )}
        </table>
      </div>
    )
  }

  return (
    <div>
      <div className="unit-bar">
        <div>
          <h2 className="unit-judul">{cfg.judul}</h2>
          {cfg.bantu && <p className="unit-bantu">{cfg.bantu}</p>}
        </div>
        <div className="unit-bar-aksi">
          {cfg.tahunKol && !cfg.semuaTahun && (
            <div className="unit-tahun">
              <button type="button" aria-label="Tahun sebelumnya" onClick={() => setTahun(tahun - 1)}><Ikon nama="kiri" size={16} /></button>
              <strong>{tahun}</strong>
              <button type="button" aria-label="Tahun berikutnya" onClick={() => setTahun(tahun + 1)}><Ikon nama="kanan" size={16} /></button>
            </div>
          )}
          {isAdmin && !pesan && <button className="btn btn-primary" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }} onClick={() => buka(null)}><Ikon nama="tambahKecil" size={16} /> Tambah</button>}
        </div>
      </div>

      {pesan && <div className="error-box">{pesan}</div>}
      {loading && !pesan && <div className="unit-memuat">Memuat...</div>}

      {!loading && !pesan && rows.length === 0 && (
        <div className="org-kosong">
          <div className="org-kosong-judul">{cfg.judul} belum diisi{cfg.tahunKol && !cfg.semuaTahun ? ` untuk ${tahun}` : ''}</div>
          <div>{isAdmin ? 'Klik “Tambah” untuk mengisi data.' : 'Data akan tampil setelah diisi oleh admin.'}</div>
        </div>
      )}

      {!loading && !pesan && rows.length > 0 && grup.map(g => (
        <div key={g.kunci} className="panel unit-panel">
          {g.label && <div className="unit-grup-judul">{g.label}</div>}
          <Tabel list={g.rows} />
        </div>
      ))}

      {modal && (
        <div className="modal-ov" onClick={e => { if (e.target === e.currentTarget) setModal(null) }}>
          <div className="modal-kotak">
            <div className="modal-kepala"><h3 style={{ margin: 0 }}>{modal.data ? 'Ubah' : 'Tambah'} — {cfg.judul}</h3><button onClick={() => setModal(null)} className="modal-x"><Ikon nama="tutup" size={18} /></button></div>
            <div className="modal-isi">
              {error && <div className="error-box">{error}</div>}
              {cfg.fields.map(f => (
                <div className="field" key={f.key}>
                  <label>{f.label}{f.req ? ' *' : ''}</label>
                  <Isian f={f} value={form[f.key]} onChange={v => setForm({ ...form, [f.key]: v })} />
                  {f.bantu && <div className="unit-hint">{f.bantu}</div>}
                </div>
              ))}
            </div>
            <div className="modal-kaki"><button className="btn btn-ghost" onClick={() => setModal(null)}>Batal</button><button className="btn btn-primary" onClick={simpan} disabled={saving}>{saving ? 'Menyimpan...' : 'Simpan'}</button></div>
          </div>
        </div>
      )}
    </div>
  )
}
