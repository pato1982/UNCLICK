import { useState } from 'react'
import ProductCard from './ProductCard'

const ROWS_PER_PAGE = 10

export default function SectionPage({ section, sidebarOpen, onBack, onOpenStore }) {
  const [currentPage, setCurrentPage] = useState(0)

  // Columnas según sidebar (coincide con las clases de la grilla)
  const cols = sidebarOpen ? 5 : 6
  const itemsPerPage = ROWS_PER_PAGE * cols
  const totalPages = Math.max(1, Math.ceil(section.items.length / itemsPerPage))
  const pageItems = section.items.slice(currentPage * itemsPerPage, (currentPage + 1) * itemsPerPage)

  const goToPage = (page) => {
    setCurrentPage(page)
    window.scrollTo({ top: 0 })
  }

  return (
    <div>
      <div className="flex items-center gap-2 sm:gap-3 mb-4 sm:mb-6">
        <button
          onClick={onBack}
          className="flex items-center gap-1 text-primary hover:text-accent transition-colors text-[10px] sm:text-xs font-bold"
        >
          <span className="material-symbols-outlined text-sm">arrow_back</span>
          Volver
        </button>
        <div className="w-1 h-4 sm:h-5 bg-accent rounded-full"></div>
        <h2 className="text-xs sm:text-sm font-bold text-slate-700 tracking-wide">{section.title}</h2>
        <span className="text-[9px] sm:text-[10px] text-slate-400">
          {section.items.length} {section.items.length === 1 ? 'resultado' : 'resultados'}
        </span>
      </div>

      <div className={`grid gap-2 sm:gap-3 md:gap-4 transition-all duration-300 ${sidebarOpen ? 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5' : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-5'}`}>
        {pageItems.map((product, idx) => (
          <ProductCard key={product.id} product={product} hidePrice={section.hidePrice} isFirst={idx === 0 && product.owner_plan_id && product.owner_plan_id >= 2} onOpenStore={onOpenStore} />
        ))}
      </div>

      {section.items.length === 0 && (
        <p className="text-center text-slate-400 text-xs mt-8">
          No hay productos para mostrar.
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
