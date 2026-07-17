import React from "react";
import { createRoot } from "react-dom/client";
import ChatWidget from "./components/chat/ChatWidget";
// Import CSS as a raw string using Vite's ?inline query
// This bypasses @tailwindcss/vite's injection and gives us the raw CSS text
import widgetCss from "./app/globals.css?inline";

const WIDGET_CONTAINER_ID = "aakars-chat-widget-root";

// Capture the script tag right when the file evaluates
const scriptTag = document.currentScript || document.querySelector('script[src*="widget.js"]');
const config = {
  scale: scriptTag?.getAttribute("data-scale") || "1",
  primaryColor: scriptTag?.getAttribute("data-color") || "#00c288",
};

function init() {
  let container = document.getElementById(WIDGET_CONTAINER_ID);
  
  if (!container) {
    container = document.createElement("div");
    container.id = WIDGET_CONTAINER_ID;
    document.body.appendChild(container);
  }

  // The host element must cover the full viewport for `position: fixed` 
  // children inside Shadow DOM to work correctly
  Object.assign(container.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "0",
    height: "0",
    overflow: "visible",
    zIndex: "999999",
    pointerEvents: "none",
  });

  // Create Shadow DOM for complete CSS isolation
  const shadow = container.attachShadow({ mode: "open" });

  // Inject ALL of our CSS into the shadow DOM (not into the host page <head>)
  const styleEl = document.createElement("style");
  styleEl.textContent = widgetCss;
  shadow.appendChild(styleEl);

  // Create a mount point inside the shadow DOM
  const mountPoint = document.createElement("div");
  mountPoint.id = "aakars-shadow-mount";
  mountPoint.style.pointerEvents = "none";
  shadow.appendChild(mountPoint);

  const root = createRoot(mountPoint);
  root.render(
    <React.StrictMode>
      <ChatWidget config={config} />
    </React.StrictMode>
  );
}

// Automatically initialize when the script loads
if (document.readyState === "loading") {
  document.addEventListener("DOMContentLoaded", init);
} else {
  init();
}
