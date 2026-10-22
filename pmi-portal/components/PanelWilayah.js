'use client'
// Panel rincian satu wilayah: muncul saat wilayah di peta Infografis diklik.
import Ikon from '@/components/Ikon'
import { STATUS_LABEL } from '@/lib/infografis'

const fmt = n => Number(n || 0).toLocaleString('id-ID')
function tgl(v) {
  if (!v) return '-'
  const d = new Date(String(v).slice(0, 10) + 'T00:00:00')
  return isNaN(d) ? v : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const HEADER = { parah: '#B3122A', sedang: '#C77D0A', ringan: '#2D6A4F', aman: '#5B6B73' }
const TEKS_STATUS = { parah: 'Dampak Parah', sedang: 'Dampak Sedang', ringan: 'Dampak Ringan', aman: 'Aman / Tidak Terdampak' }
const MENU_ISI = [['/air', 'Air Bersih'], ['/layanan-kesehatan', 'Layanan Kesehatan'], ['/bersih-bersih', 'Bersih-Bersih'], ['/barang-keluar', 'Distribusi Barang Bantuan']]

// Kelompokkan baris per jenis (dan satuan)
function kelompok(rows, kunci, jumlahKey, satuanKey, satuanTetap) {
  const m = {}
  rows.forEach(r => {
    const satuan = satuanTetap || r[satuanKey] || ''
    const k = (r[kunci] || 'Lainnya') + '||' + satuan
    m[k] = m[k] || { nama: r[kunci] || 'Lainnya', satuan, kegiatan: 0, jumlah: 0 }
    m[k].kegiatan += 1
    m[k].jumlah += Number(r[jumlahKey] || 0)
  })
  return Object.values(m)
}

function Kartu({ ikon, warna, nilai, label, sub }) {
  return (
    <div className="pw-kartu">
      <div className="pw-ikon" style={{ background: warna + '1F', color: warna }}><Ikon nama={ikon} size={22} /></div>
      <div className="pw-isi">
        <div className="pw-angka">{nilai}</div>
        <div className="pw-label">{label}</div>
        {sub ? <div className="pw-sub">{sub}</div> : null}
      </div>
    </div>
  )
}

function Bagian({ ikon, judul, kosong, children, ada }) {
  return (
    <div className="pw-bagian">
      <div className="pw-bagian-judul"><Ikon nama={ikon} size={16} /> {judul}</div>
      {ada ? children : <div className="pw-kosong">{kosong}</div>}
    </div>
  )
}

export default function PanelWilayah({ nama, status, detail, air, barang, kesehatan = [], bersih = [], loadingData, errorData, isAdmin, onClose }) {
  const diatur = !!status
  const st = status || 'aman'
  const warna = diatur ? (HEADER[st] || HEADER.aman) : '#6B7780'
  const muat = loadingData

  const totalLiter = air.reduce((s, r) => s + Number(r.liter || 0), 0)
  const airTerbaru = [...air].sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)))

  const disetujui = barang.filter(b => b.status === 'Disetujui')
  const diajukan = barang.filter(b => b.status === 'Diajukan').length
  const ringkasBarang = {}
  disetujui.forEach(b => {
    const key = `${b.jenis_barang}||${b.satuan}`
    ringkasBarang[key] = (ringkasBarang[key] || 0) + Number(b.jumlah || 0)
  })
  const daftarBarang = Object.entries(ringkasBarang)
    .map(([k, v]) => { const [n, satuan] = k.split('||'); return { nama: n, satuan, jumlah: v } })
    .sort((a, b) => b.jumlah - a.jumlah)
  const grupKes = kelompok(kesehatan, 'jenis_layanan', 'jumlah_penerima', null, 'orang')
  const grupBersih = kelompok(bersih, 'jenis_kegiatan', 'jumlah_terlayani', 'satuan')
  const totalPenerimaKes = kesehatan.reduce((s, r) => s + Number(r.jumlah_penerima || 0), 0)

  const adaAir = air.length > 0
  const adaBarang = barang.length > 0
  const adaKes = kesehatan.length > 0
  const adaBersih = bersih.length > 0
  const adaData = adaAir || adaBarang || adaKes || adaBersih
  const biru = '#1F6FB2', emas = '#B7791F', merah = '#C8102E', hijau = '#2D6A4F'
  const topBarang = daftarBarang.slice(0, 3).map(b => `${b.nama} ${fmt(b.jumlah)} ${b.satuan}`).join(' · ')

  const teksStatus = diatur ? (TEKS_STATUS[st] || TEKS_STATUS.aman) : 'Status dampak belum diatur'
  const adaRincian = detail.length > 0
  const janggal = isAdmin && adaRincian && (!diatur || st === 'aman')

  return (
    <div className="pw">
      <div className="pw-header" style={{ background: `linear-gradient(135deg, ${warna}, ${warna}CC)` }}>
        <div>
          <div className="pw-kecil">Rincian Wilayah</div>
          <div className="pw-nama">{nama}</div>
          <span className="pw-status"><Ikon nama={diatur && st !== 'aman' ? 'alert' : diatur ? 'centang' : 'info'} size={15} /> {teksStatus}</span>
        </div>
        <button type="button" className="pw-tutup" onClick={onClose} aria-label="Tutup rincian"><Ikon nama="tutup" size={18} /></button>
      </div>

      <div className="pw-badan">
        {adaRincian && (
          <div className="pw-info">
            {detail.map((w, i) => (
              <span key={i} className="pw-pil"><Ikon nama="pin" size={14} /> {w.kecamatan || '-'} kecamatan · {w.jumlah_sub || '-'} {w.label_sub || ''}</span>
            ))}
          </div>
        )}

        {janggal && (
          <div className="pw-peringatan">
            <Ikon nama="info" size={16} />
            <span>Rincian kecamatan sudah ada, tetapi status dampak wilayah ini masih <strong>{diatur ? 'Aman' : 'belum diatur'}</strong>. Periksa di Edit Data, bagian Wilayah.</span>
          </div>
        )}

        {errorData && <div className="error-box" style={{ marginBottom: 10 }}>{errorData}</div>}

        {muat && <div className="pw-muat">Memuat data wilayah...</div>}

        {!muat && !adaData && (
          <div className="pw-kosong-besar">
            <div className="pw-kosong-judul">Belum ada data tercatat untuk wilayah ini</div>
            <div>Data muncul otomatis setelah petugas mengisi menu berikut dengan kota/kabupaten <strong>{nama}</strong>:</div>
            <div className="pw-menu-isi">
              {MENU_ISI.map(([href, label]) => <a key={href} href={href}>{label}</a>)}
            </div>
          </div>
        )}

        {!muat && adaData && (
          <>
            <div className="pw-kartu-grid">
              {adaAir && <Kartu ikon="tetes" warna={biru} nilai={fmt(totalLiter)} label="Liter air bersih" sub={`${fmt(air.length)} pengiriman`} />}
              {adaBarang && <Kartu ikon="paket" warna={emas} nilai={fmt(disetujui.length)} label="Pengiriman bantuan barang" sub={topBarang || (diajukan ? `${diajukan} menunggu persetujuan` : '')} />}
              {adaKes && <Kartu ikon="hati" warna={merah} nilai={fmt(totalPenerimaKes)} label="Penerima layanan kesehatan" sub={`${fmt(kesehatan.length)} kegiatan`} />}
              {adaBersih && <Kartu ikon="bersih" warna={hijau} nilai={fmt(bersih.length)} label="Kegiatan bersih-bersih" sub={`${fmt(grupBersih.length)} jenis kegiatan`} />}
            </div>

            {adaAir && (
              <Bagian ikon="tetes" judul="Distribusi Air Bersih" ada>
                {airTerbaru.slice(0, 4).map((r, i) => (
                  <div key={r.id || i} className="pw-baris">
                    <span>{tgl(r.tanggal)}</span>
                    <span><strong>{fmt(r.liter)} L</strong>{r.penerima_manfaat ? ` · ${r.penerima_manfaat}` : ''}</span>
                  </div>
                ))}
                {air.length > 4 && <div className="pw-lebih">+ {air.length - 4} pengiriman lain di menu Air Bersih</div>}
              </Bagian>
            )}

            {adaBarang && (
              <Bagian ikon="paket" judul="Bantuan Barang Dikirim" ada>
                {daftarBarang.length === 0 ? <div className="pw-kosong">Belum ada pengiriman yang disetujui.</div> : (
                  <div className="pw-chips">{daftarBarang.map(b => <span key={b.nama + b.satuan} className="pw-chip"><strong>{b.nama}</strong> {fmt(b.jumlah)} {b.satuan}</span>)}</div>
                )}
                {diajukan > 0 && <div className="pw-lebih"><Ikon nama="jam" size={14} /> {diajukan} pengajuan menunggu persetujuan</div>}
              </Bagian>
            )}

            {adaKes && (
              <Bagian ikon="hati" judul="Layanan Kesehatan" ada>
                {grupKes.map(g => (
                  <div key={g.nama} className="pw-baris"><span><strong>{g.nama}</strong></span><span>{fmt(g.kegiatan)} kegiatan · {fmt(g.jumlah)} {g.satuan}</span></div>
                ))}
              </Bagian>
            )}

            {adaBersih && (
              <Bagian ikon="bersih" judul="Bersih-Bersih" ada>
                {grupBersih.map(g => (
                  <div key={g.nama + g.satuan} className="pw-baris"><span><strong>{g.nama}</strong></span><span>{fmt(g.kegiatan)} kegiatan · {fmt(g.jumlah)} {g.satuan}</span></div>
                ))}
              </Bagian>
            )}
          </>
        )}

        <div className="pw-catatan">Data dicocokkan dari nama kota/kabupaten yang diketik petugas di tiap menu.</div>
      </div>
    </div>
  )
}
