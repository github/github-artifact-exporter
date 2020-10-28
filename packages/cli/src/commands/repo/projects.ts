/* globals process */

import { flags as flagTypes } from "@oclif/command";
import createDebugger from "debug";
import * as ProgressBar from "progress";
import * as jsonexport from "jsonexport";
import * as dot from "dot-object";
import BaseCommand from "../../base";
import { RepositoryProject } from "../../github";

const debug = createDebugger("exporter:repo:milestones");

const LIST_PROJECTS_QUERY = `query listMilestones($owner: String!, $repo: String!, $project: Int!, $per_page: Int = 100, $columnCursor: String, $cardCursor: String) {
  repository(owner: $owner, name: $repo) {
    project(number: $project) {
      columns(first: $per_page, after: $columnCursor) {
        nodes {
          name
          cards(first: $per_page, after: $cardCursor) {
            nodes {
              note
              content {
                ... on Issue {
                  id
                  number
                  title
                }
              }
            }
            pageInfo {
              hasNextPage
              endCursor
            }
            totalCount
          }
        }
        pageInfo {
          hasNextPage
          endCursor
        }
        totalCount
      }
    }
  }
}
`;

export default class RepoProjects extends BaseCommand {
  static description = "Export GitHub Milestones for a repository";

  static flags = {
    ...BaseCommand.flags,
    projectNumber: flagTypes.integer({
      description: "Project number from where to pull cards",
    }),
  };

  async run() {
    const projects = [];

    const { flags } = this.parse(RepoProjects);
    const { owner, repo, format } = flags;

    let results: RepositoryProject;
    let currentCursor;
    let columnCursor;
    let cardCursor;
    let progress;

    // paginate through the GraphQL query until we get everything
    debug("Pulling projects from API");
    do {
      results = await this.github.graphql(LIST_PROJECTS_QUERY, {
        owner,
        repo,
        project: flags.projectNumber,
        columnCursor,
        cardCursor,
      });
      currentCursor = columnCursor;
      columnCursor = results.repository.project.columns.pageInfo.endCursor;

      if (!progress) {
        if (results.repository.project.columns.totalCount === 0) {
          this.warn("No projects found");
          process.exit(1);
        }

        progress = new ProgressBar(
          "fetching projects [:bar] :current/:total :percent",
          {
            complete: "=",
            incomplete: " ",
            width: 20,
            total: results.repository.project.columns.totalCount,
          }
        );
      }

      progress.tick(results.repository.project.columns.nodes.length);
      projects.push(...results.repository.project.columns.nodes);

      // Loop through cards
      for (const column of results.repository.project.columns.nodes) {
        cardCursor = column.cards.pageInfo.endCursor;
        let hasNextPage = column.cards.pageInfo.hasNextPage;
        while (hasNextPage) {
          results = await this.github.graphql(LIST_PROJECTS_QUERY, {
            owner,
            repo,
            project: flags.projectNumber,
            columnCursor: currentCursor,
            cardCursor,
          });

          projects
            .filter((col) => {
              return col.name === column.name;
            })[0]
            .cards.nodes.push(
              ...results.repository.project.columns.nodes.filter((col) => {
                return col.name === column.name;
              })[0].cards.nodes
            );
          cardCursor = results.repository.project.columns.nodes.filter(
            (col) => {
              return col.name === column.name;
            }
          )[0].cards.pageInfo.endCursor;
          hasNextPage = results.repository.project.columns.nodes.filter(
            (col) => {
              return col.name === column.name;
            }
          )[0].cards.pageInfo.hasNextPage;
        }
      }
    } while (results.repository.project.columns.pageInfo.hasNextPage);

    // Fix formatting
    // massage the data to remove GraphQL pagination data
    for (const column of projects) {
      //dot.move("name", "column_name", column);
      dot.del("cards.pageInfo", column);
      dot.del("cards.totalCount", column);
      for (const card of column.cards.nodes) {
        dot.del("content.id", card);
        dot.del("content.number", card);
      }
    }

    if (format === "JSON") {
      for (const release of projects) {
        process.stdout.write(`${JSON.stringify(release)}\n`);
      }
    } else if (format === "CSV") {
      const csv = await jsonexport(projects, { fillGaps: true });
      process.stdout.write(csv);
    }
  }
}
