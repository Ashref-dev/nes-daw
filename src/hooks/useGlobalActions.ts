import { useEffect } from "react";
import { DAWAction } from "../types";
import { findActionByShortcut } from "../lib/actions";
import { isEditableTarget } from "../lib/keyboardPiano";

export function useGlobalActions(actions: DAWAction[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.repeat || isEditableTarget(event.target)) {
        return;
      }

      const action = findActionByShortcut(actions, event);
      if (!action) {
        return;
      }

      event.preventDefault();
      void action.run();
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [actions]);
}
