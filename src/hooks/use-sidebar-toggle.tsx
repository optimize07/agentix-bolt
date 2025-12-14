import React from "react";

type SidebarToggleContextValue = {
  isOpen: boolean;
  setOpen: (open: boolean) => void;
  toggle: () => void;
};

const SidebarToggleContext = React.createContext<SidebarToggleContextValue | null>(null);

function usePersistedOpen(): [boolean, (open: boolean) => void] {
  const [isOpen, setIsOpen] = React.useState<boolean>(true);

  React.useEffect(() => {
    try {
      const stored = window.localStorage.getItem("sidebar:isOpen");
      if (stored !== null) {
        setIsOpen(stored === "true");
      }
    } catch {
      // ignore read errors
    }
  }, []);

  const setOpen = React.useCallback((open: boolean) => {
    setIsOpen(open);
    try {
      window.localStorage.setItem("sidebar:isOpen", String(open));
    } catch {
      // ignore write errors
    }
  }, []);

  return [isOpen, setOpen];
}

export const SidebarToggleProvider = ({ children }: { children: React.ReactNode }) => {
  const [isOpen, setOpen] = usePersistedOpen();

  const toggle = React.useCallback(() => setOpen(!isOpen), [isOpen, setOpen]);

  const value = React.useMemo(
    () => ({ isOpen, setOpen, toggle }),
    [isOpen, setOpen, toggle],
  );

  return <SidebarToggleContext.Provider value={value}>{children}</SidebarToggleContext.Provider>;
};

export function useSidebarToggle() {
  const ctx = React.useContext(SidebarToggleContext);
  if (!ctx) {
    throw new Error("useSidebarToggle must be used within SidebarToggleProvider");
  }
  return ctx;
}





