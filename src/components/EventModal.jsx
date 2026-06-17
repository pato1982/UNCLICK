import { useEffect } from 'react'
import ImageGallery from './ImageGallery'

export default function EventModal({ event, onClose }) {
  useEffect(() => {
    const handle = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onClose])

  const images = [event.image, event.imagen_2, event.imagen_3].filter(Boolean)

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 10000 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden mx-2 max-h-[90vh] flex flex-col"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-20 h-7 w-7 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
        >
          <span className="material-symbols-outlined text-slate-600 text-base">close</span>
        </button>

        {/* Galería */}
        <div className="relative shrink-0">
          <ImageGallery images={images} alt={event.title} height="h-52 sm:h-60" />
          <span className={`absolute top-3 left-3 z-10 ${event.badgeColor} px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow`}>
            {event.badge}
          </span>
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          <h3 className="text-base font-black text-slate-900 mb-3 leading-tight">{event.title}</h3>

          <div className="space-y-2">
            {event.date && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent text-sm shrink-0">calendar_month</span>
                <span className="text-sm text-slate-700 font-medium">{event.date}</span>
              </div>
            )}
            {event.horario && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 text-sm shrink-0">schedule</span>
                <span className="text-sm text-slate-600">{event.horario}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-slate-400 text-sm shrink-0 mt-0.5">location_on</span>
                <span className="text-sm text-slate-600">{event.location}</span>
              </div>
            )}
            {event.organizador && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 text-sm shrink-0">groups</span>
                <span className="text-sm text-slate-600">{event.organizador}</span>
              </div>
            )}
            {event.descripcion && (
              <p className="text-sm text-slate-600 leading-relaxed pt-2 border-t border-slate-100">{event.descripcion}</p>
            )}
            <div className="flex items-center justify-between pt-2 border-t border-slate-100 mt-1">
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-primary text-sm shrink-0">confirmation_number</span>
                <span className="text-sm font-black text-primary">{event.price}</span>
              </div>
              <div className="flex items-center gap-2">
                {event.whatsapp && (
                  <a
                    href={`https://wa.me/${event.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="h-8 w-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-400 transition-colors"
                    title="WhatsApp"
                  >
                    <span className="material-symbols-outlined text-sm">chat</span>
                  </a>
                )}
                {event.telefono && (
                  <a
                    href={`tel:${event.telefono}`}
                    onClick={e => e.stopPropagation()}
                    className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors"
                    title="Llamar"
                  >
                    <span className="material-symbols-outlined text-sm">call</span>
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
