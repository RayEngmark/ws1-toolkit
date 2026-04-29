import styles from "./FooterButton.module.css";

/**
 * Standard action-button used in the noun-page footer row. Three variants:
 * `default` (neutral), `primary` (filled accent), `danger` (red, paired with
 * an Arm→Confirm flow at the call site).
 */
export function FooterButton({
  label,
  onClick,
  variant = "default",
  disabled,
  title,
}: {
  label: string;
  onClick: () => void;
  variant?: "default" | "primary" | "danger";
  disabled?: boolean;
  title?: string;
}) {
  const cls =
    variant === "primary"
      ? styles.primary
      : variant === "danger"
        ? styles.danger
        : styles.default;
  return (
    <button
      className={cls}
      onClick={onClick}
      disabled={disabled}
      type="button"
      title={title}
    >
      {label}
    </button>
  );
}
