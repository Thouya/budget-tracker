// Design tokens lifted verbatim from the Claude Design prototype (Budget.dc.html)
export const color = {
  bg: "#F1E7DA",
  surface: "#FBF4EC",
  card: "#fff",
  ink: "#2A241E",
  inkSoft: "#6B6157",
  muted: "#8A7E70",
  mutedLight: "#9A8E80",
  faint: "#B7AB9C",
  line: "#F3ECE1",
  track: "#F1EADF",
  border: "#EADFCF",

  green: "#17B890",
  greenDark: "#12997a",
  greenDeep: "#12A79E",
  greenSoft: "#E5F7EF",

  orange: "#FF7A59",
  orangeDeep: "#B23A16",
  orangeText: "#8A5A42",
  orangeSoft: "#FFF2EC",
  orangeSoft2: "#FFF7F3",
  orangeRing: "#FFD3C0",

  red: "#F4514E",
  redSoft: "#FDE7E7",

  purple: "#9B6BEF",
  purpleDeep: "#6D5BEF",
  purpleSoft: "#F0E9FE",

  blue: "#5B8DEF",
  blueSoft: "#E9F0FE",

  teal: "#14B8C4",
  tealSoft: "#E2F7F9",
};

export const font = {
  display: "'Fredoka', system-ui, sans-serif",
  body: "'Figtree', system-ui, sans-serif",
};

export function fmt(n) {
  const v = Number(n) || 0;
  const neg = v < 0;
  const a = Math.abs(v).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  return (neg ? "−" : "") + a + " €";
}

export function fmtSigned(n) {
  const v = Number(n) || 0;
  const s = v < 0 ? "−" : "+";
  return s + Math.abs(v).toLocaleString("fr-FR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + " €";
}

export function fmt0(n) {
  return Math.round(Math.abs(Number(n) || 0)).toLocaleString("fr-FR") + " €";
}

export function fmtPct(n) {
  return Math.round(Number(n) || 0) + "%";
}
