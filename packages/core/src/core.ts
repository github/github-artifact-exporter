import { Octokit } from "@octokit/rest";
import {
  Issue,
  IssueComment,
  ListIssueCommentsQuery,
  SearchIssuesQuery,
} from "./github";
import { loadQuery } from "./utils";

export * from "./github";
export * from "./utils";

/**
 * searchIssues
 *
 * @param github
 * @param searchQuery
 */
export async function* searchIssues(github: Octokit, searchQuery: string) {
  let endCursor: string | null | undefined = null;
  let hasNextPage = false;

  const query = loadQuery("searchIssues");

  do {
    const results: SearchIssuesQuery = await github.graphql(query, {
      searchQuery,
      after: endCursor,
    });

    endCursor = results.search.pageInfo.endCursor;
    hasNextPage = results.search.pageInfo.hasNextPage;

    yield results;
  } while (hasNextPage);
}

export async function getIssues(
  github: Octokit,
  searchQuery: string,
  progressCallback: Function
): Promise<Issue[]> {
  const issues = [];
  const issueIterator = searchIssues(github, searchQuery);

  for await (const result of issueIterator) {
    progressCallback(result);

    issues.push(...(result.search.nodes as Issue[]));
  }
  return issues;
}

export async function getComments(
  github: Octokit,
  issues: Issue[],
  progressCallback: Function
) {
  const fetchComments = async (issue: Issue): Promise<void> => {
    const commentIterator = listComments(github, issue.id);

    for await (const result of commentIterator) {
      let nodes: IssueComment[];
      if (issue.comments.nodes) {
        nodes = issue.comments.nodes as IssueComment[];
      } else {
        // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
        // @ts-ignore
        nodes = issue.comments as IssueComment[];
      }
      nodes.push(...((result.node as Issue).comments.nodes as IssueComment[]));
      progressCallback(result);
    }
  };

  const promises = issues.map((issue: Issue) => fetchComments(issue));

  await Promise.all(promises);
}

/**
 * listComments
 *
 * @param github
 * @param issueId
 */
export async function* listComments(github: Octokit, issueId: string) {
  let endCursor: string | null | undefined = null;
  let hasNextPage = false;

  const query = loadQuery("listIssueComments");

  do {
    const results: ListIssueCommentsQuery = await github.graphql(query, {
      id: issueId,
      after: endCursor,
    });

    endCursor = (results.node as Issue).comments.pageInfo.endCursor;
    hasNextPage = (results.node as Issue).comments.pageInfo.hasNextPage;

    yield results;
  } while (hasNextPage);
}
