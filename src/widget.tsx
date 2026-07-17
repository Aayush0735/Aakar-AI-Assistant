import React from "react";
import { createRoot } from "react-dom/client";
import ChatWidget from "./components/chat/ChatWidget";
import "./app/globals.css";

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
    // We want the chat widget to sit on top of everything
    container.style.position = "relative";
    container.style.zIndex = "999999";
    document.body.appendChild(container);
  }

  const root = createRoot(container);
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
