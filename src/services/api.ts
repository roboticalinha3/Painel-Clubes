import { API_URL, IS_LOCALHOST } from '../config';

export const TOKEN_STORAGE_KEY = 'painel_token_sessao';
export const AUTH_EXPIRED_EVENT = 'auth:expired';

const PUBLIC_ACTIONS = new Set(['login']);

type RecordValue = Record<string, unknown>;

export interface ApiRequestPayload extends RecordValue {
  acao?: string;
}

export interface ApiBaseResponse extends RecordValue {
  sucesso?: boolean;
  SUCESSO?: boolean;
  mensagem?: string;
  message?: string;
  erro?: string;
  codigo?: string;
}

export interface SessionValidationResponse extends ApiBaseResponse {
  sucesso: boolean;
  nome?: string;
  acesso?: string;
}

export class AuthError extends Error {
  constructor(message = 'Sessao expirada ou invalida.') {
    super(message);
    this.name = 'AuthError';
  }
}

export function getSessionToken(): string {
  try {
    return localStorage.getItem(TOKEN_STORAGE_KEY) || '';
  } catch {
    return '';
  }
}

export function setSessionToken(token: string): void {
  try {
    if (token) localStorage.setItem(TOKEN_STORAGE_KEY, token);
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    // Ignora falha de storage em ambientes restritos.
  }
}

export function clearSessionToken(): void {
  setSessionToken('');
}

export async function validateSession(): Promise<SessionValidationResponse | null> {
  try {
    const data = await apiPost<SessionValidationResponse>({ acao: 'validar_sessao' });
    return data?.sucesso ? data : null;
  } catch {
    return null;
  }
}

export async function logoutSession(): Promise<void> {
  try {
    await apiPost({ acao: 'logout' });
  } catch {
    // Se falhar no backend, ainda limpamos no frontend.
  } finally {
    clearSessionToken();
  }
}

export async function apiGet<TResponse = unknown>(params: ApiRequestPayload): Promise<TResponse> {
  if (IS_LOCALHOST) {
    return jsonpRequest(params) as Promise<TResponse>;
  }

  const action = String(params?.acao || '').toLowerCase();
  const requestParams = transformSheetRequest(appendAuthToken(params, action)) as RecordValue;
  const url = `${API_URL}?${new URLSearchParams(requestParams as Record<string, string>).toString()}`;
  const response = await fetch(url);
  const result = transformSheetResponse(await response.json(), String(requestParams?.acao || ''));
  assertAuthorized(result, String((requestParams as RecordValue)?.token || ''));
  return result as TResponse;
}

export async function apiPost<TResponse = ApiBaseResponse>(payload: ApiRequestPayload): Promise<TResponse> {
  if (IS_LOCALHOST) {
    return jsonpRequest(payload) as Promise<TResponse>;
  }

  const action = String(payload?.acao || '').toLowerCase();
  const requestPayload = action === 'login'
    ? payload
    : transformSheetRequest(appendAuthToken(payload, action));

  const response = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'text/plain;charset=utf-8' },
    body: JSON.stringify(requestPayload),
  });

  const result = transformApiResponse(await response.json(), action) as RecordValue;
  assertAuthorized(result, String((requestPayload as RecordValue)?.token || ''));
  return result as TResponse;
}

