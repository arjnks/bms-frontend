import { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/auth';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    try { return JSON.parse(localStorage.getItem('leo-user') || 'null'); }
    catch { return null; }
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('leo-token');
    if (!token) {
      setUser(null);
      localStorage.removeItem('leo-user');
      setLoading(false);
      return;
    }

    authApi.me()
      .then(u => {
        setUser(u);
        localStorage.setItem('leo-user', JSON.stringify(u));
      })
      .catch(() => {
        setUser(null);
        localStorage.removeItem('leo-token');
        localStorage.removeItem('leo-user');
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (credentials) => {
    const res = await authApi.login(credentials);
    const loggedUser = res.user;
    const token = res.token;
    localStorage.setItem('leo-token', token);
    localStorage.setItem('leo-user', JSON.stringify(loggedUser));
    setUser(loggedUser);
    return loggedUser;
  };

  const logout = async () => {
    try { await authApi.logout(); } catch (_) {}
    localStorage.removeItem('leo-token');
    localStorage.removeItem('leo-user');
    setUser(null);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
