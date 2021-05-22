"use strict";
/* globals process */
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = require("debug");
const ProgressBar = require("progress");
const jsonexport = require("jsonexport");
const base_1 = require("../../base");
const debug = debug_1.default("exporter:repo:releases");
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
class RepoReleases extends base_1.default {
    async run() {
        const releases = [];
        const { flags } = this.parse(RepoReleases);
        const { owner, repo, format } = flags;
        let results;
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
                progress = new ProgressBar("fetching releases [:bar] :current/:total :percent", {
                    complete: "=",
                    incomplete: " ",
                    width: 20,
                    total: results.repository.releases.totalCount,
                });
            }
            progress.tick(results.repository.releases.nodes.length);
            releases.push(...results.repository.releases.nodes);
        } while (results.repository.releases.pageInfo.hasNextPage);
        if (format === "JSONL") {
            for (const release of releases) {
                process.stdout.write(`${JSON.stringify(release)}\n`);
            }
        }
        else if (format === "JSON") {
            process.stdout.write(JSON.stringify(releases));
        }
        else if (format === "CSV") {
            const csv = await jsonexport(releases, { fillGaps: true });
            process.stdout.write(csv);
        }
    }
}
exports.default = RepoReleases;
RepoReleases.description = "Export GitHub Releases for a repository";
RepoReleases.flags = Object.assign({}, base_1.default.flags);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVsZWFzZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29tbWFuZHMvcmVwby9yZWxlYXNlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUJBQXFCOztBQUVyQixpQ0FBbUM7QUFDbkMsd0NBQXdDO0FBQ3hDLHlDQUF5QztBQUN6QyxxQ0FBcUM7QUFHckMsTUFBTSxLQUFLLEdBQUcsZUFBYyxDQUFDLHdCQUF3QixDQUFDLENBQUM7QUFFdkQsTUFBTSxtQkFBbUIsR0FBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0EwQjNCLENBQUM7QUFFRixNQUFxQixZQUFhLFNBQVEsY0FBVztJQU9uRCxLQUFLLENBQUMsR0FBRztRQUNQLE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUVwQixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMzQyxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUM7UUFFdEMsSUFBSSxPQUEyQixDQUFDO1FBQ2hDLElBQUksTUFBTSxDQUFDO1FBQ1gsSUFBSSxRQUFRLENBQUM7UUFFYiw2REFBNkQ7UUFDN0QsS0FBSyxDQUFDLDJCQUEyQixDQUFDLENBQUM7UUFDbkMsR0FBRztZQUNELE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLG1CQUFtQixFQUFFO2dCQUN2RCxLQUFLO2dCQUNMLElBQUk7Z0JBQ0osS0FBSyxFQUFFLE1BQU07YUFDZCxDQUFDLENBQUM7WUFDSCxNQUFNLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQztZQUV4RCxJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUNiLElBQUksT0FBTyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsVUFBVSxLQUFLLENBQUMsRUFBRTtvQkFDaEQsSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO29CQUMvQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUNqQjtnQkFFRCxRQUFRLEdBQUcsSUFBSSxXQUFXLENBQ3hCLG1EQUFtRCxFQUNuRDtvQkFDRSxRQUFRLEVBQUUsR0FBRztvQkFDYixVQUFVLEVBQUUsR0FBRztvQkFDZixLQUFLLEVBQUUsRUFBRTtvQkFDVCxLQUFLLEVBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsVUFBVTtpQkFDOUMsQ0FDRixDQUFDO2FBQ0g7WUFFRCxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN4RCxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDckQsUUFBUSxPQUFPLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFO1FBRTNELElBQUksTUFBTSxLQUFLLE1BQU0sRUFBRTtZQUNyQixLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRTtnQkFDOUIsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUN0RDtTQUNGO2FBQU0sSUFBSSxNQUFNLEtBQUssS0FBSyxFQUFFO1lBQzNCLE1BQU0sR0FBRyxHQUFHLE1BQU0sVUFBVSxDQUFDLFFBQVEsRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQzNELE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzNCO0lBQ0gsQ0FBQzs7QUF4REgsK0JBeURDO0FBeERRLHdCQUFXLEdBQUcseUNBQXlDLENBQUM7QUFFeEQsa0JBQUsscUJBQ1AsY0FBVyxDQUFDLEtBQUssRUFDcEIiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWxzIHByb2Nlc3MgKi9cblxuaW1wb3J0IGNyZWF0ZURlYnVnZ2VyIGZyb20gXCJkZWJ1Z1wiO1xuaW1wb3J0ICogYXMgUHJvZ3Jlc3NCYXIgZnJvbSBcInByb2dyZXNzXCI7XG5pbXBvcnQgKiBhcyBqc29uZXhwb3J0IGZyb20gXCJqc29uZXhwb3J0XCI7XG5pbXBvcnQgQmFzZUNvbW1hbmQgZnJvbSBcIi4uLy4uL2Jhc2VcIjtcbmltcG9ydCB7IFJlcG9zaXRvcnlSZWxlYXNlcyB9IGZyb20gXCIuLi8uLi9naXRodWJcIjtcblxuY29uc3QgZGVidWcgPSBjcmVhdGVEZWJ1Z2dlcihcImV4cG9ydGVyOnJlcG86cmVsZWFzZXNcIik7XG5cbmNvbnN0IExJU1RfUkVMRUFTRVNfUVVFUlkgPSBgcXVlcnkgbGlzdFJlbGVhc2VzKCRvd25lcjogU3RyaW5nISwgJHJlcG86IFN0cmluZyEsICRwZXJfcGFnZTogSW50ID0gMTAwLCAkYWZ0ZXI6IFN0cmluZykge1xuICByZXBvc2l0b3J5KG93bmVyOiAkb3duZXIsIG5hbWU6ICRyZXBvKSB7XG4gICAgcmVsZWFzZXMoZmlyc3Q6ICRwZXJfcGFnZSwgYWZ0ZXI6ICRhZnRlcikge1xuICAgICAgbm9kZXMge1xuICAgICAgICBhdXRob3Ige1xuICAgICAgICAgIGxvZ2luXG4gICAgICAgIH1cbiAgICAgICAgY3JlYXRlZEF0XG4gICAgICAgIGRlc2NyaXB0aW9uXG4gICAgICAgIGlkXG4gICAgICAgIGlzRHJhZnRcbiAgICAgICAgaXNQcmVyZWxlYXNlXG4gICAgICAgIG5hbWVcbiAgICAgICAgcHVibGlzaGVkQXRcbiAgICAgICAgc2hvcnREZXNjcmlwdGlvbkhUTUxcbiAgICAgICAgdGFnTmFtZVxuICAgICAgICB1cGRhdGVkQXRcbiAgICAgIH1cbiAgICAgIHBhZ2VJbmZvIHtcbiAgICAgICAgZW5kQ3Vyc29yXG4gICAgICAgIGhhc05leHRQYWdlXG4gICAgICB9XG4gICAgICB0b3RhbENvdW50XG4gICAgfVxuICB9XG59XG5gO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZXBvUmVsZWFzZXMgZXh0ZW5kcyBCYXNlQ29tbWFuZCB7XG4gIHN0YXRpYyBkZXNjcmlwdGlvbiA9IFwiRXhwb3J0IEdpdEh1YiBSZWxlYXNlcyBmb3IgYSByZXBvc2l0b3J5XCI7XG5cbiAgc3RhdGljIGZsYWdzID0ge1xuICAgIC4uLkJhc2VDb21tYW5kLmZsYWdzLFxuICB9O1xuXG4gIGFzeW5jIHJ1bigpIHtcbiAgICBjb25zdCByZWxlYXNlcyA9IFtdO1xuXG4gICAgY29uc3QgeyBmbGFncyB9ID0gdGhpcy5wYXJzZShSZXBvUmVsZWFzZXMpO1xuICAgIGNvbnN0IHsgb3duZXIsIHJlcG8sIGZvcm1hdCB9ID0gZmxhZ3M7XG5cbiAgICBsZXQgcmVzdWx0czogUmVwb3NpdG9yeVJlbGVhc2VzO1xuICAgIGxldCBjdXJzb3I7XG4gICAgbGV0IHByb2dyZXNzO1xuXG4gICAgLy8gcGFnaW5hdGUgdGhyb3VnaCB0aGUgR3JhcGhRTCBxdWVyeSB1bnRpbCB3ZSBnZXQgZXZlcnl0aGluZ1xuICAgIGRlYnVnKFwiUHVsbGluZyByZWxlYXNlcyBmcm9tIEFQSVwiKTtcbiAgICBkbyB7XG4gICAgICByZXN1bHRzID0gYXdhaXQgdGhpcy5naXRodWIuZ3JhcGhxbChMSVNUX1JFTEVBU0VTX1FVRVJZLCB7XG4gICAgICAgIG93bmVyLFxuICAgICAgICByZXBvLFxuICAgICAgICBhZnRlcjogY3Vyc29yLFxuICAgICAgfSk7XG4gICAgICBjdXJzb3IgPSByZXN1bHRzLnJlcG9zaXRvcnkucmVsZWFzZXMucGFnZUluZm8uZW5kQ3Vyc29yO1xuXG4gICAgICBpZiAoIXByb2dyZXNzKSB7XG4gICAgICAgIGlmIChyZXN1bHRzLnJlcG9zaXRvcnkucmVsZWFzZXMudG90YWxDb3VudCA9PT0gMCkge1xuICAgICAgICAgIHRoaXMud2FybihcIk5vIHJlbGVhc2VzIGZvdW5kXCIpO1xuICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb2dyZXNzID0gbmV3IFByb2dyZXNzQmFyKFxuICAgICAgICAgIFwiZmV0Y2hpbmcgcmVsZWFzZXMgWzpiYXJdIDpjdXJyZW50Lzp0b3RhbCA6cGVyY2VudFwiLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGNvbXBsZXRlOiBcIj1cIixcbiAgICAgICAgICAgIGluY29tcGxldGU6IFwiIFwiLFxuICAgICAgICAgICAgd2lkdGg6IDIwLFxuICAgICAgICAgICAgdG90YWw6IHJlc3VsdHMucmVwb3NpdG9yeS5yZWxlYXNlcy50b3RhbENvdW50LFxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgcHJvZ3Jlc3MudGljayhyZXN1bHRzLnJlcG9zaXRvcnkucmVsZWFzZXMubm9kZXMubGVuZ3RoKTtcbiAgICAgIHJlbGVhc2VzLnB1c2goLi4ucmVzdWx0cy5yZXBvc2l0b3J5LnJlbGVhc2VzLm5vZGVzKTtcbiAgICB9IHdoaWxlIChyZXN1bHRzLnJlcG9zaXRvcnkucmVsZWFzZXMucGFnZUluZm8uaGFzTmV4dFBhZ2UpO1xuXG4gICAgaWYgKGZvcm1hdCA9PT0gXCJKU09OXCIpIHtcbiAgICAgIGZvciAoY29uc3QgcmVsZWFzZSBvZiByZWxlYXNlcykge1xuICAgICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZShgJHtKU09OLnN0cmluZ2lmeShyZWxlYXNlKX1cXG5gKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGZvcm1hdCA9PT0gXCJDU1ZcIikge1xuICAgICAgY29uc3QgY3N2ID0gYXdhaXQganNvbmV4cG9ydChyZWxlYXNlcywgeyBmaWxsR2FwczogdHJ1ZSB9KTtcbiAgICAgIHByb2Nlc3Muc3Rkb3V0LndyaXRlKGNzdik7XG4gICAgfVxuICB9XG59XG4iXX0=