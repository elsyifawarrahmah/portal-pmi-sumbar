'use client'
// Isi tab Pusdiklat / Klinik pada PMI Provinsi: menu bagian + isi bagian terpilih
import { useState } from 'react'
import Ikon from '@/components/Ikon'
import UnitSeksi from '@/components/UnitSeksi'
import KlinikRekap from '@/components/KlinikRekap'
import { PUSDIKLAT, KLINIK } from '@/lib/unitConfig'

export default function UnitPanel({ jenis, supabase, isAdmin }) {
  const daftar = jenis === 'pusdiklat' ? PUSDIKLAT : KLINIK
  const [aktif, setAktif] = useState(daftar[0].id)
  const cfg = daftar.find(d => d.id === aktif) || daftar[0]
  return (
    <div>
      <div className="unit-sub" role="tablist">
        {daftar.map((d, i) => (
          <button key={d.id} type="button" role="tab" aria-selected={aktif === d.id} className={'unit-subtab' + (aktif === d.id ? ' on' : '')} onClick={() => setAktif(d.id)}>
            <span className="unit-no">{i + 1}</span> {d.label}
          </button>
        ))}
      </div>
      {cfg.khusus === 'rekap' ? <KlinikRekap supabase={supabase} /> : <UnitSeksi key={jenis + cfg.id} cfg={cfg} supabase={supabase} isAdmin={isAdmin} />}
    </div>
  )
}
