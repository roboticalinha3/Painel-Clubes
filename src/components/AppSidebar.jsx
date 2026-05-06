import { useEffect, useState } from 'react';
import iconeEducacode from '../assets/icone.ico';
import logoEducacode from '../assets/logo-educacode.png';

export function AppSidebar({ activeView, userName, allowCreateClub, onLogout, onOpenDashboard, onOpenClubs, onOpenNewClub }) {
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);

  useEffect(() => {
    function handleResize() {
      setIsMobile(window.innerWidth < 1024);
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const expandedDesktop = !isMobile && expanded;

  if (isMobile) {
    return (
      <>
        <header className="app-mobile-topbar">
          <div className="app-mobile-topbar__inner">
            <img src={logoEducacode} alt="Logo Educacode" className="app-mobile-topbar__logo" />
            <p className="app-mobile-topbar__user">{userName}</p>
            <button
              type="button"
              onClick={onLogout}
              className="app-mobile-topbar__logout"
              title={`Sair do sistema (${userName})`}
              aria-label="Sair do sistema"
            >
              <span className="material-symbols-rounded text-[18px]">logout</span>
            </button>
          </div>
        </header>

        <aside className="app-mobile-tabbar" aria-label="Navegação principal">
          <nav className="app-mobile-tabbar__nav">
            <button
              type="button"
              onClick={onOpenDashboard}
              className={`app-mobile-tab-btn ${activeView === 'dashboard' ? 'is-active' : ''}`}
              title="Visão Geral"
            >
              <span className="material-symbols-rounded text-[18px]">dashboard</span>
              <span>Visão Geral</span>
            </button>

            <button
              type="button"
              onClick={onOpenClubs}
              className={`app-mobile-tab-btn ${activeView === 'clubs' ? 'is-active' : ''}`}
              title="Painel de Clubes"
            >
              <span className="material-symbols-rounded text-[18px]">groups</span>
              <span>Clubes</span>
            </button>

            {allowCreateClub && (
              <button
                type="button"
                onClick={onOpenNewClub}
                className="app-mobile-tab-btn"
                title="Novo Clube"
              >
                <span className="material-symbols-rounded text-[18px]">add_circle</span>
                <span>Novo</span>
              </button>
            )}
          </nav>
        </aside>
      </>
    );
  }

  return (
    <aside
      className={`app-sidebar-desktop ${expandedDesktop ? 'w-64' : 'w-[92px]'} bg-[#03258C] text-white flex flex-col rounded-r-[2rem] shadow-xl z-20 border-r-4 border-cetecBlueDark shrink-0 transition-all duration-300 ease-in-out`}
      onMouseEnter={() => setExpanded(true)}
      onMouseLeave={() => setExpanded(false)}
    >
      <div className={`${expandedDesktop ? 'pt-5 pb-2' : 'pt-5 pb-2'} transition-all duration-300`}>
        {!expandedDesktop && <img src={iconeEducacode} alt="Icone Educacode" className="w-12 h-12 mx-auto object-contain" />}
        {expandedDesktop && (
          <img src={logoEducacode} alt="Logo Educacode" className="w-[160px] h-auto mx-auto object-contain" />
        )}
      </div>

      <nav className={`${expandedDesktop ? 'p-4' : 'p-3'} flex-1 space-y-2 mt-0 transition-all duration-300`}>
        <button
          type="button"
          onClick={onOpenDashboard}
          className={`nav-btn ${expandedDesktop ? 'w-full justify-start px-5 py-3 rounded-2xl' : 'w-12 h-12 mx-auto justify-center rounded-xl'} font-bold transition flex items-center border-b-4 text-sm ${
            activeView === 'dashboard'
              ? 'bg-white/20 border-white/30'
              : 'bg-white/10 hover:bg-white/20 border-transparent hover:border-white/20'
          }`}
          title="Visão Geral"
        >
          <span className={`material-symbols-rounded text-[20px] ${expandedDesktop ? 'mr-3' : ''}`}>dashboard</span>
          {expandedDesktop && <span className="whitespace-nowrap">Visão Geral</span>}
        </button>

        <button
          type="button"
          onClick={onOpenClubs}
          className={`nav-btn ${expandedDesktop ? 'w-full justify-start px-5 py-3 rounded-2xl' : 'w-12 h-12 mx-auto justify-center rounded-xl'} font-bold transition flex items-center border-b-4 text-sm ${
            activeView === 'clubs'
              ? 'bg-white/20 border-white/30'
              : 'bg-white/10 hover:bg-white/20 border-transparent hover:border-white/20'
          }`}
          title="Painel de Clubes"
        >
          <span className={`material-symbols-rounded text-[20px] ${expandedDesktop ? 'mr-3' : ''}`}>groups</span>
          {expandedDesktop && <span className="whitespace-nowrap">Painel de Clubes</span>}
        </button>

        {allowCreateClub && (
          <button
            type="button"
            onClick={onOpenNewClub}
            className={`nav-btn ${expandedDesktop ? 'w-full justify-start px-5 py-3 rounded-2xl' : 'w-12 h-12 mx-auto justify-center rounded-xl'} bg-white/10 font-bold hover:bg-white/20 transition flex items-center border-b-4 border-transparent hover:border-white/20 text-sm`}
            title="Novo Clube"
          >
            <span className={`material-symbols-rounded text-[20px] ${expandedDesktop ? 'mr-3' : ''}`}>add_circle</span>
            {expandedDesktop && <span className="whitespace-nowrap">Novo Clube</span>}
          </button>
        )}
      </nav>

      <div className={`${expandedDesktop ? 'p-6' : 'p-3'} space-y-2 text-xs text-white/75 font-bold transition-all duration-300`}>
        {expandedDesktop && <p className="text-left">Usuário: {userName}</p>}
        <button
          type="button"
          onClick={onLogout}
          className={`${expandedDesktop ? 'w-full px-4 py-3 rounded-xl' : 'w-12 h-12 mx-auto rounded-xl'} text-center bg-red-500/20 text-red-200 font-bold hover:bg-red-500 hover:text-white transition text-sm inline-flex items-center justify-center gap-2`}
          title={`Sair do sistema (${userName})`}
        >
          <span className="material-symbols-rounded text-[18px]">logout</span>
          {expandedDesktop && <span className="whitespace-nowrap">Sair do Sistema</span>}
        </button>
      </div>
    </aside>
  );
}
