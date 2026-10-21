'use client'
// Panel rincian satu wilayah: muncul saat wilayah di peta Infografis diklik.
import { STATUS_WARNA } from '@/components/PetaSumbar'

const STATUS_LABEL = { parah: 'Parah', sedang: 'Sedang', ringan: 'Ringan', aman: 'Aman' }
const fmt = n => Number(n || 0).toLocaleString('id-ID')
function tgl(v) {
  if (!v) return '-'
  const d = new Date(String(v).slice(0, 10) + 'T00:00:00')
  return isNaN(d) ? v : d.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

const kotak = { background: 'var(--cream)', border: '1px solid var(--line)', borderRadius: 12, padding: '12px 14px', marginTop: 10 }
const judul = { fontSize: 12.5, fontWeight: 700, color: 'var(--ink-soft)', textTransform: 'uppercase', letterSpacing: '.03em', marginBottom: 8 }

// Kelompokkan baris per jenis (dan satuan): kembalikan [{ nama, kegiatan, jumlah, satuan }]
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

export default function PanelWilayah({ nama, status, detail, air, barang, kesehatan = [], bersih = [], loadingData, errorData, onClose }) {
  const warna = STATUS_WARNA[status] || STATUS_WARNA.aman
  const totalLiter = air.reduce((s, r) => s + Number(r.liter || 0), 0)
  const airTerbaru = [...air].sort((a, b) => String(b.tanggal).localeCompare(String(a.tanggal)))

  const disetujui = barang.filter(b => b.status === 'Disetujui')
  const diajukan = barang.filter(b => b.status === 'Diajukan').length
  const ringkasBarang = {}
  disetujui.forEach(b => {
    const key = `${b.jenis_barang}||${b.satuan}`
    ringkasBarang[key] = (ringkasBarang[key] || 0) + Number(b.jumlah || 0)
  })
  const grupKesehatan = kelompok(kesehatan, 'jenis_layanan', 'jumlah_penerima', null, 'orang')
  const grupBersih = kelompok(bersih, 'jenis_kegiatan', 'jumlah_terlayani', 'satuan')
  const daftarBarang = Object.entries(ringkasBarang).map(([k, v]) => { const [nama, satuan] = k.split('||'); return { nama, satuan, jumlah: v } })

  return (
    <div style={{ background: '#fff', border: `2px solid ${warna}`, borderRadius: 14, padding: '14px 16px', marginBottom: 14, boxShadow: 'var(--shadow)' }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 10 }}>
        <div>
          <div style={{ fontSize: 11, color: 'var(--ink-soft)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '.04em' }}>Rincian Wilayah</div>
          <div style={{ fontFamily: "'Space Grotesk',sans-serif", fontSize: 20, fontWeight: 700, lineHeight: 1.2 }}>{nama}</div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span className="tag" style={{ background: warna + '22', color: status === 'aman' ? '#2D6A4F' : warna, border: `1px solid ${warna}66` }}>
            Dampak: {STATUS_LABEL[status] || 'Aman'}
          </span>
          <button onClick={onClose} aria-label="Tutup rincian" style={{ border: 'none', background: 'none', cursor: 'pointer', fontSize: 18, lineHeight: 1 }}>✕</button>
        </div>
      </div>

      {/* Rincian dari Infografis */}
      <div style={kotak}>
        <div style={judul}>📍 Rincian Wilayah</div>
        {detail.length === 0 ? (
          <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Belum ada rincian untuk wilayah ini di infografis.</div>
        ) : detail.map((w, i) => (
          <div key={i} style={{ fontSize: 13.5, marginBottom: i < detail.length - 1 ? 6 : 0 }}>
            <strong>{w.nama}</strong>
            <span style={{ color: 'var(--ink-soft)' }}> · {w.kecamatan || '-'} Kec · {w.jumlah_sub || '-'} {w.label_sub || ''}</span>
          </div>
        ))}
      </div>

      {errorData && <div className="error-box" style={{ marginTop: 10 }}>{errorData}</div>}

      {/* Distribusi air */}
      <div style={kotak}>
        <div style={judul}>💧 Distribusi Air Bersih</div>
        {loadingData ? <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Memuat...</div> :
          air.length === 0 ? <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Belum ada distribusi air tercatat untuk wilayah ini.</div> : (
            <>
              <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginBottom: 8 }}>
                <div><div style={{ fontSize: 22, fontWeight: 700, color: '#1F6FB2', fontFamily: "'Space Grotesk',sans-serif" }}>{fmt(totalLiter)}</div><div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>liter terdistribusi</div></div>
                <div><div style={{ fontSize: 22, fontWeight: 700, fontFamily: "'Space Grotesk',sans-serif" }}>{fmt(air.length)}</div><div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>kali pengiriman</div></div>
                <div><div style={{ fontSize: 14, fontWeight: 700, marginTop: 5 }}>{tgl(airTerbaru[0].tanggal)}</div><div style={{ fontSize: 11.5, color: 'var(--ink-soft)' }}>terakhir</div></div>
              </div>
              {airTerbaru.slice(0, 5).map((r, i) => (
                <div key={r.id || i} style={{ fontSize: 12.5, padding: '5px 0', borderTop: '1px dashed var(--line)' }}>
                  {tgl(r.tanggal)} · <strong>{fmt(r.liter)} L</strong>
                  {r.penerima_manfaat ? ` · ${r.penerima_manfaat}` : ''}
                  {r.no_kendaraan ? <span style={{ color: 'var(--ink-soft)' }}> · {r.no_kendaraan}</span> : null}
                </div>
              ))}
              {air.length > 5 && <div style={{ fontSize: 11.5, color: 'var(--ink-soft)', marginTop: 4 }}>+ {air.length - 5} pengiriman lainnya (lihat menu Distribusi Air Bersih)</div>}
            </>
          )}
      </div>

      {/* Barang keluar */}
      <div style={kotak}>
        <div style={judul}>📦 Bantuan Barang Dikirim</div>
        {loadingData ? <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Memuat...</div> :
          barang.length === 0 ? <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Belum ada barang keluar tercatat untuk wilayah ini.</div> : (
            <>
              {daftarBarang.length === 0 ? (
                <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Belum ada pengiriman yang disetujui.</div>
              ) : (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {daftarBarang.map(b => (
                    <span key={b.nama + b.satuan} className="chip" style={{ background: '#fff', border: '1px solid var(--line)' }}>
                      <strong>{b.nama}</strong>&nbsp;{fmt(b.jumlah)} {b.satuan}
                    </span>
                  ))}
                </div>
              )}
              {diajukan > 0 && <div style={{ fontSize: 12, color: 'var(--gold)', marginTop: 8 }}>⏳ {diajukan} pengajuan masih menunggu persetujuan.</div>}
            </>
          )}
      </div>

      {/* Layanan kesehatan */}
      <div style={kotak}>
        <div style={judul}>🩺 Layanan Kesehatan</div>
        {loadingData ? <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Memuat...</div> :
          grupKesehatan.length === 0 ? <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Belum ada layanan kesehatan tercatat untuk wilayah ini.</div> : (
            grupKesehatan.map(g => (
              <div key={g.nama} style={{ fontSize: 13, padding: '4px 0' }}>
                <strong>{g.nama}</strong>
                <span style={{ color: 'var(--ink-soft)' }}> · {fmt(g.kegiatan)} kegiatan · {fmt(g.jumlah)} {g.satuan}</span>
              </div>
            ))
          )}
      </div>

      {/* Bersih-bersih */}
      <div style={kotak}>
        <div style={judul}>🧹 Bersih-Bersih</div>
        {loadingData ? <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Memuat...</div> :
          grupBersih.length === 0 ? <div style={{ fontSize: 13, color: 'var(--ink-soft)' }}>Belum ada kegiatan bersih-bersih tercatat untuk wilayah ini.</div> : (
            grupBersih.map(g => (
              <div key={g.nama + g.satuan} style={{ fontSize: 13, padding: '4px 0' }}>
                <strong>{g.nama}</strong>
                <span style={{ color: 'var(--ink-soft)' }}> · {fmt(g.kegiatan)} kegiatan · {fmt(g.jumlah)} {g.satuan}</span>
              </div>
            ))
          )}
      </div>

      <div style={{ fontSize: 11, color: 'var(--ink-soft)', marginTop: 10 }}>
        Data air, barang, kesehatan, dan bersih-bersih dicocokkan dari nama kota/tujuan yang diketik petugas.
      </div>
    </div>
  )
}
