'use client'
import Sidebar from '@/components/Sidebar'

const WILAYAH = [
  { nama: 'Kota Padang', kec: 9, sub: 'Kelurahan', jml: 17 },
  { nama: 'Kota Pariaman', kec: 9, sub: 'Kelurahan', jml: 17 },
  { nama: 'Kota Solok', kec: 2, sub: 'Kelurahan', jml: 8 },
  { nama: 'Kota Padang Panjang', kec: 1, sub: null, jml: null },
  { nama: 'Kota Bukittinggi', kec: 2, sub: 'Kelurahan', jml: 3 },
  { nama: 'Kab. Padang Pariaman', kec: 13, sub: 'Nagari', jml: 11 },
  { nama: 'Kab. Agam', kec: 14, sub: 'Nagari', jml: 42 },
  { nama: 'Kab. Tanah Datar', kec: 3, sub: 'Nagari', jml: 5 },
  { nama: 'Kab. Pasaman Barat', kec: 11, sub: 'Nagari', jml: 16 },
  { nama: 'Kab. Pasaman', kec: 3, sub: 'Nagari', jml: 3 },
  { nama: 'Kab. Pesisir Selatan', kec: 6, sub: 'Nagari', jml: 27 },
  { nama: 'Kab. Solok', kec: 4, sub: 'Nagari', jml: 9 },
  { nama: 'Kab. Limapuluh Kota', kec: 2, sub: 'Nagari', jml: 2 },
]

const DAMPAK = [
  { label: 'Meninggal', nilai: '264', satuan: 'orang', emoji: '🙏' },
  { label: 'Hilang', nilai: '72', satuan: 'orang', emoji: '🔍' },
  { label: 'Luka', nilai: '401', satuan: 'orang', emoji: '🩹' },
  { label: 'Mengungsi', nilai: '150', satuan: 'jiwa', emoji: '🏕️' },
  { label: 'Terdampak', nilai: '296.345', satuan: 'jiwa', emoji: '👨‍👩‍👧' },
  { label: 'Rumah Hanyut', nilai: '762', satuan: 'unit', emoji: '🏚️' },
  { label: 'Jembatan Rusak', nilai: '440', satuan: 'unit', emoji: '🌉' },
  { label: 'Tempat Ibadah Rusak', nilai: '275', satuan: 'unit', emoji: '🕌' },
  { label: 'Faskes Rusak', nilai: '149', satuan: 'unit', emoji: '🏥' },
]

