import { createContext, useContext, useState, type ReactNode } from "react";
import { createPortal } from "react-dom";

const FooterSlotContext = createContext<HTMLElement | null>(null);

export function FooterSlotProvider({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const [slot, setSlot] = useState<HTMLElement | null>(null);
  return (
    <FooterSlotContext.Provider value={slot}>
      {children}
      <div ref={setSlot} className={className} />
    </FooterSlotContext.Provider>
  );
}

export function FooterSlot({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  const slot = useContext(FooterSlotContext);
  if (!slot) return null;
  return createPortal(<footer className={className}>{children}</footer>, slot);
}
