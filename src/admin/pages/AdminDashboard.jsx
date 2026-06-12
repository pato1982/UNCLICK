export default function AdminDashboard() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-800 mb-6">Dashboard</h1>

      {/* Tarjetas de resumen */}
      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: 'Productos', value: '0', icon: 'inventory_2', color: 'bg-blue-500' },
          { label: 'Tiendas', value: '0', icon: 'storefront', color: 'bg-emerald-500' },
          { label: 'Pedidos', value: '0', icon: 'shopping_cart', color: 'bg-amber-500' },
          { label: 'Usuarios', value: '0', icon: 'group', color: 'bg-purple-500' },
        ].map((card) => (
          <div key={card.label} className="bg-white rounded-xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{card.label}</span>
              <div className={`${card.color} p-2 rounded-lg`}>
                <span className="material-symbols-outlined text-white text-xl">{card.icon}</span>
              </div>
            </div>
            <p className="text-3xl font-bold text-gray-800">{card.value}</p>
          </div>
        ))}
      </div>

      {/* Placeholder contenido */}
      <div className="bg-white rounded-xl p-8 shadow-sm border border-gray-100 text-center">
        <span className="material-symbols-outlined text-6xl text-gray-300 mb-4 block">construction</span>
        <h2 className="text-lg font-semibold text-gray-600 mb-2">Panel en construcción</h2>
        <p className="text-sm text-gray-400">
          Aquí se mostrarán las herramientas de administración para gestionar productos, tiendas y más.
        </p>
      </div>
    </div>
  )
}
