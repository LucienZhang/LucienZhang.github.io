import { axiosCorsProxy } from "./axios-instances";

const TIOBE_INDEX_URL = "https://www.tiobe.com/tiobe-index/";
const LEETCODE_PROFILE_URL = "https://leetcode.com/lucienzhang/";
const LEETCODE_GLOBAL_GRAPHQL_URL = "https://leetcode.com/graphql";
const LEETCODE_CN_GRAPHQL_URL = "https://leetcode.cn/graphql";

const GLOBAL_RANKING_QUERY = `
query getContentRankingData($username: String!) {
  userContestRanking(username: $username) {
    attendedContestsCount
    rating
    globalRanking
    __typename
  }
  userContestRankingHistory(username: $username) {
    contest {
      title
      startTime
      __typename
    }
    rating
    ranking
    __typename
  }
}
`;

const CN_RANKING_QUERY = `
query userContest($userSlug: String!) {
  userContestRanking(userSlug: $userSlug) {
    currentRatingRanking
    __typename
  }
}
`;

export function requestTiobeIndex(signal) {
  return proxyRequest(
    {
      url: TIOBE_INDEX_URL,
      method: "GET",
    },
    signal,
  );
}

export function requestLeetCodeProfile(signal) {
  return proxyRequest(
    {
      url: LEETCODE_PROFILE_URL,
      method: "GET",
    },
    signal,
  );
}

export function requestLeetCodeGlobalRanking(cookies, signal) {
  return proxyRequest(
    {
      url: LEETCODE_GLOBAL_GRAPHQL_URL,
      method: "POST",
      headers: {
        referer: LEETCODE_PROFILE_URL,
        "content-type": "application/json",
      },
      cookies: boundedCookies(cookies),
      data: JSON.stringify({
        operationName: "getContentRankingData",
        variables: { username: "lucienzhang" },
        query: GLOBAL_RANKING_QUERY,
      }),
    },
    signal,
  );
}

export function requestLeetCodeCnRanking(signal) {
  return proxyRequest(
    {
      url: LEETCODE_CN_GRAPHQL_URL,
      method: "POST",
      headers: {
        "content-type": "application/json",
      },
      data: JSON.stringify({
        operationName: "userContest",
        variables: { userSlug: "lucien_z" },
        query: CN_RANKING_QUERY,
      }),
    },
    signal,
  );
}

function proxyRequest(request, signal) {
  return axiosCorsProxy.post("", request, { signal });
}

function boundedCookies(cookies) {
  if (cookies == null) return undefined;
  const serialized = JSON.stringify(cookies);
  if (serialized.length > 32_000) {
    throw new Error("LeetCode returned an unexpectedly large cookie payload.");
  }
  return JSON.parse(serialized);
}
