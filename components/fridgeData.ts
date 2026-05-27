export const fridgeItemOrder = [
  "school",
  "travel",
  "music",
  "ride",
  "socials",
  "hands",
  "tech",
] as const;

export type FridgeItemId = (typeof fridgeItemOrder)[number];

export type FridgeItem = {
  id: FridgeItemId;
};