function jsonpRequest(params: RecordValue): Promise<unknown> {
  return new Promise((resolve, reject) => {
    const initialAction = String(params?.acao || '').toLowerCase();
    const requestParams = transformSheetRequest(appendAuthToken(params, initialAction)) as RecordValue;
    const requestToken = String(requestParams?.token || '');
    const action = String(requestParams?.acao || '').toLowerCase();
    const callbackName = `jsonp_cb_${Date.now()}_${Math.floor(Math.random() * 10000)}`;
    const query = new URLSearchParams({ ...(requestParams as Record<string, string>), callback: callbackName }).toString();
    const script = document.createElement('script');
    let settled = false;

    const timeout = window.setTimeout(() => {
      settled = true;
      // Mantem callback no-op para respostas tardias nao gerarem ReferenceError no console.
      (window as unknown as Record<string, unknown>)[callbackName] = () => {};
      if (script.parentNode) script.parentNode.removeChild(script);
      reject(new Error('Tempo de resposta excedido no JSONP.'));
    }, 30000);

    function cleanupSuccess() {
      clearTimeout(timeout);
      delete (window as unknown as Record<string, unknown>)[callbackName];
      if (script.parentNode) script.parentNode.removeChild(script);
    }

    (window as unknown as Record<string, unknown>)[callbackName] = (data: unknown) => {
      if (settled) return;
      settled = true;
      cleanupSuccess();
      try {
        const result = transformApiResponse(data, action);
        assertAuthorized(result, requestToken);
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };

    script.onerror = () => {
      if (settled) return;
      settled = true;
      clearTimeout(timeout);
      (window as unknown as Record<string, unknown>)[callbackName] = () => {};
      if (script.parentNode) script.parentNode.removeChild(script);
      reject(new Error('Falha no carregamento JSONP.'));
    };

    script.src = `${API_URL}?${query}`;
    document.head.appendChild(script);
  });
}

function transformSheetRequest(value: unknown): unknown {
  return transformDeep(value, (key, currentValue) => {
    if (typeof currentValue !== 'string') return currentValue;
    if (key === 'acao' || key === 'callback' || key === 'token' || isIdField(key)) return currentValue;
    return currentValue.toUpperCase();
  });
}

function transformSheetResponse(value: unknown, action = ''): unknown {
  const normalizedAction = String(action || '').toLowerCase();
  if (normalizedAction === 'login') return value;

  return transformDeep(value, (key, currentValue) => {
    if (typeof currentValue !== 'string') return currentValue;
    if (isIdField(key)) return currentValue;
    return currentValue.toUpperCase();
  });
}

function transformApiResponse(value: unknown, action = ''): unknown {
  const normalizedAction = String(action || '').toLowerCase();
  if (normalizedAction === 'login' || normalizedAction === 'validar_sessao' || normalizedAction === 'logout') {
    return transformDeep(value, (key, currentValue) => {
      if (typeof currentValue !== 'string') return currentValue;
      if (key === 'senha' || key === 'email' || key === 'token') return currentValue;
      return currentValue.toUpperCase();
    });
  }

  return transformSheetResponse(value, action);
}

function isIdField(key: string): boolean {
  const normalized = String(key || '').toLowerCase();
  return normalized === 'id' || normalized.startsWith('id_') || normalized === 'idclube' || normalized === 'idencontro' || normalized === 'idaluno';
}

function transformDeep(value: unknown, transformFn: (key: string, currentValue: unknown) => unknown, key = ''): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => transformDeep(item, transformFn, key));
  }

  if (value && typeof value === 'object') {
    return Object.entries(value as RecordValue).reduce<RecordValue>((acc, [currentKey, currentValue]) => {
      acc[currentKey] = transformDeep(currentValue, transformFn, currentKey);
      return acc;
    }, {});
  }

  return transformFn(key, value);
}

function appendAuthToken(payload: unknown, action: string): unknown {
  if (!payload || typeof payload !== 'object') return payload;
  if (PUBLIC_ACTIONS.has(String(action || '').toLowerCase())) return payload;

  const token = getSessionToken();
  if (!token) return payload;

  return { ...(payload as RecordValue), token };
}

function assertAuthorized(response: unknown, requestToken = ''): void {
  if (!response || typeof response !== 'object') return;

  const obj = response as RecordValue;
  const code = String(obj.codigo || obj.erro || '').toUpperCase();
  const message = String(obj.mensagem || obj.message || '').toLowerCase();
  const unauthorized =
    code === 'NAO_AUTORIZADO' ||
    code === 'UNAUTHORIZED' ||
    message.includes('nao autorizado') ||
    message.includes('nao autorizado') ||
    (message.includes('token') && message.includes('inval'));

  if (!unauthorized) return;

  // Resposta atrasada de uma requisicao antiga (token diferente) nao deve derrubar sessao atual.
  const currentToken = getSessionToken();
  const reqToken = String(requestToken || '').trim();
  if (reqToken && currentToken && reqToken !== currentToken) {
    return;
  }

  clearSessionToken();
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent(AUTH_EXPIRED_EVENT));
  }
  throw new AuthError();
}
