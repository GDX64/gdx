import { FlexDirection, Justify, Align, Wrap } from "yoga-layout";
type Percent = `${number}%`;

export type BasicAttrs = {
  fill?: number | string;
  width?: number | "auto" | Percent;
  maxWidth?: number | "auto" | Percent;
  height?: number | "auto" | Percent;
  maxHeight?: number | "auto" | Percent;
  display?: "flex" | "none";
  flexDirection?: FlexDirection;
  justify?: Justify;
  align?: Align;
  gap?: number | Percent;
  padding?: number | Percent;
  margin?: number | Percent;
  grow?: number;
  wrap?: Wrap;
};
