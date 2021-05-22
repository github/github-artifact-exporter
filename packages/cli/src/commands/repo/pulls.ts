/* globals process */

import { flags as flagTypes } from "@oclif/command";
import * as dot from "dot-object";
import createDebugger from "debug";
import * as ProgressBar from "progress";
import * as jsonexport from "jsonexport";
import BaseCommand from "../../base";
import {
  CommentsList,
  RepositoryPullRequests,
  PullRequest,
} from "../../github";

const debug = createDebugger("exporter:repo:pulls");

const LIST_PULLS_QUERY = `query listPulls($owner: String!, $repo: String!, $per_page: Int = 10, $after: String) {
  repository(owner: $owner, name: $repo) {
    pullRequests(first: $per_page, after: $after) {
      nodes {
        reviewDecision
        merged
        mergedAt
        mergedBy {
          login
        }
        assignees(first: 10) {
          nodes {
            login
          }
        }
        author {
          login
        }
        comments(first: 10) {
          nodes {
            author {
              login
            }
            body
            createdAt
          }
          pageInfo {
            endCursor
            hasNextPage
          }
          totalCount
        }
        createdAt
        id
        labels(first: 100) {
          nodes {
            name
          }
        }
        state
        title
        updatedAt
        milestone {
          title
          state
          url
        }
        closedAt
      }
      pageInfo {
        endCursor
        hasNextPage
      }
      totalCount
    }
  }
}
`;

const LIST_COMMENTS_QUERY = `query listComments($id: ID!, $per_page: Int = 100, $after: String) {
  node(id: $id) {
    ... on PullRequest {
      comments(first: $per_page, after: $after) {
        nodes {
          author {
            login
          }
          body
          createdAt
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
`;

export default class RepoPulls extends BaseCommand {
  static description = "Export GitHub Pull Requests for a repository";

  static flags = {
    ...BaseCommand.flags,
    owner: flagTypes.string({
      dependsOn: ["repo"],
      description: "GitHub repository owner",
      required: true,
    }),

    repo: flagTypes.string({
      dependsOn: ["owner"],
      description: "GitHub repository name",
      required: true,
    }),
  };

  async fetchPulls(query: string, owner: string, repo: string) {
    const pulls = [];

    let results: RepositoryPullRequests;
    let cursor;
    let progress;

    // paginate through the GraphQL Search query until we get everything
    debug("Pulling pull requests from API");
    do {
      results = await this.github.graphql(query, {
        owner,
        repo,
        after: cursor,
      });
      cursor = results.repository.pullRequests.pageInfo.endCursor;

      if (!progress) {
        if (results.repository.pullRequests.totalCount === 0) {
          this.warn("No pull requests found");
          process.exit(1);
        }

        progress = new ProgressBar(
          "fetching pulls [:bar] :current/:total :percent",
          {
            complete: "=",
            incomplete: " ",
            width: 20,
            total: results.repository.pullRequests.totalCount,
          }
        );
      }

      progress.tick(results.repository.pullRequests.nodes.length);

      pulls.push(...results.repository.pullRequests.nodes);
    } while (results.repository.pullRequests.pageInfo.hasNextPage);

    return pulls;
  }

  async fetchComments(
    query: string,
    pull: PullRequest,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    progress: any
  ): Promise<void> {
    let results: CommentsList = {
      node: {
        comments: pull.comments,
      },
    };

    while (results.node.comments.pageInfo.hasNextPage) {
      results = await this.github.graphql(query, {
        id: pull.id,
        after: results.node.comments.pageInfo.endCursor,
      });
      pull.comments.nodes.push(...results.node.comments.nodes);
      progress.tick(results.node.comments.nodes.length);
    }
  }

  async run() {
    const { flags } = this.parse(RepoPulls);
    const { owner, repo, format } = flags;

    const pulls = await this.fetchPulls(LIST_PULLS_QUERY, owner, repo);

    const pullsWithComments = pulls.filter(
      (issue) => issue.comments.totalCount - issue.comments.nodes.length > 0
    );

    if (pullsWithComments.length > 0) {
      const remainingComments = pullsWithComments
        .map((issue) => {
          return issue.comments.totalCount - issue.comments.nodes.length;
        })
        .reduce((x, y) => x + y);

      const progress = new ProgressBar(
        "fetching comments [:bar] :current/:total :percent",
        {
          complete: "=",
          incomplete: " ",
          width: 20,
          total: remainingComments,
        }
      );

      const promises = pullsWithComments.map((issue) =>
        this.fetchComments(LIST_COMMENTS_QUERY, issue, progress)
      );

      await Promise.all(promises);
    }

    // massage the data to remove GraphQL pagination data
    for (const pull of pulls) {
      dot.del("id", pull);
      dot.move("assignees.nodes", "assignees", pull);
      dot.move("comments.nodes", "comments", pull);
      dot.move("labels.nodes", "labels", pull);

      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      pull.labels = pull.labels.map(({ name }) => name).join(", ");
    }

    if (format === "JSONL") {
      for (const pull of pulls) {
        process.stdout.write(`${JSON.stringify(pull)}\n`);
      }
    } else if (format === "JSON") {
      process.stdout.write(JSON.stringify(pulls));
    } else if (format === "CSV") {
      const csv = await jsonexport(pulls, { fillGaps: true });
      process.stdout.write(csv);
    }
  }
}
