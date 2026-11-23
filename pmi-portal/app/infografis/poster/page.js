'use client'
// Poster & Cetak: pratinjau poster Infografis, cetak / simpan PDF, unduh gambar, bagikan ke WhatsApp,
// salin teks ringkasan, dan unduh data Excel untuk desainer.
import { useEffect, useMemo, useRef, useState } from 'react'
import Link from 'next/link'
import { createClient } from '@/lib/supabase-browser'
import Sidebar from '@/components/Sidebar'
import Ikon from '@/components/Ikon'
import PosterInfografis from '@/components/PosterInfografis'
import SUMBAR_GEO from '@/components/sumbarGeo'
import { KOSONG, DAMPAK, LAYANAN, PENERIMA, POSTER_SUMBER_DAYA as SUMBER_DAYA, POSTER_KOSONG, dataPoster, STATUS_LABEL, KERTAS, POSTER_W, POSTER_H, ringkasanTeks, tglID, namaWilayah } from '@/lib/infografis'

// Kecilkan foto otomatis (maks 1000 px) supaya ringan disimpan
function kecilkan(file, maks = 1000, mutu = 0.78) {
  return new Promise((ok, gagal) => {
    const url = URL.createObjectURL(file); const img = new Image()
    img.onload = () => {
      const r = Math.min(1, maks / Math.max(img.width, img.height))
      const c = document.createElement('canvas'); c.width = Math.round(img.width * r); c.height = Math.round(img.height * r)
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); ok(c.toDataURL('image/jpeg', mutu))
    }
    img.onerror = () => { URL.revokeObjectURL(url); gagal(new Error('Foto tidak bisa dibaca')) }
    img.src = url
  })
}

const mmKePx = mm => mm * 96 / 25.4

