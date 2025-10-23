import { MonkeyResponse } from "../../utils/monkey-response";
import * as LocalResultsDAL from "../../dal/local-results";
import { buildDbResult } from "../../utils/result";
import { MonkeyRequest } from "../types";
import {
  AddLocalResultRequest,
  GetLocalLeaderboardQuery,
} from "@monkeytype/contracts/local-results";

export async function addLocalResult(
  req: MonkeyRequest<undefined, AddLocalResultRequest>
): Promise<MonkeyResponse<{ success: boolean }>> {
  const { result } = req.body;

  if (
    result.username === null ||
    result.username === undefined ||
    result.username.trim() === ""
  ) {
    throw new Error("Username is required for local results");
  }

  const username = result.username; // Now we know it's a string
  const dbResult = buildDbResult(result, username, false);
  const localResult = {
    ...dbResult,
    username,
  };

  await LocalResultsDAL.addLocalResult(localResult);

  return new MonkeyResponse("Local result saved", {
    success: true,
  });
}

export async function getLocalLeaderboard(
  req: MonkeyRequest<GetLocalLeaderboardQuery>
): Promise<MonkeyResponse<{ entries: unknown[] }>> {
  const { limit = 50 } = req.query;

  const results = await LocalResultsDAL.getLocalLeaderboard(limit);

  return new MonkeyResponse("Local leaderboard retrieved", {
    entries: results.map((r, index) => ({
      rank: index + 1,
      username: r.username,
      wpm: r.wpm,
      accuracy: r.acc,
      raw: r.rawWpm,
      consistency: r.consistency,
      timestamp: new Date(r.timestamp),
    })),
  });
}

export async function getLocalUsernames(): Promise<
  MonkeyResponse<{ usernames: string[] }>
> {
  const usernames = await LocalResultsDAL.getLocalUsernames();

  return new MonkeyResponse("Local usernames retrieved", {
    usernames,
  });
}
