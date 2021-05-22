"use strict";
/* globals process */
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const debug_1 = require("debug");
const ProgressBar = require("progress");
const jsonexport = require("jsonexport");
const dot = require("dot-object");
const base_1 = require("../../base");
const debug = debug_1.default("exporter:repo:milestones");
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
class RepoProjects extends base_1.default {
    async run() {
        const projects = [];
        const { flags } = this.parse(RepoProjects);
        const { owner, repo, format } = flags;
        let results;
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
                progress = new ProgressBar("fetching projects [:bar] :current/:total :percent", {
                    complete: "=",
                    incomplete: " ",
                    width: 20,
                    total: results.repository.project.columns.totalCount,
                });
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
                        .cards.nodes.push(...results.repository.project.columns.nodes.filter((col) => {
                        return col.name === column.name;
                    })[0].cards.nodes);
                    cardCursor = results.repository.project.columns.nodes.filter((col) => {
                        return col.name === column.name;
                    })[0].cards.pageInfo.endCursor;
                    hasNextPage = results.repository.project.columns.nodes.filter((col) => {
                        return col.name === column.name;
                    })[0].cards.pageInfo.hasNextPage;
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
        if (format === "JSONL") {
            for (const release of projects) {
                process.stdout.write(`${JSON.stringify(release)}\n`);
            }
        }
        else if (format === "JSON") {
            process.stdout.write(JSON.stringify(projects));
        }
        else if (format === "CSV") {
            const csv = await jsonexport(projects, { fillGaps: true });
            process.stdout.write(csv);
        }
    }
}
exports.default = RepoProjects;
RepoProjects.description = "Export GitHub Milestones for a repository";
RepoProjects.flags = Object.assign(Object.assign({}, base_1.default.flags), { projectNumber: command_1.flags.integer({
        description: "Project number from where to pull cards",
    }) });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29tbWFuZHMvcmVwby9wcm9qZWN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUJBQXFCOztBQUVyQiw0Q0FBb0Q7QUFDcEQsaUNBQW1DO0FBQ25DLHdDQUF3QztBQUN4Qyx5Q0FBeUM7QUFDekMsa0NBQWtDO0FBQ2xDLHFDQUFxQztBQUdyQyxNQUFNLEtBQUssR0FBRyxlQUFjLENBQUMsMEJBQTBCLENBQUMsQ0FBQztBQUV6RCxNQUFNLG1CQUFtQixHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FpQzNCLENBQUM7QUFFRixNQUFxQixZQUFhLFNBQVEsY0FBVztJQVVuRCxLQUFLLENBQUMsR0FBRztRQUNQLE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUVwQixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMzQyxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUM7UUFFdEMsSUFBSSxPQUEwQixDQUFDO1FBQy9CLElBQUksYUFBYSxDQUFDO1FBQ2xCLElBQUksWUFBWSxDQUFDO1FBQ2pCLElBQUksVUFBVSxDQUFDO1FBQ2YsSUFBSSxRQUFRLENBQUM7UUFFYiw2REFBNkQ7UUFDN0QsS0FBSyxDQUFDLDJCQUEyQixDQUFDLENBQUM7UUFDbkMsR0FBRztZQUNELE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLG1CQUFtQixFQUFFO2dCQUN2RCxLQUFLO2dCQUNMLElBQUk7Z0JBQ0osT0FBTyxFQUFFLEtBQUssQ0FBQyxhQUFhO2dCQUM1QixZQUFZO2dCQUNaLFVBQVU7YUFDWCxDQUFDLENBQUM7WUFDSCxhQUFhLEdBQUcsWUFBWSxDQUFDO1lBQzdCLFlBQVksR0FBRyxPQUFPLENB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LFdBQVcsRUFBRSx5Q0FBeUM7S0FDdkQsQ0FBQyxJQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFscyBwcm9jZXNzICovXG5cbmltcG9ydCB7IGZsYWdzIGFzIGZsYWdUeXBlcyB9IGZyb20gXCJAb2NsaWYvY29tbWFuZFwiO1xuaW1wb3J0IGNyZWF0ZURlYnVnZ2VyIGZyb20gXCJkZWJ1Z1wiO1xuaW1wb3J0ICogYXMgUHJvZ3Jlc3NCYXIgZnJvbSBcInByb2dyZXNzXCI7XG5pbXBvcnQgKiBhcyBqc29uZXhwb3J0IGZyb20gXCJqc29uZXhwb3J0XCI7XG5pbXBvcnQgKiBhcyBkb3QgZnJvbSBcImRvdC1vYmplY3RcIjtcbmltcG9ydCBCYXNlQ29tbWFuZCBmcm9tIFwiLi4vLi4vYmFzZVwiO1xuaW1wb3J0IHsgUmVwb3NpdG9yeVByb2plY3QgfSBmcm9tIFwiLi4vLi4vZ2l0aHViXCI7XG5cbmNvbnN0IGRlYnVnID0gY3JlYXRlRGVidWdnZXIoXCJleHBvcnRlcjpyZXBvOm1pbGVzdG9uZXNcIik7XG5cbmNvbnN0IExJU1RfUFJPSkVDVFNfUVVFUlkgPSBgcXVlcnkgbGlzdE1pbGVzdG9uZXMoJG93bmVyOiBTdHJpbmchLCAkcmVwbzogU3RyaW5nISwgJHByb2plY3Q6IEludCEsICRwZXJfcGFnZTogSW50ID0gMTAwLCAkY29sdW1uQ3Vyc29yOiBTdHJpbmcsICRjYXJkQ3Vyc29yOiBTdHJpbmcpIHtcbiAgcmVwb3NpdG9yeShvd25lcjogJG93bmVyLCBuYW1lOiAkcmVwbykge1xuICAgIHByb2plY3QobnVtYmVyOiAkcHJvamVjdCkge1xuICAgICAgY29sdW1ucyhmaXJzdDogJHBlcl9wYWdlLCBhZnRlcjogJGNvbHVtbkN1cnNvcikge1xuICAgICAgICBub2RlcyB7XG4gICAgICAgICAgbmFtZVxuICAgICAgICAgIGNhcmRzKGZpcnN0OiAkcGVyX3BhZ2UsIGFmdGVyOiAkY2FyZEN1cnNvcikge1xuICAgICAgICAgICAgbm9kZXMge1xuICAgICAgICAgICAgICBub3RlXG4gICAgICAgICAgICAgIGNvbnRlbnQge1xuICAgICAgICAgICAgICAgIC4uLiBvbiBJc3N1ZSB7XG4gICAgICAgICAgICAgICAgICBpZFxuICAgICAgICAgICAgICAgICAgbnVtYmVyXG4gICAgICAgICAgICAgICAgICB0aXRsZVxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGFnZUluZm8ge1xuICAgICAgICAgICAgICBoYXNOZXh0UGFnZVxuICAgICAgICAgICAgICBlbmRDdXJzb3JcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRvdGFsQ291bnRcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgcGFnZUluZm8ge1xuICAgICAgICAgIGhhc05leHRQYWdlXG4gICAgICAgICAgZW5kQ3Vyc29yXG4gICAgICAgIH1cbiAgICAgICAgdG90YWxDb3VudFxuICAgICAgfVxuICAgIH1cbiAgfVxufVxuYDtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVwb1Byb2plY3RzIGV4dGVuZHMgQmFzZUNvbW1hbmQge1xuICBzdGF0aWMgZGVzY3JpcHRpb24gPSBcIkV4cG9ydCBHaXRIdWIgTWlsZXN0b25lcyBmb3IgYSByZXBvc2l0b3J5XCI7XG5cbiAgc3RhdGljIGZsYWdzID0ge1xuICAgIC4uLkJhc2VDb21tYW5kLmZsYWdzLFxuICAgIHByb2plY3ROdW1iZXI6IGZsYWdUeXBlcy5pbnRlZ2VyKHtcbiAgICAgIGRlc2NyaXB0aW9uOiBcIlByb2plY3QgbnVtYmVyIGZyb20gd2hlcmUgdG8gcHVsbCBjYXJkc1wiLFxuICAgIH0pLFxuICB9O1xuXG4gIGFzeW5jIHJ1bigpIHtcbiAgICBjb25zdCBwcm9qZWN0cyA9IFtdO1xuXG4gICAgY29uc3QgeyBmbGFncyB9ID0gdGhpcy5wYXJzZShSZXBvUHJvamVjdHMpO1xuICAgIGNvbnN0IHsgb3duZXIsIHJlcG8sIGZvcm1hdCB9ID0gZmxhZ3M7XG5cbiAgICBsZXQgcmVzdWx0czogUmVwb3NpdG9yeVByb2plY3Q7XG4gICAgbGV0IGN1cnJlbnRDdXJzb3I7XG4gICAgbGV0IGNvbHVtbkN1cnNvcjtcbiAgICBsZXQgY2FyZEN1cnNvcjtcbiAgICBsZXQgcHJvZ3Jlc3M7XG5cbiAgICAvLyBwYWdpbmF0ZSB0aHJvdWdoIHRoZSBHcmFwaFFMIHF1ZXJ5IHVudGlsIHdlIGdldCBldmVyeXRoaW5nXG4gICAgZGVidWcoXCJQdWxsaW5nIHByb2plY3RzIGZyb20gQVBJXCIpO1xuICAgIGRvIHtcbiAgICAgIHJlc3VsdHMgPSBhd2FpdCB0aGlzLmdpdGh1Yi5ncmFwaHFsKExJU1RfUFJPSkVDVFNfUVVFUlksIHtcbiAgICAgICAgb3duZXIsXG4gICAgICAgIHJlcG8sXG4gICAgICAgIHByb2plY3Q6IGZsYWdzLnByb2plY3ROdW1iZXIsXG4gICAgICAgIGNvbHVtbkN1cnNvcixcbiAgICAgICAgY2FyZEN1cnNvcixcbiAgICAgIH0pO1xuICAgICAgY3VycmVudEN1cnNvciA9IGNvbHVtbkN1cnNvcjtcbiAgICAgIGNvbHVtbkN1cnNvciA9IHJlc3VsdHMucmVwb3NpdG9yeS5wcm9qZWN0LmNvbHVtbnMucGFnZUluZm8uZW5kQ3Vyc29yO1xuXG4gICAgICBpZiAoIXByb2dyZXNzKSB7XG4gICAgICAgIGlmIChyZXN1bHRzLnJlcG9zaXRvcnkucHJvamVjdC5jb2x1bW5zLnRvdGFsQ291bnQgPT09IDApIHtcbiAgICAgICAgICB0aGlzLndhcm4oXCJObyBwcm9qZWN0cyBmb3VuZFwiKTtcbiAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgIH1cblxuICAgICAgICBwcm9ncmVzcyA9IG5ldyBQcm9ncmVzc0JhcihcbiAgICAgICAgICBcImZldGNoaW5nIHByb2plY3RzIFs6YmFyXSA6Y3VycmVudC86dG90YWwgOnBlcmNlbnRcIixcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjb21wbGV0ZTogXCI9XCIsXG4gICAgICAgICAgICBpbmNvbXBsZXRlOiBcIiBcIixcbiAgICAgICAgICAgIHdpZHRoOiAyMCxcbiAgICAgICAgICAgIHRvdGFsOiByZXN1bHRzLnJlcG9zaXRvcnkucHJvamVjdC5jb2x1bW5zLnRvdGFsQ291bnQsXG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBwcm9ncmVzcy50aWNrKHJlc3VsdHMucmVwb3NpdG9yeS5wcm9qZWN0LmNvbHVtbnMubm9kZXMubGVuZ3RoKTtcbiAgICAgIHByb2plY3RzLnB1c2goLi4ucmVzdWx0cy5yZXBvc2l0b3J5LnByb2plY3QuY29sdW1ucy5ub2Rlcyk7XG5cbiAgICAgIC8vIExvb3AgdGhyb3VnaCBjYXJkc1xuICAgICAgZm9yIChjb25zdCBjb2x1bW4gb2YgcmVzdWx0cy5yZXBvc2l0b3J5LnByb2plY3QuY29sdW1ucy5ub2Rlcykge1xuICAgICAgICBjYXJkQ3Vyc29yID0gY29sdW1uLmNhcmRzLnBhZ2VJbmZvLmVuZEN1cnNvcjtcbiAgICAgICAgbGV0IGhhc05leHRQYWdlID0gY29sdW1uLmNhcmRzLnBhZ2VJbmZvLmhhc05leHRQYWdlO1xuICAgICAgICB3aGlsZSAoaGFzTmV4dFBhZ2UpIHtcbiAgICAgICAgICByZXN1bHRzID0gYXdhaXQgdGhpcy5naXRodWIuZ3JhcGhxbChMSVNUX1BST0pFQ1RTX1FVRVJZLCB7XG4gICAgICAgICAgICBvd25lcixcbiAgICAgICAgICAgIHJlcG8sXG4gICAgICAgICAgICBwcm9qZWN0OiBmbGFncy5wcm9qZWN0TnVtYmVyLFxuICAgICAgICAgICAgY29sdW1uQ3Vyc29yOiBjdXJyZW50Q3Vyc29yLFxuICAgICAgICAgICAgY2FyZEN1cnNvcixcbiAgICAgICAgICB9KTtcblxuICAgICAgICAgIHByb2plY3RzXG4gICAgICAgICAgICAuZmlsdGVyKChjb2wpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNvbC5uYW1lID09PSBjb2x1bW4ubmFtZTtcbiAgICAgICAgICAgIH0pWzBdXG4gICAgICAgICAgICAuY2FyZHMubm9kZXMucHVzaChcbiAgICAgICAgICAgICAgLi4ucmVzdWx0cy5yZXBvc2l0b3J5LnByb2plY3QuY29sdW1ucy5ub2Rlcy5maWx0ZXIoKGNvbCkgPT4ge1xuICAgICAgICAgICAgICAgIHJldHVybiBjb2wubmFtZSA9PT0gY29sdW1uLm5hbWU7XG4gICAgICAgICAgICAgIH0pWzBdLmNhcmRzLm5vZGVzXG4gICAgICAgICAgICApO1xuICAgICAgICAgIGNhcmRDdXJzb3IgPSByZXN1bHRzLnJlcG9zaXRvcnkucHJvamVjdC5jb2x1bW5zLm5vZGVzLmZpbHRlcihcbiAgICAgICAgICAgIChjb2wpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNvbC5uYW1lID09PSBjb2x1bW4ubmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApWzBdLmNhcmRzLnBhZ2VJbmZvLmVuZEN1cnNvcjtcbiAgICAgICAgICBoYXNOZXh0UGFnZSA9IHJlc3VsdHMucmVwb3NpdG9yeS5wcm9qZWN0LmNvbHVtbnMubm9kZXMuZmlsdGVyKFxuICAgICAgICAgICAgKGNvbCkgPT4ge1xuICAgICAgICAgICAgICByZXR1cm4gY29sLm5hbWUgPT09IGNvbHVtbi5uYW1lO1xuICAgICAgICAgICAgfVxuICAgICAgICAgIClbMF0uY2FyZHMucGFnZUluZm8uaGFzTmV4dFBhZ2U7XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9IHdoaWxlIChyZXN1bHRzLnJlcG9zaXRvcnkucHJvamVjdC5jb2x1bW5zLnBhZ2VJbmZvLmhhc05leHRQYWdlKTtcblxuICAgIC8vIEZpeCBmb3JtYXR0aW5nXG4gICAgLy8gbWFzc2FnZSB0aGUgZGF0YSB0byByZW1vdmUgR3JhcGhRTCBwYWdpbmF0aW9uIGRhdGFcbiAgICBmb3IgKGNvbnN0IGNvbHVtbiBvZiBwcm9qZWN0cykge1xuICAgICAgLy9kb3QubW92ZShcIm5hbWVcIiwgXCJjb2x1bW5fbmFtZVwiLCBjb2x1bW4pO1xuICAgICAgZG90LmRlbChcImNhcmRzLnBhZ2VJbmZvXCIsIGNvbHVtbik7XG4gICAgICBkb3QuZGVsKFwiY2FyZHMudG90YWxDb3VudFwiLCBjb2x1bW4pO1xuICAgICAgZm9yIChjb25zdCBjYXJkIG9mIGNvbHVtbi5jYXJkcy5ub2Rlcykge1xuICAgICAgICBkb3QuZGVsKFwiY29udGVudC5pZFwiLCBjYXJkKTtcbiAgICAgICAgZG90LmRlbChcImNvbnRlbnQubnVtYmVyXCIsIGNhcmQpO1xuICAgICAgfVxuICAgIH1cblxuICAgIGlmIChmb3JtYXQgPT09IFwiSlNPTlwiKSB7XG4gICAgICBmb3IgKGNvbnN0IHJlbGVhc2Ugb2YgcHJvamVjdHMpIHtcbiAgICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoYCR7SlNPTi5zdHJpbmdpZnkocmVsZWFzZSl9XFxuYCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChmb3JtYXQgPT09IFwiQ1NWXCIpIHtcbiAgICAgIGNvbnN0IGNzdiA9IGF3YWl0IGpzb25leHBvcnQocHJvamVjdHMsIHsgZmlsbEdhcHM6IHRydWUgfSk7XG4gICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZShjc3YpO1xuICAgIH1cbiAgfVxufVxuIl19