import React, { createContext, useContext, useEffect, useState } from "react";
import { useLocation } from "react-router-dom";

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
    const params = new URLSearchParams(window.location.search);
    const fromUrl = params.get("ownerId");
    if (fromUrl) return fromUrl;
    return window.localStorage.getItem(OWNER_ID_STORAGE_KEY);
  });

  const location = useLocation();

  // When ?ownerId= is present, it wins over localStorage (shared links must match the URL).
  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const oid = params.get("ownerId");
    if (!oid) return;
    setOwnerId(oid);
  }, [location.search]);

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
    throw new Error("useOwnerId은 OwnerIdProvider 안에서만 사용할 수 있습니다.");
  }
  return value;
};

