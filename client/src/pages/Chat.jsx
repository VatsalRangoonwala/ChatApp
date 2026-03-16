import { useEffect, useRef } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { Navbar } from "../components/Navbar";

export default function Chat() {
  const maxViewportHeightRef = useRef(0);

  useEffect(() => {
    const root = document.documentElement;

    const updateViewportMetrics = () => {
      const visualViewport = window.visualViewport;
      const layoutViewportHeight = window.innerHeight;
      const visualViewportHeight = visualViewport?.height ?? layoutViewportHeight;
      const visualViewportOffsetTop = visualViewport?.offsetTop ?? 0;
      const effectiveViewportHeight =
        visualViewportHeight + visualViewportOffsetTop;

      maxViewportHeightRef.current = Math.max(
        maxViewportHeightRef.current,
        layoutViewportHeight,
        effectiveViewportHeight,
      );

      const stableViewportHeight =
        maxViewportHeightRef.current || layoutViewportHeight;
      const keyboardInset = Math.max(
        0,
        stableViewportHeight - effectiveViewportHeight,
      );

      root.style.setProperty("--app-height", `${stableViewportHeight}px`);
      root.style.setProperty("--keyboard-inset", `${keyboardInset}px`);
    };

    updateViewportMetrics();

    window.addEventListener("resize", updateViewportMetrics);
    window.addEventListener("orientationchange", updateViewportMetrics);
    window.visualViewport?.addEventListener("resize", updateViewportMetrics);
    window.visualViewport?.addEventListener("scroll", updateViewportMetrics);

    return () => {
      window.removeEventListener("resize", updateViewportMetrics);
      window.removeEventListener("orientationchange", updateViewportMetrics);
      window.visualViewport?.removeEventListener("resize", updateViewportMetrics);
      window.visualViewport?.removeEventListener("scroll", updateViewportMetrics);
      root.style.removeProperty("--app-height");
      root.style.removeProperty("--keyboard-inset");
    };
  }, []);

  return (
    <div className="chat-shell flex overflow-hidden bg-background">
      <div className="chat-shell__content flex min-h-0 flex-1 flex-col">
        <Navbar />
        <div className="flex min-h-0 flex-1 overflow-hidden">
          <Sidebar />
          <ChatWindow />
        </div>
      </div>
    </div>
  );
}
