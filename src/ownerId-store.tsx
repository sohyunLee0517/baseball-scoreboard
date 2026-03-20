import React, { createContext, useContext, useEffect, useState } from "react";

type OwnerIdStore = {
  ownerId: string | null;
  setOwnerId: (id: string | null) => void;
};

const OwnerIdContext = createContext<OwnerIdStore | undefined>(undefined);

const OWNER_ID_STORAGE_KEY = "ownerId";

export const OwnerIdProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [ownerId, setOwnerId] = useState<string | null>(() => {
    if (typeof window === "undefined") return null;
    return window.localStorage.getItem(OWNER_ID_STORAGE_KEY);
  });

  // Initialize from URL query (?ownerId=...) once, only if localStorage doesn't already have a value.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const oid = params.get("ownerId");
    if (!oid) return;
    const stored = window.localStorage.getItem(OWNER_ID_STORAGE_KEY);
    if (stored) return;
    setOwnerId(oid);
    window.localStorage.setItem(OWNER_ID_STORAGE_KEY, oid);
  }, []);

  // Keep localStorage in sync
  useEffect(() => {
    if (typeof window === "undefined") return;
    if (!ownerId) {
      window.localStorage.removeItem(OWNER_ID_STORAGE_KEY);
      return;
    }
    window.localStorage.setItem(OWNER_ID_STORAGE_KEY, ownerId);
  }, [ownerId]);

  return (
    <OwnerIdContext.Provider value={{ ownerId, setOwnerId }}>
      {children}
    </OwnerIdContext.Provider>
  );
};

export const useOwnerId = (): OwnerIdStore => {
  const value = useContext(OwnerIdContext);
  if (!value) {
    throw new Error("useOwnerId must be used within OwnerIdProvider");
  }
  return value;
};

