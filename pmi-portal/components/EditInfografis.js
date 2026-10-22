'use client'
// Panel edit Infografis: 6 bagian bertahap, label jelas di atas tiap kolom, pratinjau poster berubah langsung.
import { useEffect, useRef, useState } from 'react'
import Ikon from '@/components/Ikon'
import { REGIONS, STATUS_WARNA } from '@/components/PetaSumbar'
import { cocokkanWilayah } from '@/lib/wilayah'
import { DAMPAK, LAYANAN, PENERIMA, SUMBER_DAYA, STATUS_LABEL } from '@/lib/infografis'

const TAB = [
  { id: 'umum', label: 'Umum', ikon: 'info', bantu: 'Judul dan keterangan singkat yang tampil di bagian atas poster.' },
  { id: 'dampak', label: 'Dampak', ikon: 'alert', bantu: 'Isi angka sesuai laporan terbaru. Kosongkan (0) kalau belum ada.' },
  { id: 'wilayah', label: 'Wilayah', ikon: 'peta', bantu: 'Pilih tingkat dampak tiap kabupaten/kota. Bisa juga klik wilayahnya langsung di peta.' },
  { id: 'layanan', label: 'Layanan & Bantuan', ikon: 'aktivitas', bantu: 'Layanan PMI di lapangan dan barang bantuan yang sudah disalurkan.' },
  { id: 'penerima', label: 'Penerima & Sumber Daya', ikon: 'truk', bantu: 'Jumlah penerima manfaat dan kendaraan/personil yang dikerahkan.' },
  { id: 'kontak', label: 'Kontak & Donasi', ikon: 'telepon', bantu: 'Nomor yang bisa dihubungi dan rekening untuk donasi.' },
]
const URUT_STATUS = ['aman', 'ringan', 'sedang', 'parah']

function Angka({ label, satuan, value, onChange }) {
  return (
    <label className="ed-field">
      <span className="ed-label">{label}</span>
      <span className="ed-input-wrap">
        <input type="number" inputMode="numeric" min="0" value={value ? value : ''} placeholder="0"
               onFocus={e => e.target.select()}
               onChange={e => onChange(e.target.value === '' ? 0 : Math.max(0, Number(e.target.value)))} />
        {satuan && <span className="ed-sat">{satuan}</span>}
      </span>
    </label>
  )
}

function Teks({ label, value, onChange, ph, type = 'text', list, opsional }) {
  return (
    <label className="ed-field">
      <span className="ed-label">{label}{opsional ? <em> — opsional</em> : null}</span>
      <input type={type} value={value || ''} placeholder={ph || ''} list={list} onChange={e => onChange(e.target.value)} />
    </label>
  )
}

