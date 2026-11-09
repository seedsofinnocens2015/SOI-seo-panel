'use client';

import { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { fetchMasterSettings } from '../../lib/masterSettingsApi';
import { fetchPanelUsers } from '../../lib/panelUsersApi';

const MasterContext = createContext({
  dropdowns: {},
  getDropdown: () => [],
  hrUsers: [],
  recruiters: [],
  loading: true,
  refreshMasters: () => {},
});

export function MasterProvider({ children }) {
  const [dropdowns, setDropdowns] = useState({});
  const [hrUsers, setHrUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  const loadMasters = useCallback(async () => {
    try {
      setLoading(true);
      const [data, users] = await Promise.all([
        fetchMasterSettings().catch(() => null),
        fetchPanelUsers('hr').catch(() => []),
      ]);

      if (data?.dropdowns) {
        setDropdowns(data.dropdowns);
      } else {
        setDropdowns({});
      }

      // Filter out hidden ghost superadmin amitkumaryadav8314@gmail.com
      const filteredUsers = (Array.isArray(users) ? users : []).filter(
        (u) =>
          u?.email !== 'amitkumaryadav8314@gmail.com' &&
          u?.loginId !== 'amitkumaryadav8314@gmail.com' &&
          u?.loginId !== 'admin'
      );
      setHrUsers(filteredUsers);
    } catch {
      setDropdowns({});
      setHrUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadMasters();
  }, [loadMasters]);

  const getDropdown = useCallback(
    (key) => {
      const list = dropdowns[key] || [];
      const masterItems = list.map((item) => (typeof item === 'string' ? item : item.value)).filter(Boolean);

      // If recruiter dropdown is requested, combine real HR users with any master recruiters
      if (key === 'recruiters') {
        const userRecruiters = hrUsers.map((u) => u.name || u.loginId).filter(Boolean);
        const combined = Array.from(new Set([...userRecruiters, ...masterItems]));
        return combined;
      }

      return masterItems;
    },
    [dropdowns, hrUsers]
  );

  return (
    <MasterContext.Provider
      value={{
        dropdowns,
        getDropdown,
        hrUsers,
        recruiters: getDropdown('recruiters'),
        loading,
        refreshMasters: loadMasters,
      }}
    >
      {children}
    </MasterContext.Provider>
  );
}

export function useMaster() {
  return useContext(MasterContext);
}
