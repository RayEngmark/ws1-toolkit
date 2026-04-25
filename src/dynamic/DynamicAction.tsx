import { actionFor } from "./objects";
import { Settings } from "../modules/Settings/Settings";
import { TagDevices } from "../modules/TagDevices/TagDevices";
import { MoveDevices } from "../modules/MoveDevices/MoveDevices";
import { AssignProfile } from "../modules/AssignProfile/AssignProfile";
import { AssignApp } from "../modules/AssignApp/AssignApp";
import { AddToSmartGroup } from "../modules/AddToSmartGroup/AddToSmartGroup";
import { RemoveFromSmartGroup } from "../modules/RemoveFromSmartGroup/RemoveFromSmartGroup";
import { LookupSmartGroup } from "../modules/LookupSmartGroup/LookupSmartGroup";
import { LookupDevice } from "../modules/LookupDevice/LookupDevice";
import { CreateTag } from "../modules/CreateTag/CreateTag";

/**
 * Action view: routes to the existing module page based on the selected action's
 * `module` key. Reuses everything from Classic mode — same component, same flow,
 * same selection store.
 */
const MODULE_MAP = {
  settings: Settings,
  "tag-devices": TagDevices,
  "move-devices": MoveDevices,
  "assign-profile": AssignProfile,
  "assign-app": AssignApp,
  "add-to-sg": AddToSmartGroup,
  "remove-from-sg": RemoveFromSmartGroup,
  "lookup-sg": LookupSmartGroup,
  "lookup-device": LookupDevice,
  "create-tag": CreateTag,
} as const;

export function DynamicAction({
  objectKey,
  actionKey,
}: {
  objectKey: string;
  actionKey: string;
}) {
  const action = actionFor(objectKey, actionKey);
  if (!action) return null;
  const Component = MODULE_MAP[action.module];
  return <Component />;
}
