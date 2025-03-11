import {
  FlexDirection,
  Justify,
  Align,
  Wrap,
  Overflow,
  PositionType,
} from "yoga-layout";
type Percent = `${number}%`;

export type BasicAttrs = {
  fill?: number | string;
  width?: number | "auto" | Percent;
  maxWidth?: number | "auto" | Percent;
  height?: number | "auto" | Percent;
  maxHeight?: number | "auto" | Percent;
  top?: number | "auto" | Percent;
  left?: number | "auto" | Percent;
  right?: number | "auto" | Percent;
  bottom?: number | "auto" | Percent;
  position?: PositionType;
  display?: "flex" | "none";
  flexDirection?: FlexDirection;
  justify?: Justify;
  align?: Align;
  gap?: number | Percent;
  gapRow?: number | Percent;
  gapCol?: number | Percent;
  padding?: number | Percent;
  paddingX?: number | Percent;
  margin?: number | Percent;
  grow?: number;
  wrap?: Wrap;
  overflow?: Overflow;
  text?: string;
  color?: string;
  fontSize?: number;
  fontFamily?: string;
  roundness?: number;
  image?: HTMLImageElement | string;
  border?: number;
  borderColor?: string;
  onClick?: (event: MouseEvent) => any;
  onPointerMove?: (event: PointerEvent) => any;
  onPointerEnter?: (event: PointerEvent) => any;
  onPointerLeave?: (event: PointerEvent) => any;
  onPointerDown?: (event: PointerEvent) => any;
  onPointerUp?: (event: PointerEvent) => any;
};
