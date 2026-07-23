// Small shared hook: reports whether the backend is serving LIVE AI or the
// offline demo brain, plus which provider is active. Reads the public
// /api/health endpoint once on mount. Used by UI that describes the current
// mode so copy stays truthful instead of hard-coding "offline".
import { useEffect, useState } from 'react';
import { apiGet } from '../api';

export function useHealth() {
  const [health, setHealth] = useState({ aiProvider: 'mock', liveAi: false });
  useEffect(() => {
    apiGet('/api/health').then(setHealth).catch(() => {});
  }, []);
  return health;
}
