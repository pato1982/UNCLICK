import { useState, useEffect, useRef, useCallback } from 'react'
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


function shuffle(arr) {
  const result = [...arr]
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[result[i], result[j]] = [result[j], result[i]]
  }
  return result
}

export default function EventsSection({ onViewAll }) {
  const [allEvents, setAllEvents] = useState([])
  const [displayEvents, setDisplayEvents] = useState([])
  const [fading, setFading] = useState(false)
  const [selectedEvent, setSelectedEvent] = useState(null)
  const rotationRef = useRef(null)

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
          badge: isGratis(e.precio) ? 'Gratis' : (e.categoria_nombre || ''),
          badgeColor: isGratis(e.precio) ? 'bg-green-500 text-white' : getBadgeColor(e.categoria_nombre),
          descripcion: e.descripcion || '',
          organizador: e.organizador || '',
          telefono: e.telefono || '',
          whatsapp: e.whatsapp || '',
          horario: e.horario || '',
        }))
        setAllEvents(mapped)
        setDisplayEvents(shuffle(mapped).slice(0, 6))
      })
      .catch(() => {
        setAllEvents([])
        setDisplayEvents([])
      })
  }, [])

  // Rotar cada 10 segundos
  const rotate = useCallback(() => {
    const source = allEvents
    setFading(true)
    setTimeout(() => {
      setDisplayEvents(shuffle(source).slice(0, 6))
      setFading(false)
    }, 700)
  }, [allEvents])

  useEffect(() => {
    rotationRef.current = setInterval(rotate, 10000)
    return () => clearInterval(rotationRef.current)
  }, [rotate])

  const renderCard = (event) => (
    <div
      key={event.id}
      className={`rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-white/10 group w-full duration-700 cursor-pointer ${fading ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: 'rgba(255,255,255,0.06)' }}
      onClick={() => setSelectedEvent(event)}
    >
      <div className="relative w-full overflow-hidden" style={{ aspectRatio: '1/1' }}>
        <img
          src={event.image}
          alt={event.title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
        />
        <span className={`absolute top-1 left-1 sm:top-1.5 sm:left-1.5 ${event.badgeColor} px-1 sm:px-1.5 py-0.5 rounded-full text-[6px] sm:text-[7px] font-black uppercase tracking-wider shadow`}>
          {event.badge}
        </span>
      </div>
      <div className="px-1.5 sm:p-2.5 py-1.5">
        <div className="min-h-[24px] sm:min-h-0 flex items-start">
          <h3 className="font-bold text-xs sm:text-[10px] text-white leading-tight line-clamp-2 sm:line-clamp-1 mb-0.5 sm:mb-1">{event.title}</h3>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1 mb-0.5">
          <span className="material-symbols-outlined text-accent text-[10px]">calendar_month</span>
          <span className="text-[10px] sm:text-[9px] font-bold text-white/60">{event.date}</span>
        </div>
        <div className="flex items-center gap-0.5 sm:gap-1 mb-0.5 sm:mb-1.5">
          <span className="material-symbols-outlined text-white/40 text-[10px]">location_on</span>
          <span className="text-[10px] sm:text-[9px] text-white/40 line-clamp-1">{event.location}</span>
        </div>
        <div className="text-center">
          <span className="text-[10px] font-black text-accent">{event.price}</span>
        </div>
      </div>
    </div>
  )

  return (
    <div className="rounded-2xl p-3 sm:p-4" style={{ background: '#1a1220' }}>
      <div className="flex items-center gap-2 sm:gap-3 mb-3 sm:mb-4">
        <div className="w-1 h-4 sm:h-5 bg-accent rounded-full"></div>
        <h2 className="text-xs sm:text-sm font-black text-white tracking-wide">Próximos Eventos</h2>
        <div className="flex-1 h-px bg-white/10"></div>
        <button onClick={onViewAll} className="text-[9px] sm:text-[10px] font-bold text-accent hover:text-white transition-colors uppercase tracking-wider">Ver todo</button>
      </div>
      <>
        {/* MOBILE: grilla 2 por fila */}
        <div className="sm:hidden grid grid-cols-2 gap-2">
          {displayEvents.map(event => renderCard(event))}
        </div>

        {/* TABLET/DESKTOP: grid */}
        <div className="hidden sm:grid sm:grid-cols-4 md:grid-cols-6 gap-2">
          {displayEvents.map(event => renderCard(event))}
        </div>
      </>
      {selectedEvent && <EventModal event={selectedEvent} onClose={() => setSelectedEvent(null)} />}
    </div>
  )
}
