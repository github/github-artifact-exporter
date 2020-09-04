/* globals process */

import { flags as flagTypes } from "@oclif/command";
import createDebugger from "debug";
import * as dot from "dot-object";
import * as ProgressBar from "progress";
import * as jsonexport from "jsonexport";
import BaseCommand from "../../base";
import { RepositoryCommits } from "../../github";

const debug = createDebugger("exporter:repo:commits");

const LIST_COMMITS_QUERY = `query listCommits($owner: String!, $repo: String!, $branch: String!, $per_page: Int = 50, $after: String, $since: GitTimestamp, $until: GitTimestamp) {
  repository(owner: $owner, name: $repo) {
    ref(qualifiedName: $branch) {
      name
      target {
        ... on Commit {
          history(first: $per_page, after: $after, since: $since, until: $until) {
            nodes {
              author {
                name
                email
              }
              additions
              associatedPullRequests(first: 10) {
                nodes {
                  title
                  url
                }
              }
              messageHeadline
            }
            pageInfo {
              endCursor
              hasNextPage
            }
            totalCount
          }
        }
      }
    }
  }
}
`;

export default class RepoCommits extends BaseCommand {
  static description = "Export GitHub Commits for a repository";

  static flags = {
    ...BaseCommand.flags,
    branch: flagTypes.string({
      default: "master",
      description: "git branch to export commits for",
    }),
    since: flagTypes.string({
      description: "search commits created after yyyy-mm-dd",
    }),
    until: flagTypes.string({
      description: "search commits created before yyyy-mm-dd",
    }),
  };

  async run() {
    const commits = [];

    const { flags } = this.parse(RepoCommits);
    const { branch, owner, repo, format, since, until } = flags;

    if (!since || !until) {
      this.warn(
        "Exporting commits can be slow. Please consider narrowing your time range with `since` and `until`"
      );
    }

    let start;
    let end;

    if (since) {
      start = this.parseDateFlag("since", since);
    }

    if (until) {
      end = this.parseDateFlag("end", until);
    }

    let results: RepositoryCommits;
    let cursor;
    let progress;

    // paginate through the GraphQL query until we get everything
    do {
      results = await this.github.graphql(LIST_COMMITS_QUERY, {
        branch,
        owner,
        repo,
        after: cursor,
        since: start,
        until: end,
      });
      cursor = results.repository.ref.target.history.pageInfo.endCursor;

      if (!progress) {
        if (results.repository.ref.target.history.totalCount === 0) {
          this.warn("No commits found");
          process.exit(1);
        }

        progress = new ProgressBar(
          "fetching commits [:bar] :current/:total :percent",
          {
            complete: "=",
            incomplete: " ",
            width: 20,
            total: results.repository.ref.target.history.totalCount,
          }
        );
      }

      progress.tick(results.repository.ref.target.history.nodes.length);

      for (const commit of results.repository.ref.target.history.nodes) {
        dot.move(
          "associatedPullRequests.nodes",
          "associatedPullRequests",
          commit
        );
      }
      commits.push(...results.repository.ref.target.history.nodes);
    } while (results.repository.ref.target.history.pageInfo.hasNextPage);

    if (format === "JSON") {
      for (const release of commits) {
        process.stdout.write(`${JSON.stringify(release)}\n`);
      }
    } else if (format === "CSV") {
      const csv = await jsonexport(commits, { fillGaps: true });
      process.stdout.write(csv);
    }
  }
}
