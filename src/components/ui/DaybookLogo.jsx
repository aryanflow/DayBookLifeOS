import { useTheme } from "../../theme/ThemeContext";
import { fontHead } from "../../theme/colors";
import { BRAND_TILE, MARK } from "../../constants/brand";

/**
 * Pure Dot - the amber period from "Daybook." as the mark.
 * Tile: always ink. Dot: money accent. Dot optically nudged down 4%.
 */
export function DaybookMark({ size = 20, className = "", variant = "tile" }) {
  const { T } = useTheme();
  const tile = variant === "light" ? T.paper : BRAND_TILE;
  const dot = T.money;
  const s = MARK.size;

  return (
    <svg
      width={size}
      height={size}
      viewBox={`0 0 ${s} ${s}`}
      className={className}
      aria-hidden="true"
      style={{ flexShrink: 0, display: "block" }}
    >
      <rect width={s} height={s} rx={MARK.rx} fill={tile} />
      {variant === "light" && (
        <rect
          width={s}
          height={s}
          rx={MARK.rx}
          fill="none"
          stroke={T.line}
          strokeWidth="1"
        />
      )}
      <circle cx={MARK.dot.cx} cy={MARK.dot.cy} r={MARK.dot.r} fill={dot} />
    </svg>
  );
}

/** Wordmark + mark. Use mark-only (showText=false) where space is tight. */
export function DaybookLogo({
  size = 20,
  textSize = 20,
  showText = true,
  showMark = true,
  markVariant = "tile",
  className = "",
}) {
  const { T } = useTheme();
  return (
    <div className={`daybook-logo ${className}`.trim()} style={{ display: "flex", alignItems: "center", gap: 7, minWidth: 0 }}>
      {showMark && <DaybookMark size={size} variant={markVariant} />}
      {showText && (
        <span style={{ ...fontHead, fontSize: textSize, fontWeight: 700, letterSpacing: "-0.025em", color: T.ink, whiteSpace: "nowrap" }}>
          Daybook<span style={{ color: T.money }}>.</span>
        </span>
      )}
    </div>
  );
}
