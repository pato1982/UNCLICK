import { Router } from 'express'
const router = Router()

// GET /api/v1/categorias
// GET /api/v1/categorias?tipo=producto
// GET /api/v1/categorias?tipo=producto,servicio,arriendo
// Devuelve cada categoría con sus subcategorías anidadas
router.get('/', async (req, res) => {
  try {
    const { tipo } = req.query
    let catQuery  = 'SELECT id, nombre, icono, tipo FROM tb_categorias'
    let catParams = []

    if (tipo) {
      const tipos = tipo.split(',').map(t => t.trim()).filter(Boolean)
      catQuery += ` WHERE tipo IN (${tipos.map(() => '?').join(',')})`
      catParams = tipos
    }
    catQuery += ' ORDER BY nombre'

    const [categorias] = await req.pool.query(catQuery, catParams)
    if (categorias.length === 0) return res.json({ categorias: [] })

    // Subcategorías de todas las categorías obtenidas en una sola query
    const ids = categorias.map(c => c.id)
    const [subs] = await req.pool.query(
      `SELECT id, categoria_id, nombre FROM tb_subcategorias
       WHERE categoria_id IN (${ids.map(() => '?').join(',')})
       ORDER BY nombre`,
      ids
    )

    // Anidar subcategorías dentro de su categoría
    const mapa = {}
    categorias.forEach(c => { mapa[c.id] = { ...c, subcategorias: [] } })
    subs.forEach(s => { mapa[s.categoria_id]?.subcategorias.push({ id: s.id, nombre: s.nombre }) })

    res.json({ categorias: Object.values(mapa) })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener categorías' })
  }
})

// GET /api/v1/categorias/sidebar
// Solo categorías que tienen al menos 1 listing activo publicado.
// Formato: { categorias: [{ tipo, nombre, subcategorias: [{ nombre }] }] }
router.get('/sidebar', async (req, res) => {
  try {
    const [cats] = await req.pool.query(`
      SELECT DISTINCT l.tipo, l.categoria AS nombre
      FROM tb_listings l
      JOIN usuarios u ON u.id = l.usuario_id AND u.activo = 1
      WHERE l.activo = 1
        AND l.tipo IN ('producto','servicio','arriendo')
        AND l.categoria IS NOT NULL AND l.categoria != ''
      ORDER BY l.tipo, l.categoria
    `)

    if (cats.length === 0) return res.json({ categorias: [] })

    const [subs] = await req.pool.query(`
      SELECT DISTINCT l.tipo, l.categoria, l.subcategoria AS nombre
      FROM tb_listings l
      JOIN usuarios u ON u.id = l.usuario_id AND u.activo = 1
      WHERE l.activo = 1
        AND l.tipo IN ('producto','servicio','arriendo')
        AND l.categoria IS NOT NULL AND l.categoria != ''
        AND l.subcategoria IS NOT NULL AND l.subcategoria != ''
      ORDER BY l.tipo, l.categoria, l.subcategoria
    `)

    const result = cats.map(c => ({
      tipo: c.tipo,
      nombre: c.nombre,
      subcategorias: subs
        .filter(s => s.tipo === c.tipo && s.categoria === c.nombre)
        .map(s => ({ nombre: s.nombre }))
    }))

    res.json({ categorias: result })
  } catch (err) {
    console.error(err)
    res.status(500).json({ error: 'Error al obtener categorías del sidebar' })
  }
})

export default router
