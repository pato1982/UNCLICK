import React, { lazy, Suspense } from 'react'
import ReactDOM from 'react-dom/client'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import App from './App'
import ProtectedRoute from './components/ProtectedRoute'
import { installDevFetchInterceptor } from './lib/devFetch'

// Panel admin: cargado bajo demanda (no entra en el bundle inicial del sitio publico)
const AdminLayout = lazy(() => import('./admin/AdminLayout'))
const AdminProductos = lazy(() => import('./admin/pages/AdminProductos'))
const AdminNegocio = lazy(() => import('./admin/pages/AdminNegocio'))
const AdminBanner = lazy(() => import('./admin/pages/AdminBanner'))
const AdminEstadisticas = lazy(() => import('./admin/pages/AdminEstadisticas'))
const AdminTour = lazy(() => import('./admin/pages/AdminTour'))
const AdminPortada = lazy(() => import('./admin/pages/AdminPortada'))
const AdminPagina = lazy(() => import('./admin/pages/AdminPagina'))
const ProgramadorLocales = lazy(() => import('./admin/pages/ProgramadorLocales'))
const ProgramadorEventos = lazy(() => import('./admin/pages/ProgramadorEventos'))
const ProgramadorServidor = lazy(() => import('./admin/pages/ProgramadorServidor'))
const ProgramadorEstadisticas = lazy(() => import('./admin/pages/ProgramadorEstadisticas'))
const ProgramadorRoadmap = lazy(() => import('./admin/pages/ProgramadorRoadmap'))
const AdminMonitor = lazy(() => import('./admin/pages/AdminMonitor'))
const AdminLocal = lazy(() => import('./admin/pages/AdminLocal'))
const AdminEvento = lazy(() => import('./admin/pages/AdminEvento'))
const AdminFacturacion = lazy(() => import('./admin/pages/AdminFacturacion'))
import './index.css'

// Instalar interceptor de fetch para bypass en desarrollo
installDevFetchInterceptor()

// Sentry diferido: se inicializa tras el primer render para no bloquear el arranque
if (import.meta.env.VITE_SENTRY_DSN) {
  const initSentry = () =>
    import('@sentry/react').then((Sentry) => {
      Sentry.init({
        dsn: import.meta.env.VITE_SENTRY_DSN,
        environment: import.meta.env.MODE,
        tracesSampleRate: 0.05,
      })
    })
  if ('requestIdleCallback' in window) requestIdleCallback(initSentry)
  else setTimeout(initSentry, 0)
}

// Fallback minimo mientras carga un chunk lazy
const RouteFallback = () => (
  <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '60vh', color: '#6b21a8' }}>
    <span className="material-symbols-outlined animate-spin" style={{ fontSize: 40 }}>progress_activity</span>
  </div>
)

function AdminIndex() {
  const user = JSON.parse(localStorage.getItem('user') || '{}')
  if (user.rol === 'programador')          return <Navigate to="/admin/programador/locales" replace />
  if (user.tipo_cuenta === 'turismo')      return <Navigate to="/admin/negocio" replace />
  if (user.tipo_cuenta === 'local')        return <Navigate to="/admin/mi-local" replace />
  if (user.tipo_cuenta === 'evento')       return <Navigate to="/admin/mis-eventos" replace />
  // Suspense explicito: AdminProductos es lazy y aqui se renderiza directo (no via <Route element>)
  return (
    <Suspense fallback={<RouteFallback />}>
      <AdminProductos />
    </Suspense>
  )
}

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <BrowserRouter>
      <Suspense fallback={<RouteFallback />}>
        <Routes>
          <Route path="/admin" element={<ProtectedRoute><AdminLayout /></ProtectedRoute>}>
            <Route index element={<AdminIndex />} />
            <Route path="negocio" element={<AdminNegocio />} />
            <Route path="banner" element={<AdminBanner />} />
            <Route path="estadisticas" element={<AdminEstadisticas />} />
            <Route path="portada" element={<AdminPortada />} />
            <Route path="tour" element={<AdminTour />} />
            <Route path="pagina" element={<AdminPagina />} />
            <Route path="monitor" element={<AdminMonitor />} />
            <Route path="mi-local" element={<AdminLocal />} />
            <Route path="mis-eventos" element={<AdminEvento />} />
            <Route path="facturacion" element={<AdminFacturacion />} />
            <Route path="programador/locales" element={<ProgramadorLocales />} />
            <Route path="programador/eventos" element={<ProgramadorEventos />} />
            <Route path="programador/estadisticas" element={<ProgramadorEstadisticas />} />
            <Route path="programador/servidor" element={<ProgramadorServidor />} />
            <Route path="programador/roadmap" element={<ProgramadorRoadmap />} />
          </Route>
          <Route path="/*" element={<App />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  </React.StrictMode>,
)
