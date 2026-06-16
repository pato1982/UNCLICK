import { useEffect } from 'react'

export default function EventModal({ event, onClose }) {
  useEffect(() => {
    const handle = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onClose])

  return (
    <div
      className="fixed inset-0 flex items-center justify-center p-4"
      style={{ zIndex: 10000 }}
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
      <div
        className="relative bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden mx-2"
        onClick={e => e.stopPropagation()}
      >
        <button
          onClick={onClose}
          className="absolute top-2 right-2 z-10 h-7 w-7 bg-white/80 backdrop-blur rounded-full flex items-center justify-center hover:bg-slate-100 transition-colors"
        >
          <span className="material-symbols-outlined text-slate-600 text-base">close</span>
        </button>

        <div className="relative w-full h-52 sm:h-60 overflow-hidden bg-slate-100">
          {event.image ? (
            <img src={event.image} alt={event.title} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <span className="material-symbols-outlined text-slate-300 text-6xl">event</span>
            </div>
          )}
          <span className={`absolute top-3 left-3 ${event.badgeColor} px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow`}>
            {event.badge}
          </span>
        </div>

        <div className="p-4 sm:p-5">
          <h3 className="text-base font-black text-slate-900 mb-3 leading-tight">{event.title}</h3>

          <div className="space-y-2">
            {event.date && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-accent text-sm shrink-0">calendar_month</span>
                <span className="text-sm text-slate-700 font-medium">{event.date}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-slate-400 text-sm shrink-0 mt-0.5">location_on</span>
                <span className="text-sm text-slate-600">{event.location}</span>
              </div>
            )}
            <div className="flex items-center gap-2 pt-1 border-t border-slate-100 mt-3">
              <span className="material-symbols-outlined text-primary text-sm shrink-0">confirmation_number</span>
              <span className="text-sm font-black text-primary">{event.price}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
