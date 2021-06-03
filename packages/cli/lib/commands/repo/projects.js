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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHJvamVjdHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29tbWFuZHMvcmVwby9wcm9qZWN0cy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUJBQXFCOztBQUVyQiw0Q0FBb0Q7QUFDcEQsaUNBQW1DO0FBQ25DLHdDQUF3QztBQUN4Qyx5Q0FBeUM7QUFDekMsa0NBQWtDO0FBQ2xDLHFDQUFxQztBQUdyQyxNQUFNLEtBQUssR0FBRyxlQUFjLENBQUMsMEJBQTBCLENBQUMsQ0FBQztBQUV6RCxNQUFNLG1CQUFtQixHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FpQzNCLENBQUM7QUFFRixNQUFxQixZQUFhLFNBQVEsY0FBVztJQVVuRCxLQUFLLENBQUMsR0FBRztRQUNQLE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUVwQixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMzQyxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUM7UUFFdEMsSUFBSSxPQUEwQixDQUFDO1FBQy9CLElBQUksYUFBYSxDQUFDO1FBQ2xCLElBQUksWUFBWSxDQUFDO1FBQ2pCLElBQUksVUFBVSxDQUFDO1FBQ2YsSUFBSSxRQUFRLENBQUM7UUFFYiw2REFBNkQ7UUFDN0QsS0FBSyxDQUFDLDJCQUEyQixDQUFDLENBQUM7UUFDbkMsR0FBRztZQUNELE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLG1CQUFtQixFQUFFO2dCQUN2RCxLQUFLO2dCQUNMLElBQUk7Z0JBQ0osT0FBTyxFQUFFLEtBQUssQ0FBQyxhQUFhO2dCQUM1QixZQUFZO2dCQUNaLFVBQVU7YUFDWCxDQUFDLENBQUM7WUFDSCxhQUFhLEdBQUcsWUFBWSxDQUFDO1lBQzdCLFlBQVksR0FBRyxPQUFPLENB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SCwrQkFrSEM7QUFqSFEsd0JBQVcsR0FBRywyQ0FBMkMsQ0FBQztBQUUxRCxrQkFBSyxtQ0FDUCxjQUFXLENBQUMsS0FBSyxLQUNwQixhQUFhLEVBQUUsZUFBUyxDQUFDLE9BQU8sQ0FBQztRQUMvQixXQUFXLEVBQUUseUNBQXlDO0tBQ3ZELENBQUMsSUFDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbHMgcHJvY2VzcyAqL1xuXG5pbXBvcnQgeyBmbGFncyBhcyBmbGFnVHlwZXMgfSBmcm9tIFwiQG9jbGlmL2NvbW1hbmRcIjtcbmltcG9ydCBjcmVhdGVEZWJ1Z2dlciBmcm9tIFwiZGVidWdcIjtcbmltcG9ydCAqIGFzIFByb2dyZXNzQmFyIGZyb20gXCJwcm9ncmVzc1wiO1xuaW1wb3J0ICogYXMganNvbmV4cG9ydCBmcm9tIFwianNvbmV4cG9ydFwiO1xuaW1wb3J0ICogYXMgZG90IGZyb20gXCJkb3Qtb2JqZWN0XCI7XG5pbXBvcnQgQmFzZUNvbW1hbmQgZnJvbSBcIi4uLy4uL2Jhc2VcIjtcbmltcG9ydCB7IFJlcG9zaXRvcnlQcm9qZWN0IH0gZnJvbSBcIi4uLy4uL2dpdGh1YlwiO1xuXG5jb25zdCBkZWJ1ZyA9IGNyZWF0ZURlYnVnZ2VyKFwiZXhwb3J0ZXI6cmVwbzptaWxlc3RvbmVzXCIpO1xuXG5jb25zdCBMSVNUX1BST0pFQ1RTX1FVRVJZID0gYHF1ZXJ5IGxpc3RNaWxlc3RvbmVzKCRvd25lcjogU3RyaW5nISwgJHJlcG86IFN0cmluZyEsICRwcm9qZWN0OiBJbnQhLCAkcGVyX3BhZ2U6IEludCA9IDEwMCwgJGNvbHVtbkN1cnNvcjogU3RyaW5nLCAkY2FyZEN1cnNvcjogU3RyaW5nKSB7XG4gIHJlcG9zaXRvcnkob3duZXI6ICRvd25lciwgbmFtZTogJHJlcG8pIHtcbiAgICBwcm9qZWN0KG51bWJlcjogJHByb2plY3QpIHtcbiAgICAgIGNvbHVtbnMoZmlyc3Q6ICRwZXJfcGFnZSwgYWZ0ZXI6ICRjb2x1bW5DdXJzb3IpIHtcbiAgICAgICAgbm9kZXMge1xuICAgICAgICAgIG5hbWVcbiAgICAgICAgICBjYXJkcyhmaXJzdDogJHBlcl9wYWdlLCBhZnRlcjogJGNhcmRDdXJzb3IpIHtcbiAgICAgICAgICAgIG5vZGVzIHtcbiAgICAgICAgICAgICAgbm90ZVxuICAgICAgICAgICAgICBjb250ZW50IHtcbiAgICAgICAgICAgICAgICAuLi4gb24gSXNzdWUge1xuICAgICAgICAgICAgICAgICAgaWRcbiAgICAgICAgICAgICAgICAgIG51bWJlclxuICAgICAgICAgICAgICAgICAgdGl0bGVcbiAgICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhZ2VJbmZvIHtcbiAgICAgICAgICAgICAgaGFzTmV4dFBhZ2VcbiAgICAgICAgICAgICAgZW5kQ3Vyc29yXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0b3RhbENvdW50XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIHBhZ2VJbmZvIHtcbiAgICAgICAgICBoYXNOZXh0UGFnZVxuICAgICAgICAgIGVuZEN1cnNvclxuICAgICAgICB9XG4gICAgICAgIHRvdGFsQ291bnRcbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbmA7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlcG9Qcm9qZWN0cyBleHRlbmRzIEJhc2VDb21tYW5kIHtcbiAgc3RhdGljIGRlc2NyaXB0aW9uID0gXCJFeHBvcnQgR2l0SHViIE1pbGVzdG9uZXMgZm9yIGEgcmVwb3NpdG9yeVwiO1xuXG4gIHN0YXRpYyBmbGFncyA9IHtcbiAgICAuLi5CYXNlQ29tbWFuZC5mbGFncyxcbiAgICBwcm9qZWN0TnVtYmVyOiBmbGFnVHlwZXMuaW50ZWdlcih7XG4gICAgICBkZXNjcmlwdGlvbjogXCJQcm9qZWN0IG51bWJlciBmcm9tIHdoZXJlIHRvIHB1bGwgY2FyZHNcIixcbiAgICB9KSxcbiAgfTtcblxuICBhc3luYyBydW4oKSB7XG4gICAgY29uc3QgcHJvamVjdHMgPSBbXTtcblxuICAgIGNvbnN0IHsgZmxhZ3MgfSA9IHRoaXMucGFyc2UoUmVwb1Byb2plY3RzKTtcbiAgICBjb25zdCB7IG93bmVyLCByZXBvLCBmb3JtYXQgfSA9IGZsYWdzO1xuXG4gICAgbGV0IHJlc3VsdHM6IFJlcG9zaXRvcnlQcm9qZWN0O1xuICAgIGxldCBjdXJyZW50Q3Vyc29yO1xuICAgIGxldCBjb2x1bW5DdXJzb3I7XG4gICAgbGV0IGNhcmRDdXJzb3I7XG4gICAgbGV0IHByb2dyZXNzO1xuXG4gICAgLy8gcGFnaW5hdGUgdGhyb3VnaCB0aGUgR3JhcGhRTCBxdWVyeSB1bnRpbCB3ZSBnZXQgZXZlcnl0aGluZ1xuICAgIGRlYnVnKFwiUHVsbGluZyBwcm9qZWN0cyBmcm9tIEFQSVwiKTtcbiAgICBkbyB7XG4gICAgICByZXN1bHRzID0gYXdhaXQgdGhpcy5naXRodWIuZ3JhcGhxbChMSVNUX1BST0pFQ1RTX1FVRVJZLCB7XG4gICAgICAgIG93bmVyLFxuICAgICAgICByZXBvLFxuICAgICAgICBwcm9qZWN0OiBmbGFncy5wcm9qZWN0TnVtYmVyLFxuICAgICAgICBjb2x1bW5DdXJzb3IsXG4gICAgICAgIGNhcmRDdXJzb3IsXG4gICAgICB9KTtcbiAgICAgIGN1cnJlbnRDdXJzb3IgPSBjb2x1bW5DdXJzb3I7XG4gICAgICBjb2x1bW5DdXJzb3IgPSByZXN1bHRzLnJlcG9zaXRvcnkucHJvamVjdC5jb2x1bW5zLnBhZ2VJbmZvLmVuZEN1cnNvcjtcblxuICAgICAgaWYgKCFwcm9ncmVzcykge1xuICAgICAgICBpZiAocmVzdWx0cy5yZXBvc2l0b3J5LnByb2plY3QuY29sdW1ucy50b3RhbENvdW50ID09PSAwKSB7XG4gICAgICAgICAgdGhpcy53YXJuKFwiTm8gcHJvamVjdHMgZm91bmRcIik7XG4gICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvZ3Jlc3MgPSBuZXcgUHJvZ3Jlc3NCYXIoXG4gICAgICAgICAgXCJmZXRjaGluZyBwcm9qZWN0cyBbOmJhcl0gOmN1cnJlbnQvOnRvdGFsIDpwZXJjZW50XCIsXG4gICAgICAgICAge1xuICAgICAgICAgICAgY29tcGxldGU6IFwiPVwiLFxuICAgICAgICAgICAgaW5jb21wbGV0ZTogXCIgXCIsXG4gICAgICAgICAgICB3aWR0aDogMjAsXG4gICAgICAgICAgICB0b3RhbDogcmVzdWx0cy5yZXBvc2l0b3J5LnByb2plY3QuY29sdW1ucy50b3RhbENvdW50LFxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgcHJvZ3Jlc3MudGljayhyZXN1bHRzLnJlcG9zaXRvcnkucHJvamVjdC5jb2x1bW5zLm5vZGVzLmxlbmd0aCk7XG4gICAgICBwcm9qZWN0cy5wdXNoKC4uLnJlc3VsdHMucmVwb3NpdG9yeS5wcm9qZWN0LmNvbHVtbnMubm9kZXMpO1xuXG4gICAgICAvLyBMb29wIHRocm91Z2ggY2FyZHNcbiAgICAgIGZvciAoY29uc3QgY29sdW1uIG9mIHJlc3VsdHMucmVwb3NpdG9yeS5wcm9qZWN0LmNvbHVtbnMubm9kZXMpIHtcbiAgICAgICAgY2FyZEN1cnNvciA9IGNvbHVtbi5jYXJkcy5wYWdlSW5mby5lbmRDdXJzb3I7XG4gICAgICAgIGxldCBoYXNOZXh0UGFnZSA9IGNvbHVtbi5jYXJkcy5wYWdlSW5mby5oYXNOZXh0UGFnZTtcbiAgICAgICAgd2hpbGUgKGhhc05leHRQYWdlKSB7XG4gICAgICAgICAgcmVzdWx0cyA9IGF3YWl0IHRoaXMuZ2l0aHViLmdyYXBocWwoTElTVF9QUk9KRUNUU19RVUVSWSwge1xuICAgICAgICAgICAgb3duZXIsXG4gICAgICAgICAgICByZXBvLFxuICAgICAgICAgICAgcHJvamVjdDogZmxhZ3MucHJvamVjdE51bWJlcixcbiAgICAgICAgICAgIGNvbHVtbkN1cnNvcjogY3VycmVudEN1cnNvcixcbiAgICAgICAgICAgIGNhcmRDdXJzb3IsXG4gICAgICAgICAgfSk7XG5cbiAgICAgICAgICBwcm9qZWN0c1xuICAgICAgICAgICAgLmZpbHRlcigoY29sKSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiBjb2wubmFtZSA9PT0gY29sdW1uLm5hbWU7XG4gICAgICAgICAgICB9KVswXVxuICAgICAgICAgICAgLmNhcmRzLm5vZGVzLnB1c2goXG4gICAgICAgICAgICAgIC4uLnJlc3VsdHMucmVwb3NpdG9yeS5wcm9qZWN0LmNvbHVtbnMubm9kZXMuZmlsdGVyKChjb2wpID0+IHtcbiAgICAgICAgICAgICAgICByZXR1cm4gY29sLm5hbWUgPT09IGNvbHVtbi5uYW1lO1xuICAgICAgICAgICAgICB9KVswXS5jYXJkcy5ub2Rlc1xuICAgICAgICAgICAgKTtcbiAgICAgICAgICBjYXJkQ3Vyc29yID0gcmVzdWx0cy5yZXBvc2l0b3J5LnByb2plY3QuY29sdW1ucy5ub2Rlcy5maWx0ZXIoXG4gICAgICAgICAgICAoY29sKSA9PiB7XG4gICAgICAgICAgICAgIHJldHVybiBjb2wubmFtZSA9PT0gY29sdW1uLm5hbWU7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgKVswXS5jYXJkcy5wYWdlSW5mby5lbmRDdXJzb3I7XG4gICAgICAgICAgaGFzTmV4dFBhZ2UgPSByZXN1bHRzLnJlcG9zaXRvcnkucHJvamVjdC5jb2x1bW5zLm5vZGVzLmZpbHRlcihcbiAgICAgICAgICAgIChjb2wpID0+IHtcbiAgICAgICAgICAgICAgcmV0dXJuIGNvbC5uYW1lID09PSBjb2x1bW4ubmFtZTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICApWzBdLmNhcmRzLnBhZ2VJbmZvLmhhc05leHRQYWdlO1xuICAgICAgICB9XG4gICAgICB9XG4gICAgfSB3aGlsZSAocmVzdWx0cy5yZXBvc2l0b3J5LnByb2plY3QuY29sdW1ucy5wYWdlSW5mby5oYXNOZXh0UGFnZSk7XG5cbiAgICAvLyBGaXggZm9ybWF0dGluZ1xuICAgIC8vIG1hc3NhZ2UgdGhlIGRhdGEgdG8gcmVtb3ZlIEdyYXBoUUwgcGFnaW5hdGlvbiBkYXRhXG4gICAgZm9yIChjb25zdCBjb2x1bW4gb2YgcHJvamVjdHMpIHtcbiAgICAgIC8vZG90Lm1vdmUoXCJuYW1lXCIsIFwiY29sdW1uX25hbWVcIiwgY29sdW1uKTtcbiAgICAgIGRvdC5kZWwoXCJjYXJkcy5wYWdlSW5mb1wiLCBjb2x1bW4pO1xuICAgICAgZG90LmRlbChcImNhcmRzLnRvdGFsQ291bnRcIiwgY29sdW1uKTtcbiAgICAgIGZvciAoY29uc3QgY2FyZCBvZiBjb2x1bW4uY2FyZHMubm9kZXMpIHtcbiAgICAgICAgZG90LmRlbChcImNvbnRlbnQuaWRcIiwgY2FyZCk7XG4gICAgICAgIGRvdC5kZWwoXCJjb250ZW50Lm51bWJlclwiLCBjYXJkKTtcbiAgICAgIH1cbiAgICB9XG5cbiAgICBpZiAoZm9ybWF0ID09PSBcIkpTT05MXCIpIHtcbiAgICAgIGZvciAoY29uc3QgcmVsZWFzZSBvZiBwcm9qZWN0cykge1xuICAgICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZShgJHtKU09OLnN0cmluZ2lmeShyZWxlYXNlKX1cXG5gKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGZvcm1hdCA9PT0gXCJKU09OXCIpIHtcbiAgICAgIHByb2Nlc3Muc3Rkb3V0LndyaXRlKEpTT04uc3RyaW5naWZ5KHByb2plY3RzKSk7XG4gICAgfSBlbHNlIGlmIChmb3JtYXQgPT09IFwiQ1NWXCIpIHtcbiAgICAgIGNvbnN0IGNzdiA9IGF3YWl0IGpzb25leHBvcnQocHJvamVjdHMsIHsgZmlsbEdhcHM6IHRydWUgfSk7XG4gICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZShjc3YpO1xuICAgIH1cbiAgfVxufVxuIl19