export default function PosterPage() {
  const supabase = createClient()
  const [raw, setRaw] = useState(KOSONG)
  const [rowId, setRowId] = useState(null)
  const [pf, setPf] = useState(POSTER_KOSONG)
  const [isAdmin, setIsAdmin] = useState(false)
  const [menyimpan, setMenyimpan] = useState(false)
  const [loading, setLoading] = useState(true)
  const [kertas, setKertas] = useState('A3')
  const [pesan, setPesan] = useState('')
  const [sibuk, setSibuk] = useState('')
  const [lebar, setLebar] = useState(900)
  const wadah = useRef(null)
  const poster = useRef(null)

  useEffect(() => {
    (async () => {
      const { data: u } = await supabase.auth.getUser()
      if (u?.user) { const { data: prof } = await supabase.from('profiles').select('role').eq('id', u.user.id).maybeSingle(); setIsAdmin(prof?.role === 'admin') }
      const { data: rows } = await supabase.from('infografis_bencana').select('*').limit(1)
      if (rows && rows.length > 0) { setRaw({ ...KOSONG, ...rows[0].data }); setRowId(rows[0].id); setPf({ ...POSTER_KOSONG, ...(rows[0].data?.poster || {}) }) }
      setLoading(false)
    })()
  }, [])

  // skala pratinjau mengikuti lebar layar
  useEffect(() => {
    if (!wadah.current) return
    const ro = new ResizeObserver(([e]) => setLebar(e.contentRect.width))
    ro.observe(wadah.current)
    return () => ro.disconnect()
  }, [])
  const skala = Math.min(1, lebar / POSTER_W) || 0.3

  // data yang ditampilkan di poster = data Infografis + isian khusus poster (langsung terlihat saat diketik)
  const data = useMemo(() => dataPoster({ ...raw, poster: pf }), [raw, pf])
  const setPfK = (k, v) => setPf(p => ({ ...p, [k]: v }))

  async function tambahFoto(e) {
    const files = Array.from(e.target.files || []).slice(0, 4 - (pf.foto || []).length)
    try { const baru = await Promise.all(files.map(f => kecilkan(f))); setPfK('foto', [...(pf.foto || []), ...baru]) } catch (x) { info(x.message) }
    e.target.value = ''
  }

  async function simpanPoster() {
    if (!rowId) { info('Simpan data Infografis lebih dulu di halaman Infografis.'); return }
    setMenyimpan(true)
    const { data: u } = await supabase.auth.getUser()
    const { error } = await supabase.from('infografis_bencana').update({ data: { ...raw, poster: pf }, updated_at: new Date().toISOString(), updated_by: u?.user?.id }).eq('id', rowId)
    setMenyimpan(false)
    info(error ? 'Gagal menyimpan: ' + error.message : 'Isian poster tersimpan.')
  }

  const wilayahTeks = useMemo(() => {
    const ws = data.wilayah_status || {}
    return SUMBAR_GEO.features.filter(f => (ws[f.properties.id] || 'aman') !== 'aman')
      .sort((a, b) => ['parah', 'sedang', 'ringan'].indexOf(ws[a.properties.id]) - ['parah', 'sedang', 'ringan'].indexOf(ws[b.properties.id]))
      .map(f => `${namaWilayah(f)} (${STATUS_LABEL[ws[f.properties.id]]})`)
  }, [data])
  const teks = useMemo(() => ringkasanTeks(data, wilayahTeks), [data, wilayahTeks])
  const namaBerkas = `infografis-pmi-sumbar-${data.tanggal_update || new Date().toISOString().slice(0, 10)}`

  function info(t) { setPesan(t); clearTimeout(info.t); info.t = setTimeout(() => setPesan(''), 5000) }

  async function buatGambar() {
    const { toBlob } = await import('html-to-image')
    const hp = /Android|iPhone|iPad/i.test(navigator.userAgent)
    // jaga-jaga: peramban HP sering gagal memuat gambar terlalu besar, jadi resolusinya diturunkan
    const blob = await toBlob(poster.current, { pixelRatio: hp ? 2 : 3, cacheBust: true, backgroundColor: '#ffffff' })
    if (!blob) throw new Error('Gambar gagal dibuat')
    return blob
  }

  async function unduhGambar() {
    setSibuk('png')
    try {
      const blob = await buatGambar()
      const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = namaBerkas + '.png'; a.click()
      setTimeout(() => URL.revokeObjectURL(a.href), 4000)
      info('Gambar poster berhasil diunduh.')
    } catch (e) { info('Gagal membuat gambar: ' + (e.message || e)) }
    setSibuk('')
  }

  async function bagikan() {
    setSibuk('bagi')
    try {
      const blob = await buatGambar()
      const file = new File([blob], namaBerkas + '.png', { type: 'image/png' })
      if (navigator.canShare && navigator.canShare({ files: [file] })) {
        await navigator.share({ files: [file], title: data.judul, text: teks })
      } else {
        // Peramban laptop tidak bisa membagikan berkas langsung: unduh gambar dan salin teksnya
        const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = namaBerkas + '.png'; a.click()
        try { await navigator.clipboard.writeText(teks) } catch {}
        info('Gambar diunduh dan teks ringkasan disalin. Tinggal lampirkan ke WhatsApp atau email.')
      }
    } catch (e) { if (e?.name !== 'AbortError') info('Gagal membagikan: ' + (e.message || e)) }
    setSibuk('')
  }

  async function salinTeks() {
    try { await navigator.clipboard.writeText(teks); info('Teks ringkasan disalin. Tempel di WhatsApp atau email.') }
    catch { info('Gagal menyalin. Pilih teks di kotak bawah lalu salin manual.') }
  }

  async function unduhExcel() {
    setSibuk('xls')
    try {
      const XLSX = await import('xlsx')
      const d = data, wb = XLSX.utils.book_new()
      const add = (nama, aoa) => XLSX.utils.book_append_sheet(wb, XLSX.utils.aoa_to_sheet(aoa), nama)
      add('Umum', [['Judul', d.judul], ['Tanggal update', tglID(d.tanggal_update)], ['Pukul', d.pukul_update], ['Status', d.status_keterangan], ['Ringkasan', d.deskripsi], ['Media sosial', d.media_sosial], ['Tautan donasi', d.tautan_donasi]])
      add('Dampak', [['Dampak', 'Jumlah', 'Satuan'], ...DAMPAK.map(([k, , lb, st]) => [lb, Number(d.dampak?.[k]) || 0, st])])
      const ws = d.wilayah_status || {}
      add('Wilayah', [['Kabupaten/Kota', 'Tingkat dampak', 'Kecamatan terdampak', 'Jumlah', 'Satuan'], ...SUMBAR_GEO.features.map(f => {
        const det = (d.wilayah_detail || []).find(x => x.region_id === f.properties.id) || {}
        return [namaWilayah(f), STATUS_LABEL[ws[f.properties.id] || 'aman'], Number(det.kecamatan) || '', Number(det.jumlah_sub) || '', det.label_sub || '']
      })])
      add('Layanan PMI', [['Layanan', 'Jumlah', 'Satuan'], ...LAYANAN.map(([k, , lb, st]) => [lb, Number(d.layanan?.[k]) || 0, st])])
      add('Bantuan PMI', [['Barang', 'Jumlah', 'Satuan'], ...(d.bantuan_items || []).map(b => [b.nama, Number(b.jumlah) || b.jumlah || '', b.satuan])])
      add('Penerima Manfaat', [['Penerima', 'Jiwa'], ...PENERIMA.map(([k, lb]) => [lb, Number(d.penerima_manfaat?.[k]) || 0])])
      add('Kebutuhan Mendesak', [['Kebutuhan'], ...(d.kebutuhan_mendesak || []).filter(x => String(x).trim()).map(x => [x])])
      add('Sumber Daya', [['Sumber daya', 'Jumlah'], ...SUMBER_DAYA.map(([k, , lb]) => [lb, Number(d.sumber_daya?.[k]) || 0])])
      add('Kontak & Donasi', [['Contact person', 'Nomor'], ...(d.kontak || []).map(k => [k.nama, k.nomor]), [], ['Bank', d.rekening?.bank], ['Nomor rekening', d.rekening?.nomor], ['Atas nama', d.rekening?.atas_nama]])
      add('Teks Ringkasan', teks.split('\n').map(x => [x]))
      XLSX.writeFile(wb, namaBerkas + '.xlsx')
      info('Data Excel diunduh. Kirim berkas ini ke desainer atau percetakan.')
    } catch (e) { info('Gagal membuat Excel: ' + (e.message || e)) }
    setSibuk('')
  }

  function cetak() { window.print() }

  const [pw, ph] = KERTAS[kertas]
  const skalaCetak = mmKePx(pw) / POSTER_W
  const cssCetak = `
    @page{size:${kertas} landscape;margin:0}
    @media print{
      html,body{background:#fff !important;margin:0 !important;padding:0 !important}
      body *{visibility:hidden !important}
      .poster-cetak,.poster-cetak *{visibility:visible !important;-webkit-print-color-adjust:exact;print-color-adjust:exact}
      .poster-cetak{position:fixed !important;left:0;top:0;width:${pw}mm !important;height:${ph}mm !important;overflow:hidden;box-shadow:none !important;border-radius:0 !important;margin:0 !important}
      .poster-skala{transform:scale(${skalaCetak}) !important;transform-origin:top left !important}
    }`

  return (
    <div className="app">
      <style>{cssCetak}</style>
      <Sidebar />
      <div className="main">
        <div className="topbar poster-toolbar-tutup">
          <div><h1>Poster &amp; Cetak</h1><p className="desc">Siap dicetak, dibagikan, atau dikirim ke desainer. Isinya mengikuti data Infografis yang sudah disimpan.</p></div>
          <Link href="/infografis" className="btn btn-ghost" style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}><Ikon nama="kiri" size={16} /> Kembali ke Infografis</Link>
        </div>

        <div className="poster-aksi poster-toolbar-tutup">
          <label className="poster-kertas">Ukuran kertas
            <select value={kertas} onChange={e => setKertas(e.target.value)}>{Object.keys(KERTAS).map(k => <option key={k}>{k}</option>)}</select>
          </label>
          <button className="btn btn-primary" onClick={cetak}><Ikon nama="unduh" size={16} /> Cetak / Simpan PDF</button>
          <button className="btn btn-ghost" onClick={unduhGambar} disabled={!!sibuk}>{sibuk === 'png' ? 'Membuat gambar…' : 'Unduh Gambar (PNG)'}</button>
          <button className="btn btn-ghost" onClick={bagikan} disabled={!!sibuk}>{sibuk === 'bagi' ? 'Menyiapkan…' : 'Bagikan (WhatsApp)'}</button>
          <button className="btn btn-ghost" onClick={salinTeks}>Salin Teks</button>
          <button className="btn btn-ghost" onClick={unduhExcel} disabled={!!sibuk}>{sibuk === 'xls' ? 'Menyiapkan…' : 'Data untuk Desainer (Excel)'}</button>
        </div>
        {pesan && <div className="poster-pesan poster-toolbar-tutup" role="status">{pesan}</div>}

        {isAdmin && (
          <details className="poster-form poster-toolbar-tutup">
            <summary>Lengkapi poster (khusus cetak, hanya admin)</summary>
            <div className="pf-grid">
              <label>Pukul update<input value={pf.pukul} onChange={e => setPfK('pukul', e.target.value)} placeholder="Contoh: 16.00 WIB" /></label>
              <label>Media sosial<input value={pf.media_sosial} onChange={e => setPfK('media_sosial', e.target.value)} placeholder="@pmisumbar  ·  PMI Sumatera Barat" /></label>
              <label>Sepeda motor (unit)<input type="number" min="0" value={pf.sepeda_motor} onChange={e => setPfK('sepeda_motor', e.target.value)} /></label>
              <label>Alkon (unit)<input type="number" min="0" value={pf.alkon} onChange={e => setPfK('alkon', e.target.value)} /></label>
              <label className="pf-lebar">Tautan donasi (dijadikan kode QR di poster)<input type="url" value={pf.tautan_donasi} onChange={e => setPfK('tautan_donasi', e.target.value)} placeholder="https://..." /></label>
              <label className="pf-lebar">Kebutuhan mendesak (satu per baris)<textarea rows={5} value={(pf.kebutuhan_mendesak || []).join('\n')} onChange={e => setPfK('kebutuhan_mendesak', e.target.value.split('\n'))} placeholder={'Hygiene Kit\nFamily Kit\nSarung\nTikar'} /></label>
              <div className="pf-lebar"><div style={{ fontSize: 13.5, fontWeight: 700, color: 'var(--ink-soft)', marginBottom: 6 }}>Foto dokumentasi (maksimal 4)</div>
                <div className="pf-foto">
                  {(pf.foto || []).map((u, i) => <div key={i} className="pf-foto-item" style={{ backgroundImage: `url(${u})` }}><button type="button" aria-label="Hapus foto" onClick={() => setPfK('foto', pf.foto.filter((_, k) => k !== i))}>&times;</button></div>)}
                  {(pf.foto || []).length < 4 && <label className="pf-foto-item pf-foto-tambah"><span style={{ fontSize: 22 }}>+</span><span>Tambah foto</span><input type="file" accept="image/*" multiple onChange={tambahFoto} style={{ display: 'none' }} /></label>}
                </div>
              </div>
            </div>
            <div style={{ marginTop: 14 }}><button className="btn btn-primary" onClick={simpanPoster} disabled={menyimpan}>{menyimpan ? 'Menyimpan…' : 'Simpan isian poster'}</button> <span style={{ fontSize: 13, color: 'var(--ink-soft)', marginLeft: 8 }}>Pratinjau di bawah langsung berubah saat diisi.</span></div>
          </details>
        )}

        <div ref={wadah} className="poster-wadah">
          <div className="poster-cetak" style={{ width: POSTER_W * skala, height: POSTER_H * skala }}>
            <div className="poster-skala" style={{ width: POSTER_W, height: POSTER_H, transform: `scale(${skala})`, transformOrigin: 'top left' }}>
              {!loading && <PosterInfografis ref={poster} data={data} />}
            </div>
          </div>
        </div>

        <details className="poster-teks poster-toolbar-tutup">
          <summary>Lihat teks ringkasan (caption siap kirim)</summary>
          <textarea readOnly value={teks} rows={12} onFocus={e => e.target.select()} />
        </details>
        <p className="poster-bantu poster-toolbar-tutup">Tips cetak: di jendela cetak pilih <b>Simpan sebagai PDF</b> atau printer, atur margin ke <b>Tidak ada</b>, dan centang <b>Grafik latar belakang</b>. Ukuran kertas di atas sudah diatur otomatis.</p>
      </div>
    </div>
  )
}
