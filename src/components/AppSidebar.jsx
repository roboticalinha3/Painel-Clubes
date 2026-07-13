import { useEffect, useState } from 'react';
import iconeEducacode from '../assets/icone.ico';
import logoEducacode from '../assets/logo-educacode.png';
import { BaseModal } from './ui/BaseModal';

export function AppSidebar({
  activeView,
  userName,
  allowUsersTools = false,
  onLogout,
  onOpenDashboard,
  onOpenClubs,
  onOpenAdminUsers,
}) {
  const [expanded, setExpanded] = useState(false);
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 1024);
  const [showDevsModal, setShowDevsModal] = useState(false);

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
            <div className="flex items-center gap-2.5 ml-auto">
              <button
                type="button"
                onClick={() => setShowDevsModal(true)}
                className="w-8 h-8 rounded-full flex items-center justify-center bg-white/10 text-white hover:bg-white/20 active:scale-95 transition"
                title="Desenvolvedores"
                aria-label="Desenvolvedores"
              >
                <span className="material-symbols-rounded text-[18px]">code</span>
              </button>
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

            {allowUsersTools && (
              <>
                <button
                  type="button"
                  onClick={onOpenAdminUsers}
                  className={`app-mobile-tab-btn ${activeView === 'admin-users' ? 'is-active' : ''}`}
                  title="Usuários"
                >
                  <span className="material-symbols-rounded text-[18px]">person_add</span>
                  <span>Usuários</span>
                </button>
              </>
            )}
          </nav>
        </aside>

        <BaseModal
          open={showDevsModal}
          onClose={() => setShowDevsModal(false)}
          title="✨ Equipe de Desenvolvimento"
          sizeClass="ui-modal-card ui-modal-card--sm"
        >
          <div className="text-center py-2">
            <div className="flex justify-center mb-3">
              <span className="material-symbols-rounded text-5xl text-cetecOrange animate-bounce">rocket_launch</span>
            </div>
            <h4 className="text-lg font-black text-cetecBlue mb-1">Painel de Clubes - CETEC</h4>
            <p className="text-xs text-gray-500 mb-6">Criado com paixão para impulsionar o aprendizado e a tecnologia!</p>

            <div className="space-y-4 text-left">
              {/* Arthur Silveira Card */}
              <a
                href="https://github.com/IsArthurSilveira"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl bg-gradient-to-r from-cetecBlue/5 to-cetecBlue/10 border border-cetecBlue/10 hover:border-cetecBlue hover:shadow-md transition duration-300 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cetecBlue text-white font-black flex items-center justify-center text-sm shadow-inner group-hover:scale-110 transition duration-300 shrink-0">
                    AS
                  </div>
                  <div>
                    <h5 className="font-bold text-cetecBlue group-hover:text-cetecOrange transition duration-300 text-sm">Arthur Silveira</h5>
                    <p className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
                      <span className="material-symbols-rounded text-[12px]">terminal</span>
                      Desenvolvedor Full-stack
                    </p>
                  </div>
                </div>
                <span className="material-symbols-rounded text-gray-400 group-hover:text-cetecOrange group-hover:translate-x-0.5 transition duration-300 text-lg">arrow_forward</span>
              </a>

              {/* Matheus Oliveira Card */}
              <a
                href="https://github.com/matheus96-cr"
                target="_blank"
                rel="noopener noreferrer"
                className="p-3.5 rounded-2xl bg-gradient-to-r from-cetecGreen/5 to-cetecGreen/10 border border-cetecGreen/10 hover:border-cetecGreen hover:shadow-md transition duration-300 flex items-center justify-between group"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-cetecGreen text-white font-black flex items-center justify-center text-sm shadow-inner group-hover:scale-110 transition duration-300 shrink-0">
                    MO
                  </div>
                  <div>
                    <h5 className="font-bold text-cetecBlue group-hover:text-cetecGreenDark transition duration-300 text-sm">Matheus Oliveira</h5>
                    <p className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
                      <span className="material-symbols-rounded text-[12px]">code</span>
                      Desenvolvedor Full-stack
                    </p>
                  </div>
                </div>
                <span className="material-symbols-rounded text-gray-400 group-hover:text-cetecGreenDark group-hover:translate-x-0.5 transition duration-300 text-lg">arrow_forward</span>
              </a>
            </div>

            <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-[11px] text-gray-400 font-mono">
              <span>Versão 1.2.0 (2026)</span>
              <div className="flex items-center gap-2 font-semibold text-xs text-cetecOrange">
                <a
                  href="https://github.com/IsArthurSilveira"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline hover:text-cetecOrangeDark transition duration-200"
                >
                  GitHub Arthur
                </a>
                <span>|</span>
                <a
                  href="https://github.com/matheus96-cr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:underline hover:text-cetecOrangeDark transition duration-200"
                >
                  GitHub Matheus
                </a>
              </div>
            </div>
          </div>
        </BaseModal>
      </>
    );
  }

  return (
    <>
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

          {allowUsersTools && (
            <>
              <button
                type="button"
                onClick={onOpenAdminUsers}
                className={`nav-btn ${expandedDesktop ? 'w-full justify-start px-5 py-3 rounded-2xl' : 'w-12 h-12 mx-auto justify-center rounded-xl'} bg-white/10 font-bold hover:bg-white/20 transition flex items-center border-b-4 border-transparent hover:border-white/20 text-sm ${activeView === 'admin-users' ? 'bg-white/20 border-white/30' : ''}`}
                title="Usuários"
              >
                <span className={`material-symbols-rounded text-[20px] ${expandedDesktop ? 'mr-3' : ''}`}>person_add</span>
                {expandedDesktop && <span className="whitespace-nowrap">Usuários</span>}
              </button>
            </>
          )}
        </nav>

        <div className={`${expandedDesktop ? 'p-6' : 'p-3'} space-y-2 text-xs text-white/75 font-bold transition-all duration-300`}>
          {expandedDesktop && <p className="text-left mb-1">Usuário: {userName}</p>}
          <button
            type="button"
            onClick={() => setShowDevsModal(true)}
            className={`${expandedDesktop ? 'w-full px-4 py-3 rounded-xl justify-start' : 'w-12 h-12 mx-auto justify-center'} bg-white/10 text-white font-bold hover:bg-white/20 transition text-sm inline-flex items-center gap-2`}
            title="Desenvolvedores do Sistema"
          >
            <span className="material-symbols-rounded text-[18px]">code</span>
            {expandedDesktop && <span className="whitespace-nowrap">Desenvolvedores</span>}
          </button>
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

      <BaseModal
        open={showDevsModal}
        onClose={() => setShowDevsModal(false)}
        title="✨ Equipe de Desenvolvimento"
        sizeClass="ui-modal-card ui-modal-card--sm"
      >
        <div className="text-center py-2">
          <div className="flex justify-center mb-3">
            <span className="material-symbols-rounded text-5xl text-cetecOrange animate-bounce">rocket_launch</span>
          </div>
          <h4 className="text-lg font-black text-cetecBlue mb-1">Painel de Clubes - CETEC</h4>
          <p className="text-xs text-gray-500 mb-6">Criado com paixão para impulsionar o aprendizado e a tecnologia!</p>

          <div className="space-y-4 text-left">
            {/* Arthur Silveira Card */}
            <a
              href="https://github.com/IsArthurSilveira"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl bg-gradient-to-r from-cetecBlue/5 to-cetecBlue/10 border border-cetecBlue/10 hover:border-cetecBlue hover:shadow-md transition duration-300 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cetecBlue text-white font-black flex items-center justify-center text-sm shadow-inner group-hover:scale-110 transition duration-300 shrink-0">
                  AS
                </div>
                <div>
                  <h5 className="font-bold text-cetecBlue group-hover:text-cetecOrange transition duration-300 text-sm">Arthur Silveira</h5>
                  <p className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
                    <span className="material-symbols-rounded text-[12px]">terminal</span>
                    Desenvolvedor Full-stack
                  </p>
                </div>
              </div>
              <span className="material-symbols-rounded text-gray-400 group-hover:text-cetecOrange group-hover:translate-x-0.5 transition duration-300 text-lg">arrow_forward</span>
            </a>

            {/* Matheus Oliveira Card */}
            <a
              href="https://github.com/matheus96-cr"
              target="_blank"
              rel="noopener noreferrer"
              className="p-3.5 rounded-2xl bg-gradient-to-r from-cetecGreen/5 to-cetecGreen/10 border border-cetecGreen/10 hover:border-cetecGreen hover:shadow-md transition duration-300 flex items-center justify-between group"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-cetecGreen text-white font-black flex items-center justify-center text-sm shadow-inner group-hover:scale-110 transition duration-300 shrink-0">
                  MO
                </div>
                <div>
                  <h5 className="font-bold text-cetecBlue group-hover:text-cetecGreenDark transition duration-300 text-sm">Matheus Oliveira</h5>
                  <p className="text-[11px] text-gray-500 font-semibold flex items-center gap-1">
                    <span className="material-symbols-rounded text-[12px]">code</span>
                    Desenvolvedor Full-stack
                  </p>
                </div>
              </div>
              <span className="material-symbols-rounded text-gray-400 group-hover:text-cetecGreenDark group-hover:translate-x-0.5 transition duration-300 text-lg">arrow_forward</span>
            </a>
          </div>

          <div className="mt-6 pt-4 border-t border-gray-100 flex justify-between items-center text-[11px] text-gray-400 font-mono">
            <span>Versão 1.2.0 (2026)</span>
            <div className="flex items-center gap-2 font-semibold text-xs text-cetecOrange">
              <a
                href="https://github.com/IsArthurSilveira"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline hover:text-cetecOrangeDark transition duration-200"
              >
                GitHub Arthur
              </a>
              <span>|</span>
              <a
                href="https://github.com/matheus96-cr"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:underline hover:text-cetecOrangeDark transition duration-200"
              >
                GitHub Matheus
              </a>
            </div>
          </div>
        </div>
      </BaseModal>
    </>
  );
}
