import { getStoreHeaderStyle } from '../lib/storeHeaderPresets'

/* Logo "un CLICK" — solo planes gratuitos o cuando no hay logo propio */
function Brand({ light, mini, onClick }) {
  const sub = light ? 'text-white/70' : 'text-slate-400'
  const main = light ? 'text-white' : 'text-slate-900'
  const inner = (
    <span className="flex items-center gap-1.5">
      <span className="bg-accent text-primary rounded-md p-1 leading-none flex">
        <span className="material-symbols-outlined text-base sm:text-lg">ads_click</span>
      </span>
      {!mini && (
        <span className="flex flex-col leading-none text-left">
          <span className={`text-[8px] font-bold uppercase tracking-widest ${sub}`}>Solo a</span>
          <span className={`text-sm sm:text-base font-black italic tracking-tight ${main}`}>un <span className="text-accent uppercase">CLICK</span></span>
        </span>
      )}
    </span>
  )
  return onClick
    ? <button type="button" onClick={onClick} className="shrink-0 hover:opacity-80 transition-opacity">{inner}</button>
    : <div className="shrink-0">{inner}</div>
}

/* Buscador (decorativo) */
function Search({ name, mini }) {
  if (mini) return <div className="shrink-0 h-4 w-12 rounded-full bg-white/85 border border-black/5" />
  return (
    <label className="relative shrink-0 w-40 sm:w-52 md:w-60 hidden sm:block">
      <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm pointer-events-none">search</span>
      <input
        type="text"
        placeholder={`Buscar en ${name}…`}
        className="w-full rounded-full bg-white text-slate-900 border border-slate-200 py-1.5 pl-9 pr-3 text-xs placeholder:text-slate-400 focus:ring-2 focus:ring-primary/30 outline-none"
      />
    </label>
  )
}

/**
 * Header temático de la tienda. Presentacional (sin barra inferior ni sticky).
 * Lo usan StoreHeader (tienda real) y la vista previa del panel.
 */
export default function StoreHeaderThemed({ store, name, slogan, mini, onBrandClick, actions }) {
  const hdr = getStoreHeaderStyle(store)
  const v = hdr.variant
  const right = actions || <Search name={name} mini={mini} />
  const px = mini ? 'px-3' : 'px-3 sm:px-4 md:px-6'
  const miniPad = Math.max(6, Math.round(hdr.padY * 0.45))
  const padStyle = mini ? { paddingTop: miniPad, paddingBottom: miniPad } : { paddingTop: hdr.padY, paddingBottom: hdr.padY }
  const nameBig = mini ? 'text-sm' : 'text-xl sm:text-2xl md:text-3xl'
  const nameMd = mini ? 'text-sm' : 'text-lg sm:text-2xl'
  const eyebrow = mini ? 'text-[7px]' : 'text-[9px] sm:text-[10px]'

  const Shell = ({ style, extra, vpad = true, children }) => (
    <header className={`relative overflow-hidden w-full max-w-full ${px} shadow-lg ${extra || ''}`} style={{ ...style, ...(vpad ? padStyle : {}) }}>
      {children}
    </header>
  )

  // 1) ESENCIAL
  if (v === 'esencial') {
    return (
      <Shell style={{ backgroundColor: hdr.colorPale }} extra="border-b border-slate-200 !shadow-sm">
        <div className="relative z-10 max-w-7xl mx-auto flex items-center gap-3">
          <Brand mini={mini} onClick={onBrandClick} />
          <div className="flex-1 min-w-0 flex flex-col items-center justify-center text-center">
            {slogan && <span className={`${eyebrow} uppercase tracking-[0.3em] text-slate-400 mb-0.5 truncate max-w-full`}>{slogan}</span>}
            <span className={`${nameBig} font-semibold tracking-tight truncate max-w-full`} style={{ color: hdr.color }}>{name}</span>
          </div>
          {right}
        </div>
      </Shell>
    )
  }

  // 2) MARCA
  if (v === 'marca') {
    return (
      <Shell style={{ backgroundColor: hdr.color }}>
        <div className="relative z-10 max-w-7xl mx-auto flex items-center gap-3 sm:gap-4">
          <Brand light mini={mini} onClick={onBrandClick} />
          <span className="h-7 sm:h-9 w-px bg-white/25 shrink-0" />
          <div className="flex flex-col leading-none min-w-0">
            <span className={`${nameMd} font-bold tracking-tight text-white truncate`}>{name}</span>
            {slogan && <span className={`${eyebrow} uppercase tracking-wider text-white/60 mt-0.5 truncate`}>{slogan}</span>}
          </div>
          <div className="flex-1" />
          {right}
        </div>
      </Shell>
    )
  }

  // 3) BOUTIQUE
  if (v === 'boutique') {
    return (
      <Shell style={{ backgroundColor: hdr.colorDeep }}>
        <div className="absolute left-3 sm:left-6 top-1/2 -translate-y-1/2 z-10">
          <Brand light mini onClick={onBrandClick} />
        </div>
        {actions && (
          <div className="absolute right-3 sm:right-6 top-1/2 -translate-y-1/2 z-10">{actions}</div>
        )}
        <div className="relative z-10 max-w-7xl mx-auto flex flex-col items-center justify-center text-center gap-1">
          {slogan && <span className={`${eyebrow} uppercase tracking-[0.35em] text-accent truncate max-w-full`}>{slogan}</span>}
          <span className={`${mini ? 'text-base' : 'text-2xl sm:text-3xl'} font-serif tracking-wide text-white truncate max-w-full`}>{name}</span>
          <span className="w-10 h-px bg-accent mt-1" />
        </div>
      </Shell>
    )
  }

  // 4) DEGRADÉ
  if (v === 'degrade') {
    return (
      <Shell style={{ background: `linear-gradient(120deg, ${hdr.colorLight} 0%, ${hdr.color} 55%, ${hdr.colorDark} 100%)` }}>
        <div className="relative z-10 max-w-7xl mx-auto flex items-center gap-3">
          <Brand light mini={mini} onClick={onBrandClick} />
          <div className="flex-1 min-w-0 flex flex-col items-center justify-center text-center">
            {slogan && <span className={`${eyebrow} uppercase tracking-[0.3em] text-white/70 mb-0.5 truncate max-w-full`}>{slogan}</span>}
            <span className={`${nameBig} font-extrabold tracking-tight text-white truncate max-w-full`}>{name}</span>
          </div>
          {right}
        </div>
      </Shell>
    )
  }

  // 5) PANEL
  return (
    <Shell style={{ backgroundColor: '#f1f5f9' }} extra="!px-0 !shadow-sm" vpad={false}>
      <div className="relative z-10 flex items-stretch">
        <div className={`flex items-center gap-2 sm:gap-3 ${px} rounded-r-[1.75rem]`} style={{ backgroundColor: hdr.color, ...padStyle }}>
          <Brand light mini={mini} onClick={onBrandClick} />
          <span className="h-7 sm:h-9 w-px bg-white/25 shrink-0 hidden sm:block" />
          <div className="flex flex-col leading-none min-w-0">
            <span className={`${nameMd} font-bold tracking-tight text-white truncate`}>{name}</span>
            {slogan && <span className={`${eyebrow} uppercase tracking-wider text-white/60 mt-0.5 truncate`}>{slogan}</span>}
          </div>
        </div>
        <div className={`flex-1 flex items-center justify-end ${mini ? 'px-3' : 'px-4 md:px-6'}`}>
          {right}
        </div>
      </div>
    </Shell>
  )
}
