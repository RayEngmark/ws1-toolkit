// Object → Action mapping for Dynamic mode.
// Maps each object type to the actions available on it, and the corresponding
// Module key from uiStore (so the Action view can reuse the existing module page).

import type { Module } from "../state/uiStore";

export interface DynamicObject {
  key: string;
  label: string;
  blurb: string;
}

export interface DynamicAction {
  key: string;
  label: string;
  blurb: string;
  module: Module;
}

export const DYNAMIC_OBJECTS: DynamicObject[] = [
  { key: "devices", label: "Devices", blurb: "Search, look up, tag, move, install profiles" },
  { key: "smartgroups", label: "Smart Groups", blurb: "Browse groups, add or remove devices, push apps & profiles" },
  { key: "ogs", label: "Organization Groups", blurb: "Reassign devices into a different OG" },
  { key: "apps", label: "Apps", blurb: "Push internal, public, or purchased apps" },
  { key: "profiles", label: "Profiles", blurb: "Install or assign WiFi, VPN, restrictions, passcode policies" },
  { key: "tags", label: "Tags", blurb: "Create new tags or apply tags to devices" },
];

export const DYNAMIC_ACTIONS: Record<string, DynamicAction[]> = {
  devices: [
    { key: "lookup", label: "Look up a device", blurb: "Search by serial, user, UUID, MAC, IMEI, asset tag", module: "lookup-device" },
    { key: "tag", label: "Tag devices", blurb: "Apply or remove a tag in bulk", module: "tag-devices" },
    { key: "move", label: "Move to organization group", blurb: "Reassign devices between OGs", module: "move-devices" },
    { key: "addsg", label: "Add to smart group", blurb: "Add devices to an SG's manual list", module: "add-to-sg" },
    { key: "remsg", label: "Remove from smart group", blurb: "Add devices to an SG's exclusion list", module: "remove-from-sg" },
    { key: "profile", label: "Install profile", blurb: "Push a configuration profile per device", module: "assign-profile" },
  ],
  smartgroups: [
    { key: "browse", label: "Browse smart groups", blurb: "View members, criteria, and assignments", module: "lookup-sg" },
    { key: "addsg", label: "Add devices", blurb: "Add devices to an SG's manual list", module: "add-to-sg" },
    { key: "remsg", label: "Remove devices", blurb: "Add devices to an SG's exclusion list", module: "remove-from-sg" },
    { key: "profile", label: "Assign profile", blurb: "Push a profile to all members of an SG", module: "assign-profile" },
    { key: "app", label: "Assign app", blurb: "Push an app to all members of an SG", module: "assign-app" },
  ],
  ogs: [
    { key: "move", label: "Move devices into an OG", blurb: "Reassign devices into a different OG", module: "move-devices" },
  ],
  apps: [
    { key: "assign", label: "Assign app to smart group", blurb: "Push an app to all members of an SG", module: "assign-app" },
  ],
  profiles: [
    { key: "devices", label: "Install profile on devices", blurb: "Per-device install via /api/mdm/profiles/{id}/install", module: "assign-profile" },
    { key: "sg", label: "Assign profile to smart group", blurb: "Push to all members of an SG", module: "assign-profile" },
  ],
  tags: [
    { key: "create", label: "Create new tag", blurb: "Add a new tag in your tenant", module: "create-tag" },
    { key: "apply", label: "Apply tags to devices", blurb: "Add tags in bulk", module: "tag-devices" },
    { key: "remove", label: "Remove tags from devices", blurb: "Strip tags in bulk", module: "tag-devices" },
  ],
};

export function objectFor(key?: string): DynamicObject | undefined {
  return DYNAMIC_OBJECTS.find((o) => o.key === key);
}

export function actionFor(objKey?: string, actKey?: string): DynamicAction | undefined {
  if (!objKey || !actKey) return undefined;
  return DYNAMIC_ACTIONS[objKey]?.find((a) => a.key === actKey);
}
