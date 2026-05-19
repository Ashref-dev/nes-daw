import { useContext } from "react";
import { DAWContext } from "./daw-context";

export function useDAWContext() {
  const context = useContext(DAWContext);

  if (!context) {
    throw new Error("useDAWContext must be used within DAWProvider");
  }

  return context;
}
