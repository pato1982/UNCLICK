import { useState, useEffect, useRef } from 'react'

const API = import.meta.env.VITE_API || ''

function parseJSON(val) {
  if (!val) return null
  if (typeof val === 'string') try { return JSON.parse(val) } catch { return null }
  return val
}

const tabsDef = [
  { key: 'superior', label: 'Imagen + Texto Superior', icon: 'vertical_align_top' },
  { key: 'inferior', label: 'Imagen + Texto Inferior', icon: 'vertical_align_bottom' },
]

export default function AdminPagina() {
  const [activeTab, setActiveTab] = useState('superior')
  const [loading, setLoading] = useState(true)
  const [paginaId, setPaginaId] = useState(null)

  // Estado para fila superior
  const [supTitulo, setSupTitulo] = useState('')
  const [supTexto, setSupTexto] = useState('')
  const [supImagen, setSupImagen] = useState(null)   // File o string (url)
  const [supPreview, setSupPreview] = useState(null)
  const [savingSup, setSavingSup] = useState(false)
  const [savedSup, setSavedSup] = useState(false)
  const [supCrop, setSupCrop] = useState(null)
  const supRef = useRef(null)

  // Estado para fila inferior
  const [infTitulo, setInfTitulo] = useState('')
  const [infTexto, setInfTexto] = useState('')
  const [infImagen, setInfImagen] = useState(null)
  const [infPreview, setInfPreview] = useState(null)
  const [savingInf, setSavingInf] = useState(false)
  const [savedInf, setSavedInf] = useState(false)
  const [infCrop, setInfCrop] = useState(null)
  const infRef = useRef(null)


  // Cargar datos existentes
  useEffect(() => {
    const headers = { }
    fetch(`${API}/api/v1/pagina`, { credentials: 'include' })
      .then(r => {
        if (r.status === 401) {
          localStorage.removeItem('token'); localStorage.removeItem('user'); window.location.href = '/'
          return {}
        }
        if (!r.ok) return {}
        return r.json()
      })
      .then(data => {
        if (data.pagina) {
          const p = data.pagina
          setPaginaId(p.id)
          setSupTitulo(p.titulo_superior || '')
          setSupTexto(p.texto_superior || '')
          if (p.imagen_superior) {
            setSupImagen(p.imagen_superior)
            setSupPreview(`${API}${p.imagen_superior}`)
          }
          setInfTitulo(p.titulo_inferior || '')
          setInfTexto(p.texto_inferior || '')
          if (p.imagen_inferior) {
            setInfImagen(p.imagen_inferior)
            setInfPreview(`${API}${p.imagen_inferior}`)
          }
          if (p.crop_superior) setSupCrop(parseJSON(p.crop_superior))
          if (p.crop_inferior) setInfCrop(parseJSON(p.crop_inferior))
        }
      })
      .catch(err => console.error('Error cargando página:', err))
      .finally(() => setLoading(false))
  }, [])

  const handleImage = (type, e) => {
    const file = e.target.files[0]
    if (!file) return
    const reader = new FileReader()
    reader.onloadend = () => {
      if (type === 'superior') {
        setSupImagen(file)
        setSupPreview(reader.result)
        setSavedSup(false)
      } else {
        setInfImagen(file)
        setInfPreview(reader.result)
        setSavedInf(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const removeImage = (type) => {
    if (type === 'superior') {
      setSupImagen(null)
      setSupPreview(null)
      setSavedSup(false)
    } else {
      setInfImagen(null)
      setInfPreview(null)
      setSavedInf(false)
    }
  }

  // Subir imagen si es File, si es string (ya subida) retornar tal cual
  const uploadIfNeeded = async (imagen) => {
    if (!imagen) return null
    if (typeof imagen === 'string') return imagen
    const fd = new FormData()
    fd.append('imagen', imagen)
    const res = await fetch(`${API}/api/v1/upload?tipo=paginas`, {
      method: 'POST',
      credentials: 'include',
      body: fd,
    })
    const data = await res.json()
    return data.url || null
  }

  const [error, setError] = useState('')

  const handleSave = async (type) => {
    const setSaving = type === 'superior' ? setSavingSup : setSavingInf
    const setSaved = type === 'superior' ? setSavedSup : setSavedInf
    setSaving(true)
    setError('')

    try {
      // Subir imágenes si son File, preservando la otra tab tal cual
      let imgSupUrl = supImagen
      let imgInfUrl = infImagen

      if (supImagen instanceof File) {
        imgSupUrl = await uploadIfNeeded(supImagen)
        if (!imgSupUrl) {
          setError('Error al subir la imagen superior')
          setSaving(false)
          return
        }
        setSupImagen(imgSupUrl)
        setSupPreview(`${API}${imgSupUrl}`)
      }

      if (infImagen instanceof File) {
        imgInfUrl = await uploadIfNeeded(infImagen)
        if (!imgInfUrl) {
          setError('Error al subir la imagen inferior')
          setSaving(false)
          return
        }
        setInfImagen(imgInfUrl)
        setInfPreview(`${API}${imgInfUrl}`)
      }

      // Asegurar que las URLs sean strings o null (no objetos File)
      const body = {
        titulo_superior: supTitulo || null,
        texto_superior: supTexto || null,
        imagen_superior: typeof imgSupUrl === 'string' ? imgSupUrl : null,
        titulo_inferior: infTitulo || null,
        texto_inferior: infTexto || null,
        imagen_inferior: typeof imgInfUrl === 'string' ? imgInfUrl : null,
      }

      let res
      if (paginaId) {
        res = await fetch(`${API}/api/v1/pagina/${paginaId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify(body),
        })
      } else {
        res = await fetch(`${API}/api/v1/pagina`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }, credentials: 'include',
          body: JSON.stringify(body),
        })
      }

      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setError(data.error || 'Error al guardar la página')
        setSaving(false)
        return
      }

      const data = await res.json()
      if (data.id) {
        setPaginaId(data.id)
        if (supCrop || infCrop) {
          fetch(`${API}/api/v1/pagina/${data.id}/crop`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' }, credentials: 'include',
            body: JSON.stringify({ crop_superior: supCrop, crop_inferior: infCrop }),
          }).catch(() => {})
        }
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Error guardando página:', err)
      setError('Error de conexión al guardar')
    }
    setSaving(false)
  }

  const current = activeTab === 'superior'
    ? { titulo: supTitulo, setTitulo: setSupTitulo, texto: supTexto, setTexto: setSupTexto, imagen: supImagen, preview: supPreview, ref: supRef, saving: savingSup, saved: savedSup, crop: supCrop, setCrop: setSupCrop }
    : { titulo: infTitulo, setTitulo: setInfTitulo, texto: infTexto, setTexto: setInfTexto, imagen: infImagen, preview: infPreview, ref: infRef, saving: savingInf, saved: savedInf, crop: infCrop, setCrop: setInfCrop }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <span className="material-symbols-outlined text-primary text-3xl animate-spin">progress_activity</span>
      </div>
    )
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-xl font-black text-gray-800">Mi Página</h1>
        <p className="text-xs text-gray-400 mt-0.5">Personaliza las secciones de imagen y texto de tu página premium</p>
      </div>

      {/* Pestañas */}
      <div className="flex mb-4 rounded-xl overflow-hidden border border-gray-200 bg-white shadow-sm">
        {tabsDef.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`flex-1 py-3 text-xs font-semibold transition-colors relative flex items-center justify-center gap-2 ${
              activeTab === tab.key
                ? 'text-primary bg-primary/5'
                : 'text-gray-400 hover:text-gray-600 hover:bg-gray-50'
            }`}
          >
            <span className="material-symbols-outlined text-base">{tab.icon}</span>
            {tab.label}
            {activeTab === tab.key && <span className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary" />}
          </button>
        ))}
      </div>

      {/* Mensaje de error */}
      {error && (
        <div className="mb-4 bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-2 flex items-center gap-2">
          <span className="material-symbols-outlined text-base">error</span>
          {error}
        </div>
      )}

      {/* Contenido de la pestaña activa */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 sm:p-6">
        <div className="flex flex-col sm:flex-row gap-6">
          {/* Columna izquierda — Imagen */}
          <div className="w-full sm:w-80 shrink-0">
            <label className="block text-[11px] font-semibold text-gray-600 mb-2">
              Imagen {activeTab === 'superior' ? 'superior' : 'inferior'}
            </label>

            {current.preview ? (
              <div className="w-full rounded-xl overflow-hidden border border-gray-200 shadow-sm bg-gray-50" style={{ aspectRatio: '16/9' }}>
                <img
                  src={current.preview}
                  alt={`Imagen ${activeTab}`}
                  className="w-full h-full object-contain"
                />
              </div>
            ) : (
              <button
                type="button"
                onClick={() => current.ref.current?.click()}
                className="w-full border-2 border-dashed border-gray-300 rounded-xl flex flex-col items-center justify-center gap-1.5 hover:border-primary hover:bg-primary/5 transition-all cursor-pointer py-6"
                style={{ aspectRatio: '16/9' }}
              >
                <span className="material-symbols-outlined text-3xl text-gray-400">cloud_upload</span>
                <span className="text-xs font-semibold text-gray-500">Buscar imagen</span>
                <span className="text-[10px] text-gray-400">JPG, PNG, WEBP</span>
                <span className="text-[10px] text-amber-600 font-semibold mt-1 px-3 text-center leading-tight">
                  📐 Recuerda usar una imagen rectangular (horizontal) para que se vea bien
                </span>
              </button>
            )}

            {/* Botones editar/quitar cuando hay imagen */}
            {current.preview && (
              <div className="flex gap-2 mt-2">
                <button
                  type="button"
                  onClick={() => current.ref.current?.click()}
                  className="flex-1 text-[11px] font-semibold text-primary border border-primary/30 rounded-lg py-1.5 hover:bg-primary/5 transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">edit</span>
                  Cambiar
                </button>
                <button
                  type="button"
                  onClick={() => removeImage(activeTab)}
                  className="flex-1 text-[11px] font-semibold text-red-500 border border-red-200 rounded-lg py-1.5 hover:bg-red-50 transition-colors flex items-center justify-center gap-1"
                >
                  <span className="material-symbols-outlined text-sm">delete</span>
                  Quitar
                </button>
              </div>
            )}

            <input
              ref={supRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImage('superior', e)}
              className="hidden"
            />
            <input
              ref={infRef}
              type="file"
              accept="image/*"
              onChange={(e) => handleImage('inferior', e)}
              className="hidden"
            />

            <p className="text-[10px] text-gray-400 text-center mt-2">
              {activeTab === 'superior'
                ? 'Esta imagen aparece a la izquierda del texto'
                : 'Esta imagen aparece a la derecha del texto'}
            </p>
          </div>

          {/* Columna derecha — Título + Texto */}
          <div className="flex-1 flex flex-col gap-4">
            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Título</label>
              <input
                type="text"
                value={current.titulo}
                onChange={(e) => { current.setTitulo(e.target.value); activeTab === 'superior' ? setSavedSup(false) : setSavedInf(false) }}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none"
                placeholder={activeTab === 'superior' ? 'Ejemplo: Sobre Nosotros' : 'Ejemplo: Nuestra Historia'}
              />
            </div>

            <div>
              <label className="block text-[11px] font-semibold text-gray-600 mb-0.5">Texto</label>
              <textarea
                value={current.texto}
                onChange={(e) => { current.setTexto(e.target.value); activeTab === 'superior' ? setSavedSup(false) : setSavedInf(false) }}
                rows={6}
                className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-primary/30 focus:border-primary outline-none resize-none"
                placeholder={activeTab === 'superior'
                  ? 'Ejemplo: Somos líderes en ascensos al volcán Villarrica con más de 15 años de experiencia...'
                  : 'Ejemplo: Nuestra empresa nació el año 2010 con la misión de acercar la naturaleza a las personas...'}
              />
            </div>

            {/* Botón guardar */}
            <div className="flex items-center gap-3 mt-2">
              <button
                type="button"
                onClick={() => handleSave(activeTab)}
                disabled={current.saving || current.saved}
                className={`font-bold px-6 py-2.5 rounded-lg transition-all text-sm flex items-center gap-2 disabled:opacity-90 ${
                  current.saved
                    ? 'bg-green-500 text-white'
                    : 'bg-primary text-white hover:bg-primary/90'
                }`}
              >
                <span className="material-symbols-outlined text-lg">{current.saved ? 'check_circle' : 'save'}</span>
                {current.saving ? 'Guardando...' : current.saved ? 'Guardado' : 'Guardar cambios'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Vista previa */}
      <div className="mt-6">
        <p className="text-[10px] font-semibold text-gray-500 mb-2 flex items-center gap-1">
          <span className="material-symbols-outlined text-xs">visibility</span>
          Vista previa — {activeTab === 'superior' ? 'Fila superior de tu página' : 'Fila inferior de tu página'}
        </p>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 max-w-2xl">
          {activeTab === 'superior' ? (
            <div className="flex flex-col sm:flex-row gap-5 items-center">
              {current.preview ? (
                <div className="sm:w-1/2 rounded-xl overflow-hidden shadow-md bg-gray-50" style={{ aspectRatio: '16/9' }}>
                  <img src={current.preview} alt="Superior" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="sm:w-1/2 bg-gray-50 rounded-xl flex items-center justify-center border border-dashed border-gray-200" style={{ aspectRatio: '16/9' }}>
                  <span className="material-symbols-outlined text-3xl text-gray-300">image</span>
                </div>
              )}
              <div className="sm:w-1/2 flex flex-col">
                <h3 className="text-sm font-black text-primary mb-2">{current.titulo || 'Sobre Nosotros'}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{current.texto || 'Tu texto aparecerá aquí...'}</p>
              </div>
            </div>
          ) : (
            <div className="flex flex-col sm:flex-row gap-5 items-center">
              <div className="sm:w-1/2 flex flex-col">
                <h3 className="text-sm font-black text-primary mb-2">{current.titulo || 'Nuestra Historia'}</h3>
                <p className="text-xs text-slate-500 leading-relaxed">{current.texto || 'Tu texto aparecerá aquí...'}</p>
              </div>
              {current.preview ? (
                <div className="sm:w-1/2 rounded-xl overflow-hidden shadow-md bg-gray-50" style={{ aspectRatio: '16/9' }}>
                  <img src={current.preview} alt="Inferior" className="w-full h-full object-contain" />
                </div>
              ) : (
                <div className="sm:w-1/2 bg-gray-50 rounded-xl flex items-center justify-center border border-dashed border-gray-200" style={{ aspectRatio: '16/9' }}>
                  <span className="material-symbols-outlined text-3xl text-gray-300">image</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
