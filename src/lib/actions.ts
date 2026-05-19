import { DAWAction } from "../types";

export function findActionByShortcut(
  actions: DAWAction[],
  event: KeyboardEvent,
): DAWAction | undefined {
  return actions.find((action) => action.shortcut === event.key);
}
