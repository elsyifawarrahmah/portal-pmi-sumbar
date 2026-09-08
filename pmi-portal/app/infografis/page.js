'use client'
import { useEffect, useState } from 'react'
import { createClient } from '@/lib/supabase-browser'
import Sidebar from '@/components/Sidebar'
import PetaSumbar, { REGIONS, STATUS_WARNA } from '@/components/PetaSumbar'

const KOSONG = {
  judul: 'Bencana Hidrometeorologi Sumatera Barat',
  deskripsi: '',
  tanggal_update: '',
  status_keterangan: '',
  dampak: { meninggal:0, hilang:0, luka:0, mengungsi:0, terdampak:0, rumah_hanyut:0, jembatan_rusak:0, tempat_ibadah_rusak:0, faskes_rusak:0 },
  layanan: { distribusi_air_liter:0, distribusi_air_jiwa:0, ews_unit:0, mobile_clinic_jiwa:0, sumur_bor_unit:0, dukungan_psikososial_jiwa:0 },
  penerima_manfaat: { air_bersih_jiwa:0, bantuan_jiwa:0, total_jiwa:0 },
  sumber_daya: { ambulans:0, pickup:0, minibus:0, truk_tanki:0, personil:0 },
  kontak: [],
  rekening: { bank:'', nomor:'', atas_nama:'' },
  wilayah_status: {},
  bantuan_items: [],
  wilayah_detail: [],
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

  useEffect(() => { load() }, [])

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

  function mulaiEdit() {
    setDraft(JSON.parse(JSON.stringify(data)))
    setEditing(true)
  }

  async function simpan() {
    setSaving(true)
    const { data: userData } = await supabase.auth.getUser()
    const { error } = await supabase.from('infografis_bencana').update({
      data: draft, updated_at: new Date().toISOString(), updated_by: userData.user.id,
    }).eq('id', rowId)
    setSaving(false)
    if (error) { alert('Gagal menyimpan: ' + error.message); return }
    setData(draft)
    setEditing(false)
  }

  function upd(path, value) {
    setDraft(d => {
      const copy = { ...d }
      let ref = copy
      const keys = path.split('.')
      for (let i = 0; i < keys.length - 1; i++) { ref[keys[i]] = { ...ref[keys[i]] }; ref = ref[keys[i]] }
      ref[keys[keys.length - 1]] = value
      return copy
    })
  }

  function tambahKontak() { setDraft(d => ({ ...d, kontak: [...d.kontak, { nama:'', nomor:'' }] })) }
  function hapusKontak(i) { setDraft(d => ({ ...d, kontak: d.kontak.filter((_,idx)=>idx!==i) })) }
  function updKontak(i, field, val) { setDraft(d => ({ ...d, kontak: d.kontak.map((k,idx)=>idx===i?{...k,[field]:val}:k) })) }

  function tambahBantuan() { setDraft(d => ({ ...d, bantuan_items: [...d.bantuan_items, { nama:'', jumlah:'', satuan:'' }] })) }
  function hapusBantuan(i) { setDraft(d => ({ ...d, bantuan_items: d.bantuan_items.filter((_,idx)=>idx!==i) })) }
  function updBantuan(i, field, val) { setDraft(d => ({ ...d, bantuan_items: d.bantuan_items.map((b,idx)=>idx===i?{...b,[field]:val}:b) })) }

  function tambahWilayah() { setDraft(d => ({ ...d, wilayah_detail: [...d.wilayah_detail, { nama:'', kecamatan:'', jumlah_sub:'', label_sub:'Kelurahan' }] })) }
  function hapusWilayah(i) { setDraft(d => ({ ...d, wilayah_detail: d.wilayah_detail.filter((_,idx)=>idx!==i) })) }
  function updWilayah(i, field, val) { setDraft(d => ({ ...d, wilayah_detail: d.wilayah_detail.map((w,idx)=>idx===i?{...w,[field]:val}:w) })) }

  if (loading) return <div className="app"><Sidebar /><div className="main">Memuat...</div></div>

  const show = editing ? draft : data

  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div>
            <h1>🌊 Infografis Bencana Hidrometeorologi</h1>
            <p className="desc">Sumatera Barat — data langsung, bisa diperbarui admin kapan saja.</p>
          </div>
          {isAdmin && !editing && <button className="btn btn-primary" onClick={mulaiEdit}>✏️ Edit Data</button>}
          {editing && (
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-ghost" onClick={()=>setEditing(false)}>Batal</button>
              <button className="btn btn-primary" onClick={simpan} disabled={saving}>{saving?'Menyimpan...':'💾 Simpan Semua'}</button>
            </div>
          )}
        </div>

        {/* HERO */}
        <div style={{
          background:'linear-gradient(135deg, var(--pmi-red) 0%, var(--pmi-red-dark) 100%)', borderRadius:18,
          padding:'26px 28px', color:'#fff', marginBottom:20, boxShadow:'0 12px 30px rgba(200,16,46,.25)'
        }}>
          {editing ? (
            <>
              <input value={draft.judul} onChange={e=>upd('judul', e.target.value)} style={{fontSize:22,fontWeight:700,marginBottom:10,background:'rgba(255,255,255,.15)',color:'#fff',border:'1px solid rgba(255,255,255,.3)'}} />
              <textarea value={draft.deskripsi} onChange={e=>upd('deskripsi', e.target.value)} rows={3} style={{width:'100%',padding:10,borderRadius:8,border:'1px solid rgba(255,255,255,.3)',background:'rgba(255,255,255,.15)',color:'#fff',fontSize:13}} />
              <div style={{display:'flex',gap:10,marginTop:10,flexWrap:'wrap'}}>
                <div><label style={{color:'rgba(255,255,255,.8)',fontSize:11}}>Tanggal Update</label><input type="date" value={draft.tanggal_update} onChange={e=>upd('tanggal_update', e.target.value)} /></div>
                <div style={{flex:1,minWidth:200}}><label style={{color:'rgba(255,255,255,.8)',fontSize:11}}>Status/Keterangan</label><input value={draft.status_keterangan} onChange={e=>upd('status_keterangan', e.target.value)} placeholder="Masa Transisi Pemulihan Bencana" style={{width:'100%'}} /></div>
              </div>
            </>
          ) : (
            <>
              <h2 style={{margin:'0 0 10px',fontSize:22}}>{show.judul}</h2>
              <p style={{margin:0,fontSize:13.5,lineHeight:1.7,opacity:.95,maxWidth:760}}>{show.deskripsi || 'Belum ada deskripsi — klik Edit Data untuk menambahkan.'}</p>
              <div style={{display:'flex',gap:10,marginTop:14,flexWrap:'wrap'}}>
                {show.tanggal_update && <span style={{background:'rgba(255,255,255,.18)',padding:'6px 14px',borderRadius:20,fontSize:12.5,fontWeight:600}}>📅 Update: {new Date(show.tanggal_update).toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'})}</span>}
                {show.status_keterangan && <span style={{background:'#fff',color:'var(--pmi-red-dark)',padding:'6px 14px',borderRadius:20,fontSize:12.5,fontWeight:700}}>{show.status_keterangan}</span>}
              </div>
            </>
          )}
        </div>

        {/* PETA + WILAYAH */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20}}>
          <div className="panel" style={{marginBottom:0}}>
            <div className="panel-head"><h3>🗺️ Peta Wilayah Terdampak</h3></div>
            <div className="panel-body">
              <PetaSumbar statusWilayah={show.wilayah_status} aktif={aktifWilayah} onSelect={editing ? (id)=>setAktifWilayah(id) : undefined} />
              <div style={{display:'flex',gap:14,justifyContent:'center',marginTop:14,flexWrap:'wrap'}}>
                {Object.entries(STATUS_WARNA).map(([k,v]) => (
                  <div key={k} style={{display:'flex',alignItems:'center',gap:6,fontSize:11.5}}>
                    <span style={{width:11,height:11,borderRadius:3,background:v,display:'inline-block'}}></span>
                    <span style={{textTransform:'capitalize'}}>{k}</span>
                  </div>
                ))}
              </div>
              {editing && (
                <div style={{marginTop:16,borderTop:'1px solid var(--line)',paddingTop:14}}>
                  <div style={{fontSize:12,fontWeight:600,marginBottom:8,color:'var(--ink-soft)'}}>Klik wilayah di peta, lalu atur statusnya:</div>
                  {aktifWilayah && (
                    <div style={{display:'flex',alignItems:'center',gap:8}}>
                      <strong style={{fontSize:13}}>{REGIONS.find(r=>r.id===aktifWilayah)?.nama}</strong>
                      <select value={draft.wilayah_status[aktifWilayah] || 'aman'} onChange={e=>upd(`wilayah_status.${aktifWilayah}`, e.target.value)}>
                        {Object.keys(STATUS_WARNA).map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  )}
                  {!aktifWilayah && <div style={{fontSize:12,color:'var(--ink-soft)'}}>Belum ada wilayah dipilih.</div>}
                </div>
              )}
            </div>
          </div>

          <div className="panel" style={{marginBottom:0}}>
            <div className="panel-head">
              <h3>📋 Detail Kabupaten/Kota</h3>
              {editing && <button className="btn btn-ghost" style={{padding:'4px 10px',fontSize:12}} onClick={tambahWilayah}>+ Tambah</button>}
            </div>
            <div className="panel-body" style={{maxHeight:380, overflowY:'auto'}}>
              {editing ? (
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {draft.wilayah_detail.map((w,i) => (
                    <div key={i} style={{display:'flex',gap:6,alignItems:'center'}}>
                      <input value={w.nama} onChange={e=>updWilayah(i,'nama',e.target.value)} placeholder="Nama wilayah" style={{flex:2}} />
                      <input value={w.kecamatan} onChange={e=>updWilayah(i,'kecamatan',e.target.value)} placeholder="Kec." style={{flex:1}} type="number" />
                      <input value={w.jumlah_sub} onChange={e=>updWilayah(i,'jumlah_sub',e.target.value)} placeholder="Jml" style={{flex:1}} type="number" />
                      <input value={w.label_sub} onChange={e=>updWilayah(i,'label_sub',e.target.value)} placeholder="Kelurahan/Nagari" style={{flex:1}} />
                      <button className="btn btn-ghost" style={{padding:'4px 8px'}} onClick={()=>hapusWilayah(i)}>✕</button>
                    </div>
                  ))}
                </div>
              ) : (
                <table>
                  <thead><tr><th>Wilayah</th><th>Kec.</th><th>Rincian</th></tr></thead>
                  <tbody>
                    {show.wilayah_detail.length === 0 ? <tr><td colSpan={3} style={{color:'var(--ink-soft)',textAlign:'center',padding:20}}>Belum ada data.</td></tr> :
                    show.wilayah_detail.map((w,i) => (
                      <tr key={i}><td><strong>{w.nama}</strong></td><td className="num">{w.kecamatan}</td><td className="num">{w.jumlah_sub} {w.label_sub}</td></tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* DAMPAK */}
        <div className="panel">
          <div className="panel-head"><h3>💥 Dampak Bencana</h3></div>
          <div className="panel-body">
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(160px, 1fr))', gap:14}}>
              {[
                ['meninggal','🙏 Meninggal','orang'], ['hilang','🔍 Hilang','orang'], ['luka','🩹 Luka','orang'],
                ['mengungsi','🏕️ Mengungsi','jiwa'], ['terdampak','👨‍👩‍👧 Terdampak','jiwa'], ['rumah_hanyut','🏚️ Rumah Hanyut','unit'],
                ['jembatan_rusak','🌉 Jembatan Rusak','unit'], ['tempat_ibadah_rusak','🕌 Tempat Ibadah','unit'], ['faskes_rusak','🏥 Faskes Rusak','unit'],
              ].map(([key,label,satuan]) => (
                <div key={key} className="stat" style={{'--accent':'var(--pmi-red)'}}>
                  <div className="lbl">{label}</div>
                  {editing ? (
                    <input type="number" value={draft.dampak[key]} onChange={e=>upd(`dampak.${key}`, Number(e.target.value))} style={{marginTop:6,fontWeight:700,fontSize:18}} />
                  ) : (
                    <div className="val" style={{fontSize:22}}>{Number(show.dampak[key]||0).toLocaleString('id-ID')}</div>
                  )}
                  <div className="unit">{satuan}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* LAYANAN PMI */}
        <div className="panel">
          <div className="panel-head"><h3>🚑 Layanan PMI di Lapangan</h3></div>
          <div className="panel-body">
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(170px, 1fr))', gap:14}}>
              {[
                ['distribusi_air_liter','💧 Distribusi Air','liter'], ['distribusi_air_jiwa','👥 Penerima Air','jiwa'],
                ['ews_unit','📡 Rambu EWS','unit'], ['mobile_clinic_jiwa','🏥 Mobile Clinic','jiwa'],
                ['sumur_bor_unit','⛲ Sumur Bor','unit'], ['dukungan_psikososial_jiwa','💚 Dukungan Psikososial','jiwa'],
              ].map(([key,label,satuan]) => (
                <div key={key} className="stat" style={{'--accent':'var(--water)'}}>
                  <div className="lbl">{label}</div>
                  {editing ? (
                    <input type="number" value={draft.layanan[key]} onChange={e=>upd(`layanan.${key}`, Number(e.target.value))} style={{marginTop:6,fontWeight:700,fontSize:18}} />
                  ) : (
                    <div className="val" style={{fontSize:20}}>{Number(show.layanan[key]||0).toLocaleString('id-ID')}</div>
                  )}
                  <div className="unit">{satuan}</div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* BANTUAN PMI */}
        <div className="panel">
          <div className="panel-head">
            <h3>📦 Bantuan yang Disalurkan</h3>
            {editing && <button className="btn btn-ghost" style={{padding:'4px 10px',fontSize:12}} onClick={tambahBantuan}>+ Tambah Item</button>}
          </div>
          <div className="panel-body">
            {editing ? (
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {draft.bantuan_items.map((b,i) => (
                  <div key={i} style={{display:'flex',gap:6}}>
                    <input value={b.nama} onChange={e=>updBantuan(i,'nama',e.target.value)} placeholder="Nama barang" style={{flex:2}} />
                    <input value={b.jumlah} onChange={e=>updBantuan(i,'jumlah',e.target.value)} placeholder="Jumlah" style={{flex:1}} type="number" />
                    <input value={b.satuan} onChange={e=>updBantuan(i,'satuan',e.target.value)} placeholder="pcs/karung/dus" style={{flex:1}} />
                    <button className="btn btn-ghost" style={{padding:'4px 8px'}} onClick={()=>hapusBantuan(i)}>✕</button>
                  </div>
                ))}
                {draft.bantuan_items.length === 0 && <div style={{fontSize:12,color:'var(--ink-soft)'}}>Klik "+ Tambah Item" untuk mulai.</div>}
              </div>
            ) : (
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fill, minmax(140px, 1fr))', gap:10}}>
                {show.bantuan_items.length === 0 ? <div style={{color:'var(--ink-soft)',fontSize:13}}>Belum ada data bantuan.</div> :
                show.bantuan_items.map((b,i) => (
                  <div key={i} style={{background:'var(--cream)',borderRadius:10,padding:'10px 12px',textAlign:'center'}}>
                    <div style={{fontSize:18,fontWeight:700,color:'var(--pmi-red)'}}>{b.jumlah}</div>
                    <div style={{fontSize:11,color:'var(--ink-soft)'}}>{b.satuan}</div>
                    <div style={{fontSize:12.5,fontWeight:600,marginTop:4}}>{b.nama}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* PENERIMA MANFAAT + SUMBER DAYA */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20}}>
          <div className="panel" style={{marginBottom:0}}>
            <div className="panel-head"><h3>🤝 Penerima Manfaat</h3></div>
            <div className="panel-body" style={{display:'flex',flexDirection:'column',gap:10}}>
              {[['air_bersih_jiwa','Air Bersih'],['bantuan_jiwa','Bantuan'],['total_jiwa','Total Layanan PMI']].map(([key,label]) => (
                <div key={key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--stock-bg)',padding:'10px 14px',borderRadius:10}}>
                  <span style={{fontSize:13,fontWeight:600}}>{label}</span>
                  {editing ? (
                    <input type="number" value={draft.penerima_manfaat[key]} onChange={e=>upd(`penerima_manfaat.${key}`, Number(e.target.value))} style={{width:120,textAlign:'right'}} />
                  ) : (
                    <strong style={{color:'var(--stock)'}}>{Number(show.penerima_manfaat[key]||0).toLocaleString('id-ID')} jiwa</strong>
                  )}
                </div>
              ))}
            </div>
          </div>
          <div className="panel" style={{marginBottom:0}}>
            <div className="panel-head"><h3>🚚 Sumber Daya</h3></div>
            <div className="panel-body" style={{display:'flex',flexDirection:'column',gap:8}}>
              {[['ambulans','Ambulans'],['pickup','Pickup Granmax'],['minibus','Minibus Double Cabin'],['truk_tanki','Truk Tanki Air Bersih'],['personil','Personil PMI']].map(([key,label]) => (
                <div key={key} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                  <span style={{fontSize:13}}>{label}</span>
                  {editing ? (
                    <input type="number" value={draft.sumber_daya[key]} onChange={e=>upd(`sumber_daya.${key}`, Number(e.target.value))} style={{width:90,textAlign:'right'}} />
                  ) : (
                    <strong>{Number(show.sumber_daya[key]||0).toLocaleString('id-ID')} unit</strong>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* KONTAK + DONASI */}
        <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
          <div className="panel" style={{marginBottom:0}}>
            <div className="panel-head">
              <h3>📞 Contact Person</h3>
              {editing && <button className="btn btn-ghost" style={{padding:'4px 10px',fontSize:12}} onClick={tambahKontak}>+ Tambah</button>}
            </div>
            <div className="panel-body">
              {editing ? (
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {draft.kontak.map((k,i) => (
                    <div key={i} style={{display:'flex',gap:6}}>
                      <input value={k.nama} onChange={e=>updKontak(i,'nama',e.target.value)} placeholder="Nama" style={{flex:1}} />
                      <input value={k.nomor} onChange={e=>updKontak(i,'nomor',e.target.value)} placeholder="No. HP" style={{flex:1}} />
                      <button className="btn btn-ghost" style={{padding:'4px 8px'}} onClick={()=>hapusKontak(i)}>✕</button>
                    </div>
                  ))}
                </div>
              ) : (
                <table><tbody>
                  {show.kontak.length === 0 ? <tr><td style={{color:'var(--ink-soft)'}}>Belum ada kontak.</td></tr> :
                  show.kontak.map((k,i) => <tr key={i}><td><strong>{k.nama}</strong></td><td className="mono">{k.nomor}</td></tr>)}
                </tbody></table>
              )}
            </div>
          </div>
          <div className="panel" style={{marginBottom:0}}>
            <div className="panel-head"><h3>💳 Salurkan Donasi</h3></div>
            <div className="panel-body">
              {editing ? (
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  <input value={draft.rekening.bank} onChange={e=>upd('rekening.bank', e.target.value)} placeholder="Nama Bank" />
                  <input value={draft.rekening.nomor} onChange={e=>upd('rekening.nomor', e.target.value)} placeholder="Nomor Rekening" />
                  <input value={draft.rekening.atas_nama} onChange={e=>upd('rekening.atas_nama', e.target.value)} placeholder="Atas Nama" />
                </div>
              ) : (
                <>
                  <div style={{fontSize:13, color:'var(--ink-soft)', marginBottom:6}}>{show.rekening.bank || '-'}</div>
                  <div className="mono" style={{fontSize:20, fontWeight:700, marginBottom:6}}>{show.rekening.nomor || '-'}</div>
                  <div style={{fontSize:13}}>a.n <strong>{show.rekening.atas_nama || '-'}</strong></div>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
