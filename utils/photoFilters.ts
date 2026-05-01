import { ViewStyle } from "react-native";
import { PhotoFilterName } from "@/stores/postingStore";

const FILTER_PREVIEW_STYLES: Record<
  Exclude<PhotoFilterName, "none">,
  ViewStyle[]
> = {
  sepia: [
    { backgroundColor: "rgb(112, 66, 20)", opacity: 0.18 },
    { backgroundColor: "rgb(214, 180, 120)", opacity: 0.08 },
  ],
  grayscale: [
    { backgroundColor: "rgb(108, 108, 108)", opacity: 0.22 },
    { backgroundColor: "rgb(230, 230, 230)", opacity: 0.06 },
  ],
  cool: [
    { backgroundColor: "rgb(0, 128, 255)", opacity: 0.14 },
    { backgroundColor: "rgb(160, 220, 255)", opacity: 0.06 },
  ],
  warm: [
    { backgroundColor: "rgb(255, 120, 24)", opacity: 0.14 },
    { backgroundColor: "rgb(255, 214, 160)", opacity: 0.07 },
  ],
  vintage: [
    { backgroundColor: "rgb(118, 84, 52)", opacity: 0.16 },
    { backgroundColor: "rgb(220, 190, 140)", opacity: 0.07 },
  ],
  teal: [
    { backgroundColor: "rgb(0, 128, 128)", opacity: 0.18 },
    { backgroundColor: "rgb(166, 226, 216)", opacity: 0.05 },
  ],
  pink: [
    { backgroundColor: "rgb(255, 0, 128)", opacity: 0.1 },
    { backgroundColor: "rgb(255, 210, 235)", opacity: 0.05 },
  ],
  purple: [
    { backgroundColor: "rgb(128, 0, 255)", opacity: 0.12 },
    { backgroundColor: "rgb(214, 182, 255)", opacity: 0.05 },
  ],
  orange: [
    { backgroundColor: "rgb(255, 128, 0)", opacity: 0.13 },
    { backgroundColor: "rgb(255, 215, 166)", opacity: 0.06 },
  ],
};

export function getPhotoFilterPreviewLayers(filterName?: PhotoFilterName) {
  if (!filterName || filterName === "none") {
    return [];
  }

  return FILTER_PREVIEW_STYLES[filterName] || [];
}
