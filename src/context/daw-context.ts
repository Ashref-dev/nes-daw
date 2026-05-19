import { createContext } from "react";
import { useDAW } from "../hooks/useDAW";

export type DAWContextValue = ReturnType<typeof useDAW>;

export const DAWContext = createContext<DAWContextValue | null>(null);
