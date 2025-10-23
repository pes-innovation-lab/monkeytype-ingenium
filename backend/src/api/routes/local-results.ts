import { localResultsContract } from "@monkeytype/contracts/local-results";
import { initServer } from "@ts-rest/express";
import * as LocalResultsController from "../controllers/local-results";
import { callController } from "../ts-rest-adapter";

const s = initServer();
export default s.router(localResultsContract, {
  add: {
    handler: async (r) =>
      callController(LocalResultsController.addLocalResult)(r),
  },
  getLeaderboard: {
    handler: async (r) =>
      callController(LocalResultsController.getLocalLeaderboard)(r),
  },
  getUsernames: {
    handler: async (r) =>
      callController(LocalResultsController.getLocalUsernames)(r),
  },
});