export default function InfografisPage() {
  return (
    <div className="app">
      <Sidebar />
      <div className="main">
        <div className="topbar">
          <div><h1>Infografis Bencana Hidrometeorologi</h1><p className="desc">Sumatera Barat — data dipindahkan dari papan informasi fisik PMI Sumbar.</p></div>
        </div>

        {/* Header ringkasan */}
        <div className="panel">
          <div className="panel-body">
            <p style={{fontSize:14, lineHeight:1.7, margin:0}}>
              Hujan dengan intensitas tinggi yang terjadi sejak tanggal <strong>19 November 2025</strong> memicu
              rangkaian bencana di Sumatera Barat, antara lain banjir, banjir bandang, tanah longsor, dan angin kencang.
              Beberapa daerah Kabupaten/Kota mengalami dampak baik harta benda maupun jiwa.
            </p>
            <div style={{marginTop:16}}>
              <img src="/infografis/update-status.png" alt="Status update terakhir" style={{maxWidth:340, width:'100%', borderRadius:8, border:'1px solid var(--line)'}} />
              <div style={{fontSize:11, color:'var(--ink-soft)', marginTop:4}}>📷 Cuplikan asli papan — tanggal update & status ditulis tangan.</div>
            </div>
          </div>
        </div>

        {/* Peta + wilayah terdampak */}
        <div className="charts-row" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16, marginBottom:20}}>
          <div className="panel" style={{marginBottom:0}}>
            <div className="panel-head"><h3>Peta Wilayah Terdampak</h3></div>
            <div className="panel-body" style={{textAlign:'center'}}>
              <img src="/infografis/peta-wilayah.png" alt="Peta wilayah terdampak Sumatera Barat" style={{maxWidth:'100%', borderRadius:10}} />
              <div style={{fontSize:11, color:'var(--ink-soft)', marginTop:6}}>📷 Foto asli peta dari papan infografis (dipertahankan persis, tidak digambar ulang).</div>
            </div>
          </div>
          <div className="panel" style={{marginBottom:0}}>
            <div className="panel-head"><h3>Kabupaten/Kota Terdampak</h3></div>
            <div className="panel-body" style={{maxHeight:380, overflowY:'auto'}}>
              <table>
                <thead><tr><th>Wilayah</th><th>Kecamatan</th><th>{WILAYAH[5].sub}</th></tr></thead>
                <tbody>
                  {WILAYAH.map(w => (
                    <tr key={w.nama}>
                      <td><strong>{w.nama}</strong></td>
                      <td className="num">{w.kec}</td>
                      <td className="num">{w.jml !== null ? `${w.jml} ${w.sub}` : '-'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>

        {/* Dampak */}
        <div className="panel">
          <div className="panel-head"><h3>Dampak Bencana</h3></div>
          <div className="panel-body">
            <div style={{display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:14}}>
              {DAMPAK.map(d => (
                <div key={d.label} className="stat" style={{'--accent':'var(--pmi-red)'}}>
                  <div className="lbl">{d.emoji} {d.label}</div>
                  <div className="val" style={{fontSize:22}}>{d.nilai}</div>
                  <div className="unit">{d.satuan}</div>
                </div>
              ))}
            </div>
            <div style={{marginTop:18}}>
              <div style={{fontSize:12.5, fontWeight:600, color:'var(--ink-soft)', marginBottom:8}}>Detail unit rumah rusak (dari papan asli — tulisan tangan sebagian tumpang tindih):</div>
              <img src="/infografis/detail-kerusakan.png" alt="Detail kerusakan rumah" style={{maxWidth:400, width:'100%', borderRadius:8, border:'1px solid var(--line)'}} />
            </div>
          </div>
        </div>

        {/* Layanan PMI */}
        <div className="panel">
          <div className="panel-head"><h3>Layanan PMI di Lapangan</h3></div>
          <div className="panel-body" style={{textAlign:'center'}}>
            <img src="/infografis/layanan-pmi.png" alt="Layanan PMI" style={{maxWidth:'100%', borderRadius:10}} />
            <div style={{fontSize:11, color:'var(--ink-soft)', marginTop:6}}>📷 Foto asli — mencakup WASH, Pengurangan Risiko Bencana, dan Layanan Kesehatan.</div>
          </div>
        </div>

        {/* Bantuan PMI */}
        <div className="panel">
          <div className="panel-head"><h3>Bantuan PMI yang Disalurkan</h3></div>
          <div className="panel-body" style={{textAlign:'center'}}>
            <img src="/infografis/bantuan-pmi.png" alt="Bantuan PMI" style={{maxWidth:'100%', borderRadius:10}} />
            <div style={{fontSize:11, color:'var(--ink-soft)', marginTop:6}}>📷 Foto asli rincian bantuan — banyak item dengan angka tulisan tangan, ditampilkan apa adanya agar tidak ada kesalahan baca.</div>
          </div>
        </div>

        {/* Penerima manfaat + sumber daya */}
        <div className="panel">
          <div className="panel-head"><h3>Penerima Manfaat & Sumber Daya</h3></div>
          <div className="panel-body" style={{textAlign:'center'}}>
            <img src="/infografis/penerima-manfaat.png" alt="Penerima manfaat dan sumber daya" style={{maxWidth:500, width:'100%', borderRadius:10}} />
          </div>
        </div>

        {/* Kontak & Donasi */}
        <div className="charts-row" style={{display:'grid', gridTemplateColumns:'1fr 1fr', gap:16}}>
          <div className="panel" style={{marginBottom:0}}>
            <div className="panel-head"><h3>Contact Person</h3></div>
            <div className="panel-body">
              <table>
                <tbody>
                  <tr><td><strong>Hidayatul Irwan</strong></td><td className="mono">08116631171</td></tr>
                  <tr><td><strong>Nuzlan Huda</strong></td><td className="mono">08116617784</td></tr>
                  <tr><td><strong>Zulhendri</strong></td><td className="mono">081374693707</td></tr>
                </tbody>
              </table>
            </div>
          </div>
          <div className="panel" style={{marginBottom:0}}>
            <div className="panel-head"><h3>Salurkan Donasi</h3></div>
            <div className="panel-body">
              <div style={{fontSize:13, color:'var(--ink-soft)', marginBottom:6}}>Rekening Bank Nagari</div>
              <div className="mono" style={{fontSize:20, fontWeight:700, marginBottom:6}}>210002300000805</div>
              <div style={{fontSize:13}}>a.n <strong>PMI Provinsi Sumbar</strong></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
