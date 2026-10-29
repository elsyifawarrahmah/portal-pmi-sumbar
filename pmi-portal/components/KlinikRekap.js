'use client'
// Rekap total pasien per bulan — dihitung otomatis dari Laporan Layanan Harian (tidak perlu diisi manual)
import { useEffect, useState } from 'react'
import Ikon from '@/components/Ikon'
import { NAMA_BULAN, JENIS_LAYANAN, fmtAngka } from '@/lib/unit'

export default function KlinikRekap({ supabase }) {
  const [tahun, setTahun] = useState(new Date().getFullYear())
  const [rows, setRows] = useState([])
  const [loading, setLoading] = useState(true)
  const [pesan, setPesan] = useState('')

  useEffect(() => { (async () => {
    setLoading(true)
    const { data, error } = await supabase.from('klinik_pasien_harian').select('tanggal, jenis_layanan, kunjungan, rujukan').gte('tanggal', `${tahun}-01-01`).lte('tanggal', `${tahun}-12-31`).range(0, 4999)
    if (error) { setPesan(/does not exist|schema cache/i.test(error.message || '') || error.code === '42P01' || error.code === 'PGRST205' ? 'Tabel belum dibuat. Jalankan file supabase-migrasi-pusdiklat-klinik.sql di Supabase (SQL Editor) satu kali.' : 'Gagal memuat data: ' + error.message); setRows([]) }
    else { setPesan(''); setRows(data || []) }
    setLoading(false)
  })() }, [tahun])

  const bulan = NAMA_BULAN.map(() => ({ kunjungan: 0, rujukan: 0, per: Object.fromEntries(JENIS_LAYANAN.map(j => [j, 0])) }))
  rows.forEach(r => {
    const b = bulan[Number(String(r.tanggal).slice(5, 7)) - 1]
    if (!b) return
    b.kunjungan += r.kunjungan || 0; b.rujukan += r.rujukan || 0
    if (b.per[r.jenis_layanan] !== undefined) b.per[r.jenis_layanan] += r.kunjungan || 0
  })
  const total = bulan.reduce((t, b) => ({ kunjungan: t.kunjungan + b.kunjungan, rujukan: t.rujukan + b.rujukan, per: Object.fromEntries(JENIS_LAYANAN.map(j => [j, t.per[j] + b.per[j]])) }), { kunjungan: 0, rujukan: 0, per: Object.fromEntries(JENIS_LAYANAN.map(j => [j, 0])) })

  return (
    <div>
      <div className="unit-bar">
        <div>
          <h2 className="unit-judul">Rekap Total Pasien per Bulan</h2>
          <p className="unit-bantu">Dihitung otomatis dari Laporan Harian. Kolom layanan menunjukkan pasien kunjungan.</p>
        </div>
        <div className="unit-tahun">
          <button type="button" aria-label="Tahun sebelumnya" onClick={() => setTahun(tahun - 1)}><Ikon nama="kiri" size={16} /></button>
          <strong>{tahun}</strong>
          <button type="button" aria-label="Tahun berikutnya" onClick={() => setTahun(tahun + 1)}><Ikon nama="kanan" size={16} /></button>
        </div>
      </div>
      {pesan && <div className="error-box">{pesan}</div>}
      {loading && !pesan && <div className="unit-memuat">Memuat...</div>}
      {!loading && !pesan && (
        <div className="panel unit-panel"><div className="unit-scroll">
          <table className="unit-tabel">
            <thead><tr><th>Bulan</th>{JENIS_LAYANAN.map(j => <th key={j} className="num">{j}</th>)}<th className="num">Total Kunjungan</th><th className="num">Total Rujukan</th></tr></thead>
            <tbody>
              {bulan.map((b, i) => (
                <tr key={i}><td>{NAMA_BULAN[i]}</td>{JENIS_LAYANAN.map(j => <td key={j} className="num">{fmtAngka(b.per[j])}</td>)}<td className="num"><strong>{fmtAngka(b.kunjungan)}</strong></td><td className="num">{fmtAngka(b.rujukan)}</td></tr>
              ))}
            </tbody>
            <tfoot><tr><td>Total {tahun}</td>{JENIS_LAYANAN.map(j => <td key={j} className="num">{fmtAngka(total.per[j])}</td>)}<td className="num">{fmtAngka(total.kunjungan)}</td><td className="num">{fmtAngka(total.rujukan)}</td></tr></tfoot>
          </table>
        </div></div>
      )}
    </div>
  )
}
