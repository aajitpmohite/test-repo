// Authentication + team state for the whole app.
// Holds the signed-in user, their teams, and the currently selected team/role.
// Persists the token + selected team id so a refresh keeps you signed in.
import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
  apiGet,
  apiPost,
  getTeamId,
  getToken,
  setTeamId,
  setToken,
  setUnauthorizedHandler,
} from '../api';

const AuthContext = createContext(null);
export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [teams, setTeams] = useState([]);
  const [activeTeamId, setActiveTeamId] = useState(() => (getTeamId() ? Number(getTeamId()) : null));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    setToken(null);
    setTeamId(null);
    setUser(null);
    setTeams([]);
    setActiveTeamId(null);
  }, []);

  // Let api.js kick us out on a 401.
  useEffect(() => {
    setUnauthorizedHandler(() => logout());
  }, [logout]);

  const pickTeam = useCallback((teamList) => {
    const saved = getTeamId() ? Number(getTeamId()) : null;
    const valid = saved && teamList.some((t) => t.id === saved) ? saved : teamList[0]?.id ?? null;
    setActiveTeamId(valid);
    setTeamId(valid);
    return valid;
  }, []);

  const applyAuth = useCallback(
    (data) => {
      setToken(data.token);
      setUser(data.user);
      setTeams(data.teams);
      pickTeam(data.teams);
    },
    [pickTeam],
  );

  // Restore a session on first load.
  useEffect(() => {
    async function boot() {
      if (!getToken()) {
        setLoading(false);
        return;
      }
      try {
        const me = await apiGet('/api/auth/me');
        setUser(me.user);
        setTeams(me.teams);
        pickTeam(me.teams);
      } catch {
        logout();
      } finally {
        setLoading(false);
      }
    }
    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const login = async (email, password) => applyAuth(await apiPost('/api/auth/login', { email, password }));
  const register = async (payload) => applyAuth(await apiPost('/api/auth/register', payload));
  const demo = async () => applyAuth(await apiPost('/api/auth/demo'));
  const switchTeam = (id) => {
    setActiveTeamId(id);
    setTeamId(id);
  };
  const refresh = async () => {
    const me = await apiGet('/api/auth/me');
    setUser(me.user);
    setTeams(me.teams);
  };

  const activeTeam = teams.find((t) => t.id === activeTeamId) || null;
  const role = activeTeam?.role || 'member';

  const value = {
    user,
    teams,
    activeTeam,
    activeTeamId,
    role,
    isAdmin: role === 'admin',
    isAuthenticated: !!user,
    loading,
    login,
    register,
    demo,
    logout,
    switchTeam,
    refresh,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
