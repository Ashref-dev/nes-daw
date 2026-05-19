import { useEffect } from "react";
import { DAWAction } from "../types";
import { findActionByShortcut } from "../lib/actions";
import { isEditableTarget, isTextCompositionEvent } from "../lib/keyboardPiano";

export function useGlobalActions(actions: DAWAction[]) {
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.repeat ||
        isEditableTarget(event.target) ||
        isTextCompositionEvent(event)
      ) {
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
