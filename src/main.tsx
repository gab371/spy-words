import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import "./index.css";
import App from "./App.tsx";

export function mount(
  element: HTMLElement,
  options: {
    peerId: string;
    onExit?: () => void;
    externalPeerManager?: unknown;
    playerName?: string;
    playerAvatar?: string;
    isHost?: boolean;
    lateJoin?: boolean;
    gameConfig?: unknown;
    hubPhase?: string;
  },
) {
  const styleId = "game-style-spy";
  if (!document.getElementById(styleId)) {
    const link = document.createElement("link");
    link.id = styleId;
    link.rel = "stylesheet";
    link.href = "./games/spy/style.css";
    document.head.appendChild(link);
  }

  const root = createRoot(element);
  root.render(
    <StrictMode>
      <App
        isEmbedded={true}
        externalPeerManager={options.externalPeerManager as PeerManagerLikeShim}
        onExit={options.onExit}
        playerName={options.playerName}
        playerAvatar={options.playerAvatar}
        isHost={options.isHost}
        lateJoin={options.lateJoin}
        gameConfig={options.gameConfig}
        hubPhase={options.hubPhase}
      />
    </StrictMode>,
  );
  return () => root.unmount();
}

type PeerManagerLikeShim = Parameters<typeof App>[0]["externalPeerManager"];

// Attach to window for dynamic runtime loads
(window as unknown as { mountSpy: typeof mount }).mountSpy = mount;

const rootEl = document.getElementById("root");
if (import.meta.env.MODE !== "lib" && rootEl && rootEl.children.length === 0) {
  createRoot(rootEl).render(
    <StrictMode>
      <App />
    </StrictMode>,
  );
}