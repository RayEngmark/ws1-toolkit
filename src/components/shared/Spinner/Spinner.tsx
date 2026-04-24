import styles from "./Spinner.module.css";

interface Props {
  size?: number;
}

export function Spinner({ size = 24 }: Props) {
  return (
    <div
      className={styles.spinner}
      style={{ width: size, height: size }}
    />
  );
}
