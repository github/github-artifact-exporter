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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicmVsZWFzZXMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29tbWFuZHMvcmVwby9yZWxlYXNlcy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUJBQXFCOztBQUVyQixpQ0FBbUM7QUFDbkMsd0NBQXdDO0FBQ3hDLHlDQUF5QztBQUN6QyxxQ0FBcUM7QUFHckMsTUFBTSxLQUFLLEdBQUcsZUFBYyxDQUFDLHdCQUF3QixDQUFDLENBQUM7QUFFdkQsTUFBTSxtQkFBbUIsR0FBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0EwQjNCLENBQUM7QUFFRixNQUFxQixZQUFhLFNBQVEsY0FBVztJQU9uRCxLQUFLLENBQUMsR0FBRztRQUNQLE1BQU0sUUFBUSxHQUFHLEVBQUUsQ0FBQztRQUVwQixNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMzQyxNQUFNLEVBQUUsS0FBSyxFQUFFLElBQUksRUFBRSxNQUFNLEVBQUUsR0FBRyxLQUFLLENBQUM7UUFFdEMsSUFBSSxPQUEyQixDQUFDO1FBQ2hDLElBQUksTUFBTSxDQUFDO1FBQ1gsSUFBSSxRQUFRLENBQUM7UUFFYiw2REFBNkQ7UUFDN0QsS0FBSyxDQUFDLDJCQUEyQixDQUFDLENBQUM7UUFDbkMsR0FBRztZQUNELE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLG1CQUFtQixFQUFFO2dCQUN2RCxLQUFLO2dCQUNMLElBQUk7Z0JBQ0osS0FBSyxFQUFFLE1BQU07YUFDZCxDQUFDLENBQUM7WUFDSCxNQUFNLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsUUFBUSxDQUFDLFNBQVMsQ0FBQztZQUV4RCxJQUFJLENBQUMsUUFBUSxFQUFFO2dCQUNiLElBQUksT0FBTyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsVUFBVSxLQUFLLENBQUMsRUFBRTtvQkFDaEQsSUFBSSxDQUFDLElBQUksQ0FBQyxtQkFBbUIsQ0FBQyxDQUFDO29CQUMvQixPQUFPLENBQUMsSUFBSSxDQUFDLENBQUMsQ0FBQyxDQUFDO2lCQUNqQjtnQkFFRCxRQUFRLEdBQUcsSUFBSSxXQUFXLENBQ3hCLG1EQUFtRCxFQUNuRDtvQkFDRSxRQUFRLEVBQUUsR0FBRztvQkFDYixVQUFVLEVBQUUsR0FBRztvQkFDZixLQUFLLEVBQUUsRUFBRTtvQkFDVCxLQUFLLEVBQUUsT0FBTyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsVUFBVTtpQkFDOUMsQ0FDRixDQUFDO2FBQ0g7WUFFRCxRQUFRLENBQUMsSUFBSSxDQUFDLE9BQU8sQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLEtBQUssQ0FBQyxNQUFNLENBQUMsQ0FBQztZQUN4RCxRQUFRLENBQUMsSUFBSSxDQUFDLEdBQUcsT0FBTyxDQUFDLFVBQVUsQ0FBQyxRQUFRLENBQUMsS0FBSyxDQUFDLENBQUM7U0FDckQsUUFBUSxPQUFPLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxRQUFRLENBQUMsV0FBVyxFQUFFO1FBRTNELElBQUksTUFBTSxLQUFLLE9BQU8sRUFBRTtZQUN0QixLQUFLLE1BQU0sT0FBTyxJQUFJLFFBQVEsRUFBRTtnQkFDOUIsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxJQUFJLENBQUMsU0FBUyxDQUFDLE9BQU8sQ0FBQyxJQUFJLENBQUMsQ0FBQzthQUN0RDtTQUNGO2FBQU0sSUFBSSxNQUFNLEtBQUssTUFBTSxFQUFFO1lBQzVCLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLElBQUksQ0FBQyxTQUFTLENBQUMsUUFBUSxDQUFDLENBQUMsQ0FBQztTQUNoRDthQUFNLElBQUksTUFBTSxLQUFLLEtBQUssRUFBRTtZQUMzQixNQUFNLEdBQUcsR0FBRyxNQUFNLFVBQVUsQ0FBQyxRQUFRLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUMzRCxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUMzQjtJQUNILENBQUM7O0FBMURILCtCQTJEQztBQTFEUSx3QkFBVyxHQUFHLHlDQUF5QyxDQUFDO0FBRXhELGtCQUFLLHFCQUNQLGNBQVcsQ0FBQyxLQUFLLEVBQ3BCIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFscyBwcm9jZXNzICovXG5cbmltcG9ydCBjcmVhdGVEZWJ1Z2dlciBmcm9tIFwiZGVidWdcIjtcbmltcG9ydCAqIGFzIFByb2dyZXNzQmFyIGZyb20gXCJwcm9ncmVzc1wiO1xuaW1wb3J0ICogYXMganNvbmV4cG9ydCBmcm9tIFwianNvbmV4cG9ydFwiO1xuaW1wb3J0IEJhc2VDb21tYW5kIGZyb20gXCIuLi8uLi9iYXNlXCI7XG5pbXBvcnQgeyBSZXBvc2l0b3J5UmVsZWFzZXMgfSBmcm9tIFwiLi4vLi4vZ2l0aHViXCI7XG5cbmNvbnN0IGRlYnVnID0gY3JlYXRlRGVidWdnZXIoXCJleHBvcnRlcjpyZXBvOnJlbGVhc2VzXCIpO1xuXG5jb25zdCBMSVNUX1JFTEVBU0VTX1FVRVJZID0gYHF1ZXJ5IGxpc3RSZWxlYXNlcygkb3duZXI6IFN0cmluZyEsICRyZXBvOiBTdHJpbmchLCAkcGVyX3BhZ2U6IEludCA9IDEwMCwgJGFmdGVyOiBTdHJpbmcpIHtcbiAgcmVwb3NpdG9yeShvd25lcjogJG93bmVyLCBuYW1lOiAkcmVwbykge1xuICAgIHJlbGVhc2VzKGZpcnN0OiAkcGVyX3BhZ2UsIGFmdGVyOiAkYWZ0ZXIpIHtcbiAgICAgIG5vZGVzIHtcbiAgICAgICAgYXV0aG9yIHtcbiAgICAgICAgICBsb2dpblxuICAgICAgICB9XG4gICAgICAgIGNyZWF0ZWRBdFxuICAgICAgICBkZXNjcmlwdGlvblxuICAgICAgICBpZFxuICAgICAgICBpc0RyYWZ0XG4gICAgICAgIGlzUHJlcmVsZWFzZVxuICAgICAgICBuYW1lXG4gICAgICAgIHB1Ymxpc2hlZEF0XG4gICAgICAgIHNob3J0RGVzY3JpcHRpb25IVE1MXG4gICAgICAgIHRhZ05hbWVcbiAgICAgICAgdXBkYXRlZEF0XG4gICAgICB9XG4gICAgICBwYWdlSW5mbyB7XG4gICAgICAgIGVuZEN1cnNvclxuICAgICAgICBoYXNOZXh0UGFnZVxuICAgICAgfVxuICAgICAgdG90YWxDb3VudFxuICAgIH1cbiAgfVxufVxuYDtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgUmVwb1JlbGVhc2VzIGV4dGVuZHMgQmFzZUNvbW1hbmQge1xuICBzdGF0aWMgZGVzY3JpcHRpb24gPSBcIkV4cG9ydCBHaXRIdWIgUmVsZWFzZXMgZm9yIGEgcmVwb3NpdG9yeVwiO1xuXG4gIHN0YXRpYyBmbGFncyA9IHtcbiAgICAuLi5CYXNlQ29tbWFuZC5mbGFncyxcbiAgfTtcblxuICBhc3luYyBydW4oKSB7XG4gICAgY29uc3QgcmVsZWFzZXMgPSBbXTtcblxuICAgIGNvbnN0IHsgZmxhZ3MgfSA9IHRoaXMucGFyc2UoUmVwb1JlbGVhc2VzKTtcbiAgICBjb25zdCB7IG93bmVyLCByZXBvLCBmb3JtYXQgfSA9IGZsYWdzO1xuXG4gICAgbGV0IHJlc3VsdHM6IFJlcG9zaXRvcnlSZWxlYXNlcztcbiAgICBsZXQgY3Vyc29yO1xuICAgIGxldCBwcm9ncmVzcztcblxuICAgIC8vIHBhZ2luYXRlIHRocm91Z2ggdGhlIEdyYXBoUUwgcXVlcnkgdW50aWwgd2UgZ2V0IGV2ZXJ5dGhpbmdcbiAgICBkZWJ1ZyhcIlB1bGxpbmcgcmVsZWFzZXMgZnJvbSBBUElcIik7XG4gICAgZG8ge1xuICAgICAgcmVzdWx0cyA9IGF3YWl0IHRoaXMuZ2l0aHViLmdyYXBocWwoTElTVF9SRUxFQVNFU19RVUVSWSwge1xuICAgICAgICBvd25lcixcbiAgICAgICAgcmVwbyxcbiAgICAgICAgYWZ0ZXI6IGN1cnNvcixcbiAgICAgIH0pO1xuICAgICAgY3Vyc29yID0gcmVzdWx0cy5yZXBvc2l0b3J5LnJlbGVhc2VzLnBhZ2VJbmZvLmVuZEN1cnNvcjtcblxuICAgICAgaWYgKCFwcm9ncmVzcykge1xuICAgICAgICBpZiAocmVzdWx0cy5yZXBvc2l0b3J5LnJlbGVhc2VzLnRvdGFsQ291bnQgPT09IDApIHtcbiAgICAgICAgICB0aGlzLndhcm4oXCJObyByZWxlYXNlcyBmb3VuZFwiKTtcbiAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgIH1cblxuICAgICAgICBwcm9ncmVzcyA9IG5ldyBQcm9ncmVzc0JhcihcbiAgICAgICAgICBcImZldGNoaW5nIHJlbGVhc2VzIFs6YmFyXSA6Y3VycmVudC86dG90YWwgOnBlcmNlbnRcIixcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjb21wbGV0ZTogXCI9XCIsXG4gICAgICAgICAgICBpbmNvbXBsZXRlOiBcIiBcIixcbiAgICAgICAgICAgIHdpZHRoOiAyMCxcbiAgICAgICAgICAgIHRvdGFsOiByZXN1bHRzLnJlcG9zaXRvcnkucmVsZWFzZXMudG90YWxDb3VudCxcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHByb2dyZXNzLnRpY2socmVzdWx0cy5yZXBvc2l0b3J5LnJlbGVhc2VzLm5vZGVzLmxlbmd0aCk7XG4gICAgICByZWxlYXNlcy5wdXNoKC4uLnJlc3VsdHMucmVwb3NpdG9yeS5yZWxlYXNlcy5ub2Rlcyk7XG4gICAgfSB3aGlsZSAocmVzdWx0cy5yZXBvc2l0b3J5LnJlbGVhc2VzLnBhZ2VJbmZvLmhhc05leHRQYWdlKTtcblxuICAgIGlmIChmb3JtYXQgPT09IFwiSlNPTkxcIikge1xuICAgICAgZm9yIChjb25zdCByZWxlYXNlIG9mIHJlbGVhc2VzKSB7XG4gICAgICAgIHByb2Nlc3Muc3Rkb3V0LndyaXRlKGAke0pTT04uc3RyaW5naWZ5KHJlbGVhc2UpfVxcbmApO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZm9ybWF0ID09PSBcIkpTT05cIikge1xuICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoSlNPTi5zdHJpbmdpZnkocmVsZWFzZXMpKTtcbiAgICB9IGVsc2UgaWYgKGZvcm1hdCA9PT0gXCJDU1ZcIikge1xuICAgICAgY29uc3QgY3N2ID0gYXdhaXQganNvbmV4cG9ydChyZWxlYXNlcywgeyBmaWxsR2FwczogdHJ1ZSB9KTtcbiAgICAgIHByb2Nlc3Muc3Rkb3V0LndyaXRlKGNzdik7XG4gICAgfVxuICB9XG59XG4iXX0=