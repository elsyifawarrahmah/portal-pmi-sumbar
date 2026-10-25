// Memuat data awal Organisasi (ketua, markas, kepengurusan) dari aplikasi, memakai sesi admin yang sedang login.
// Aman dijalankan berulang: data yang sudah ada tidak ditimpa dan tidak digandakan.
export async function muatDataAwal(supabase, onProgress = () => {}) {
  const { ORG, PENGURUS } = await import('./seedOrganisasi')
  const hasil = { organisasi: 0, pengurus: 0, relawan: 0 }

  onProgress('Memuat daftar ketua dan markas...')
  const { data: sebelum, error: e0 } = await supabase.from('pmi_organisasi').select('slug')
  if (e0) throw e0
  const ada = new Set((sebelum || []).map(x => x.slug))
  const baru = ORG.filter(o => !ada.has(o.slug))
  if (baru.length) {
    const { error } = await supabase.from('pmi_organisasi').insert(baru)
    if (error) throw error
    hasil.organisasi = baru.length
  }

  const { data: orgs, error: e1 } = await supabase.from('pmi_organisasi').select('id, slug, jenis')
  if (e1) throw e1

  onProgress('Memuat kepengurusan...')
  const { data: sudahPeng, error: e2 } = await supabase.from('pmi_pengurus').select('organisasi_id')
  if (e2) throw e2
  const sudah = new Set((sudahPeng || []).map(x => x.organisasi_id))
  const barisPeng = []
  orgs.forEach(o => {
    if (sudah.has(o.id) || !PENGURUS[o.slug]) return
    PENGURUS[o.slug].forEach(p => barisPeng.push({ organisasi_id: o.id, ...p }))
  })
  for (let i = 0; i < barisPeng.length; i += 150) {
    const { error } = await supabase.from('pmi_pengurus').insert(barisPeng.slice(i, i + 150))
    if (error) throw error
  }
  hasil.pengurus = barisPeng.length

  onProgress('Menyiapkan tabel relawan...')
  const { data: sudahRel, error: e3 } = await supabase.from('relawan').select('organisasi_id')
  if (e3) throw e3
  const adaRel = new Set((sudahRel || []).map(x => x.organisasi_id))
  const barisRel = orgs.filter(o => o.jenis !== 'provinsi' && !adaRel.has(o.id)).map(o => ({ organisasi_id: o.id }))
  if (barisRel.length) {
    const { error } = await supabase.from('relawan').insert(barisRel)
    if (error) throw error
  }
  hasil.relawan = barisRel.length
  return hasil
}
