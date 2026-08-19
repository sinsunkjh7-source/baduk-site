export type View =
  | { screen: "home" }
  | { screen: "unit"; unitId: string }
  | { screen: "level"; unitId: string; levelId: string }
  | { screen: "lecture" };
