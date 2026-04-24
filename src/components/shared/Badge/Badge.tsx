import type { ReactNode } from "react";
import styles from "./Badge.module.css";

interface Props {
  variant?: "default" | "success" | "danger" | "warning" | "info";
  children: ReactNode;
}

export function Badge({ variant = "default", children }: Props) {
  return <span className={`${styles.badge} ${styles[variant]}`}>{children}</span>;
}
