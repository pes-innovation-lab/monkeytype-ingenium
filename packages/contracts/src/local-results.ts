import { z } from "zod";
import {
  CommonResponses,
  meta,
  MonkeyClientError,
  responseWithData,
} from "./util/api";
import { initContract } from "@ts-rest/core";
import { CompletedEventSchema } from "@monkeytype/schemas/results";

const LocalResultSchema = CompletedEventSchema;

export type LocalResult = z.infer<typeof LocalResultSchema>;

const LocalLeaderboardEntrySchema = z.object({
  rank: z.number().int().positive(),
  username: z.string().max(20),
  wpm: z.number().nonnegative(),
  accuracy: z.number().nonnegative(),
  raw: z.number().nonnegative(),
  consistency: z.number().nonnegative(),
  timestamp: z.date(),
});

export type LocalLeaderboardEntry = z.infer<typeof LocalLeaderboardEntrySchema>;

const AddLocalResultRequestSchema = z.object({
  result: LocalResultSchema,
});

export type AddLocalResultRequest = z.infer<typeof AddLocalResultRequestSchema>;

const AddLocalResultResponseSchema = responseWithData(
  z.object({
    success: z.boolean(),
  })
);

export type AddLocalResultResponse = z.infer<
  typeof AddLocalResultResponseSchema
>;

const GetLocalLeaderboardQuerySchema = z.object({
  limit: z.number().int().positive().max(100).default(50),
});

export type GetLocalLeaderboardQuery = z.infer<
  typeof GetLocalLeaderboardQuerySchema
>;

const GetLocalLeaderboardResponseSchema = responseWithData(
  z.object({
    entries: z.array(LocalLeaderboardEntrySchema),
  })
);

export type GetLocalLeaderboardResponse = z.infer<
  typeof GetLocalLeaderboardResponseSchema
>;

const GetLocalUsernamesResponseSchema = responseWithData(
  z.object({
    usernames: z.array(z.string().max(20)),
  })
);

export type GetLocalUsernamesResponse = z.infer<
  typeof GetLocalUsernamesResponseSchema
>;

const c = initContract();
export const localResultsContract = c.router(
  {
    add: {
      summary: "add local result",
      description: "Add a local typing result with username.",
      method: "POST",
      path: "/add",
      body: AddLocalResultRequestSchema,
      responses: {
        200: AddLocalResultResponseSchema,
        400: MonkeyClientError,
      },
      metadata: meta({
        authenticationOptions: { isPublic: true },
      }),
    },
    getLeaderboard: {
      summary: "get local leaderboard",
      description: "Get local leaderboard results.",
      method: "GET",
      path: "/leaderboard",
      query: GetLocalLeaderboardQuerySchema.strict(),
      responses: {
        200: GetLocalLeaderboardResponseSchema,
        404: MonkeyClientError,
      },
      metadata: meta({
        authenticationOptions: { isPublic: true },
      }),
    },
    getUsernames: {
      summary: "get local usernames",
      description: "Get all usernames that have submitted local results.",
      method: "GET",
      path: "/usernames",
      responses: {
        200: GetLocalUsernamesResponseSchema,
        404: MonkeyClientError,
      },
      metadata: meta({
        authenticationOptions: { isPublic: true },
      }),
    },
  },
  {
    pathPrefix: "/local-results",
    strictStatusCodes: true,
    metadata: meta({
      openApiTags: ["local-results"],
      rateLimit: "resultsAdd",
    }),
    commonResponses: CommonResponses,
  }
);
