import { useState, useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import AdminHeader from './components/AdminHeader'
import AdminSidebar from './components/AdminSidebar'

export default function AdminLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(() => window.innerWidth >= 1101)
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  const isProg = (user.rol || 'usuario') === 'programador'

  // Cerrar sidebar al cambiar a mobile/tablet
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth < 1101) setSidebarOpen(false)
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return (
    <div className={`min-h-screen flex flex-col ${isProg ? 'bg-slate-800' : 'bg-gray-100'}`}>
      <AdminHeader onToggleSidebar={() => setSidebarOpen(!sidebarOpen)} />

      <div className="flex flex-1">
        <AdminSidebar open={sidebarOpen} onClose={() => setSidebarOpen(false)} />

        <main
          className={`flex-1 min-w-0 overflow-x-hidden p-3 sm:p-4 md:p-6 transition-all duration-300 ${
            sidebarOpen ? 'md:ml-64' : 'ml-0'
          }`}
        >
          <Outlet />
        </main>
      </div>
    </div>
  )
}
