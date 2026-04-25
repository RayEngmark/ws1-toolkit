import { useState } from "react";
import { DevicePicker } from "../../components/DevicePicker/DevicePicker";
import type { Device } from "../../ipc/contracts";
import shared from "../_shared/ActionPage.module.css";
import styles from "./LookupDevice.module.css";

export function LookupDevice() {
  const [devices, setDevices] = useState<Device[]>([]);

  return (
    <div className={shared.page}>
      <header className={shared.header}>
        <h1 className={shared.title}>Look up devices</h1>
        <p className={shared.subtitle}>
          Resolve any identifier and see the full device record. Useful for
          quick checks, copying IDs, or verifying enrollment.
        </p>
      </header>

      <div className={shared.body}>
        <div className={shared.stack}>
          <DevicePicker resolved={devices} onChange={setDevices} />

          {devices.length > 0 && (
            <div className={styles.detailGrid}>
              {devices.map((d) => (
                <DeviceCard key={d.id} device={d} />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function DeviceCard({ device }: { device: Device }) {
  const compliant = device.complianceStatus === "Compliant";
  return (
    <div className={styles.card}>
      <div className={styles.cardHeader}>
        <div>
          <div className={styles.cardName}>{device.friendlyName}</div>
          <div className={styles.cardSub}>
            {device.userName} · {device.model}
          </div>
        </div>
        <span
          className={`${styles.status} ${compliant ? styles.statusOk : styles.statusBad}`}
        >
          <span className={styles.dot} />
          {device.complianceStatus}
        </span>
      </div>
      <div className={styles.detailList}>
        <DetailRow label="Serial" value={device.serialNumber} mono />
        <DetailRow label="UUID" value={device.udid || device.uuid} mono />
        {device.imei && <DetailRow label="IMEI" value={device.imei} mono />}
        {device.macAddress && <DetailRow label="MAC" value={device.macAddress} mono />}
        {device.assetNumber && <DetailRow label="Asset" value={device.assetNumber} mono />}
        <DetailRow label="OS" value={device.os} />
        <DetailRow label="Platform" value={device.platform} />
        <DetailRow label="OG" value={device.ogName} />
        <DetailRow label="Ownership" value={device.ownership} />
        <DetailRow label="Enrolled" value={device.enrollmentStatus} />
        <DetailRow label="Last seen" value={new Date(device.lastSeen).toLocaleString()} />
      </div>
    </div>
  );
}

function DetailRow({ label, value, mono }: { label: string; value: string; mono?: boolean }) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={`${styles.detailValue} ${mono ? styles.mono : ""}`}>
        {value || "—"}
      </span>
    </div>
  );
}
