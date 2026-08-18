import { ImageResponse } from "next/og";

export const size = {
  width: 32,
  height: 32,
};
export const contentType = "image/png";

export default function Icon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#FFB22C",
          borderRadius: "8px",
          color: "#000000",
          fontSize: "18px",
          fontWeight: 900,
          fontFamily: "sans-serif",
          letterSpacing: "-0.5px",
        }}
      >
        EP
      </div>
    ),
    {
      ...size,
    }
  );
}
