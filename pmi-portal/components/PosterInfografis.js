'use client'
// Poster Infografis ukuran tetap (1754 x 1240 px, rasio kertas A landscape).
// Dipakai untuk pratinjau, cetak, unduh gambar, dan bagikan. Semua gaya ditulis langsung (inline)
// supaya hasil unduhan gambar sama persis dengan yang terlihat di layar.
import { forwardRef, useEffect, useMemo, useState } from 'react'
import QRCode from 'qrcode'
import Ikon from '@/components/Ikon'
import SUMBAR_GEO from '@/components/sumbarGeo'
import { DAMPAK, LAYANAN, PENERIMA, POSTER_SUMBER_DAYA as SUMBER_DAYA, STATUS_LABEL, STATUS_WARNA, POSTER_W, POSTER_H, tglID, angkaID, namaWilayah } from '@/lib/infografis'

const MERAH = '#C8102E'
const GELAP = '#8C0F24'
const TEKS = '#1B1715'
const FONT = "'Space Grotesk','Inter','Segoe UI',Arial,sans-serif"

// Proyeksi sederhana (lon/lat -> SVG) untuk peta Sumatera Barat
function bangunPeta() {
  let minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9
  const ring = (g) => (g.type === 'Polygon' ? [g.coordinates] : g.coordinates)
  SUMBAR_GEO.features.forEach(f => ring(f.geometry).forEach(poly => poly.forEach(r => r.forEach(([x, y]) => {
    if (x < minX) minX = x; if (x > maxX) maxX = x; if (y < minY) minY = y; if (y > maxY) maxY = y
  }))))
  const k = Math.cos(((minY + maxY) / 2) * Math.PI / 180)
  const lebar = (maxX - minX) * k, tinggi = maxY - minY
  const skala = 1000 / Math.max(lebar, tinggi)
  const P = ([x, y]) => `${((x - minX) * k * skala).toFixed(1)} ${((maxY - y) * skala).toFixed(1)}`
  const wilayah = SUMBAR_GEO.features.map(f => ({
    id: f.properties.id,
    nama: namaWilayah(f),
    d: ring(f.geometry).map(poly => poly.map(r => 'M' + r.map(P).join('L') + 'Z').join('')).join(''),
  }))
  return { wilayah, w: Math.round(lebar * skala), h: Math.round(tinggi * skala) }
}

function Judul({ children }) {
  return <div style={{ background: MERAH, color: '#fff', fontWeight: 800, fontSize: 19, letterSpacing: '.08em', textAlign: 'center', padding: '6px 14px', borderRadius: 999, textTransform: 'uppercase' }}>{children}</div>
}

