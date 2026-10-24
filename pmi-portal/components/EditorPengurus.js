'use client'
// Editor kepengurusan: Pelindung, Dewan Kehormatan, dan Pengurus (jabatan + nama), disimpan sekaligus.
import { useState } from 'react'
import Ikon from '@/components/Ikon'
import { SARAN_JABATAN } from '@/lib/organisasi'

const GRUP = [
  { id: 'Pelindung', judul: 'Pelindung', bantu: 'Contoh: Bupati Kabupaten Agam / Walikota Padang', baru: { jabatan: 'Pelindung' } },
  { id: 'Dewan Kehormatan', judul: 'Dewan Kehormatan', bantu: 'Satu baris “Ketua”, lalu “Anggota” (satu baris satu nama).', baru: { jabatan: 'Anggota' } },
  { id: 'Pengurus', judul: 'Pengurus', bantu: 'Ketua, Wakil Ketua, Ketua Bidang, Sekretaris, Bendahara, dan Anggota.', baru: { jabatan: 'Anggota' } },
]

let kunci = 0
const kunciBaru = () => 'n' + (++kunci)

export default function EditorPengurus({ org, rows, supabase, onTutup, onTersimpan }) {
  const [list, setList] = useState(() => rows.map(r => ({ key: r.id, id: r.id, kelompok: r.kelompok, jabatan: r.jabatan, nama: r.nama })))
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const dirty = JSON.stringify(list.map(({ id, kelompok, jabatan, nama }) => [id, kelompok, jabatan, nama])) !== JSON.stringify(rows.map(r => [r.id, r.kelompok, r.jabatan, r.nama]))

  const ubah = (key, f, v) => setList(l => l.map(x => x.key === key ? { ...x, [f]: v } : x))
  const hapus = key => setList(l => l.filter(x => x.key !== key))
  const tambah = g => setList(l => {
    // sisipkan di akhir kelompoknya
    const idx = l.map(x => x.kelompok).lastIndexOf(g.id)
    const baris = { key: kunciBaru(), id: null, kelompok: g.id, jabatan: g.baru.jabatan, nama: '' }
    const salinan = [...l]; salinan.splice(idx < 0 ? salinan.length : idx + 1, 0, baris)
    return salinan
  })

  function tutup() {
    if (dirty && !confirm('Perubahan belum disimpan. Tutup tanpa menyimpan?')) return
    onTutup()
  }

  async function simpan() {
    setError('')
    const bersih = list.filter(x => x.nama.trim() || x.jabatan.trim())
    for (const x of bersih) {
      if (!x.nama.trim()) { setError(`Nama untuk jabatan “${x.jabatan}” belum diisi.`); return }
      if (!x.jabatan.trim()) { setError(`Jabatan untuk “${x.nama}” belum diisi.`); return }
    }
    setSaving(true)
    // urutan global: Pelindung, Dewan Kehormatan, lalu Pengurus
    const urutan = []
    GRUP.forEach(g => bersih.filter(x => x.kelompok === g.id).forEach(x => urutan.push(x)))
    const dengan = urutan.map((x, i) => ({ ...x, urut: i + 1 }))
    const idKini = new Set(dengan.filter(x => x.id).map(x => x.id))
    const dihapus = rows.filter(r => !idKini.has(r.id)).map(r => r.id)

    try {
      if (dihapus.length) {
        const { error: e } = await supabase.from('pmi_pengurus').delete().in('id', dihapus)
        if (e) throw e
      }
      const asli = Object.fromEntries(rows.map(r => [r.id, r]))
      for (const x of dengan.filter(x => x.id)) {
        const a = asli[x.id]
        if (a && a.jabatan === x.jabatan.trim() && a.nama === x.nama.trim() && a.kelompok === x.kelompok && a.urut === x.urut) continue
        const { error: e } = await supabase.from('pmi_pengurus').update({ kelompok: x.kelompok, jabatan: x.jabatan.trim(), nama: x.nama.trim(), urut: x.urut }).eq('id', x.id)
        if (e) throw e
      }
      const baru = dengan.filter(x => !x.id).map(x => ({ organisasi_id: org.id, kelompok: x.kelompok, jabatan: x.jabatan.trim(), nama: x.nama.trim(), urut: x.urut }))
      if (baru.length) {
        const { error: e } = await supabase.from('pmi_pengurus').insert(baru)
        if (e) throw e
      }
      await supabase.from('pmi_organisasi').update({ updated_at: new Date().toISOString() }).eq('id', org.id)
    } catch (e) {
      setSaving(false); setError('Gagal menyimpan: ' + (e.message || e)); return
    }
    setSaving(false); onTersimpan()
  }

  return (
    <>
      <div className="ov" onClick={tutup} />
      <aside className="ed-drawer" role="dialog" aria-label="Edit kepengurusan">
        <div className="ed-head">
          <div>
            <div className="ed-judul">Edit Kepengurusan</div>
            <div className="ed-langkah">{org.nama} · masa bakti {org.masa_bakti || '-'}</div>
          </div>
          <button type="button" className="ed-x" onClick={tutup} aria-label="Tutup"><Ikon nama="tutup" size={20} /></button>
        </div>
        <div className="ed-body">
          {error && <div className="error-box" style={{ marginBottom: 12 }}>{error}</div>}
          {GRUP.map(g => (
            <section key={g.id} className="ed-sec">
              <div className="ed-sec-bar"><h4>{g.judul}</h4>
                <button type="button" className="ed-add" onClick={() => tambah(g)}><Ikon nama="tambahKecil" size={16} /> Tambah baris</button>
              </div>
              <p className="ed-bantu" style={{ marginBottom: 10 }}><Ikon nama="info" size={16} /> {g.bantu}</p>
              {list.filter(x => x.kelompok === g.id).length === 0 && <div className="ed-kosong">Belum ada baris. Klik “Tambah baris”.</div>}
              {list.filter(x => x.kelompok === g.id).map(x => (
                <div key={x.key} className="ed-baris ed-baris-pengurus">
                  <label className="ed-field"><span className="ed-label">Jabatan</span>
                    <input value={x.jabatan} list="saran-jabatan" onChange={e => ubah(x.key, 'jabatan', e.target.value)} />
                  </label>
                  <label className="ed-field"><span className="ed-label">Nama (beserta gelar)</span>
                    <input value={x.nama} onChange={e => ubah(x.key, 'nama', e.target.value)} />
                  </label>
                  <button type="button" className="ed-hapus" onClick={() => hapus(x.key)} aria-label="Hapus baris"><Ikon nama="hapus" size={18} /></button>
                </div>
              ))}
            </section>
          ))}
          <datalist id="saran-jabatan">{SARAN_JABATAN.map(o => <option key={o} value={o} />)}</datalist>
        </div>
        <div className="ed-foot">
          <div className="ed-nav"><button type="button" className="btn btn-ghost" onClick={tutup}>Batal</button></div>
          <div className="ed-simpan">
            {dirty && <span className="ed-belum">Belum disimpan</span>}
            <button type="button" className="btn btn-primary" onClick={simpan} disabled={saving}><Ikon nama="simpan" size={16} /> {saving ? 'Menyimpan...' : 'Simpan Kepengurusan'}</button>
          </div>
        </div>
      </aside>
    </>
  )
}
