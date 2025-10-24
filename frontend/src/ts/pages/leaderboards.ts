import Page from "./page";
import { loadLocalLeaderboard } from "../event-handlers/leaderboards";

export const page = new Page({
  id: "leaderboards",
  element: $(".page.pageLeaderboards"),
  path: "/leaderboards",
  beforeShow: async (): Promise<void> => {
    void loadLocalLeaderboard(0);
  },
  afterShow: async (): Promise<void> => {
    void loadLocalLeaderboard(0);
  },
});
