import { useState, useEffect } from 'react'
import EventModal from './EventModal'

const API = import.meta.env.VITE_API || ''

const badgeColors = {
  'Música': 'bg-primary-light text-white',
  'Musica': 'bg-primary-light text-white',
  'Gastronomía': 'bg-accent text-primary font-black',
  'Gastronomia': 'bg-accent text-primary font-black',
  'Deporte': 'bg-red-500 text-white',
  'Cultura': 'bg-primary text-white',
  'Artesanía': 'bg-amber-500 text-white',
  'Artesania': 'bg-amber-500 text-white',
  'Ferias': 'bg-teal-500 text-white',
  'Familiar': 'bg-blue-400 text-white',
  'Nocturno': 'bg-purple-600 text-white',
  'Educación': 'bg-blue-500 text-white',
  'Educacion': 'bg-blue-500 text-white',
  'Beneficencia': 'bg-pink-500 text-white',
  'Naturaleza': 'bg-green-600 text-white',
  'Religioso': 'bg-amber-600 text-white',
}

function getBadgeColor(categoria) {
  return badgeColors[categoria] || 'bg-slate-500 text-white'
}

function isGratis(precio) {
  if (!precio || precio === 0) return true
  const lower = String(precio).toLowerCase().trim()
  return lower === 'entrada libre' || lower === 'gratis' || lower === '' || lower === '$0' || lower === '0'
}

function EventCard({ event }) {
  const [showModal, setShowModal] = useState(false)
  return (
    <>
      <div
        className="bg-white rounded-lg sm:rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all flex flex-col group border border-slate-100 cursor-pointer"
        onClick={() => setShowModal(true)}
      >
        <div className="relative h-32 sm:h-32 md:h-40 bg-slate-100 overflow-hidden">
          <img
            src={event.image}
            alt={event.title}
            className="w-full h-full object-contain"
          />
          <span className={`absolute top-1 left-1 sm:top-2 sm:left-2 ${event.badgeColor} px-1 sm:px-2 py-0.5 rounded-full text-[6px] sm:text-[8px] font-black uppercase tracking-wider shadow`}>
            {event.badge}
          </span>
        </div>
        <div className="px-1.5 sm:px-4 py-1.5 sm:py-3 flex flex-col flex-1">
          <div className="min-h-[24px] sm:min-h-0 flex items-start">
            <h3 className="font-bold text-[10px] sm:text-xs text-slate-900 leading-tight line-clamp-2 sm:line-clamp-1 mb-0.5 sm:mb-1.5">{event.title}</h3>
          </div>
          <div className="flex items-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1">
            <span className="material-symbols-outlined text-accent text-[9px] sm:text-xs shrink-0">calendar_month</span>
            <p className="text-[9px] sm:text-[10px] font-bold text-slate-600">{event.date}</p>
          </div>
          <div className="flex items-start gap-0.5 sm:gap-1 mb-0.5 sm:mb-2">
            <span className="material-symbols-outlined text-slate-400 text-[9px] sm:text-xs mt-0.5 shrink-0">location_on</span>
            <p className="text-[9px] sm:text-[10px] text-slate-500 line-clamp-1">{event.location}</p>
          </div>
          <div className="mt-auto text-center">
            <span className="text-[10px] sm:text-xs font-black text-primary">{event.price}</span>
          </div>
        </div>
      </div>
      {showModal && <EventModal event={event} onClose={() => setShowModal(false)} />}
    </>
  )
}


