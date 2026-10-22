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

export default function PanelWilayah({ nama, status, detail, air, barang, kesehatan = [], bersih = [], loadingData, errorData, onClose }) {
  const warna = HEADER[status] || HEADER.aman
  const totalLiter = air.reduce((s, r) => s + Number(r.liter || 0), 0)
  const airTerbaru = [...air].sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)))

  const disetujui = barang.filter(b => b.status === 'Disetujui')
  const diajukan = barang.filter(b => b.status === 'Diajukan').length
  const ringkasBarang = {}
  disetujui.forEach(b => {
    const key = `${b.jenis_barang}||${b.satuan}`
    ringkasBarang[key] = (ringkasBarang[key] || 0) + Number(b.jumlah || 0)
  })
  const daftarBarang = Object.entries(ringkasBarang).map(([k, v]) => { const [n, satuan] = k.split('||'); return { nama: n, satuan, jumlah: v } })
  const grupKes = kelompok(kesehatan, 'jenis_layanan', 'jumlah_penerima', null, 'orang')
  const grupBersih = kelompok(bersih, 'jenis_kegiatan', 'jumlah_terlayani', 'satuan')
  const totalPenerimaKes = kesehatan.reduce((s, r) => s + Number(r.jumlah_penerima || 0), 0)

  const muat = loadingData
  const biru = '#1F6FB2', emas = '#B7791F', merah = '#C8102E', hijau = '#2D6A4F'

  return (
    <div className="pw">
      <div className="pw-header" style={{ background: `linear-gradient(135deg, ${warna}, ${warna}CC)` }}>
        <div>
          <div className="pw-kecil">Rincian Wilayah</div>
          <div className="pw-nama">{nama}</div>
          <span className="pw-status"><Ikon nama={status === 'aman' ? 'centang' : 'alert'} size={14} /> {TEKS_STATUS[status] || TEKS_STATUS.aman}</span>
        </div>
        <button type="button" className="pw-tutup" onClick={onClose} aria-label="Tutup rincian"><Ikon nama="tutup" size={18} /></button>
      </div>

      <div className="pw-badan">
        {detail.length > 0 && (
          <div className="pw-info">
            {detail.map((w, i) => (
              <span key={i} className="pw-pil"><Ikon nama="pin" size={13} /> {w.kecamatan || '-'} kecamatan · {w.jumlah_sub || '-'} {w.label_sub || ''}</span>
            ))}
          </div>
        )}

        {errorData && <div className="error-box" style={{ marginBottom: 10 }}>{errorData}</div>}

        <div className="pw-kartu-grid">
          <Kartu ikon="tetes" warna={biru} nilai={muat ? '…' : fmt(totalLiter)} label="Liter air bersih" sub={muat ? '' : `${fmt(air.length)} pengiriman`} />
          <Kartu ikon="paket" warna={emas} nilai={muat ? '…' : fmt(daftarBarang.length)} label="Jenis bantuan barang" sub={muat ? '' : `${fmt(disetujui.length)} pengiriman disetujui`} />
          <Kartu ikon="hati" warna={merah} nilai={muat ? '…' : fmt(totalPenerimaKes)} label="Penerima layanan kesehatan" sub={muat ? '' : `${fmt(kesehatan.length)} kegiatan`} />
          <Kartu ikon="bersih" warna={hijau} nilai={muat ? '…' : fmt(bersih.length)} label="Kegiatan bersih-bersih" sub={muat ? '' : `${fmt(grupBersih.length)} jenis kegiatan`} />
        </div>

        <Bagian ikon="tetes" judul="Distribusi Air Bersih" ada={!muat && air.length > 0} kosong={muat ? 'Memuat...' : 'Belum ada distribusi air tercatat.'}>
          {airTerbaru.slice(0, 4).map((r, i) => (
            <div key={r.id || i} className="pw-baris">
              <span>{tgl(r.tanggal)}</span>
              <span><strong>{fmt(r.liter)} L</strong>{r.penerima_manfaat ? ` · ${r.penerima_manfaat}` : ''}</span>
            </div>
          ))}
          {air.length > 4 && <div className="pw-lebih">+ {air.length - 4} pengiriman lain di menu Air Bersih</div>}
        </Bagian>

        <Bagian ikon="paket" judul="Bantuan Barang Dikirim" ada={!muat && barang.length > 0} kosong={muat ? 'Memuat...' : 'Belum ada barang keluar tercatat.'}>
          {daftarBarang.length === 0 ? <div className="pw-kosong">Belum ada pengiriman yang disetujui.</div> : (
            <div className="pw-chips">{daftarBarang.map(b => <span key={b.nama + b.satuan} className="pw-chip"><strong>{b.nama}</strong> {fmt(b.jumlah)} {b.satuan}</span>)}</div>
          )}
          {diajukan > 0 && <div className="pw-lebih"><Ikon nama="jam" size={13} /> {diajukan} pengajuan menunggu persetujuan</div>}
        </Bagian>

        <Bagian ikon="hati" judul="Layanan Kesehatan" ada={!muat && grupKes.length > 0} kosong={muat ? 'Memuat...' : 'Belum ada layanan kesehatan tercatat.'}>
          {grupKes.map(g => (
            <div key={g.nama} className="pw-baris"><span><strong>{g.nama}</strong></span><span>{fmt(g.kegiatan)} kegiatan · {fmt(g.jumlah)} {g.satuan}</span></div>
          ))}
        </Bagian>

        <Bagian ikon="bersih" judul="Bersih-Bersih" ada={!muat && grupBersih.length > 0} kosong={muat ? 'Memuat...' : 'Belum ada kegiatan bersih-bersih tercatat.'}>
          {grupBersih.map(g => (
            <div key={g.nama + g.satuan} className="pw-baris"><span><strong>{g.nama}</strong></span><span>{fmt(g.kegiatan)} kegiatan · {fmt(g.jumlah)} {g.satuan}</span></div>
          ))}
        </Bagian>

        <div className="pw-catatan">Data air, barang, kesehatan, dan bersih-bersih dicocokkan dari nama kota/tujuan yang diketik petugas.</div>
      </div>
    </div>
  )
}
