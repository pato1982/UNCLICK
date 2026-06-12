import { useState, useRef, useCallback, useEffect } from 'react'

export default function ImageZoomPan({ src, alt, onEdit, onRemove, initialCrop, onSaveCrop, saving }) {
  const [zoom, setZoom] = useState(initialCrop?.zoom || 1)
  const [pan, setPan] = useState({ x: initialCrop?.x || 0, y: initialCrop?.y || 0 })
  const [dragging, setDragging] = useState(false)
  const [dirty, setDirty] = useState(false)
  const [saved, setSaved] = useState(false)
  const dragStart = useRef({ x: 0, y: 0 })
  const panStart = useRef({ x: 0, y: 0 })
  const containerRef = useRef(null)

  // Reset zoom/pan when image changes
  useEffect(() => {
    setZoom(initialCrop?.zoom || 1)
    setPan({ x: initialCrop?.x || 0, y: initialCrop?.y || 0 })
    setDirty(false)
    setSaved(false)
  }, [src])

  // Load initial crop when it arrives (e.g. from server)
  useEffect(() => {
    if (initialCrop) {
      setZoom(initialCrop.zoom || 1)
      setPan({ x: initialCrop.x || 0, y: initialCrop.y || 0 })
    }
  }, [initialCrop?.zoom, initialCrop?.x, initialCrop?.y])

  const markDirty = () => { setDirty(true); setSaved(false) }

  const handleZoomIn = () => { setZoom(z => Math.min(z + 0.25, 3)); markDirty() }
  const handleZoomOut = () => {
    setZoom(z => {
      const newZ = Math.max(z - 0.25, 1)
      if (newZ === 1) setPan({ x: 0, y: 0 })
      return newZ
    })
    markDirty()
  }

  const handleWheel = useCallback((e) => {
    e.preventDefault()
    if (e.deltaY < 0) {
      setZoom(z => Math.min(z + 0.15, 3))
    } else {
      setZoom(z => {
        const newZ = Math.max(z - 0.15, 1)
        if (newZ === 1) setPan({ x: 0, y: 0 })
        return newZ
      })
    }
    setDirty(true)
    setSaved(false)
  }, [])

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    el.addEventListener('wheel', handleWheel, { passive: false })
    return () => el.removeEventListener('wheel', handleWheel)
  }, [handleWheel])

  const startDrag = (clientX, clientY) => {
    setDragging(true)
    dragStart.current = { x: clientX, y: clientY }
    panStart.current = { ...pan }
  }

  const moveDrag = (clientX, clientY) => {
    if (!dragging) return
    const dx = clientX - dragStart.current.x
    const dy = clientY - dragStart.current.y
    setPan({ x: panStart.current.x + dx, y: panStart.current.y + dy })
  }

  const endDrag = () => {
    if (dragging) markDirty()
    setDragging(false)
  }

  const onMouseDown = (e) => { e.preventDefault(); startDrag(e.clientX, e.clientY) }
  const onMouseMove = (e) => moveDrag(e.clientX, e.clientY)
  const onMouseUp = () => endDrag()

  const onTouchStart = (e) => { if (e.touches.length === 1) startDrag(e.touches[0].clientX, e.touches[0].clientY) }
  const onTouchMove = (e) => { if (e.touches.length === 1) moveDrag(e.touches[0].clientX, e.touches[0].clientY) }
  const onTouchEnd = () => endDrag()

  const handleSave = () => {
    if (onSaveCrop) {
      onSaveCrop({ zoom, x: pan.x, y: pan.y })
      setSaved(true)
      setDirty(false)
      setTimeout(() => setSaved(false), 3000)
    }
  }

  return (
    <div>
      <div className="relative">
        <div
          ref={containerRef}
          className="w-52 h-52 rounded-lg border border-slate-600 overflow-hidden"
          style={{ cursor: dragging ? 'grabbing' : 'grab' }}
          onMouseDown={onMouseDown}
          onMouseMove={onMouseMove}
          onMouseUp={onMouseUp}
          onMouseLeave={onMouseUp}
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
          <img
            src={src}
            alt={alt}
            className="w-full h-full object-cover select-none pointer-events-none"
            style={{
              transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
              transformOrigin: 'center center',
              transition: dragging ? 'none' : 'transform 0.15s ease-out',
            }}
            draggable={false}
          />
        </div>

        {/* Zoom controls */}
        <div className="absolute bottom-1.5 left-1/2 -translate-x-1/2 flex items-center gap-1 bg-white/90 rounded-full shadow px-1.5 py-0.5 z-10">
          <button type="button" onClick={handleZoomOut} disabled={zoom <= 1} className="p-0.5 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-30">
            <span className="material-symbols-outlined text-gray-600 text-sm">remove</span>
          </button>
          <span className="text-[10px] font-bold text-gray-500 min-w-[32px] text-center">{Math.round(zoom * 100)}%</span>
          <button type="button" onClick={handleZoomIn} disabled={zoom >= 3} className="p-0.5 hover:bg-gray-100 rounded-full transition-colors disabled:opacity-30">
            <span className="material-symbols-outlined text-gray-600 text-sm">add</span>
          </button>
        </div>

        <button type="button" onClick={onEdit} className="absolute top-1.5 left-1.5 bg-white/90 p-1 rounded-md shadow hover:bg-primary/10 transition-colors z-10">
          <span className="material-symbols-outlined text-primary text-sm">edit</span>
        </button>
        <button type="button" onClick={onRemove} className="absolute top-1.5 right-1.5 bg-white/90 p-1 rounded-md shadow hover:bg-red-50 transition-colors z-10">
          <span className="material-symbols-outlined text-red-500 text-sm">close</span>
        </button>
      </div>

      {/* Save crop button */}
      {onSaveCrop && (
        <button
          type="button"
          onClick={handleSave}
          disabled={(!dirty && !saved) || saving}
          className={`mt-2 w-52 py-1.5 rounded-lg text-[11px] font-bold flex items-center justify-center gap-1 transition-all disabled:opacity-50 ${
            saved ? 'bg-green-500 text-white' : 'bg-primary text-white hover:bg-primary/90'
          }`}
        >
          <span className="material-symbols-outlined text-sm">{saved ? 'check_circle' : 'crop'}</span>
          {saving ? 'Guardando...' : saved ? 'Guardado' : 'Guardar encuadre'}
        </button>
      )}
    </div>
  )
}
