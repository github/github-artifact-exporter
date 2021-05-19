import createDebugger from "debug";
import * as ProgressBar from "progress";
import * as jsonexport from "jsonexport";
import BaseCommand from "../../base";
import { RepositoryReleases } from "../../github";

const debug = createDebugger("exporter:repo:releases");

const LIST_RELEASES_QUERY = `query listReleases($owner: String!, $repo: String!, $per_page: Int = 100, $after: String) {
  repository(owner: $owner, name: $repo) {
    releases(first: $per_page, after: $after) {
      nodes {
        author {
          login
        }
        createdAt
        description
        id
        isDraft
        isPrerelease
        name
        publishedAt
        shortDescriptionHTML
        tagName
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

export default class RepoReleases extends BaseCommand {
  static description = "Export GitHub Releases for a repository";

  static flags = {
    ...BaseCommand.flags,
  };

  async run() {
    const releases = [];

    const { flags } = this.parse(RepoReleases);
    const { owner, repo, format } = flags;

    let results: RepositoryReleases;
    let cursor;
    let progress;

    // paginate through the GraphQL query until we get everything
    debug("Pulling releases from API");
    do {
      results = await this.github.graphql(LIST_RELEASES_QUERY, {
        owner,
        repo,
        after: cursor,
      });
      cursor = results.repository.releases.pageInfo.endCursor;

      if (!progress) {
        if (results.repository.releases.totalCount === 0) {
          this.warn("No releases found");
          process.exit(1);
        }

        progress = new ProgressBar(
          "fetching releases [:bar] :current/:total :percent",
          {
            complete: "=",
            incomplete: " ",
            width: 20,
            total: results.repository.releases.totalCount,
          }
        );
      }

      progress.tick(results.repository.releases.nodes.length);
      releases.push(...results.repository.releases.nodes);
    } while (results.repository.releases.pageInfo.hasNextPage);

    if (format === "JSON") {
      for (const release of releases) {
        process.stdout.write(`${JSON.stringify(release)}\n`);
      }
    } else if (format === "CSV") {
      const csv = await jsonexport(releases, { fillGaps: true });
      process.stdout.write(csv);
    }
  }
}