export default function EventsPage({ sidebarOpen, onBack, activeFilter }) {
  const [allEvents, setAllEvents] = useState([])
  const [currentPage, setCurrentPage] = useState(0)
  const [scrolled, setScrolled] = useState(false)
  const [headerH, setHeaderH] = useState(116)

  useEffect(() => {
    const measure = () => {
      const el = document.getElementById('main-header')
      if (el) setHeaderH(el.offsetHeight)
    }
    measure()
    window.addEventListener('resize', measure)
    return () => window.removeEventListener('resize', measure)
  }, [])

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 60)
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  useEffect(() => {
    fetch(`${API}/api/v1/eventos`)
      .then(r => r.json())
      .then(data => {
        const mapped = (data.eventos || []).map(e => ({
          id: e.id,
          title: e.titulo,
          image: e.imagen ? `${API}${e.imagen}` : '',
          imagen_2: e.imagen_2 ? `${API}${e.imagen_2}` : null,
          imagen_3: e.imagen_3 ? `${API}${e.imagen_3}` : null,
          date: e.fecha || '',
          location: e.ubicacion || '',
          price: e.precio || 'Entrada libre',
          type: e.categoria_nombre || '',
          badge: isGratis(e.precio) ? 'Gratis' : (e.categoria_nombre || ''),
          badgeColor: isGratis(e.precio) ? 'bg-green-500 text-white' : getBadgeColor(e.categoria_nombre),
          descripcion: e.descripcion || '',
          organizador: e.organizador || '',
          telefono: e.telefono || '',
          whatsapp: e.whatsapp || '',
          horario: e.horario || '',
        }))
        setAllEvents(mapped)
      })
      .catch(() => setAllEvents([]))
  }, [])

  const filteredEvents = activeFilter
    ? allEvents.filter((e) => e.type && e.type.toLowerCase() === activeFilter.toLowerCase())
    : allEvents

  const cols = sidebarOpen ? 5 : 6
  const ROWS_PER_PAGE = 10
  const itemsPerPage = ROWS_PER_PAGE * cols
  const totalPages = Math.max(1, Math.ceil(filteredEvents.length / itemsPerPage))
  const pageItems = filteredEvents.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)

  const goToPage = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0 })
  }

  return (
    <div>
      {scrolled && (
        <button
          onClick={onBack}
          aria-label="Inicio"
          className="sm:hidden fixed right-3 z-50 flex items-center justify-center h-11 w-11 rounded-full bg-accent text-primary shadow-lg hover:brightness-110 active:scale-95 transition-all"
          style={{ top: headerH + 10 }}
        >
          <span className="material-symbols-outlined text-xl">home</span>
        </button>
      )}
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <button
          onClick={onBack}
          className="hidden sm:flex items-center gap-1 text-primary hover:text-accent transition-colors text-[10px] sm:text-xs font-bold"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Volver
        </button>
        <div className="w-1 h-4 sm:h-5 bg-accent rounded-full sm:block hidden"></div>
        <h2 className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide">
          {activeFilter ? activeFilter : 'Todos los Eventos'}
        </h2>
        <span className="text-[9px] sm:text-[10px] text-slate-400">
          {filteredEvents.length} {filteredEvents.length === 1 ? 'evento' : 'eventos'}
        </span>
        <button
          onClick={onBack}
          aria-label="Inicio"
          className="sm:hidden ml-auto shrink-0 flex items-center justify-center h-7 w-7 rounded-full bg-accent text-primary shadow hover:brightness-110 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-base">home</span>
        </button>
      </div>

      <div className={`grid gap-2 sm:gap-3 md:gap-4 ${sidebarOpen ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-6'} transition-all duration-300`}>
        {pageItems.map((event, idx) => (
          <EventCard key={`${event.id}-${idx}`} event={event} />
        ))}
      </div>

      {filteredEvents.length === 0 && (
        <p className="text-center text-slate-400 text-xs mt-8">
          No hay eventos para mostrar.
        </p>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage === 0}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            <span className="material-symbols-outlined text-sm">chevron_left</span>
          </button>

          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => goToPage(i)}
              className={`h-8 w-8 rounded-lg text-xs font-bold transition-all ${
                i === currentPage
                  ? 'bg-primary text-white shadow'
                  : 'text-slate-500 hover:bg-slate-100'
              }`}
            >
              {i + 1}
            </button>
          ))}

          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage === totalPages - 1}
            className="h-8 w-8 rounded-lg flex items-center justify-center text-primary hover:bg-primary hover:text-white transition-all disabled:opacity-30 disabled:pointer-events-none"
          >
            <span className="material-symbols-outlined text-sm">chevron_right</span>
          </button>
        </div>
      )}
    </div>
  )
}
