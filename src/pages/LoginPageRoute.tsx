import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { apiPost, setSessionToken } from '../services/api';
import type { ApiBaseResponse } from '../services/api';

interface LoginPayload {
  name: string;
  access: string;
  token?: string;
}

interface LoginPageRouteProps {
  userName: string;
  onLogin: (payload: LoginPayload) => void;
}

interface LoginResponse extends ApiBaseResponse {
  sucesso?: boolean;
  token?: string;
  nome?: string;
  acesso?: string;
}

export function LoginPageRoute({ userName, onLogin }: LoginPageRouteProps) {
  const [email, setEmail] = useState('');
  const [senha, setSenha] = useState('');
  const [loading, setLoading] = useState(false);
  const [erro, setErro] = useState('');

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setLoading(true);
    setErro('');

    try {
      const data = await apiPost<LoginResponse>({ acao: 'login', email: email.trim(), senha });
      if (data?.sucesso && data?.token) {
        setSessionToken(data.token);
        onLogin({ name: data.nome || 'Usuário', access: data.acesso || 'usuario', token: data.token });
      } else {
        setErro('Credenciais incorretas.');
      }
    } catch {
      setErro('Erro ao conectar com o servidor.');
    } finally {
      setLoading(false);
    }
  }

  if (userName) return <Navigate to="/dashboard" replace />;

  return (
    <main className="flex items-center justify-center min-h-screen w-full px-4 py-6 sm:py-8 bg-cetecBlue">
      <section className="bg-white p-6 sm:p-8 rounded-[1.6rem] sm:rounded-[2rem] shadow-2xl w-[420px] max-w-full text-center border-b-[8px] border-cetecBlueDark">
        <h1 className="text-2xl sm:text-3xl font-black text-cetecBlue mb-2 tracking-tight">Painel de Clubes</h1>
        <p className="text-gray-500 font-bold text-xs sm:text-sm mb-6 sm:mb-8">Acesso ao ambiente de gerenciamento CETEC</p>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            type="email"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            placeholder="Digite seu e-mail"
            className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-cetecGreen font-bold text-gray-700"
            required
          />
          <input
            type="password"
            value={senha}
            onChange={(event) => setSenha(event.target.value)}
            placeholder="Digite sua senha"
            className="w-full px-4 sm:px-5 py-3.5 sm:py-4 bg-gray-50 border-2 border-gray-200 rounded-2xl focus:outline-none focus:border-cetecGreen font-bold text-gray-700"
            required
          />

          {erro && <p className="text-red-500 font-bold text-sm">{erro}</p>}

          <button type="submit" className="btn-3d w-full bg-cetecGreen text-white font-black text-base sm:text-lg py-3.5 sm:py-4 px-4 rounded-2xl border-b-[6px] border-cetecGreenDark hover:bg-[#7ed152]" disabled={loading}>
            {loading ? 'A CARREGAR...' : 'ENTRAR'}
          </button>
        </form>
      </section>
    </main>
  );
}
