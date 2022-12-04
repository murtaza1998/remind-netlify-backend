export const isPositive: (x: "0" | "1" | "true" | "false") => boolean = (x) =>
  x === "1" || x === "true";
