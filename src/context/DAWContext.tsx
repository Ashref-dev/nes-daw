import { ReactNode } from "react";
import { DAWContext } from "./daw-context";
import { useDAW } from "../hooks/useDAW";

export function DAWProvider({ children }: { children: ReactNode }) {
  const daw = useDAW();

  return <DAWContext.Provider value={daw}>{children}</DAWContext.Provider>;
}
