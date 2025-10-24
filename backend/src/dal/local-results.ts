import * as db from "../init/db";
import { Collection } from "mongodb";
import { DBResult } from "../utils/result";

export type DBLocalResult = DBResult & {
  username: string;
};

export const getLocalResultsCollection = (): Collection<DBLocalResult> =>
  db.collection<DBLocalResult>("localResults");

export async function addLocalResult(result: DBLocalResult): Promise<void> {
  // Check if user already has any result
  const existingUserResults = await getLocalResultsCollection()
    .find({ username: result.username })
    .sort({ wpm: -1 })
    .limit(1)
    .toArray();

  if (existingUserResults.length > 0) {
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    const bestResult = existingUserResults[0]!;
    // Only update if new WPM is higher than the user's current best
    if (result.wpm > bestResult.wpm) {
      const { _id, ...updateData } = result;
      await getLocalResultsCollection().updateOne(
        { _id: bestResult._id },
        { $set: updateData }
      );
    }
    // If WPM is not higher, don't update
  } else {
    // No existing result for user, insert new one
    await getLocalResultsCollection().insertOne(result);
  }
}

export async function getLocalResults(
  username?: string,
  mode?: string,
  mode2?: string,
  limit: number = 50,
  skip: number = 0
): Promise<DBLocalResult[]> {
  const query: Partial<Pick<DBLocalResult, "username" | "mode" | "mode2">> = {};
  if (username !== undefined && username !== null && username.trim() !== "")
    query.username = username;
  if (mode !== undefined && mode !== null && mode.trim() !== "")
    query.mode = mode as DBLocalResult["mode"];
  if (mode2 !== undefined && mode2 !== null && mode2.trim() !== "")
    query.mode2 = mode2;

  return await getLocalResultsCollection()
    .find(query)
    .sort({ wpm: -1, timestamp: -1 })
    .limit(limit)
    .skip(skip)
    .toArray();
}

export async function getLocalLeaderboard(
  limit: number = 50,
  skip: number = 0
): Promise<DBLocalResult[]> {
  return await getLocalResultsCollection()
    .find({})
    .sort({ wpm: -1, timestamp: -1 })
    .skip(skip)
    .limit(limit)
    .toArray();
}

export async function getLocalUsernames(): Promise<string[]> {
  const results = await getLocalResultsCollection()
    .aggregate<{ _id: string }>([
      {
        $group: {
          _id: "$username",
        },
      },
      {
        $sort: { _id: 1 },
      },
    ])
    .toArray();

  return results.map((r) => r["_id"]);
}

export async function deleteLocalResults(username?: string): Promise<void> {
  const query: Partial<Pick<DBLocalResult, "username">> = {};
  if (username !== undefined && username !== null && username.trim() !== "")
    query.username = username;

  await getLocalResultsCollection().deleteMany(query);
}
