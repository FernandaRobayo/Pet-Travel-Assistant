'use client';

import {createContext, useCallback, useContext, useEffect, useState} from 'react';
import {api, ApiError} from '@/lib/api';

interface Usuario { id: string; correo: string }
interface Session {
  token: string | null;
  usuario: Usuario | null;
  loading: boolean;
  error: string;
  login: (correo: string, contrasena: string) => Promise<void>;
  logout: () => void;
  retry: () => void;
}
const Context = createContext<Session | null>(null);
const key = 'pta.session';

export default function AuthProvider({children}: {children: React.ReactNode}) {
  const [token, setToken] = useState<string | null>(null);
  const [usuario, setUsuario] = useState<Usuario | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [attempt, setAttempt] = useState(0);
  const logout = useCallback(() => {
    sessionStorage.removeItem(key); setToken(null); setUsuario(null); setError(''); setLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    const saved = sessionStorage.getItem(key);
    if (!saved) { setLoading(false); return; }
    setLoading(true); setError('');
    api<Usuario>('/auth/me', saved).then(user => {
      if (active) { setToken(saved); setUsuario(user); }
    }).catch(reason => {
      if (!active) return;
      if (reason instanceof ApiError && reason.status === 401) logout();
      else setError('No pudimos verificar tu sesión. Revisa la conexión e intenta de nuevo.');
    }).finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [attempt, logout]);

  useEffect(() => {
    window.addEventListener('pta:session-expired', logout);
    return () => window.removeEventListener('pta:session-expired', logout);
  }, [logout]);

  async function login(correo: string, contrasena: string) {
    const result = await api<{accessToken: string; usuario: Usuario}>('/auth/login', null, {
      method: 'POST', body: JSON.stringify({correo, contrasena})
    });
    // Supuesto: Bearer en sessionStorage por pestaña; sin cookies. No está definido en el alcance actual.
    sessionStorage.setItem(key, result.accessToken);
    setToken(result.accessToken); setUsuario(result.usuario); setError('');
  }
  return <Context.Provider value={{token, usuario, loading, error, login, logout, retry: () => setAttempt(x=>x+1)}}>{children}</Context.Provider>;
}

export function useAuth() {
  const context = useContext(Context);
  if (!context) throw new Error('AuthProvider no está disponible.');
  return context;
}
