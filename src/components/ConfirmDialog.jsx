// Modal de confirmación reutilizable (MOD-021 y usos futuros).
// El "control único" para pedir confirmación antes de una acción sensible.
export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  tone = 'primary', // 'primary' | 'danger'
  icon = 'help',
  onConfirm,
  onCancel,
}) {
  if (!open) return null
  const confirmCls = tone === 'danger' ? 'bg-red-500 hover:bg-red-600' : 'bg-primary hover:bg-primary/90'
  const iconCls = tone === 'danger' ? 'bg-red-100 text-red-500' : 'bg-primary/10 text-primary'
  return (
    <div className="fixed inset-0 bg-black/50 z-[60] flex items-center justify-center p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-center">
          <div className={`w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-3 ${iconCls}`}>
            <span className="material-symbols-outlined text-3xl">{icon}</span>
          </div>
          {title && <h2 className="font-bold text-lg text-slate-800">{title}</h2>}
          {message && <p className="text-sm text-slate-500 mt-1">{message}</p>}
        </div>
        <div className="flex gap-3 px-6 pb-6">
          <button
            onClick={onCancel}
            className="flex-1 border-2 border-gray-300 text-gray-600 font-bold py-2.5 rounded-lg hover:bg-gray-50 transition-colors"
          >
            {cancelLabel}
          </button>
          <button
            onClick={onConfirm}
            className={`flex-1 text-white font-bold py-2.5 rounded-lg transition-colors ${confirmCls}`}
          >
            {confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
