import { AppShell } from "./components/AppShell/AppShell";
import { useConnectionStore } from "./state/connectionStore";
import { useUIStore } from "./state/uiStore";
import "./styles/global.css";

if (import.meta.env.DEV) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const w = window as any;
  w.__ws1 = {
    connectionStore: useConnectionStore,
    uiStore: useUIStore,
  };
}

function App() {
  return <AppShell />;
}

export default App;
