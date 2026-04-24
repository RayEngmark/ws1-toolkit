import { useDeviceStore } from "../state/deviceStore";

export function useDeviceSelection() {
  const devices = useDeviceStore((s) => s.devices);
  const selectedIds = useDeviceStore((s) => s.selectedIds);

  const selectedDevices = devices.filter((d) => selectedIds.has(d.id));
  return {
    selectedDevices,
    selectedCount: selectedIds.size,
    hasSelection: selectedIds.size > 0,
  };
}
