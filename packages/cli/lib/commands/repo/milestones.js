"use strict";
/* globals process */
Object.defineProperty(exports, "__esModule", { value: true });
const debug_1 = require("debug");
const ProgressBar = require("progress");
const jsonexport = require("jsonexport");
const base_1 = require("../../base");
const debug = debug_1.default("exporter:repo:milestones");
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
class RepoMilestones extends base_1.default {
    async run() {
        const milestones = [];
        const { flags } = this.parse(RepoMilestones);
        const { owner, repo, format } = flags;
        let results;
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
                progress = new ProgressBar("fetching milestones [:bar] :current/:total :percent", {
                    complete: "=",
                    incomplete: " ",
                    width: 20,
                    total: results.repository.milestones.totalCount,
                });
            }
            progress.tick(results.repository.milestones.nodes.length);
            milestones.push(...results.repository.milestones.nodes);
        } while (results.repository.milestones.pageInfo.hasNextPage);
        if (format === "JSONL") {
            for (const release of milestones) {
                process.stdout.write(`${JSON.stringify(release)}\n`);
            }
        }
        else if (format === "JSON") {
            process.stdout.write(JSON.stringify(milestones));
        }
        else if (format === "CSV") {
            const csv = await jsonexport(milestones, { fillGaps: true });
            process.stdout.write(csv);
        }
    }
}
exports.default = RepoMilestones;
RepoMilestones.description = "Export GitHub Milestones for a repository";
RepoMilestones.flags = Object.assign({}, base_1.default.flags);
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlsZXN0b25lcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tYW5kcy9yZXBvL21pbGVzdG9uZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFCQUFxQjs7QUFFckIsaUNBQW1DO0FBQ25DLHdDQUF3QztBQUN4Qyx5Q0FBeUM7QUFDekMscUNBQXFDO0FBR3JDLE1BQU0sS0FBSyxHQUFHLGVBQWMsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0FBRXpELE1BQU0sbUJBQW1CLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBMEIzQixDQUFDO0FBRUYsTUFBcUIsY0FBZSxTQUFRLGNBQVc7SUFPckQsS0FBSyxDQUFDLEdBQUc7UUFDUCxNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUM7UUFFdEIsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDN0MsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBRXRDLElBQUksT0FBNkIsQ0FBQztRQUNsQyxJQUFJLE1BQU0sQ0FBQztRQUNYLElBQUksUUFBUSxDQUFDO1FBRWIsNkRBQTZEO1FBQzdELEtBQUssQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1FBQ3JDLEdBQUc7WUFDRCxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsRUFBRTtnQkFDdkQsS0FBSztnQkFDTCxJQUFJO2dCQUNKLEtBQUssRUFBRSxNQUFNO2FBQ2QsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUM7WUFFMUQsSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDYixJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLFVBQVUsS0FBSyxDQUFDLEVBQUU7b0JBQ2xELElBQUksQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQztvQkFDakMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDakI7Z0JBRUQsUUFBUSxHQUFHLElBQUksV0FBVyxDQUN4QixxREFBcUQsRUFDckQ7b0JBQ0UsUUFBUSxFQUFFLEdBQUc7b0JBQ2IsVUFBVSxFQUFFLEdBQUc7b0JBQ2YsS0FBSyxFQUFFLEVBQUU7b0JBQ1QsS0FBSyxFQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLFVBQVU7aUJBQ2hELENBQ0YsQ0FBQzthQUNIO1lBRUQsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDMUQsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3pELFFBQVEsT0FBTyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRTtRQUU3RCxJQUFJLE1BQU0sS0FBSyxPQUFPLEVBQUU7WUFDdEIsS0FBSyxNQUFNLE9BQU8sSUFBSSxVQUFVLEVBQUU7Z0JBQ2hDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDdEQ7U0FDRjthQUFNLElBQUksTUFBTSxLQUFLLE1BQU0sRUFBRTtZQUM1QixPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxJQUFJLENBQUMsU0FBUyxDQUFDLFVBQVUsQ0FBQyxDQUFDLENBQUM7U0FDbEQ7YUFBTSxJQUFJLE1BQU0sS0FBSyxLQUFLLEVBQUU7WUFDM0IsTUFBTSxHQUFHLEdBQUcsTUFBTSxVQUFVLENBQUMsVUFBVSxFQUFFLEVBQUUsUUFBUSxFQUFFLElBQUksRUFBRSxDQUFDLENBQUM7WUFDN0QsT0FBTyxDQUFDLE1BQU0sQ0FBQyxLQUFLLENBQUMsR0FBRyxDQUFDLENBQUM7U0FDM0I7SUFDSCxDQUFDOztBQTFESCxpQ0EyREM7QUExRFEsMEJBQVcsR0FBRywyQ0FBMkMsQ0FBQztBQUUxRCxvQkFBSyxxQkFDUCxjQUFXLENBQUMsS0FBSyxFQUNwQiIsInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbHMgcHJvY2VzcyAqL1xuXG5pbXBvcnQgY3JlYXRlRGVidWdnZXIgZnJvbSBcImRlYnVnXCI7XG5pbXBvcnQgKiBhcyBQcm9ncmVzc0JhciBmcm9tIFwicHJvZ3Jlc3NcIjtcbmltcG9ydCAqIGFzIGpzb25leHBvcnQgZnJvbSBcImpzb25leHBvcnRcIjtcbmltcG9ydCBCYXNlQ29tbWFuZCBmcm9tIFwiLi4vLi4vYmFzZVwiO1xuaW1wb3J0IHsgUmVwb3NpdG9yeU1pbGVzdG9uZXMgfSBmcm9tIFwiLi4vLi4vZ2l0aHViXCI7XG5cbmNvbnN0IGRlYnVnID0gY3JlYXRlRGVidWdnZXIoXCJleHBvcnRlcjpyZXBvOm1pbGVzdG9uZXNcIik7XG5cbmNvbnN0IExJU1RfUkVMRUFTRVNfUVVFUlkgPSBgcXVlcnkgbGlzdE1pbGVzdG9uZXMoJG93bmVyOiBTdHJpbmchLCAkcmVwbzogU3RyaW5nISwgJHBlcl9wYWdlOiBJbnQgPSAxMDAsICRhZnRlcjogU3RyaW5nKSB7XG4gIHJlcG9zaXRvcnkob3duZXI6ICRvd25lciwgbmFtZTogJHJlcG8pIHtcbiAgICBtaWxlc3RvbmVzKGZpcnN0OiAkcGVyX3BhZ2UsIGFmdGVyOiAkYWZ0ZXIpIHtcbiAgICAgIG5vZGVzIHtcbiAgICAgICAgY2xvc2VkXG4gICAgICAgIGNsb3NlZEF0XG4gICAgICAgIGNyZWF0ZWRBdFxuICAgICAgICBjcmVhdG9yIHtcbiAgICAgICAgICBsb2dpblxuICAgICAgICB9XG4gICAgICAgIGRlc2NyaXB0aW9uXG4gICAgICAgIGR1ZU9uXG4gICAgICAgIGlkXG4gICAgICAgIG51bWJlclxuICAgICAgICBzdGF0ZVxuICAgICAgICB0aXRsZVxuICAgICAgICB1cGRhdGVkQXRcbiAgICAgIH1cbiAgICAgIHBhZ2VJbmZvIHtcbiAgICAgICAgZW5kQ3Vyc29yXG4gICAgICAgIGhhc05leHRQYWdlXG4gICAgICB9XG4gICAgICB0b3RhbENvdW50XG4gICAgfVxuICB9XG59XG5gO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZXBvTWlsZXN0b25lcyBleHRlbmRzIEJhc2VDb21tYW5kIHtcbiAgc3RhdGljIGRlc2NyaXB0aW9uID0gXCJFeHBvcnQgR2l0SHViIE1pbGVzdG9uZXMgZm9yIGEgcmVwb3NpdG9yeVwiO1xuXG4gIHN0YXRpYyBmbGFncyA9IHtcbiAgICAuLi5CYXNlQ29tbWFuZC5mbGFncyxcbiAgfTtcblxuICBhc3luYyBydW4oKSB7XG4gICAgY29uc3QgbWlsZXN0b25lcyA9IFtdO1xuXG4gICAgY29uc3QgeyBmbGFncyB9ID0gdGhpcy5wYXJzZShSZXBvTWlsZXN0b25lcyk7XG4gICAgY29uc3QgeyBvd25lciwgcmVwbywgZm9ybWF0IH0gPSBmbGFncztcblxuICAgIGxldCByZXN1bHRzOiBSZXBvc2l0b3J5TWlsZXN0b25lcztcbiAgICBsZXQgY3Vyc29yO1xuICAgIGxldCBwcm9ncmVzcztcblxuICAgIC8vIHBhZ2luYXRlIHRocm91Z2ggdGhlIEdyYXBoUUwgcXVlcnkgdW50aWwgd2UgZ2V0IGV2ZXJ5dGhpbmdcbiAgICBkZWJ1ZyhcIlB1bGxpbmcgbWlsZXN0b25lcyBmcm9tIEFQSVwiKTtcbiAgICBkbyB7XG4gICAgICByZXN1bHRzID0gYXdhaXQgdGhpcy5naXRodWIuZ3JhcGhxbChMSVNUX1JFTEVBU0VTX1FVRVJZLCB7XG4gICAgICAgIG93bmVyLFxuICAgICAgICByZXBvLFxuICAgICAgICBhZnRlcjogY3Vyc29yLFxuICAgICAgfSk7XG4gICAgICBjdXJzb3IgPSByZXN1bHRzLnJlcG9zaXRvcnkubWlsZXN0b25lcy5wYWdlSW5mby5lbmRDdXJzb3I7XG5cbiAgICAgIGlmICghcHJvZ3Jlc3MpIHtcbiAgICAgICAgaWYgKHJlc3VsdHMucmVwb3NpdG9yeS5taWxlc3RvbmVzLnRvdGFsQ291bnQgPT09IDApIHtcbiAgICAgICAgICB0aGlzLndhcm4oXCJObyBtaWxlc3RvbmVzIGZvdW5kXCIpO1xuICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb2dyZXNzID0gbmV3IFByb2dyZXNzQmFyKFxuICAgICAgICAgIFwiZmV0Y2hpbmcgbWlsZXN0b25lcyBbOmJhcl0gOmN1cnJlbnQvOnRvdGFsIDpwZXJjZW50XCIsXG4gICAgICAgICAge1xuICAgICAgICAgICAgY29tcGxldGU6IFwiPVwiLFxuICAgICAgICAgICAgaW5jb21wbGV0ZTogXCIgXCIsXG4gICAgICAgICAgICB3aWR0aDogMjAsXG4gICAgICAgICAgICB0b3RhbDogcmVzdWx0cy5yZXBvc2l0b3J5Lm1pbGVzdG9uZXMudG90YWxDb3VudCxcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHByb2dyZXNzLnRpY2socmVzdWx0cy5yZXBvc2l0b3J5Lm1pbGVzdG9uZXMubm9kZXMubGVuZ3RoKTtcbiAgICAgIG1pbGVzdG9uZXMucHVzaCguLi5yZXN1bHRzLnJlcG9zaXRvcnkubWlsZXN0b25lcy5ub2Rlcyk7XG4gICAgfSB3aGlsZSAocmVzdWx0cy5yZXBvc2l0b3J5Lm1pbGVzdG9uZXMucGFnZUluZm8uaGFzTmV4dFBhZ2UpO1xuXG4gICAgaWYgKGZvcm1hdCA9PT0gXCJKU09OTFwiKSB7XG4gICAgICBmb3IgKGNvbnN0IHJlbGVhc2Ugb2YgbWlsZXN0b25lcykge1xuICAgICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZShgJHtKU09OLnN0cmluZ2lmeShyZWxlYXNlKX1cXG5gKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGZvcm1hdCA9PT0gXCJKU09OXCIpIHtcbiAgICAgIHByb2Nlc3Muc3Rkb3V0LndyaXRlKEpTT04uc3RyaW5naWZ5KG1pbGVzdG9uZXMpKTtcbiAgICB9IGVsc2UgaWYgKGZvcm1hdCA9PT0gXCJDU1ZcIikge1xuICAgICAgY29uc3QgY3N2ID0gYXdhaXQganNvbmV4cG9ydChtaWxlc3RvbmVzLCB7IGZpbGxHYXBzOiB0cnVlIH0pO1xuICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoY3N2KTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==