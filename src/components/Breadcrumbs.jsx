export default function Breadcrumbs() {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
      <nav className="flex items-center gap-2 text-sm">
        <a className="text-slate-500 hover:text-primary transition-colors" href="#">Inicio</a>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <a className="text-slate-500 hover:text-primary transition-colors" href="#">Setup</a>
        <span className="material-symbols-outlined text-xs">chevron_right</span>
        <span className="font-bold text-primary">Resultados</span>
      </nav>
      <div className="flex items-center gap-3 overflow-x-auto pb-2 md:pb-0">
        <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200 text-sm font-bold text-slate-700 whitespace-nowrap">
          Precio: Menor a Mayor
          <span className="material-symbols-outlined text-lg">expand_more</span>
        </button>
        <button className="flex items-center gap-2 px-4 py-2 bg-white rounded-lg shadow-sm border border-slate-200 text-sm font-bold text-slate-700 whitespace-nowrap">
          Marca
          <span className="material-symbols-outlined text-lg">expand_more</span>
        </button>
      </div>
    </div>
  )
}
