/* globals process */

import createDebugger from "debug";
import * as ProgressBar from "progress";
import * as jsonexport from "jsonexport";
import BaseCommand from "../../base";
import { RepositoryMilestones } from "../../github";

const debug = createDebugger("exporter:repo:milestones");

const LIST_RELEASES_QUERY = `query listMilestones($owner: String!, $repo: String!, $per_page: Int = 100, $after: String) {
  repository(owner: $owner, name: $repo) {
    milestones(first: $per_page, after: $after) {
      nodes {
        closed
        closedAt
        createdAt
        creator {
          login
        }
        description
        dueOn
        id
        number
        state
        title
        updatedAt
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

export default class RepoMilestones extends BaseCommand {
  static description = "Export GitHub Milestones for a repository";

  static flags = {
    ...BaseCommand.flags,
  };

  async run() {
    const milestones = [];

    const { flags } = this.parse(RepoMilestones);
    const { owner, repo, format } = flags;

    let results: RepositoryMilestones;
    let cursor;
    let progress;

    // paginate through the GraphQL query until we get everything
    debug("Pulling milestones from API");
    do {
      results = await this.github.graphql(LIST_RELEASES_QUERY, {
        owner,
        repo,
        after: cursor,
      });
      cursor = results.repository.milestones.pageInfo.endCursor;

      if (!progress) {
        if (results.repository.milestones.totalCount === 0) {
          this.warn("No milestones found");
          process.exit(1);
        }

        progress = new ProgressBar(
          "fetching milestones [:bar] :current/:total :percent",
          {
            complete: "=",
            incomplete: " ",
            width: 20,
            total: results.repository.milestones.totalCount,
          }
        );
      }

      progress.tick(results.repository.milestones.nodes.length);
      milestones.push(...results.repository.milestones.nodes);
    } while (results.repository.milestones.pageInfo.hasNextPage);

    if (format === "JSONL") {
      for (const release of milestones) {
        process.stdout.write(`${JSON.stringify(release)}\n`);
      }
    } else if (format === "JSON") {
      process.stdout.write(JSON.stringify(milestones));
    } else if (format === "CSV") {
      const csv = await jsonexport(milestones, { fillGaps: true });
      process.stdout.write(csv);
    }
  }
}
