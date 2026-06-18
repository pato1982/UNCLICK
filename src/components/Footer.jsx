import { useState } from 'react'
import LoginModal from './LoginModal'
import RegisterModal from './RegisterModal'
import PlansModal from './PlansModal'
import TermsModal from './TermsModal'
import PrivacyModal from './PrivacyModal'
import CookiesModal from './CookiesModal'

export default function Footer({ onNavigate, onLoginSuccess }) {
  const [showLogin, setShowLogin] = useState(false)
  const [showRegister, setShowRegister] = useState(false)
  const [showPlans, setShowPlans] = useState(false)
  const [showTerms, setShowTerms] = useState(false)
  const [showPrivacy, setShowPrivacy] = useState(false)
  const [showCookies, setShowCookies] = useState(false)

  return (
    <footer id="main-footer" className="bg-primary text-white pt-6 sm:pt-8 pb-3 px-3 sm:px-4 md:px-6">
      <div className="max-w-7xl mx-auto">

        {/* ===== MOBILE: layout compacto ===== */}
        <div className="sm:hidden flex flex-col gap-4">
          {/* Logo + Descripción en una fila */}
          <div className="flex items-center gap-3">
            <div className="flex items-center gap-2 shrink-0">
              <div className="bg-accent p-1.5 rounded-lg text-primary">
                <span className="material-symbols-outlined block text-2xl font-bold">ads_click</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[9px] font-bold uppercase tracking-widest text-white/70">Solo a</span>
                <span className="text-xl font-black italic tracking-tight">un <span className="text-accent uppercase">CLICK</span></span>
              </div>
            </div>
            <p className="text-white/50 text-[8px] leading-relaxed text-justify pl-3">
              Tu vitrina digital en Villarrica. Conectamos productos, servicios, arriendos y experiencias turísticas con quienes los necesitan.
            </p>
          </div>

          {/* Fila 1: Accesos + Legal + Mi cuenta */}
          <div className="grid grid-cols-3 gap-3">
            <div className="flex justify-center">
              <div>
                <h4 className="font-black tracking-widest text-accent text-[10px] mb-2">Accesos</h4>
                <ul className="space-y-1 text-[9px] font-normal text-white/50">
                  <li><a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); onNavigate?.('productos', false) }} href="#">Productos</a></li>
                  <li><a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); onNavigate?.('arriendos', false) }} href="#">Arriendos</a></li>
                  <li><a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); onNavigate?.('servicios', false) }} href="#">Servicios</a></li>
                  <li><a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); onNavigate?.('negocios', false) }} href="#">Negocios</a></li>
                  <li><a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); onNavigate?.('turismo', false) }} href="#">Turismo</a></li>
                  <li><a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); onNavigate?.('eventos', false) }} href="#">Eventos</a></li>
                </ul>
              </div>
            </div>
            <div className="flex justify-center">
              <div>
                <h4 className="font-black tracking-widest text-accent text-[10px] mb-2">Legal</h4>
                <ul className="space-y-1 text-[9px] font-normal text-white/50">
                  <li><button type="button" onClick={() => setShowTerms(true)} className="hover:text-accent transition-colors text-left">Términos</button></li>
                  <li><a className="hover:text-accent transition-colors" href="#">Datos</a></li>
                  <li><button type="button" onClick={() => setShowPrivacy(true)} className="hover:text-accent transition-colors text-left">Privacidad</button></li>
                  <li><button type="button" onClick={() => setShowCookies(true)} className="hover:text-accent transition-colors text-left">Cookies</button></li>
                </ul>
              </div>
            </div>
            <div className="flex justify-center">
              <div>
                <h4 className="font-black tracking-widest text-accent text-[10px] mb-2">Mi cuenta</h4>
                <ul className="space-y-1 text-[9px] font-normal text-white/50">
                  <li><a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); setShowLogin(true) }} href="#">Ingresar</a></li>
                  <li><a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); setShowRegister(true) }} href="#">Registrarse</a></li>
                  <li><a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); setShowPlans(true) }} href="#">Planes</a></li>
                </ul>
              </div>
            </div>
          </div>

          {/* Fila 2: Contacto + Redes */}
          <div className="grid grid-cols-2 gap-3">
            <div className="flex justify-center">
              <div>
                <h4 className="font-black tracking-widest text-accent text-[10px] mb-2">Contacto</h4>
                <ul className="space-y-1 text-[9px] font-normal text-white/50">
                  <li className="flex items-center gap-1.5">
                    <span className="material-symbols-outlined text-xs text-accent">mail</span>
                    <a className="hover:text-accent transition-colors" href="mailto:contacto@localclick.cl">contacto@localclick.cl</a>
                  </li>
                  <li className="flex items-center gap-1.5">
                    <svg className="w-3 h-3 fill-current text-accent" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.347 0-4.522-.809-6.236-2.164l-.436-.35-3.233 1.084 1.084-3.233-.35-.436A9.956 9.956 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                    <a className="hover:text-accent transition-colors" href="#">+54 9 2972 12 3456</a>
                  </li>
                </ul>
              </div>
            </div>
            <div className="flex justify-center">
              <div>
                <h4 className="font-black tracking-widest text-accent text-[10px] mb-2">Redes Sociales</h4>
                <div className="flex items-center gap-3">
                <a href="#" className="hover:opacity-80 transition-opacity" title="Facebook">
                  <svg className="w-5 h-5 fill-current text-[#1877F2]" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="hover:opacity-80 transition-opacity" title="Instagram">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><defs><linearGradient id="ig-grad-m" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" style={{stopColor:'#feda75'}}/><stop offset="25%" style={{stopColor:'#fa7e1e'}}/><stop offset="50%" style={{stopColor:'#d62976'}}/><stop offset="75%" style={{stopColor:'#962fbf'}}/><stop offset="100%" style={{stopColor:'#4f5bd5'}}/></linearGradient></defs><path fill="url(#ig-grad-m)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
              </div>
              </div>
            </div>
          </div>
        </div>

        {/* ===== TABLET: layout propio ===== */}
        <div className="hidden sm:flex md:hidden flex-col gap-5">
          {/* Fila 1: Logo + Descripción */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2 shrink-0">
              <div className="bg-accent p-1.5 rounded-lg text-primary">
                <span className="material-symbols-outlined block text-3xl font-bold">ads_click</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-[10px] font-bold uppercase tracking-widest text-white/70">Solo a</span>
                <span className="text-2xl font-black italic tracking-tight">un <span className="text-accent uppercase">CLICK</span></span>
              </div>
            </div>
            <p className="text-white/50 text-[10px] leading-relaxed text-justify">
              Tu vitrina digital en Villarrica. Conectamos productos, servicios, arriendos y experiencias turísticas con quienes los necesitan, todo en un solo lugar.
            </p>
          </div>
          {/* Fila 2: 5 columnas */}
          <div className="grid grid-cols-5 gap-3">
            <div>
              <h4 className="font-black tracking-widest text-accent text-[10px] mb-2">Accesos</h4>
              <ul className="space-y-1 text-[10px] font-normal text-white/50">
                <li><a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); onNavigate?.('productos', false) }} href="#">Productos</a></li>
                <li><a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); onNavigate?.('arriendos', false) }} href="#">Arriendos</a></li>
                <li><a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); onNavigate?.('servicios', false) }} href="#">Servicios</a></li>
                <li><a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); onNavigate?.('negocios', false) }} href="#">Negocios</a></li>
                <li><a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); onNavigate?.('turismo', false) }} href="#">Turismo</a></li>
                  <li><a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); onNavigate?.('eventos', false) }} href="#">Eventos</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black tracking-widest text-accent text-[10px] mb-2">Legal</h4>
              <ul className="space-y-1 text-[10px] font-normal text-white/50">
                <li><button type="button" onClick={() => setShowTerms(true)} className="hover:text-accent transition-colors text-left">Términos</button></li>
                <li><a className="hover:text-accent transition-colors" href="#">Datos</a></li>
                <li><button type="button" onClick={() => setShowPrivacy(true)} className="hover:text-accent transition-colors text-left">Privacidad</button></li>
                <li><button type="button" onClick={() => setShowCookies(true)} className="hover:text-accent transition-colors text-left">Cookies</button></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black tracking-widest text-accent text-[10px] mb-2">Mi cuenta</h4>
              <ul className="space-y-1 text-[10px] font-normal text-white/50">
                <li><a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); setShowLogin(true) }} href="#">Ingresar</a></li>
                <li><a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); setShowRegister(true) }} href="#">Registrarse</a></li>
                <li><a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); setShowPlans(true) }} href="#">Planes</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-black tracking-widest text-accent text-[10px] mb-2">Contacto</h4>
              <ul className="space-y-1 text-[10px] font-normal text-white/50">
                <li className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-xs text-accent">mail</span>
                  <a className="hover:text-accent transition-colors" href="mailto:contacto@localclick.cl">contacto@localclick.cl</a>
                </li>
                <li className="flex items-center gap-1">
                  <svg className="w-3 h-3 fill-current text-accent shrink-0" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.347 0-4.522-.809-6.236-2.164l-.436-.35-3.233 1.084 1.084-3.233-.35-.436A9.956 9.956 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                  <a className="hover:text-accent transition-colors" href="#">+54 9 2972 12 3456</a>
                </li>
              </ul>
            </div>
            <div>
              <h4 className="font-black tracking-widest text-accent text-[10px] mb-2">Redes Sociales</h4>
              <div className="flex items-center gap-2">
                <a href="#" className="hover:opacity-80 transition-opacity" title="Facebook">
                  <svg className="w-5 h-5 fill-current text-[#1877F2]" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
                </a>
                <a href="#" className="hover:opacity-80 transition-opacity" title="Instagram">
                  <svg className="w-5 h-5" viewBox="0 0 24 24"><defs><linearGradient id="ig-grad-t" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" style={{stopColor:'#feda75'}}/><stop offset="25%" style={{stopColor:'#fa7e1e'}}/><stop offset="50%" style={{stopColor:'#d62976'}}/><stop offset="75%" style={{stopColor:'#962fbf'}}/><stop offset="100%" style={{stopColor:'#4f5bd5'}}/></linearGradient></defs><path fill="url(#ig-grad-t)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
                </a>
              </div>
            </div>
          </div>
        </div>

        {/* ===== DESKTOP: layout original ===== */}
        <div className="hidden md:grid md:grid-cols-[1fr_1fr_1fr_1fr_1fr] gap-8">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-accent p-2 rounded-lg text-primary">
                <span className="material-symbols-outlined block text-4xl font-bold">ads_click</span>
              </div>
              <div className="flex flex-col leading-none">
                <span className="text-xs font-bold uppercase tracking-widest text-white/70">Solo a</span>
                <span className="text-3xl font-black italic tracking-tight">un <span className="text-accent uppercase">CLICK</span></span>
              </div>
            </div>
            <p className="text-white/50 text-xs leading-relaxed max-w-xs text-justify">
              Tu vitrina digital en Villarrica. Conectamos productos, servicios, arriendos y experiencias turísticas con quienes los necesitan, todo en un solo lugar.
            </p>
          </div>
          <div className="md:px-20">
            <h4 className="font-black tracking-widest text-accent text-sm mb-6 text-center">Accesos</h4>
            <div className="grid grid-cols-2 gap-x-20 gap-y-2 text-xs font-normal text-white/50 justify-items-center">
              <a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); onNavigate?.('productos', false) }} href="#">Productos</a>
              <a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); onNavigate?.('negocios', false) }} href="#">Negocios</a>
              <a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); onNavigate?.('arriendos', false) }} href="#">Arriendos</a>
              <a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); onNavigate?.('turismo', false) }} href="#">Turismo</a>
              <a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); onNavigate?.('servicios', false) }} href="#">Servicios</a>
              <a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); onNavigate?.('eventos', false) }} href="#">Eventos</a>
            </div>
          </div>
          <div className="md:px-10">
            <h4 className="font-black tracking-widest text-accent text-sm mb-6">Legal</h4>
            <ul className="space-y-2 text-xs font-normal text-white/50">
              <li><button type="button" onClick={() => setShowTerms(true)} className="hover:text-accent transition-colors text-left">Términos y condiciones</button></li>
              <li><button type="button" onClick={() => setShowPrivacy(true)} className="hover:text-accent transition-colors text-left">Protección de datos</button></li>
              <li><button type="button" onClick={() => setShowPrivacy(true)} className="hover:text-accent transition-colors text-left">Política de privacidad</button></li>
              <li><button type="button" onClick={() => setShowCookies(true)} className="hover:text-accent transition-colors text-left">Política de cookies</button></li>
            </ul>
          </div>
          <div className="md:px-10">
            <h4 className="font-black tracking-widest text-accent text-sm mb-6">Mi cuenta</h4>
            <ul className="space-y-2 text-xs font-normal text-white/50">
              <li><a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); setShowLogin(true) }} href="#">Ingresar</a></li>
              <li><a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); setShowRegister(true) }} href="#">Registrarse</a></li>
              <li><a className="hover:text-accent transition-colors cursor-pointer" onClick={(e) => { e.preventDefault(); setShowPlans(true) }} href="#">Planes</a></li>
            </ul>
          </div>
          <div>
            <h4 className="font-black tracking-widest text-accent text-sm mb-6">Contacto</h4>
            <ul className="space-y-2 text-xs font-normal text-white/50">
              <li className="flex items-center gap-2">
                <span className="material-symbols-outlined text-sm text-accent">mail</span>
                <a className="hover:text-accent transition-colors" href="mailto:contacto@localclick.cl">contacto@localclick.cl</a>
              </li>
              <li className="flex items-center gap-2">
                <svg className="w-3.5 h-3.5 fill-current text-accent" viewBox="0 0 24 24"><path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z"/><path d="M12 0C5.373 0 0 5.373 0 12c0 2.625.846 5.059 2.284 7.034L.789 23.492a.5.5 0 00.611.611l4.458-1.495A11.943 11.943 0 0012 24c6.627 0 12-5.373 12-12S18.627 0 12 0zm0 22c-2.347 0-4.522-.809-6.236-2.164l-.436-.35-3.233 1.084 1.084-3.233-.35-.436A9.956 9.956 0 012 12C2 6.486 6.486 2 12 2s10 4.486 10 10-4.486 10-10 10z"/></svg>
                <a className="hover:text-accent transition-colors" href="#">+54 9 2972 12 3456</a>
              </li>
            </ul>
            <h4 className="font-black tracking-widest text-accent text-sm mt-3 mb-4">Redes Sociales</h4>
            <div className="flex items-center gap-3">
              <a href="#" className="hover:opacity-80 transition-opacity" title="Facebook">
                <svg className="w-6 h-6 fill-current text-[#1877F2]" viewBox="0 0 24 24"><path d="M24 12.073c0-6.627-5.373-12-12-12s-12 5.373-12 12c0 5.99 4.388 10.954 10.125 11.854v-8.385H7.078v-3.47h3.047V9.43c0-3.007 1.792-4.669 4.533-4.669 1.312 0 2.686.235 2.686.235v2.953H15.83c-1.491 0-1.956.925-1.956 1.874v2.25h3.328l-.532 3.47h-2.796v8.385C19.612 23.027 24 18.062 24 12.073z"/></svg>
              </a>
              <a href="#" className="hover:opacity-80 transition-opacity" title="Instagram">
                <svg className="w-6 h-6" viewBox="0 0 24 24"><defs><linearGradient id="ig-grad" x1="0%" y1="100%" x2="100%" y2="0%"><stop offset="0%" style={{stopColor:'#feda75'}}/><stop offset="25%" style={{stopColor:'#fa7e1e'}}/><stop offset="50%" style={{stopColor:'#d62976'}}/><stop offset="75%" style={{stopColor:'#962fbf'}}/><stop offset="100%" style={{stopColor:'#4f5bd5'}}/></linearGradient></defs><path fill="url(#ig-grad)" d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto pt-2 mt-4 border-t border-white/10 flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-6 md:gap-24">
        <p className="text-white/40 text-[8px] sm:text-[10px] font-bold tracking-widest">
          &copy; 2026 LocalClick. Todos los derechos reservados.
        </p>
        <p className="text-white/40 text-[8px] sm:text-[10px] font-bold tracking-widest">
          Desarrollado por <span className="text-accent">CH</span>system
        </p>
      </div>
      {showPlans && <PlansModal onClose={() => setShowPlans(false)} />}
      {showTerms && <TermsModal onClose={() => setShowTerms(false)} />}
      {showPrivacy && <PrivacyModal onClose={() => setShowPrivacy(false)} />}
      {showCookies && <CookiesModal onClose={() => setShowCookies(false)} />}
      {showLogin && (
        <LoginModal
          onClose={() => setShowLogin(false)}
          onSwitchToRegister={() => { setShowLogin(false); setShowRegister(true) }}
          onLoginSuccess={(userData) => { setShowLogin(false); onLoginSuccess?.(userData) }}
        />
      )}
      {showRegister && (
        <RegisterModal
          onClose={() => setShowRegister(false)}
          onSwitchToLogin={() => { setShowRegister(false); setShowLogin(true) }}
          onRegisterSuccess={(userData) => { setShowRegister(false); onLoginSuccess?.(userData) }}
        />
      )}
    </footer>
  )
}
