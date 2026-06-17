import { useEffect } from 'react'
import ImageGallery from './ImageGallery'

export default function LocalModal({ local, onClose }) {
  useEffect(() => {
    const handle = (e) => { if (e.key === 'Escape') onClose() }
    document.addEventListener('keydown', handle)
    return () => document.removeEventListener('keydown', handle)
  }, [onClose])

  const images = [local.image, local.imagen_2, local.imagen_3].filter(Boolean)

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
          <ImageGallery images={images} alt={local.name} height="h-52 sm:h-60" />
          {local.type && (
            <span className="absolute top-3 left-3 z-10 bg-primary/80 backdrop-blur text-white px-2 py-0.5 rounded-full text-[9px] font-black uppercase tracking-wider shadow">
              {local.type}
            </span>
          )}
        </div>

        <div className="p-4 sm:p-5 overflow-y-auto flex-1">
          <h3 className="text-base font-black text-slate-900 mb-3 leading-tight">{local.name}</h3>

          <div className="space-y-2">
            {local.address && (
              <div className="flex items-start gap-2">
                <span className="material-symbols-outlined text-slate-400 text-sm shrink-0 mt-0.5">location_on</span>
                <span className="text-sm text-slate-600">{local.address}</span>
              </div>
            )}
            {local.horario && (
              <div className="flex items-center gap-2">
                <span className="material-symbols-outlined text-slate-400 text-sm shrink-0">schedule</span>
                <span className="text-sm text-slate-600">{local.horario}</span>
              </div>
            )}
            {local.descripcion && (
              <p className="text-sm text-slate-600 leading-relaxed pt-2 border-t border-slate-100">{local.descripcion}</p>
            )}

            {/* Botones de contacto */}
            {(local.whatsapp || local.telefono || local.correo || local.facebook || local.instagram) && (
              <div className="flex items-center flex-wrap gap-2 pt-2 border-t border-slate-100 mt-1">
                {local.whatsapp && (
                  <a
                    href={`https://wa.me/${local.whatsapp.replace(/\D/g, '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="h-8 w-8 rounded-full bg-green-500 text-white flex items-center justify-center hover:bg-green-400 transition-colors"
                    title="WhatsApp"
                  >
                    <span className="material-symbols-outlined text-sm">chat</span>
                  </a>
                )}
                {local.telefono && (
                  <a
                    href={`tel:${local.telefono}`}
                    onClick={e => e.stopPropagation()}
                    className="h-8 w-8 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center hover:bg-slate-200 transition-colors"
                    title="Llamar"
                  >
                    <span className="material-symbols-outlined text-sm">call</span>
                  </a>
                )}
                {local.correo && (
                  <a
                    href={`mailto:${local.correo}`}
                    onClick={e => e.stopPropagation()}
                    className="h-8 w-8 rounded-full bg-primary/10 text-primary flex items-center justify-center hover:bg-primary/20 transition-colors"
                    title="Correo"
                  >
                    <span className="material-symbols-outlined text-sm">mail</span>
                  </a>
                )}
                {local.facebook && (
                  <a
                    href={local.facebook.startsWith('http') ? local.facebook : `https://${local.facebook}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="h-8 w-8 rounded-full bg-blue-600 text-white flex items-center justify-center hover:bg-blue-500 transition-colors"
                    title="Facebook"
                  >
                    <span className="material-symbols-outlined text-sm">public</span>
                  </a>
                )}
                {local.instagram && (
                  <a
                    href={local.instagram.startsWith('http') ? local.instagram : `https://instagram.com/${local.instagram.replace('@', '')}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    onClick={e => e.stopPropagation()}
                    className="h-8 rounded-full bg-gradient-to-br from-purple-500 via-pink-500 to-amber-400 text-white flex items-center justify-center px-3 gap-1.5 hover:opacity-90 transition-opacity text-xs font-bold"
                    title="Instagram"
                  >
                    <span className="material-symbols-outlined text-sm">photo_camera</span>
                    {local.instagram.startsWith('@') ? local.instagram : `@${local.instagram}`}
                  </a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
