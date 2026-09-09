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

const DAMPAK_ICON = [
  ['meninggal','🙏','Meninggal','orang','#B3261E'],
  ['hilang','🔍','Hilang','orang','#B3261E'],
  ['luka','🩹','Luka','orang','#D98E04'],
  ['mengungsi','🏕️','Mengungsi','jiwa','#D98E04'],
  ['terdampak','👨‍👩‍👧','Terdampak','jiwa','#1F6FB2'],
  ['rumah_hanyut','🏚️','Rumah Hanyut','unit','#B3261E'],
  ['jembatan_rusak','🌉','Jembatan Rusak','unit','#D98E04'],
  ['tempat_ibadah_rusak','🕌','Tempat Ibadah','unit','#D98E04'],
  ['faskes_rusak','🏥','Faskes Rusak','unit','#D98E04'],
]
const LAYANAN_ICON = [
  ['distribusi_air_liter','💧','Air Terdistribusi','liter'],
  ['distribusi_air_jiwa','👥','Penerima Air','jiwa'],
  ['ews_unit','📡','Rambu EWS','unit'],
  ['mobile_clinic_jiwa','🏥','Mobile Clinic','jiwa'],
  ['sumur_bor_unit','⛲','Sumur Bor','unit'],
  ['dukungan_psikososial_jiwa','💚','Dukungan Psikososial','jiwa'],
]

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

  function mulaiEdit() { setDraft(JSON.parse(JSON.stringify(data))); setEditing(true) }

  async function simpan() {
    setSaving(true)
    const { data: userData } = await supabase.auth.getUser()
    const { error } = await supabase.from('infografis_bencana').update({
      data: draft, updated_at: new Date().toISOString(), updated_by: userData.user.id,
    }).eq('id', rowId)
    setSaving(false)
    if (error) { alert('Gagal menyimpan: ' + error.message); return }
    setData(draft); setEditing(false)
  }

  function upd(path, value) {
    setDraft(d => {
      const copy = { ...d }; let ref = copy; const keys = path.split('.')
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
          <div><h1>Infografis Bencana</h1><p className="desc">Ringkasan visual — dibagikan seperti poster, datanya tetap hidup.</p></div>
          {isAdmin && !editing && <button className="btn btn-primary" onClick={mulaiEdit}>✏️ Edit Data</button>}
          {editing && (
            <div style={{display:'flex',gap:8}}>
              <button className="btn btn-ghost" onClick={()=>setEditing(false)}>Batal</button>
              <button className="btn btn-primary" onClick={simpan} disabled={saving}>{saving?'Menyimpan...':'💾 Simpan Semua'}</button>
            </div>
          )}
        </div>

        {editing && (
          <div style={{background:'var(--gold-bg)',color:'var(--gold)',padding:'10px 14px',borderRadius:10,fontSize:12.5,fontWeight:600,marginBottom:16}}>
            ✏️ Mode Edit aktif — ubah data di bawah, lalu klik "Simpan Semua" di pojok kanan atas.
          </div>
        )}

        {/* ===== POSTER ===== */}
        <div style={{background:'#fff', borderRadius:22, padding:0, overflow:'hidden', boxShadow:'0 16px 50px rgba(32,28,26,.12)', border:'3px solid var(--pmi-red)'}}>

          {/* HERO */}
          <div style={{background:'linear-gradient(135deg, var(--pmi-red) 0%, var(--pmi-red-dark) 100%)', padding:'32px 32px 26px', color:'#fff', position:'relative'}}>
            <div style={{display:'inline-block',background:'rgba(255,255,255,.2)',padding:'4px 14px',borderRadius:20,fontSize:11,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',marginBottom:12}}>Infografis</div>
            {editing ? (
              <>
                <input value={draft.judul} onChange={e=>upd('judul', e.target.value)} style={{fontSize:26,fontWeight:800,marginBottom:10,background:'rgba(255,255,255,.15)',color:'#fff',border:'1px solid rgba(255,255,255,.3)',width:'100%'}} />
                <textarea value={draft.deskripsi} onChange={e=>upd('deskripsi', e.target.value)} rows={3} style={{width:'100%',padding:10,borderRadius:8,border:'1px solid rgba(255,255,255,.3)',background:'rgba(255,255,255,.15)',color:'#fff',fontSize:13}} />
                <div style={{display:'flex',gap:10,marginTop:10,flexWrap:'wrap'}}>
                  <div><label style={{color:'rgba(255,255,255,.8)',fontSize:11}}>Tanggal Update</label><input type="date" value={draft.tanggal_update} onChange={e=>upd('tanggal_update', e.target.value)} /></div>
                  <div style={{flex:1,minWidth:200}}><label style={{color:'rgba(255,255,255,.8)',fontSize:11}}>Status/Keterangan</label><input value={draft.status_keterangan} onChange={e=>upd('status_keterangan', e.target.value)} style={{width:'100%'}} /></div>
                </div>
              </>
            ) : (
              <>
                <h1 style={{margin:'0 0 12px',fontSize:'clamp(22px,3.2vw,32px)',fontWeight:800,lineHeight:1.15}}>{show.judul}</h1>
                <p style={{margin:'0 0 16px',fontSize:14,lineHeight:1.7,opacity:.95,maxWidth:820}}>{show.deskripsi || 'Belum ada deskripsi.'}</p>
                <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                  {show.tanggal_update && <span style={{background:'rgba(255,255,255,.2)',padding:'7px 16px',borderRadius:20,fontSize:12.5,fontWeight:700}}>📅 {new Date(show.tanggal_update).toLocaleDateString('id-ID',{day:'2-digit',month:'long',year:'numeric'})}</span>}
                  {show.status_keterangan && <span style={{background:'#fff',color:'var(--pmi-red-dark)',padding:'7px 16px',borderRadius:20,fontSize:12.5,fontWeight:800}}>⚡ {show.status_keterangan}</span>}
                </div>
              </>
            )}
          </div>

          <div style={{padding:'26px 28px', background:'var(--cream)'}}>

            {/* DAMPAK */}
            <div className="ribbon">💥 DAMPAK BENCANA</div>
            <div className="poster-section" style={{marginTop:-8, borderTop:'none', borderTopLeftRadius:0, borderTopRightRadius:0}}>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(110px,1fr))', gap:4}}>
                {DAMPAK_ICON.map(([key,icon,label,satuan,warna]) => (
                  <div key={key} className="icon-stat">
                    <div className="circle" style={{background:warna+'22'}}>{icon}</div>
                    {editing ? (
                      <input type="number" value={draft.dampak[key]} onChange={e=>upd(`dampak.${key}`, Number(e.target.value))} style={{width:80,textAlign:'center',fontWeight:700}} />
                    ) : (
                      <div className="num" style={{color:warna}}>{Number(show.dampak[key]||0).toLocaleString('id-ID')}</div>
                    )}
                    <div className="lbl2">{label} <span style={{opacity:.6}}>({satuan})</span></div>
                  </div>
                ))}
              </div>
            </div>

            {/* PETA */}
            <div className="ribbon" style={{marginTop:22}}>🗺️ PETA WILAYAH TERDAMPAK</div>
            <div className="poster-section" style={{marginTop:-8, borderTop:'none', borderTopLeftRadius:0, borderTopRightRadius:0}}>
              <div style={{display:'grid', gridTemplateColumns: editing ? '1fr' : '1fr 1.1fr', gap:20, alignItems:'center'}}>
                <div>
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
                    <div style={{marginTop:14,borderTop:'1px solid var(--line)',paddingTop:12,textAlign:'center'}}>
                      <div style={{fontSize:12,fontWeight:600,marginBottom:8,color:'var(--ink-soft)'}}>Klik wilayah di peta, lalu atur statusnya:</div>
                      {aktifWilayah ? (
                        <div style={{display:'inline-flex',alignItems:'center',gap:8}}>
                          <strong style={{fontSize:13}}>{REGIONS.find(r=>r.id===aktifWilayah)?.nama}</strong>
                          <select value={draft.wilayah_status[aktifWilayah] || 'aman'} onChange={e=>upd(`wilayah_status.${aktifWilayah}`, e.target.value)}>
                            {Object.keys(STATUS_WARNA).map(s => <option key={s} value={s}>{s}</option>)}
                          </select>
                        </div>
                      ) : <div style={{fontSize:12,color:'var(--ink-soft)'}}>Belum ada wilayah dipilih.</div>}
                    </div>
                  )}
                </div>
                {!editing && (
                  <div style={{display:'flex',flexWrap:'wrap',gap:8,alignContent:'flex-start'}}>
                    {show.wilayah_detail.length === 0 ? <span style={{color:'var(--ink-soft)',fontSize:13}}>Belum ada data wilayah.</span> :
                    show.wilayah_detail.map((w,i) => {
                      const regionMatch = REGIONS.find(r => r.nama.toLowerCase().includes(w.nama.toLowerCase().replace('kab. ','').replace('kota ','')) || w.nama.toLowerCase().includes(r.nama.toLowerCase()))
                      const warna = regionMatch ? (STATUS_WARNA[show.wilayah_status[regionMatch.id]] || STATUS_WARNA.aman) : STATUS_WARNA.aman
                      return (
                        <div key={i} className="chip" style={{background:warna+'20', border:`1px solid ${warna}55`}}>
                          <span style={{width:8,height:8,borderRadius:'50%',background:warna,display:'inline-block'}}></span>
                          <strong>{w.nama}</strong>
                          <span style={{color:'var(--ink-soft)'}}>· {w.kecamatan} Kec · {w.jumlah_sub || '-'} {w.label_sub}</span>
                        </div>
                      )
                    })}
                  </div>
                )}
                {editing && (
                  <div style={{gridColumn:'1 / -1'}}>
                    <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',marginBottom:8}}>
                      <strong style={{fontSize:13}}>Daftar Wilayah</strong>
                      <button className="btn btn-ghost" style={{padding:'4px 10px',fontSize:12}} onClick={tambahWilayah}>+ Tambah</button>
                    </div>
                    <div style={{display:'flex',flexDirection:'column',gap:8,maxHeight:280,overflowY:'auto'}}>
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
                  </div>
                )}
              </div>
            </div>

            {/* LAYANAN PMI */}
            <div className="ribbon" style={{marginTop:22, background:'linear-gradient(90deg, var(--water) 0%, #164E7F 100%)'}}>🚑 LAYANAN PMI DI LAPANGAN</div>
            <div className="poster-section" style={{marginTop:-8, borderTop:'none', borderTopLeftRadius:0, borderTopRightRadius:0}}>
              <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(110px,1fr))', gap:4}}>
                {LAYANAN_ICON.map(([key,icon,label,satuan]) => (
                  <div key={key} className="icon-stat">
                    <div className="circle" style={{background:'var(--water-bg)'}}>{icon}</div>
                    {editing ? (
                      <input type="number" value={draft.layanan[key]} onChange={e=>upd(`layanan.${key}`, Number(e.target.value))} style={{width:80,textAlign:'center',fontWeight:700}} />
                    ) : (
                      <div className="num" style={{color:'var(--water)'}}>{Number(show.layanan[key]||0).toLocaleString('id-ID')}</div>
                    )}
                    <div className="lbl2">{label} <span style={{opacity:.6}}>({satuan})</span></div>
                  </div>
                ))}
              </div>
            </div>

            {/* BANTUAN */}
            <div className="ribbon" style={{marginTop:22, background:'linear-gradient(90deg, var(--gold) 0%, #7A5606 100%)'}}>
              📦 BANTUAN YANG DISALURKAN
              {editing && <button className="btn btn-ghost" style={{padding:'3px 10px',fontSize:11,marginLeft:'auto',background:'#fff'}} onClick={tambahBantuan}>+ Tambah</button>}
            </div>
            <div className="poster-section" style={{marginTop:-8, borderTop:'none', borderTopLeftRadius:0, borderTopRightRadius:0}}>
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
                  {draft.bantuan_items.length === 0 && <div style={{fontSize:12,color:'var(--ink-soft)'}}>Klik "+ Tambah" untuk mulai.</div>}
                </div>
              ) : (
                <div style={{display:'flex',flexWrap:'wrap',gap:10}}>
                  {show.bantuan_items.length === 0 ? <span style={{color:'var(--ink-soft)',fontSize:13}}>Belum ada data bantuan.</span> :
                  show.bantuan_items.map((b,i) => (
                    <div key={i} style={{background:'var(--gold-bg)',borderRadius:14,padding:'12px 16px',textAlign:'center',minWidth:100}}>
                      <div style={{fontSize:20,fontWeight:800,color:'var(--gold)'}}>{b.jumlah}</div>
                      <div style={{fontSize:10.5,color:'var(--ink-soft)',fontWeight:600}}>{b.satuan}</div>
                      <div style={{fontSize:12.5,fontWeight:700,marginTop:4}}>{b.nama}</div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* PENERIMA MANFAAT + SUMBER DAYA */}
            <div style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginTop:22}}>
              <div>
                <div className="ribbon" style={{background:'linear-gradient(90deg, var(--stock) 0%, #163D2C 100%)'}}>🤝 PENERIMA MANFAAT</div>
                <div className="poster-section" style={{marginTop:-8, borderTop:'none', borderTopLeftRadius:0, borderTopRightRadius:0, display:'flex', flexDirection:'column', gap:10}}>
                  {[['air_bersih_jiwa','Air Bersih'],['bantuan_jiwa','Bantuan'],['total_jiwa','Total Layanan PMI']].map(([key,label]) => (
                    <div key={key} style={{display:'flex',justifyContent:'space-between',alignItems:'center',background:'var(--stock-bg)',padding:'10px 14px',borderRadius:10}}>
                      <span style={{fontSize:13,fontWeight:600}}>{label}</span>
                      {editing ? (
                        <input type="number" value={draft.penerima_manfaat[key]} onChange={e=>upd(`penerima_manfaat.${key}`, Number(e.target.value))} style={{width:110,textAlign:'right'}} />
                      ) : (
                        <strong style={{color:'var(--stock)',fontSize:15}}>{Number(show.penerima_manfaat[key]||0).toLocaleString('id-ID')} jiwa</strong>
                      )}
                    </div>
                  ))}
                </div>
              </div>
              <div>
                <div className="ribbon" style={{background:'linear-gradient(90deg, #555 0%, #222 100%)'}}>🚚 SUMBER DAYA</div>
                <div className="poster-section" style={{marginTop:-8, borderTop:'none', borderTopLeftRadius:0, borderTopRightRadius:0, display:'flex', flexDirection:'column', gap:8}}>
                  {[['ambulans','🚑 Ambulans'],['pickup','🚗 Pickup Granmax'],['minibus','🚐 Minibus Double Cabin'],['truk_tanki','🚛 Truk Tanki Air'],['personil','👷 Personil PMI']].map(([key,label]) => (
                    <div key={key} style={{display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontSize:13}}>{label}</span>
                      {editing ? (
                        <input type="number" value={draft.sumber_daya[key]} onChange={e=>upd(`sumber_daya.${key}`, Number(e.target.value))} style={{width:80,textAlign:'right'}} />
                      ) : (
                        <strong>{Number(show.sumber_daya[key]||0).toLocaleString('id-ID')} unit</strong>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* FOOTER CTA */}
          <div style={{background:'var(--pmi-red-dark)', color:'#fff', padding:'24px 28px', display:'grid', gridTemplateColumns:'1fr 1fr', gap:20}}>
            <div>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',opacity:.7,marginBottom:10}}>Contact Person</div>
              {editing ? (
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  {draft.kontak.map((k,i) => (
                    <div key={i} style={{display:'flex',gap:6}}>
                      <input value={k.nama} onChange={e=>updKontak(i,'nama',e.target.value)} placeholder="Nama" style={{flex:1}} />
                      <input value={k.nomor} onChange={e=>updKontak(i,'nomor',e.target.value)} placeholder="No. HP" style={{flex:1}} />
                      <button className="btn btn-ghost" style={{padding:'4px 8px'}} onClick={()=>hapusKontak(i)}>✕</button>
                    </div>
                  ))}
                  <button className="btn btn-ghost" style={{alignSelf:'flex-start',padding:'4px 10px',fontSize:12}} onClick={tambahKontak}>+ Tambah Kontak</button>
                </div>
              ) : (
                show.kontak.length === 0 ? <div style={{opacity:.7,fontSize:13}}>Belum ada kontak.</div> :
                show.kontak.map((k,i) => (
                  <div key={i} style={{display:'flex',justifyContent:'space-between',fontSize:13.5,padding:'5px 0',borderBottom: i<show.kontak.length-1 ? '1px solid rgba(255,255,255,.15)' : 'none'}}>
                    <span style={{fontWeight:600}}>{k.nama}</span><span className="mono">{k.nomor}</span>
                  </div>
                ))
              )}
            </div>
            <div>
              <div style={{fontSize:11,fontWeight:700,letterSpacing:'.08em',textTransform:'uppercase',opacity:.7,marginBottom:10}}>Salurkan Donasi</div>
              {editing ? (
                <div style={{display:'flex',flexDirection:'column',gap:6}}>
                  <input value={draft.rekening.bank} onChange={e=>upd('rekening.bank', e.target.value)} placeholder="Nama Bank" />
                  <input value={draft.rekening.nomor} onChange={e=>upd('rekening.nomor', e.target.value)} placeholder="Nomor Rekening" />
                  <input value={draft.rekening.atas_nama} onChange={e=>upd('rekening.atas_nama', e.target.value)} placeholder="Atas Nama" />
                </div>
              ) : (
                <>
                  <div style={{fontSize:13, opacity:.85, marginBottom:4}}>{show.rekening.bank || '-'}</div>
                  <div className="mono" style={{fontSize:24, fontWeight:800, marginBottom:4}}>{show.rekening.nomor || '-'}</div>
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
