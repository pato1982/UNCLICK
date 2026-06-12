import { useState, useEffect, useRef, useCallback } from 'react'

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

const PLACEHOLDER_EVENTS = [
  { id: 'ph-e1', title: 'Festival de Verano Villarrica', image: 'https://images.unsplash.com/photo-1470229722913-7c0e2dbbafd3?w=300&q=80', date: '15 Abril', location: 'Plaza de Armas', price: 'Entrada libre', badge: 'Música', badgeColor: 'bg-primary-light text-white' },
  { id: 'ph-e2', title: 'Feria Gastronómica del Lago', image: 'https://images.unsplash.com/photo-1414235077428-338989a2e8c0?w=300&q=80', date: '20 Abril', location: 'Costanera', price: '$5.000', badge: 'Gastronomía', badgeColor: 'bg-accent text-primary font-black' },
  { id: 'ph-e3', title: 'Carrera Trail Volcán 2026', image: 'https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=300&q=80', date: '3 Mayo', location: 'Volcán Lanín', price: '$15.000', badge: 'Deporte', badgeColor: 'bg-red-500 text-white' },
  { id: 'ph-e4', title: 'Expo Arte Mapuche Local', image: 'https://images.unsplash.com/photo-1541417904950-b855846fe074?w=300&q=80', date: '8 Mayo', location: 'Centro Cultural', price: 'Gratis', badge: 'Cultura', badgeColor: 'bg-primary text-white' },
  { id: 'ph-e5', title: 'Feria Artesanal de Otoño', image: 'https://images.unsplash.com/photo-1533174072545-7a4b6ad7a6c3?w=300&q=80', date: '10 Mayo', location: 'Mercado Local', price: 'Gratis', badge: 'Artesanía', badgeColor: 'bg-amber-500 text-white' },
  { id: 'ph-e6', title: 'Concierto de Folclore', image: 'https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=300&q=80', date: '15 Mayo', location: 'Anfiteatro', price: '$8.000', badge: 'Música', badgeColor: 'bg-primary-light text-white' },
  { id: 'ph-e7', title: 'Torneo de Pesca Deportiva', image: 'https://images.unsplash.com/photo-1504309092620-4d0ec726efa4?w=300&q=80', date: '18 Mayo', location: 'Lago Villarrica', price: '$10.000', badge: 'Deporte', badgeColor: 'bg-red-500 text-white' },
  { id: 'ph-e8', title: 'Noche de Cine al Aire Libre', image: 'https://images.unsplash.com/photo-1478720568477-152d9b164e26?w=300&q=80', date: '22 Mayo', location: 'Parque Municipal', price: 'Gratis', badge: 'Familiar', badgeColor: 'bg-blue-400 text-white' },
  { id: 'ph-e9', title: 'Taller de Cerámica Mapuche', image: 'https://images.unsplash.com/photo-1514228742587-6b1558fcca3d?w=300&q=80', date: '25 Mayo', location: 'Casa de la Cultura', price: '$3.000', badge: 'Cultura', badgeColor: 'bg-primary text-white' },
  { id: 'ph-e10', title: 'Festival Cerveza Artesanal', image: 'https://images.unsplash.com/photo-1535958636474-b021ee887b13?w=300&q=80', date: '1 Junio', location: 'Recinto Ferial', price: '$7.000', badge: 'Gastronomía', badgeColor: 'bg-accent text-primary font-black' },
  { id: 'ph-e11', title: 'Yoga al Amanecer', image: 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?w=300&q=80', date: '5 Junio', location: 'Playa Grande', price: 'Gratis', badge: 'Deporte', badgeColor: 'bg-red-500 text-white' },
  { id: 'ph-e12', title: 'Mercado Navideño Anticipado', image: 'https://images.unsplash.com/photo-1543589077-47d81606c1bf?w=300&q=80', date: '8 Junio', location: 'Plaza Cívica', price: 'Entrada libre', badge: 'Ferias', badgeColor: 'bg-teal-500 text-white' },
]

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
  const rotationRef = useRef(null)

  useEffect(() => {
    fetch(`${API}/api/v1/eventos`)
      .then(r => r.json())
      .then(data => {
        const mapped = (data.eventos || []).map(e => ({
          id: e.id,
          title: e.titulo,
          image: e.imagen ? `${API}${e.imagen}` : '',
          date: e.fecha || '',
          location: e.ubicacion || '',
          price: e.precio || 'Entrada libre',
          badge: isGratis(e.precio) ? 'Gratis' : (e.categoria_nombre || ''),
          badgeColor: isGratis(e.precio) ? 'bg-green-500 text-white' : getBadgeColor(e.categoria_nombre),
        }))
        setAllEvents(mapped)
        const source = mapped.length > 0 ? mapped : PLACEHOLDER_EVENTS
        setDisplayEvents(shuffle(source).slice(0, 6))
      })
      .catch(() => {
        setAllEvents([])
        setDisplayEvents(shuffle(PLACEHOLDER_EVENTS).slice(0, 6))
      })
  }, [])

  // Rotar cada 10 segundos
  const rotate = useCallback(() => {
    const source = allEvents.length > 0 ? allEvents : PLACEHOLDER_EVENTS
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
      className={`rounded-xl overflow-hidden shadow-sm hover:shadow-lg transition-all border border-white/10 group w-full duration-700 ${fading ? 'opacity-0' : 'opacity-100'}`}
      style={{ background: 'rgba(255,255,255,0.06)' }}
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
    </div>
  )
}
