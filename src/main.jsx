import * as Sentry from '@sentry/react'
if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    environment: import.meta.env.MODE,
    tracesSampleRate: 0.05,
  })
}
import React from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App'
import ProtectedRoute from './components/ProtectedRoute'
import { installDevFetchInterceptor } from './lib/devFetch'

import AdminLayout from './admin/AdminLayout'
import AdminProductos from './admin/pages/AdminProductos'
import AdminNegocio from './admin/pages/AdminNegocio'
import AdminBanner from './admin/pages/AdminBanner'
import AdminApariencia from './admin/pages/AdminApariencia'
import AdminEstadisticas from './admin/pages/AdminEstadisticas'
import AdminTour from './admin/pages/AdminTour'
import AdminPortada from './admin/pages/AdminPortada'
import AdminPagina from './admin/pages/AdminPagina'
import ProgramadorLocales from './admin/pages/ProgramadorLocales'
import ProgramadorEventos from './admin/pages/ProgramadorEventos'
import ProgramadorServidor from './admin/pages/ProgramadorServidor'
import ProgramadorEstadisticas from './admin/pages/ProgramadorEstadisticas'
import AdminMonitor from './admin/pages/AdminMonitor'
import './index.css'

// Instalar interceptor de fetch para bypass en desarrollo
installDevFetchInterceptor()

function AdminIndex() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  if (user.rol === 'programador') return <Navigate to="/admin/programador/locales" replace />
  if (user.tipo_cuenta === 'turismo') return <Navigate to="/admin/tour" replace />
  return <AdminProductos />
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
          <Route index element={<AdminIndex />} />
          <Route path="negocio" element={<AdminNegocio />} />
          <Route path="banner" element={<AdminBanner />} />
          <Route path="apariencia" element={<AdminApariencia />} />
          <Route path="estadisticas" element={<AdminEstadisticas />} />
          <Route path="portada" element={<AdminPortada />} />
          <Route path="tour" element={<AdminTour />} />
          <Route path="pagina" element={<AdminPagina />} />
          <Route path="monitor" element={<AdminMonitor />} />
          <Route path="programador/locales" element={<ProgramadorLocales />} />
          <Route path="programador/eventos" element={<ProgramadorEventos />} />
          <Route path="programador/estadisticas" element={<ProgramadorEstadisticas />} />
          <Route path="programador/servidor" element={<ProgramadorServidor />} />
        </Route>
        <Route path="/*" element={<App />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>,
)
