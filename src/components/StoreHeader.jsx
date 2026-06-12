import { Link } from 'react-router-dom'
import { getStoreHeaderStyle } from '../lib/storeHeaderPresets'
import StoreHeaderThemed from './StoreHeaderThemes'

/**
 * Header de la tienda premium (estilo personalizable).
 * La barra de navegación puede ir separada (debajo) o integrada dentro del header.
 */
export default function StoreHeader({ store, user, onGoHome, onLogout, onToggleCat }) {
  const hdr = getStoreHeaderStyle(store)

  // Acciones (Volver / panel / salir) — se usan en la barra o integradas en el header.
  // En móvil con barra integrada, el "Volver" se reemplaza por una flecha flotante
  // bajo el header (ver más abajo), por eso aquí se oculta con `hidden sm:flex`.
  const actions = (
    <div className={`flex items-center gap-2 sm:gap-3 shrink-0 ${hdr.actionText}`}>
      <button onClick={onGoHome} className="hidden sm:flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-accent border border-accent px-2 sm:px-2.5 py-0.5 rounded-full hover:bg-accent/10 transition-all">
        <span className="material-symbols-outlined text-sm">arrow_back</span>
        Volver
      </button>
      {user && user.rol !== 'programador' && (
        <Link to="/admin" className="flex items-center hover:text-accent transition-colors" title="Panel de administrador">
          <span className="material-symbols-outlined text-lg sm:text-xl">dashboard</span>
        </Link>
      )}
      {user && user.rol === 'programador' && (
        <Link to="/admin" className="flex items-center hover:text-accent transition-colors" title="Panel programador">
          <span className="material-symbols-outlined text-lg sm:text-xl">terminal</span>
        </Link>
      )}
      {user && (
        <button onClick={onLogout} className="flex items-center hover:text-accent transition-colors" title="Salir">
          <span className="material-symbols-outlined text-lg sm:text-xl">logout</span>
        </button>
      )}
    </div>
  )

  return (
    <div className="sticky top-0 z-50">
      <StoreHeaderThemed
        store={store}
        name={store.name}
        slogan={store.slogan}
        onBrandClick={onGoHome}
        actions={hdr.barIntegrated ? actions : null}
      />

      {/* Móvil + barra integrada: botón Volver flotante (solo flecha) bajo el header, a la izquierda */}
      {hdr.barIntegrated && (
        <button
          onClick={onGoHome}
          aria-label="Volver"
          title="Volver"
          className="sm:hidden absolute left-2 top-full mt-2 z-50 flex items-center justify-center h-9 w-9 rounded-full bg-accent text-primary shadow-lg ring-1 ring-black/10 hover:brightness-110 active:scale-95 transition-all"
        >
          <span className="material-symbols-outlined text-xl">arrow_back</span>
        </button>
      )}

      {/* Barra de navegación separada (solo si no está integrada en el header) */}
      {!hdr.barIntegrated && (
        <nav className={`px-3 sm:px-4 md:px-6 py-1 sm:py-1.5 shadow-md ${hdr.navBorderClass}`} style={hdr.navStyle}>
          <div className="max-w-7xl mx-auto flex items-center justify-between relative">
            <button onClick={onGoHome} className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-accent border border-accent px-2 sm:px-2.5 py-0.5 rounded-full hover:bg-accent/10 transition-all">
              <span className="material-symbols-outlined text-sm">arrow_back</span>
              Volver
            </button>
            <button
              onClick={onToggleCat}
              className={`md:hidden absolute left-1/2 -translate-x-1/2 p-0.5 rounded-md hover:bg-black/10 transition-colors ${hdr.navText}`}
            >
              <span className="material-symbols-outlined text-xl">menu</span>
            </button>
            <div className="flex items-center gap-2 sm:gap-4">
              {user ? (
                <>
                  {user.rol !== 'programador' && (
                    <>
                      <span className={`hidden md:inline text-xs ${hdr.navTextSoft}`}>Hola, <span className="font-bold text-accent">{(() => { const n = user.nombre.split(' ')[0]; return n.length > 10 ? n.slice(0, 10) + '...' : n })()}</span>
                        {' '}<span className={hdr.navTextFaint}>Plan {user.plan_id === 3 ? 'Premium' : user.plan_id === 2 ? 'Normal' : 'Gratis'}</span>
                      </span>
                      <Link to="/admin" className={`flex items-center hover:text-accent transition-colors ${hdr.navText}`} title="Panel de administrador">
                        <span className="material-symbols-outlined text-lg sm:text-xl">dashboard</span>
                      </Link>
                    </>
                  )}
                  {user.rol === 'programador' && (
                    <Link to="/admin" className={`flex items-center hover:text-accent transition-colors ${hdr.navText}`} title="Panel programador">
                      <span className="material-symbols-outlined text-lg sm:text-xl">terminal</span>
                    </Link>
                  )}
                  <button onClick={onLogout} className={`flex items-center hover:text-accent transition-colors ${hdr.navText}`} title="Salir">
                    <span className="material-symbols-outlined text-lg sm:text-xl">logout</span>
                  </button>
                </>
              ) : (
                <button onClick={onGoHome} className="flex items-center gap-1 text-[10px] sm:text-[11px] font-bold text-accent border border-accent px-2 sm:px-2.5 py-0.5 rounded-full hover:bg-accent/10 transition-all">
                  <span className="material-symbols-outlined text-sm">home</span>
                  Inicio
                </button>
              )}
            </div>
          </div>
        </nav>
      )}
    </div>
  )
}