function Wilayah({ draft, setDraft, upd, aktifWilayah, setAktifWilayah }) {
  const refs = useRef({})
  useEffect(() => {
    if (aktifWilayah && refs.current[aktifWilayah]) refs.current[aktifWilayah].scrollIntoView({ block: 'center', behavior: 'smooth' })
  }, [aktifWilayah])

  const cari = rid => draft.wilayah_detail.findIndex(d => (d.region_id ? d.region_id === rid : cocokkanWilayah(d.nama) === rid))
  function setDetail(rid, nama, field, val) {
    setDraft(d => {
      const list = [...d.wilayah_detail]
      let i = list.findIndex(x => (x.region_id ? x.region_id === rid : cocokkanWilayah(x.nama) === rid))
      if (i < 0) { list.push({ nama, region_id: rid, kecamatan: '', jumlah_sub: '', label_sub: 'Nagari' }); i = list.length - 1 }
      list[i] = { ...list[i], region_id: rid, nama: list[i].nama || nama, [field]: val }
      return { ...d, wilayah_detail: list }
    })
  }

  return (
    <div className="ed-wil">
      {REGIONS.map(r => {
        const st = draft.wilayah_status[r.id] || 'aman'
        const idx = cari(r.id)
        const det = idx >= 0 ? draft.wilayah_detail[idx] : null
        const tampilDetail = st !== 'aman' || (det && (det.kecamatan || det.jumlah_sub))
        return (
          <div key={r.id} ref={el => { refs.current[r.id] = el }} className={`ed-region${aktifWilayah === r.id ? ' aktif' : ''}`} onClick={() => setAktifWilayah(r.id)}>
            <div className="ed-region-nama"><span className="ed-dot" style={{ background: STATUS_WARNA[st] }} />{r.nama}</div>
            <div className="ed-seg" role="group" aria-label={'Dampak ' + r.nama}>
              {URUT_STATUS.map(s => (
                <button key={s} type="button" className={st === s ? 'on' : ''}
                        style={st === s ? { background: STATUS_WARNA[s], color: s === 'aman' ? '#1B4332' : '#fff', borderColor: STATUS_WARNA[s] } : undefined}
                        onClick={e => { e.stopPropagation(); upd(`wilayah_status.${r.id}`, s) }}>{STATUS_LABEL[s]}</button>
              ))}
            </div>
            {tampilDetail && (
              <div className="ed-region-detail">
                <label><span className="ed-label">Kecamatan terdampak</span>
                  <input type="number" inputMode="numeric" min="0" placeholder="0" value={det?.kecamatan ?? ''} onChange={e => setDetail(r.id, r.nama, 'kecamatan', e.target.value)} />
                </label>
                <label><span className="ed-label">Jumlah</span>
                  <input type="number" inputMode="numeric" min="0" placeholder="0" value={det?.jumlah_sub ?? ''} onChange={e => setDetail(r.id, r.nama, 'jumlah_sub', e.target.value)} />
                </label>
                <label><span className="ed-label">Satuan</span>
                  <select value={det?.label_sub || 'Nagari'} onChange={e => setDetail(r.id, r.nama, 'label_sub', e.target.value)}>
                    {['Nagari', 'Kelurahan', 'Desa', 'Jorong'].map(o => <option key={o}>{o}</option>)}
                  </select>
                </label>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}

export default function EditInfografis({ draft, setDraft, upd, onSimpan, onBatal, saving, dirty, aktifWilayah, setAktifWilayah, defaultTab = 'umum' }) {
  const [tab, setTab] = useState(defaultTab)
  const bodyRef = useRef(null)
  const i = TAB.findIndex(t => t.id === tab)
  const aktif = TAB[i]

  // Klik wilayah di peta -> langsung ke bagian Wilayah
  useEffect(() => { if (aktifWilayah) setTab('wilayah') }, [aktifWilayah])
  useEffect(() => { if (bodyRef.current) bodyRef.current.scrollTop = 0 }, [tab])

  const kelompokDampak = ['Korban jiwa', 'Kerusakan']
  const hariIni = () => new Date().toISOString().slice(0, 10)

  const tambahBantuan = () => setDraft(d => ({ ...d, bantuan_items: [...d.bantuan_items, { nama: '', jumlah: '', satuan: '' }] }))
  const hapusBantuan = k => setDraft(d => ({ ...d, bantuan_items: d.bantuan_items.filter((_, x) => x !== k) }))
  const updBantuan = (k, f, v) => setDraft(d => ({ ...d, bantuan_items: d.bantuan_items.map((b, x) => x === k ? { ...b, [f]: v } : b) }))
  const tambahKontak = () => setDraft(d => ({ ...d, kontak: [...d.kontak, { nama: '', nomor: '' }] }))
  const hapusKontak = k => setDraft(d => ({ ...d, kontak: d.kontak.filter((_, x) => x !== k) }))
  const updKontak = (k, f, v) => setDraft(d => ({ ...d, kontak: d.kontak.map((c, x) => x === k ? { ...c, [f]: v } : c) }))

  return (
    <aside className="ed-drawer" role="dialog" aria-label="Edit data infografis">
      <div className="ed-head">
        <div>
          <div className="ed-judul">Edit Data Infografis</div>
          <div className="ed-langkah">Bagian {i + 1} dari {TAB.length}: <strong>{aktif.label}</strong></div>
        </div>
        <button type="button" className="ed-x" onClick={onBatal} aria-label="Tutup"><Ikon nama="tutup" size={20} /></button>
      </div>

      <div className="ed-tabs" role="tablist">
        {TAB.map((t, k) => (
          <button key={t.id} type="button" role="tab" aria-selected={tab === t.id} className={`ed-tab${tab === t.id ? ' on' : ''}`} onClick={() => setTab(t.id)}>
            <span className="ed-no">{k + 1}</span><span className="ed-tab-teks">{t.label}</span>
          </button>
        ))}
      </div>

      <div className="ed-body" ref={bodyRef}>
        <p className="ed-bantu"><Ikon nama="info" size={16} /> {aktif.bantu}</p>

        {tab === 'umum' && (
          <div className="ed-stack">
            <Teks label="Judul Infografis" value={draft.judul} onChange={v => upd('judul', v)} />
            <label className="ed-field">
              <span className="ed-label">Deskripsi / Ringkasan Kejadian</span>
              <textarea rows={5} value={draft.deskripsi || ''} onChange={e => upd('deskripsi', e.target.value)} placeholder="Tuliskan ringkasan singkat kejadian dan dampaknya." />
            </label>
            <label className="ed-field">
              <span className="ed-label">Tanggal Update Data</span>
              <span className="ed-input-wrap">
                <input type="date" value={draft.tanggal_update || ''} onChange={e => upd('tanggal_update', e.target.value)} />
                <button type="button" className="ed-mini" onClick={() => upd('tanggal_update', hariIni())}>Hari ini</button>
              </span>
            </label>
            <Teks label="Status / Keterangan Singkat" opsional value={draft.status_keterangan} onChange={v => upd('status_keterangan', v)} ph="Contoh: Masa Transisi Pemulihan" />
          </div>
        )}

        {tab === 'dampak' && kelompokDampak.map(g => (
          <section key={g} className="ed-sec">
            <h4>{g}</h4>
            <div className="ed-grid">
              {DAMPAK.filter(x => x[5] === g).map(([k, , label, satuan]) => (
                <Angka key={k} label={label} satuan={satuan} value={draft.dampak[k]} onChange={v => upd(`dampak.${k}`, v)} />
              ))}
            </div>
          </section>
        ))}

        {tab === 'wilayah' && <Wilayah draft={draft} setDraft={setDraft} upd={upd} aktifWilayah={aktifWilayah} setAktifWilayah={setAktifWilayah} />}

        {tab === 'layanan' && (
          <>
            <section className="ed-sec">
              <h4>Layanan PMI di Lapangan</h4>
              <div className="ed-grid">
                {LAYANAN.map(([k, , label, satuan]) => (
                  <Angka key={k} label={label} satuan={satuan} value={draft.layanan[k]} onChange={v => upd(`layanan.${k}`, v)} />
                ))}
              </div>
            </section>
            <section className="ed-sec">
              <div className="ed-sec-bar"><h4>Bantuan yang Disalurkan</h4>
                <button type="button" className="ed-add" onClick={tambahBantuan}><Ikon nama="tambahKecil" size={16} /> Tambah barang</button>
              </div>
              {draft.bantuan_items.length === 0 && <div className="ed-kosong">Belum ada barang. Klik “Tambah barang”.</div>}
              {draft.bantuan_items.map((b, k) => (
                <div key={k} className="ed-baris">
                  <Teks label="Nama barang" value={b.nama} onChange={v => updBantuan(k, 'nama', v)} ph="Beras, mie instan, selimut..." />
                  <label className="ed-field"><span className="ed-label">Jumlah</span>
                    <input type="number" inputMode="numeric" min="0" placeholder="0" value={b.jumlah} onChange={e => updBantuan(k, 'jumlah', e.target.value)} />
                  </label>
                  <Teks label="Satuan" value={b.satuan} onChange={v => updBantuan(k, 'satuan', v)} ph="karung" list="ed-satuan" />
                  <button type="button" className="ed-hapus" onClick={() => hapusBantuan(k)} aria-label="Hapus barang"><Ikon nama="hapus" size={18} /></button>
                </div>
              ))}
              <datalist id="ed-satuan">{['karung', 'dus', 'pcs', 'kaleng', 'kg', 'liter', 'lembar', 'paket', 'botol'].map(o => <option key={o} value={o} />)}</datalist>
            </section>
          </>
        )}

        {tab === 'penerima' && (
          <>
            <section className="ed-sec">
              <h4>Penerima Manfaat</h4>
              <div className="ed-grid">
                {PENERIMA.map(([k, label]) => <Angka key={k} label={label} satuan="jiwa" value={draft.penerima_manfaat[k]} onChange={v => upd(`penerima_manfaat.${k}`, v)} />)}
              </div>
            </section>
            <section className="ed-sec">
              <h4>Sumber Daya yang Dikerahkan</h4>
              <div className="ed-grid">
                {SUMBER_DAYA.map(([k, , label]) => <Angka key={k} label={label} satuan={k === 'personil' ? 'orang' : 'unit'} value={draft.sumber_daya[k]} onChange={v => upd(`sumber_daya.${k}`, v)} />)}
              </div>
            </section>
          </>
        )}

        {tab === 'kontak' && (
          <>
            <section className="ed-sec">
              <div className="ed-sec-bar"><h4>Contact Person</h4>
                <button type="button" className="ed-add" onClick={tambahKontak}><Ikon nama="tambahKecil" size={16} /> Tambah kontak</button>
              </div>
              {draft.kontak.length === 0 && <div className="ed-kosong">Belum ada kontak. Klik “Tambah kontak”.</div>}
              {draft.kontak.map((c, k) => (
                <div key={k} className="ed-baris ed-baris-2">
                  <Teks label="Nama" value={c.nama} onChange={v => updKontak(k, 'nama', v)} />
                  <Teks label="No. HP / WhatsApp" type="tel" value={c.nomor} onChange={v => updKontak(k, 'nomor', v)} ph="0812xxxxxxx" />
                  <button type="button" className="ed-hapus" onClick={() => hapusKontak(k)} aria-label="Hapus kontak"><Ikon nama="hapus" size={18} /></button>
                </div>
              ))}
            </section>
            <section className="ed-sec">
              <h4>Rekening Donasi</h4>
              <div className="ed-stack">
                <Teks label="Nama Bank" value={draft.rekening.bank} onChange={v => upd('rekening.bank', v)} ph="BRI, BNI, Mandiri, BSI..." list="ed-bank" />
                <datalist id="ed-bank">{['BRI', 'BNI', 'Bank Mandiri', 'BSI', 'BCA', 'Bank Nagari'].map(o => <option key={o} value={o} />)}</datalist>
                <Teks label="Nomor Rekening" value={draft.rekening.nomor} onChange={v => upd('rekening.nomor', v)} />
                <Teks label="Atas Nama" value={draft.rekening.atas_nama} onChange={v => upd('rekening.atas_nama', v)} />
              </div>
            </section>
          </>
        )}
      </div>

      <div className="ed-foot">
        <div className="ed-nav">
          <button type="button" className="btn btn-ghost" disabled={i === 0} onClick={() => setTab(TAB[i - 1].id)}><Ikon nama="kiri" size={16} /> Kembali</button>
          <button type="button" className="btn btn-ghost" disabled={i === TAB.length - 1} onClick={() => setTab(TAB[i + 1].id)}>Lanjut <Ikon nama="kanan" size={16} /></button>
        </div>
        <div className="ed-simpan">
          {dirty && <span className="ed-belum">Belum disimpan</span>}
          <button type="button" className="btn btn-primary" onClick={onSimpan} disabled={saving}><Ikon nama="simpan" size={16} /> {saving ? 'Menyimpan...' : 'Simpan Semua'}</button>
        </div>
      </div>
    </aside>
  )
}
