// SiteContext — loads KV state once, shares it with the whole app.
// Header reads toolPages to build dynamic nav.
// Host panel writes back through api.saveState().

import { createContext, useContext, useEffect, useState } from 'react';
import { api } from '../api/client.js';
import { DF } from '../data/defaults.js';

const SiteContext = createContext(null);

export function SiteProvider({ children }) {
  const [state, setState] = useState({ ...DF });
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    api.getState()
      .then(s => { setState({ ...DF, ...s }); setLoaded(true); })
      .catch(() => setLoaded(true));
  }, []);

  return (
    <SiteContext.Provider value={{ state, setState, loaded }}>
      {children}
    </SiteContext.Provider>
  );
}

export function useSite() {
  return useContext(SiteContext);
}
