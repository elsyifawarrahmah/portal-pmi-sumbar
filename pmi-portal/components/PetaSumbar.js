'use client'

// Peta vektor disederhanakan dari susunan geografis Sumatera Barat (bukan foto).
// Tiap wilayah punya path sendiri, warna diatur dari data infografis (bukan hardcode).
const REGIONS = [
  { id: 'pasaman_barat', nama: 'Pasaman Barat', d: 'M40,20 L110,15 L120,70 L70,90 L35,70 Z' },
  { id: 'pasaman', nama: 'Pasaman', d: 'M110,15 L175,10 L185,55 L120,70 Z' },
  { id: 'agam', nama: 'Agam', d: 'M120,70 L185,55 L200,110 L140,125 L70,90 Z' },
  { id: 'bukittinggi', nama: 'Bukittinggi', d: 'M150,88 L168,85 L172,100 L155,104 Z' },
  { id: 'limapuluh_kota', nama: 'Limapuluh Kota', d: 'M185,55 L250,60 L255,120 L200,110 Z' },
  { id: 'payakumbuh', nama: 'Payakumbuh', d: 'M205,95 L225,92 L228,108 L208,111 Z' },
  { id: 'tanah_datar', nama: 'Tanah Datar', d: 'M140,125 L200,110 L205,150 L155,165 Z' },
  { id: 'padang_panjang', nama: 'Padang Panjang', d: 'M148,128 L165,125 L168,140 L151,143 Z' },
  { id: 'padang_pariaman', nama: 'Padang Pariaman', d: 'M70,90 L140,125 L120,175 L60,165 L45,120 Z' },
  { id: 'kota_pariaman', nama: 'Kota Pariaman', d: 'M55,140 L75,137 L78,155 L58,158 Z' },
  { id: 'sijunjung', nama: 'Sijunjung', d: 'M205,150 L255,120 L280,165 L235,195 Z' },
  { id: 'solok', nama: 'Solok', d: 'M120,175 L155,165 L205,150 L235,195 L180,230 L130,220 Z' },
  { id: 'kota_solok', nama: 'Kota Solok', d: 'M168,192 L188,189 L191,206 L171,209 Z' },
  { id: 'padang', nama: 'Kota Padang', d: 'M60,165 L120,175 L130,220 L95,245 L65,215 Z' },
  { id: 'solok_selatan', nama: 'Solok Selatan', d: 'M180,230 L235,195 L265,235 L215,265 Z' },
  { id: 'dharmasraya', nama: 'Dharmasraya', d: 'M235,195 L280,165 L310,205 L265,235 Z' },
  { id: 'pesisir_selatan', nama: 'Pesisir Selatan', d: 'M95,245 L130,220 L180,230 L215,265 L190,320 L150,360 L120,330 Z' },
  { id: 'mentawai', nama: 'Kep. Mentawai', d: 'M0,220 L25,210 L32,245 L15,258 Z M10,275 L28,268 L33,295 L18,300 Z M20,320 L35,312 L40,335 L25,340 Z' },
]

const STATUS_WARNA = {
  parah: '#C8102E',
  sedang: '#E0A020',
  ringan: '#2D6A4F',
  aman: '#B9D6C4',
}

export default function PetaSumbar({ statusWilayah = {}, aktif, onSelect }) {
  return (
    <svg viewBox="0 0 320 370" style={{ width: '100%', maxWidth: 380, height: 'auto', margin: '0 auto', display: 'block' }}>
      {REGIONS.map(r => {
        const status = statusWilayah[r.id] || 'aman'
        const warna = STATUS_WARNA[status] || STATUS_WARNA.aman
        const isActive = aktif === r.id
        return (
          <path
            key={r.id}
            d={r.d}
            fill={warna}
            stroke="#fff"
            strokeWidth={isActive ? 2.5 : 1.3}
            opacity={isActive ? 1 : 0.92}
            style={{ cursor: onSelect ? 'pointer' : 'default', transition: 'opacity .15s' }}
            onClick={() => onSelect && onSelect(r.id, r.nama)}
          >
            <title>{r.nama}</title>
          </path>
        )
      })}
    </svg>
  )
}

export { REGIONS, STATUS_WARNA }
