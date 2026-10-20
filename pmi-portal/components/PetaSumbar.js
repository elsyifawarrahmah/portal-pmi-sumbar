'use client'

// Peta interaktif Sumatera Barat (Leaflet + peta dasar OpenStreetMap).
// 19 kabupaten/kota diwarnai sesuai status dampak. Bisa digeser dan di-zoom.
import { useEffect, useRef } from 'react'
import 'leaflet/dist/leaflet.css'
import SUMBAR_GEO from './sumbarGeo'

const STATUS_WARNA = {
  parah: '#C8102E',
  sedang: '#E0A020',
  ringan: '#2D6A4F',
  aman: '#B9D6C4',
}

const REGIONS = SUMBAR_GEO.features.map(f => ({ id: f.properties.id, nama: f.properties.nama }))

const STATUS_LABEL = { parah: 'Parah', sedang: 'Sedang', ringan: 'Ringan', aman: 'Aman' }

function gaya(status, isActive) {
  return {
    color: isActive ? '#1B1715' : '#7A0C20',
    weight: isActive ? 3 : 1.2,
    opacity: 1,
    fillColor: STATUS_WARNA[status] || STATUS_WARNA.aman,
    fillOpacity: isActive ? 0.8 : 0.6,
  }
}

export default function PetaSumbar({ statusWilayah = {}, aktif, onSelect }) {
  const wadah = useRef(null)
  const peta = useRef(null)
  const lapisan = useRef({})       // id -> layer
  const infoEl = useRef(null)
  const terbaru = useRef({})       // nilai terbaru untuk dipakai handler
  terbaru.current = { statusWilayah, aktif, onSelect }

  // Buat peta sekali
  useEffect(() => {
    let batal = false
    let petaLokal = null
    ;(async () => {
      const L = (await import('leaflet')).default
      if (batal || !wadah.current) return

      petaLokal = L.map(wadah.current, {
        zoomControl: true,
        scrollWheelZoom: false,
        minZoom: 6,
        maxZoom: 13,
        attributionControl: true,
      })
      peta.current = petaLokal

      L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
        maxZoom: 19,
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright" target="_blank" rel="noopener">OpenStreetMap</a>',
      }).addTo(petaLokal)

      // Kotak info (pojok kanan atas)
      const info = L.control({ position: 'topright' })
      info.onAdd = () => {
        const div = L.DomUtil.create('div', 'peta-info')
        div.innerHTML = 'Arahkan ke wilayah'
        infoEl.current = div
        return div
      }
      info.addTo(petaLokal)

      const geo = L.geoJSON(SUMBAR_GEO, {
        style: f => gaya(terbaru.current.statusWilayah[f.properties.id] || 'aman', terbaru.current.aktif === f.properties.id),
        onEachFeature: (f, layer) => {
          const { id, nama } = f.properties
          lapisan.current[id] = layer
          layer.bindTooltip(nama, { permanent: true, direction: 'center', className: 'peta-label', opacity: 1 })
          layer.on('mouseover', () => {
            const st = terbaru.current.statusWilayah[id] || 'aman'
            if (infoEl.current) infoEl.current.innerHTML = `<b>${nama}</b><br/>Status: ${STATUS_LABEL[st] || st}`
            layer.setStyle({ weight: 2.5 })
          })
          layer.on('mouseout', () => {
            const st = terbaru.current.statusWilayah[id] || 'aman'
            layer.setStyle(gaya(st, terbaru.current.aktif === id))
            if (infoEl.current) infoEl.current.innerHTML = 'Arahkan ke wilayah'
          })
          layer.on('click', () => {
            const st = terbaru.current.statusWilayah[id] || 'aman'
            if (infoEl.current) infoEl.current.innerHTML = `<b>${nama}</b><br/>Status: ${STATUS_LABEL[st] || st}`
            if (terbaru.current.onSelect) terbaru.current.onSelect(id, nama)
          })
        },
      }).addTo(petaLokal)

      petaLokal.fitBounds(geo.getBounds(), { padding: [8, 8] })

      // Label nama: wilayah luas tampil dari awal, wilayah kecil muncul saat di-zoom
      const atur = () => {
        const z = petaLokal.getZoom()
        Object.values(lapisan.current).forEach(layer => {
          const b = layer.getBounds()
          const span = Math.max(b.getNorth() - b.getSouth(), b.getEast() - b.getWest())
          const minZ = span > 0.5 ? 7 : span > 0.25 ? 8 : span > 0.12 ? 9 : 10
          if (z >= minZ) layer.openTooltip()
          else layer.closeTooltip()
        })
      }
      petaLokal.on('zoomend', atur)
      atur()

      // Scroll-zoom hanya aktif setelah peta diklik (supaya halaman tetap bisa di-scroll)
      petaLokal.on('click', () => petaLokal.scrollWheelZoom.enable())
      petaLokal.on('mouseout', () => petaLokal.scrollWheelZoom.disable())

      setTimeout(() => petaLokal && petaLokal.invalidateSize(), 150)
    })()
    return () => {
      batal = true
      if (petaLokal) { petaLokal.remove(); petaLokal = null }
      peta.current = null
      lapisan.current = {}
    }
  }, [])

  // Perbarui warna saat status / wilayah aktif berubah
  useEffect(() => {
    Object.entries(lapisan.current).forEach(([id, layer]) => {
      layer.setStyle(gaya(statusWilayah[id] || 'aman', aktif === id))
      if (aktif === id) layer.bringToFront()
    })
  }, [statusWilayah, aktif])

  return (
    <div className="peta-wrap">
      <div ref={wadah} className="peta-sumbar" role="application" aria-label="Peta wilayah terdampak Sumatera Barat" />
    </div>
  )
}

export { REGIONS, STATUS_WARNA }
