import { ImageResponse } from "next/og";
export const alt = "DevToolbox — privacy-focused developer tools";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export default function OpenGraphImage() {
  return new ImageResponse(
    <div
      style={{
        alignItems: "center",
        background: "linear-gradient(135deg, #07111f, #12304a)",
        color: "white",
        display: "flex",
        flexDirection: "column",
        height: "100%",
        justifyContent: "center",
        letterSpacing: "-0.03em",
        width: "100%",
      }}
    >
      <div style={{ color: "#5eead4", fontSize: 28, marginBottom: 24 }}>
        PRIVATE · FAST · BROWSER-FIRST
      </div>
      <div style={{ fontSize: 88, fontWeight: 700 }}>DevToolbox</div>
      <div style={{ color: "#cbd5e1", fontSize: 34, marginTop: 24 }}>
        Practical utilities for developers and operators
      </div>
    </div>,
    size,
  );
}
