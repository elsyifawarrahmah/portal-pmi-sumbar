'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Sidebar from '@/components/Sidebar'
import PetaSumbar, { REGIONS, STATUS_WARNA } from '@/components/PetaSumbar'
import PanelWilayah from '@/components/PanelWilayah'
import EditInfografis from '@/components/EditInfografis'
import Ikon from '@/components/Ikon'
import { cocokkanWilayah } from '@/lib/wilayah'
import { KOSONG, DAMPAK, LAYANAN, PENERIMA, SUMBER_DAYA, STATUS_LABEL } from '@/lib/infografis'

const angka = n => Number(n || 0).toLocaleString('id-ID')

// Buang rincian wilayah kosong yang terbentuk otomatis dari panel edit
function bersihkan(d) {
  return { ...d, wilayah_detail: (d.wilayah_detail || []).filter(x => !(x.region_id && !String(x.kecamatan ?? '').trim() && !String(x.jumlah_sub ?? '').trim())) }
}

export default function InfografisPage() {
  const supabase = createClient()
  const [data, setData] = useState(KOSONG)
  const [rowId, setRowId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [isAdmin, setIsAdmin] = useState(false)
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(KOSONG)
  const [aktifWilayah, setAktifWilayah] = useState(null)
  const [saving, setSaving] = useState(false)
  const [extra, setExtra] = useState({ air: [], barang: [], kes: [], bersih: [], org: [], loaded: false, loading: false, error: '' })

  useEffect(() => { load() }, [])

  // Data air, barang, kesehatan & bersih-bersih dimuat sekali, saat wilayah pertama kali diklik
  useEffect(() => {
    if (!aktifWilayah || extra.loaded || extra.loading) return
    ;(async () => {
      setExtra(e => ({ ...e, loading: true }))
      const [a, b, k, c, o] = await Promise.all([
        supabase.from('distribusi_air').select('id, tanggal, kota, liter, penerima_manfaat, no_kendaraan').order('tanggal', { ascending: false }),
        supabase.from('barang_keluar').select('id, tanggal, jenis_barang, jumlah, satuan, tujuan_penerima, status').order('tanggal', { ascending: false }),
        supabase.from('layanan_kesehatan').select('id, tanggal, jenis_layanan, kota, jumlah_penerima'),
        supabase.from('kegiatan_bersih').select('id, tanggal, jenis_kegiatan, kota, jumlah_terlayani, satuan'),
        supabase.from('pmi_organisasi').select('slug, region_id, ketua, masa_bakti, markas_telp'),
      ])
      const err = (a.error || b.error) ? 'Sebagian data (air/barang) gagal dimuat: ' + (a.error?.message || b.error?.message) : ''
      setExtra({ air: a.data || [], barang: b.data || [], kes: k.data || [], bersih: c.data || [], org: o.data || [], loaded: true, loading: false, error: err })
    })()
  }, [aktifWilayah])

  async function load() {
    setLoading(true)
    const { data: userData } = await supabase.auth.getUser()
    if (userData?.user) {
      const { data: profile } = await supabase.from('profiles').select('role').eq('id', userData.user.id).single()
      setIsAdmin(profile?.role === 'admin')
    }
    const { data: rows } = await supabase.from('infografis_bencana').select('*').limit(1)
    if (rows && rows.length > 0) {
      setRowId(rows[0].id)
      setData({ ...KOSONG, ...rows[0].data })
    }
    setLoading(false)
  }

  function mulaiEdit() { setDraft(JSON.parse(JSON.stringify(data))); setEditing(true) }
  const dirty = editing && JSON.stringify(draft) !== JSON.stringify(data)

  function batalEdit() {
    if (dirty && !confirm('Perubahan belum disimpan. Tutup tanpa menyimpan?')) return
    setEditing(false)
  }

  async function simpan() {
    if (!String(draft.judul || '').trim()) { alert('Judul infografis wajib diisi (bagian Umum).'); return }
    setSaving(true)
    const hasil = bersihkan(draft)
    const { data: userData } = await supabase.auth.getUser()
    const { error } = await supabase.from('infografis_bencana').update({
      data: hasil, updated_at: new Date().toISOString(), updated_by: userData.user.id,
    }).eq('id', rowId)
    setSaving(false)
    if (error) { alert('Gagal menyimpan: ' + error.message); return }
    setData(hasil); setDraft(hasil); setEditing(false)
  }

  function upd(path, value) {
    setDraft(d => {
      const copy = { ...d }; let ref = copy; const keys = path.split('.')
      for (let i = 0; i < keys.length - 1; i++) { ref[keys[i]] = { ...ref[keys[i]] }; ref = ref[keys[i]] }
      ref[keys[keys.length - 1]] = value
      return copy
    })
  }

  if (loading) return <div className="app"><Sidebar /><div className="main">Memuat...</div></div>

  const show = editing ? draft : data
  const bagianKecil = { marginTop: -8, borderTop: 'none', borderTopLeftRadius: 0, borderTopRightRadius: 0 }

  return (
    <div className="app">
      <Sidebar />
      <div className={'main' + (editing ? ' edit-open' : '')}>
        <div className="topbar">
          <div><h1>Infografis Bencana</h1><p className="desc">Ringkasan visual — dibagikan seperti poster, datanya tetap hidup.</p></div>
          {isAdmin && !editing && (
            <button className="btn btn-primary" onClick={mulaiEdit} style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
              <Ikon nama="edit" size={16} /> Edit Data
            </button>
          )}
        </div>

        {editing && (
          <div style={{ background: 'var(--gold-bg)', color: 'var(--gold)', padding: '10px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, marginBottom: 16, display: 'flex', gap: 8, alignItems: 'center' }}>
            <Ikon nama="edit" size={16} /> Mode edit aktif — isi data di panel sebelah kanan, poster ini berubah langsung sebagai pratinjau.
          </div>
        )}

        {/* ===== POSTER ===== */}
        <div style={{ background: '#fff', borderRadius: 22, padding: 0, overflow: 'clip', boxShadow: '0 16px 50px rgba(32,28,26,.12)', border: '3px solid var(--pmi-red)' }}>

          {/* HERO */}
          <div style={{ background: 'linear-gradient(135deg, var(--pmi-red) 0%, var(--pmi-red-dark) 100%)', padding: '32px 32px 26px', color: '#fff', position: 'relative' }}>
            <div style={{ display: 'inline-block', background: 'rgba(255,255,255,.2)', padding: '4px 14px', borderRadius: 20, fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', marginBottom: 12 }}>Infografis</div>
            <h1 style={{ margin: '0 0 12px', fontSize: 'clamp(22px,3.2vw,32px)', fontWeight: 800, lineHeight: 1.15 }}>{show.judul}</h1>
            <p style={{ margin: '0 0 16px', fontSize: 14, lineHeight: 1.7, opacity: .95, maxWidth: 820 }}>{show.deskripsi || 'Belum ada deskripsi.'}</p>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {show.tanggal_update && (
                <span style={{ background: 'rgba(255,255,255,.2)', padding: '7px 16px', borderRadius: 20, fontSize: 12.5, fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <Ikon nama="kalender" size={15} /> {new Date(show.tanggal_update).toLocaleDateString('id-ID', { day: '2-digit', month: 'long', year: 'numeric' })}
                </span>
              )}
              {show.status_keterangan && (
                <span style={{ background: '#fff', color: 'var(--pmi-red-dark)', padding: '7px 16px', borderRadius: 20, fontSize: 12.5, fontWeight: 800, display: 'inline-flex', alignItems: 'center', gap: 7 }}>
                  <Ikon nama="kilat" size={15} /> {show.status_keterangan}
                </span>
              )}
            </div>
          </div>

          <div style={{ padding: '26px 28px', background: 'var(--cream)' }}>

            {/* DAMPAK */}
            <div className="ribbon"><Ikon nama="alert" size={18} /> DAMPAK BENCANA</div>
            <div className="poster-section" style={bagianKecil}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px,1fr))', gap: 4 }}>
                {DAMPAK.map(([key, ikon, label, satuan, warna]) => (
                  <div key={key} className="icon-stat">
                    <div className="circle" style={{ background: warna + '22', color: warna }}><Ikon nama={ikon} size={26} /></div>
                    <div className="num" style={{ color: warna }}>{angka(show.dampak[key])}</div>
                    <div className="lbl2">{label} <span style={{ opacity: .6 }}>({satuan})</span></div>
                  </div>
                ))}
              </div>
            </div>

            {/* PETA */}
            <div className="ribbon" style={{ marginTop: 22 }}><Ikon nama="peta" size={18} /> PETA WILAYAH TERDAMPAK</div>
            <div className="poster-section" style={bagianKecil}>
              <div style={{ display: 'grid', gridTemplateColumns: editing ? '1fr' : '1fr 1.1fr', gap: 20, alignItems: 'start' }}>
                <div style={editing ? undefined : { position: 'sticky', top: 96, alignSelf: 'start' }}>
                  <PetaSumbar statusWilayah={show.wilayah_status} aktif={aktifWilayah} onSelect={(id) => setAktifWilayah(id)} />
                  <div style={{ display: 'flex', gap: 14, justifyContent: 'center', marginTop: 14, flexWrap: 'wrap' }}>
                    {Object.entries(STATUS_WARNA).map(([k, v]) => (
                      <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 11.5 }}>
                        <span style={{ width: 11, height: 11, borderRadius: 3, background: v, display: 'inline-block' }}></span>
                        <span>{STATUS_LABEL[k]}</span>
                      </div>
                    ))}
                  </div>
                  <div style={{ textAlign: 'center', fontSize: 12, color: 'var(--ink-soft)', marginTop: 10 }}>
                    {editing ? 'Klik wilayah di peta untuk mengatur dampaknya di panel kanan.' : 'Klik wilayah di peta untuk melihat rinciannya.'}
                  </div>
                </div>

                {!editing && (
                  <div>
                    {aktifWilayah && (() => {
                      const w = REGIONS.find(r => r.id === aktifWilayah)
                      const detail = (show.wilayah_detail || []).filter(d => (d.region_id ? d.region_id === aktifWilayah : cocokkanWilayah(d.nama) === aktifWilayah))
                      const air = extra.air.filter(r => cocokkanWilayah(r.kota) === aktifWilayah)
                      const barang = extra.barang.filter(r => cocokkanWilayah(r.tujuan_penerima) === aktifWilayah)
                      const kesehatan = extra.kes.filter(r => cocokkanWilayah(r.kota) === aktifWilayah)
                      const bersih = extra.bersih.filter(r => cocokkanWilayah(r.kota) === aktifWilayah)
                      return (
                        <PanelWilayah
                          nama={w?.nama || aktifWilayah}
                          status={show.wilayah_status[aktifWilayah]} isAdmin={isAdmin}
                          detail={detail} air={air} barang={barang} kesehatan={kesehatan} bersih={bersih} organisasi={extra.org.find(x => x.region_id === aktifWilayah)}
                          loadingData={!extra.loaded} errorData={extra.error}
                          onClose={() => setAktifWilayah(null)}
                        />
                      )
                    })()}
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8, alignContent: 'flex-start' }}>
                      {show.wilayah_detail.length === 0 ? <span style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Belum ada data wilayah.</span> :
                      show.wilayah_detail.map((w, i) => {
                        const warna = w.region_id ? (STATUS_WARNA[show.wilayah_status[w.region_id]] || STATUS_WARNA.aman) : STATUS_WARNA.aman
                        return (
                          <div key={i} className="chip" onClick={w.region_id ? () => setAktifWilayah(w.region_id) : undefined} style={{ background: warna + '20', border: `1px solid ${warna}55`, cursor: w.region_id ? 'pointer' : 'default' }}>
                            <span style={{ width: 8, height: 8, borderRadius: '50%', background: warna, display: 'inline-block' }}></span>
                            <strong>{w.nama}</strong>
                            <span style={{ color: 'var(--ink-soft)' }}>· {w.kecamatan} Kec · {w.jumlah_sub || '-'} {w.label_sub}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* LAYANAN PMI */}
            <div className="ribbon" style={{ marginTop: 22, background: 'linear-gradient(90deg, var(--water) 0%, #164E7F 100%)' }}><Ikon nama="aktivitas" size={18} /> LAYANAN PMI DI LAPANGAN</div>
            <div className="poster-section" style={bagianKecil}>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(110px,1fr))', gap: 4 }}>
                {LAYANAN.map(([key, ikon, label, satuan]) => (
                  <div key={key} className="icon-stat">
                    <div className="circle" style={{ background: 'var(--water-bg)', color: 'var(--water)' }}><Ikon nama={ikon} size={26} /></div>
                    <div className="num" style={{ color: 'var(--water)' }}>{angka(show.layanan[key])}</div>
                    <div className="lbl2">{label} <span style={{ opacity: .6 }}>({satuan})</span></div>
                  </div>
                ))}
              </div>
            </div>

            {/* BANTUAN */}
            <div className="ribbon" style={{ marginTop: 22, background: 'linear-gradient(90deg, var(--gold) 0%, #7A5606 100%)' }}><Ikon nama="paket" size={18} /> BANTUAN YANG DISALURKAN</div>
            <div className="poster-section" style={bagianKecil}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10 }}>
                {show.bantuan_items.length === 0 ? <span style={{ color: 'var(--ink-soft)', fontSize: 13 }}>Belum ada data bantuan.</span> :
                show.bantuan_items.map((b, i) => (
                  <div key={i} style={{ background: 'var(--gold-bg)', borderRadius: 14, padding: '12px 16px', textAlign: 'center', minWidth: 100 }}>
                    <div style={{ fontSize: 20, fontWeight: 800, color: 'var(--gold)' }}>{b.jumlah}</div>
                    <div style={{ fontSize: 10.5, color: 'var(--ink-soft)', fontWeight: 600 }}>{b.satuan}</div>
                    <div style={{ fontSize: 12.5, fontWeight: 700, marginTop: 4 }}>{b.nama}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* PENERIMA MANFAAT + SUMBER DAYA */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginTop: 22 }}>
              <div>
                <div className="ribbon" style={{ background: 'linear-gradient(90deg, var(--stock) 0%, #163D2C 100%)' }}><Ikon nama="orang2" size={18} /> PENERIMA MANFAAT</div>
                <div className="poster-section" style={{ ...bagianKecil, display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {PENERIMA.map(([key, label]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--stock-bg)', padding: '10px 14px', borderRadius: 10 }}>
                      <span style={{ fontSize: 13, fontWeight: 600 }}>{label}</span>
                      <strong style={{ color: 'var(--stock)', fontSize: 15 }}>{angka(show.penerima_manfaat[key])} jiwa</strong>
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="ribbon" style={{ background: 'linear-gradient(90deg, #555 0%, #222 100%)' }}><Ikon nama="truk" size={18} /> SUMBER DAYA</div>
                <div className="poster-section" style={{ ...bagianKecil, display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {SUMBER_DAYA.map(([key, ikon, label]) => (
                    <div key={key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 13, display: 'inline-flex', alignItems: 'center', gap: 8 }}><Ikon nama={ikon} size={17} style={{ color: 'var(--ink-soft)' }} /> {label}</span>
                      <strong>{angka(show.sumber_daya[key])} {key === 'personil' ? 'orang' : 'unit'}</strong>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER CTA */}
          <div style={{ background: 'var(--pmi-red-dark)', color: '#fff', padding: '24px 28px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', opacity: .7, marginBottom: 10 }}>Contact Person</div>
              {show.kontak.length === 0 ? <div style={{ opacity: .7, fontSize: 13 }}>Belum ada kontak.</div> :
              show.kontak.map((k, i) => (
                <div key={i} style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13.5, padding: '5px 0', borderBottom: i < show.kontak.length - 1 ? '1px solid rgba(255,255,255,.15)' : 'none' }}>
                  <span style={{ fontWeight: 600 }}>{k.nama}</span><span className="mono">{k.nomor}</span>
                </div>
              ))}
            </div>
            <div>
              <div style={{ fontSize: 11, fontWeight: 700, letterSpacing: '.08em', textTransform: 'uppercase', opacity: .7, marginBottom: 10 }}>Salurkan Donasi</div>
              <div style={{ fontSize: 13, opacity: .85, marginBottom: 4 }}>{show.rekening.bank || '-'}</div>
              <div className="mono" style={{ fontSize: 24, fontWeight: 800, marginBottom: 4 }}>{show.rekening.nomor || '-'}</div>
              <div style={{ fontSize: 13 }}>a.n <strong>{show.rekening.atas_nama || '-'}</strong></div>
            </div>
          </div>
        </div>
      </div>

      {editing && (
        <EditInfografis draft={draft} setDraft={setDraft} upd={upd} onSimpan={simpan} onBatal={batalEdit}
                        saving={saving} dirty={dirty} aktifWilayah={aktifWilayah} setAktifWilayah={setAktifWilayah} />
      )}
    </div>
  )
}