const PosterInfografis = forwardRef(function PosterInfografis({ data, lebar }, ref) {
  const peta = useMemo(bangunPeta, [])
  const [qr, setQr] = useState('')
  const tautan = (data.tautan_donasi || '').trim()
  useEffect(() => {
    let batal = false
    if (!tautan) { setQr(''); return }
    QRCode.toDataURL(tautan, { margin: 1, width: 420, color: { dark: '#1B1715', light: '#FFFFFF' } }).then(u => { if (!batal) setQr(u) }).catch(() => { if (!batal) setQr('') })
    return () => { batal = true }
  }, [tautan])

  const ws = data.wilayah_status || {}
  const urut = { parah: 0, sedang: 1, ringan: 2 }
  const kartu = SUMBAR_GEO.features
    .map(f => ({ id: f.properties.id, nama: namaWilayah(f), st: ws[f.properties.id] || 'aman' }))
    .filter(r => r.st !== 'aman')
    .sort((a, b) => urut[a.st] - urut[b.st])
    .map(r => {
      const det = (data.wilayah_detail || []).find(x => x.region_id === r.id)
      const kec = det && Number(det.kecamatan) > 0 ? `${angkaID(det.kecamatan)} Kecamatan` : ''
      const sub = det && Number(det.jumlah_sub) > 0 ? `${angkaID(det.jumlah_sub)} ${det.label_sub || 'Nagari'}` : ''
      return { ...r, info: [kec, sub].filter(Boolean).join('  |  ') || 'Dampak ' + STATUS_LABEL[r.st].toLowerCase() }
    })
  const foto = (data.foto || []).filter(Boolean).slice(0, 4)
  const bantuan = (data.bantuan_items || []).filter(b => b.nama).slice(0, 16)
  const mendesak = (data.kebutuhan_mendesak || []).map(x => String(x).trim()).filter(Boolean).slice(0, 14)
  const kontak = (data.kontak || []).filter(k => k.nama || k.nomor).slice(0, 5)
  const rek = data.rekening || {}
  const adaRek = !!(rek.nomor || rek.bank)
  const sdAktif = SUMBER_DAYA.filter(([k]) => Number(data.sumber_daya?.[k]) > 0)

  // Susunan kolom menyesuaikan lebar poster: tambahan lebar dibagi ke kolom wilayah, peta, dan kanan
  const W = lebar || POSTER_W
  const extra = Math.max(0, W - POSTER_W)
  const Lw = 392 + Math.round(extra * 0.18), Mw = 520 + Math.round(extra * 0.27)
  const Mx = 40 + Lw + 20, Rx = Mx + Mw + 20, Rw = W - 40 - Rx
  const photoW = Mw + 180 + Math.round(extra * 0.2)
  const kolBantuan = Rw >= 1100 ? 6 : Rw >= 900 ? 5 : 4

  return (
    <div ref={ref} style={{ position: 'relative', width: W, height: POSTER_H, background: '#fff', fontFamily: FONT, color: TEKS, overflow: 'hidden', boxSizing: 'border-box', border: `6px solid ${MERAH}` }}>

      {/* ===== KEPALA ===== */}
      <div style={{ position: 'absolute', left: 0, top: 22, width: 560, height: 78, background: MERAH, clipPath: 'polygon(0 0,100% 0,93% 100%,0 100%)', display: 'flex', alignItems: 'center', paddingLeft: 44 }}>
        <span style={{ color: '#fff', fontWeight: 800, fontSize: 56, letterSpacing: '.01em', textTransform: 'lowercase' }}>infografis</span>
      </div>
      <div style={{ position: 'absolute', left: 580, top: 14, width: W - 954, height: 96, display: 'flex', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
        <div style={{ fontWeight: 800, fontSize: (data.judul || '').length > 40 ? 40 : 48, lineHeight: 1.08 }}>{data.judul || 'Infografis Bencana'}</div>
      </div>
      <div style={{ position: 'absolute', right: 40, top: 20, display: 'flex', alignItems: 'center', gap: 14 }}>
        <img src="/logo-pmi.png?v=3" alt="" style={{ width: 70, height: 70, objectFit: 'contain' }} />
        <div style={{ borderLeft: '2px solid #B7ADA8', paddingLeft: 14, lineHeight: 1.15, fontWeight: 700, fontSize: 19 }}>Palang Merah Indonesia<br /><span style={{ fontWeight: 800, color: GELAP }}>Provinsi Sumatera Barat</span></div>
      </div>

      {/* ===== RINGKASAN + UPDATE ===== */}
      <div style={{ position: 'absolute', left: 40, top: 122, width: W - 634, height: 118, fontSize: 21, lineHeight: 1.36, color: '#2E2926', overflow: 'hidden' }}>
        {data.deskripsi || ''}
        <div style={{ height: 5, background: MERAH, borderRadius: 3, position: 'absolute', left: 0, right: 0, bottom: 0 }} />
      </div>
      <div style={{ position: 'absolute', left: W - 564, top: 120, width: 524, height: 122 }}>
        <div style={{ position: 'absolute', left: 0, top: 0, right: 0, bottom: 0, background: MERAH, borderRadius: 18 }} />
        <div style={{ position: 'absolute', left: 190, top: -2, width: 144, textAlign: 'center', background: '#fff', color: MERAH, fontWeight: 800, fontSize: 18, letterSpacing: '.1em', borderRadius: '0 0 12px 12px', padding: '3px 0', borderBottom: `3px solid ${MERAH}` }}>UPDATE</div>
        <div style={{ position: 'absolute', left: 14, right: 14, top: 38, bottom: 12, background: '#fff', borderRadius: 12, padding: '8px 18px', display: 'flex', flexDirection: 'column', justifyContent: 'center', gap: 4, fontSize: 21 }}>
          <div><b style={{ display: 'inline-block', width: 100 }}>Tanggal</b> : {tglID(data.tanggal_update) || '-'}</div>
          <div><b style={{ display: 'inline-block', width: 100 }}>Pukul</b> : {data.pukul_update || '-'}</div>
          {data.status_keterangan ? <div style={{ fontSize: 17, color: GELAP, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{data.status_keterangan}</div> : null}
        </div>
      </div>

      {/* ===== KOLOM KIRI: WILAYAH ===== */}
      <div style={{ position: 'absolute', left: 40, top: 256, width: Lw, height: 700, display: 'grid', gridTemplateColumns: '1fr 1fr', gridAutoRows: 64, gap: 6, alignContent: 'start' }}>
        {kartu.length === 0 && <div style={{ gridColumn: '1/-1', color: '#7A6E69', fontSize: 18, padding: 10 }}>Belum ada wilayah terdampak yang ditandai.</div>}
        {kartu.slice(0, 20).map(r => (
          <div key={r.id} style={{ background: STATUS_WARNA[r.st], color: r.st === 'sedang' ? '#2A1F00' : '#fff', borderRadius: 12, padding: '6px 10px', display: 'flex', flexDirection: 'column', justifyContent: 'center', minWidth: 0 }}>
            <div style={{ fontWeight: 800, fontSize: r.nama.length > 19 ? 14 : r.nama.length > 15 ? 15.5 : 17, lineHeight: 1.1, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.nama}</div>
            <div style={{ fontSize: 13.5, fontWeight: 600, opacity: .95, marginTop: 3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{r.info}</div>
          </div>
        ))}
      </div>

      {/* ===== KOLOM TENGAH: PETA + DAMPAK ===== */}
      <div style={{ position: 'absolute', left: Mx, top: 256, width: Mw, height: 700 }}>
        <div style={{ position: 'relative', height: 322 }}>
          <svg viewBox={`0 0 ${peta.w} ${peta.h}`} style={{ width: '100%', height: 300 }} preserveAspectRatio="xMidYMid meet" role="img" aria-label="Peta dampak per kabupaten dan kota">
            {peta.wilayah.map(w => <path key={w.id} d={w.d} fill={STATUS_WARNA[ws[w.id] || 'aman']} stroke="#fff" strokeWidth="2.2" strokeLinejoin="round" />)}
          </svg>
          <div style={{ position: 'absolute', left: 0, bottom: 0, display: 'flex', gap: 14, fontSize: 14, fontWeight: 700 }}>
            {['parah', 'sedang', 'ringan', 'aman'].map(s => <span key={s} style={{ display: 'inline-flex', alignItems: 'center', gap: 6 }}><i style={{ width: 14, height: 14, borderRadius: 4, background: STATUS_WARNA[s], display: 'inline-block' }} />{STATUS_LABEL[s]}</span>)}
          </div>
        </div>
        <div style={{ marginTop: 10 }}><Judul>Dampak</Judul></div>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gridAutoRows: 100, gap: '6px 8px' }}>
          {DAMPAK.map(([k, ik, lb, st, wr]) => (
            <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 10, minWidth: 0 }}>
              <span style={{ color: wr, flexShrink: 0, display: 'inline-flex' }}><Ikon nama={ik} size={44} stroke={1.7} /></span>
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 800, fontSize: 31, lineHeight: 1, color: wr }}>{angkaID(data.dampak?.[k])}</div>
                <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.15, marginTop: 3 }}>{lb}<span style={{ color: '#7A6E69', fontWeight: 600 }}> ({st})</span></div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ===== KOLOM KANAN: LAYANAN, BANTUAN, PENERIMA, KEBUTUHAN, SUMBER DAYA ===== */}
      <div style={{ position: 'absolute', left: Rx, top: 256, width: Rw, height: 700 }}>
        <Judul>Layanan PMI</Judul>
        <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: 'repeat(6,1fr)', gap: 4, height: 104 }}>
          {LAYANAN.map(([k, ik, lb, st]) => (
            <div key={k} style={{ textAlign: 'center', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2 }}>
              <span style={{ color: GELAP, display: 'inline-flex' }}><Ikon nama={ik} size={34} stroke={1.7} /></span>
              <div style={{ fontWeight: 800, fontSize: 21, lineHeight: 1 }}>{angkaID(data.layanan?.[k])}</div>
              <div style={{ fontSize: 12, fontWeight: 700, lineHeight: 1.1, color: '#4A403C' }}>{lb}<br /><span style={{ fontWeight: 600, color: '#7A6E69' }}>({st})</span></div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10 }}><Judul>Bantuan PMI</Judul></div>
        <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: `repeat(${kolBantuan},1fr)`, gridAutoRows: 46, gap: '4px 10px', height: 192, alignContent: 'start' }}>
          {bantuan.length === 0 && <div style={{ gridColumn: '1/-1', color: '#7A6E69', fontSize: 16 }}>Belum ada data bantuan.</div>}
          {bantuan.map((b, i) => (
            <div key={i} style={{ minWidth: 0 }}>
              <div style={{ fontWeight: 800, fontSize: 19, lineHeight: 1.05, color: GELAP }}>{angkaID(b.jumlah)}<span style={{ fontSize: 13, fontWeight: 700, color: '#4A403C' }}> {b.satuan}</span></div>
              <div style={{ fontSize: 13, fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{b.nama}</div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 8, display: 'grid', gridTemplateColumns: `repeat(${PENERIMA.length},1fr)`, gap: 10 }}>
          {PENERIMA.map(([k, lb]) => (
            <div key={k} style={{ background: MERAH, color: '#fff', borderRadius: 14, padding: '8px 12px', textAlign: 'center' }}>
              <div style={{ fontSize: 13.5, fontWeight: 700, lineHeight: 1.1 }}>{k === 'total_jiwa' ? 'Total Layanan PMI' : 'Penerima Manfaat ' + lb}</div>
              <div style={{ fontWeight: 800, fontSize: 28, lineHeight: 1.1 }}>{angkaID(data.penerima_manfaat?.[k])} <span style={{ fontSize: 15, fontWeight: 700 }}>Jiwa</span></div>
            </div>
          ))}
        </div>
        <div style={{ marginTop: 10, display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, height: 232 }}>
          <div>
            <Judul>Kebutuhan Mendesak</Judul>
            <ul style={{ margin: '8px 0 0', padding: 0, listStyle: 'none', columns: 2, columnGap: 12, fontSize: 16, fontWeight: 700, lineHeight: 1.45 }}>
              {mendesak.length === 0 && <li style={{ color: '#7A6E69', fontWeight: 600 }}>Belum diisi.</li>}
              {mendesak.map((m, i) => <li key={i} style={{ breakInside: 'avoid', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}><span style={{ color: MERAH }}>&#9679;</span> {m}</li>)}
            </ul>
          </div>
          <div>
            <Judul>Sumber Daya</Judul>
            <div style={{ marginTop: 8, display: 'grid', gap: 3 }}>
              {sdAktif.length === 0 && <div style={{ color: '#7A6E69', fontWeight: 600, fontSize: 16 }}>Belum diisi.</div>}
              {sdAktif.map(([k, ik, lb]) => (
                <div key={k} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 700, lineHeight: 1.2 }}>
                  <span style={{ color: GELAP, display: 'inline-flex', flexShrink: 0 }}><Ikon nama={ik} size={22} stroke={1.8} /></span>
                  <b style={{ fontSize: 20, minWidth: 34 }}>{angkaID(data.sumber_daya[k])}</b> {k === 'personil' ? 'orang ' : 'unit '}{lb.replace(' PMI', '')}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ===== KAKI: KONTAK, FOTO, DONASI ===== */}
      <div style={{ position: 'absolute', left: 40, top: 972, width: Lw, height: 224, border: `3px solid ${MERAH}`, borderRadius: 16, padding: '12px 16px', boxSizing: 'border-box' }}>
        <div style={{ color: MERAH, fontWeight: 800, fontSize: 15, letterSpacing: '.1em', marginBottom: 6 }}>CONTACT PERSON</div>
        {kontak.length === 0 && <div style={{ color: '#7A6E69', fontSize: 16 }}>Belum ada kontak.</div>}
        {kontak.map((k, i) => (
          <div key={i} style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 18.5, fontWeight: 800, lineHeight: 1.5 }}>
            <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{k.nama}</span><span style={{ whiteSpace: 'nowrap' }}>{k.nomor}</span>
          </div>
        ))}
      </div>

      <div style={{ position: 'absolute', left: Mx, top: 972, width: foto.length ? photoW : 0, height: 224, display: foto.length ? 'grid' : 'none', gridTemplateColumns: `repeat(${Math.max(foto.length, 1)},1fr)`, gap: 8, border: `3px solid ${MERAH}`, borderRadius: 16, padding: 6, boxSizing: 'border-box', overflow: 'hidden' }}>
        {foto.map((u, i) => <div key={i} style={{ borderRadius: 10, backgroundImage: `url(${u})`, backgroundSize: 'cover', backgroundPosition: 'center' }} />)}
      </div>

      <div style={{ position: 'absolute', left: foto.length ? Mx + photoW + 20 : Mx, top: 972, right: 40, height: 224, background: MERAH, color: '#fff', borderRadius: 16, padding: '14px 20px', boxSizing: 'border-box', display: 'flex', alignItems: 'center', gap: 18 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontWeight: 800, fontSize: 15, letterSpacing: '.1em', opacity: .9 }}>SALURKAN DONASI MELALUI</div>
          {adaRek ? (
            <>
              <div style={{ fontWeight: 800, fontSize: foto.length ? 22 : 30, lineHeight: 1.15, marginTop: 4 }}>{rek.bank || 'Rekening'}</div>
              <div style={{ fontWeight: 800, fontSize: foto.length ? 30 : 42, letterSpacing: '.02em', lineHeight: 1.1, overflowWrap: 'anywhere' }}>{rek.nomor}</div>
              {rek.atas_nama && <div style={{ fontWeight: 700, fontSize: foto.length ? 16 : 22, marginTop: 4 }}>a.n. {rek.atas_nama}</div>}
            </>
          ) : <div style={{ fontSize: 18, marginTop: 8 }}>Rekening donasi belum diisi.</div>}
          {data.media_sosial ? <div style={{ fontWeight: 700, fontSize: 16, marginTop: 8, opacity: .95 }}>{data.media_sosial}</div> : null}
        </div>
        {qr && (
          <div style={{ background: '#fff', borderRadius: 14, padding: 8, flexShrink: 0, textAlign: 'center' }}>
            <img src={qr} alt="Kode QR donasi" style={{ width: 150, height: 150, display: 'block' }} />
            <div style={{ color: TEKS, fontWeight: 800, fontSize: 12, marginTop: 2 }}>Scan untuk donasi</div>
          </div>
        )}
      </div>

      {/* ===== PITA BAWAH ===== */}
      <div style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 32, background: GELAP, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 40px', fontSize: 14.5, fontWeight: 700, letterSpacing: '.03em' }}>
        <span>PMI Provinsi Sumatera Barat</span>
        <span>{data.tanggal_update ? 'Data per ' + tglID(data.tanggal_update) + (data.pukul_update ? ', ' + data.pukul_update : '') : ''}</span>
      </div>
    </div>
  )
})

export default PosterInfografis
