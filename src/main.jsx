import React from "react";
import { createRoot } from "react-dom/client";
import "./fonts.js";

const root = createRoot(document.getElementById("root"));

// development only: `__auditText()` lists any text that is cut off on screen
if (import.meta.env.DEV) import("./dev/auditText.js").then(({ auditAtRest }) => { window.__auditText = auditAtRest; });

if (import.meta.env.DEV && new URLSearchParams(location.search).has("gallery")) {
  import("./dev/Gallery.jsx").then(({ Gallery }) => root.render(<Gallery />));
} else {
  import("./App.jsx").then(({ App }) => root.render(
    <React.StrictMode>
      <App />
    </React.StrictMode>,
  ));
}
