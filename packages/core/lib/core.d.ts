import { Octokit } from "@octokit/rest";
import { Issue, ListIssueCommentsQuery, SearchIssuesQuery } from "./github";
export * from "./github";
export * from "./utils";
/**
 * searchIssues
 *
 * @param github
 * @param searchQuery
 */
export declare function searchIssues(github: Octokit, searchQuery: string): AsyncGenerator<SearchIssuesQuery, void, unknown>;
export declare function getIssues(github: Octokit, searchQuery: string, progressCallback: Function): Promise<Issue[]>;
export declare function getComments(github: Octokit, issues: Issue[], progressCallback: Function): Promise<void>;
/**
 * listComments
 *
 * @param github
 * @param issueId
 */
export declare function listComments(github: Octokit, issueId: string): AsyncGenerator<ListIssueCommentsQuery, void, unknown>;
//# sourceMappingURL=core.d.ts.map