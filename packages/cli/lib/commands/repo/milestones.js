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
        if (format === "JSON") {
            for (const release of milestones) {
                process.stdout.write(`${JSON.stringify(release)}\n`);
            }
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoibWlsZXN0b25lcy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tYW5kcy9yZXBvL21pbGVzdG9uZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFCQUFxQjs7QUFFckIsaUNBQW1DO0FBQ25DLHdDQUF3QztBQUN4Qyx5Q0FBeUM7QUFDekMscUNBQXFDO0FBR3JDLE1BQU0sS0FBSyxHQUFHLGVBQWMsQ0FBQywwQkFBMEIsQ0FBQyxDQUFDO0FBRXpELE1BQU0sbUJBQW1CLEdBQUc7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O0NBMEIzQixDQUFDO0FBRUYsTUFBcUIsY0FBZSxTQUFRLGNBQVc7SUFPckQsS0FBSyxDQUFDLEdBQUc7UUFDUCxNQUFNLFVBQVUsR0FBRyxFQUFFLENBQUM7UUFFdEIsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsY0FBYyxDQUFDLENBQUM7UUFDN0MsTUFBTSxFQUFFLEtBQUssRUFBRSxJQUFJLEVBQUUsTUFBTSxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBRXRDLElBQUksT0FBNkIsQ0FBQztRQUNsQyxJQUFJLE1BQU0sQ0FBQztRQUNYLElBQUksUUFBUSxDQUFDO1FBRWIsNkRBQTZEO1FBQzdELEtBQUssQ0FBQyw2QkFBNkIsQ0FBQyxDQUFDO1FBQ3JDLEdBQUc7WUFDRCxPQUFPLEdBQUcsTUFBTSxJQUFJLENBQUMsTUFBTSxDQUFDLE9BQU8sQ0FBQyxtQkFBbUIsRUFBRTtnQkFDdkQsS0FBSztnQkFDTCxJQUFJO2dCQUNKLEtBQUssRUFBRSxNQUFNO2FBQ2QsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUM7WUFFMUQsSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDYixJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLFVBQVUsS0FBSyxDQUFDLEVBQUU7b0JBQ2xELElBQUksQ0FBQyxJQUFJLENBQUMscUJBQXFCLENBQUMsQ0FBQztvQkFDakMsT0FBTyxDQUFDLElBQUksQ0FBQyxDQUFDLENBQUMsQ0FBQztpQkFDakI7Z0JBRUQsUUFBUSxHQUFHLElBQUksV0FBVyxDQUN4QixxREFBcUQsRUFDckQ7b0JBQ0UsUUFBUSxFQUFFLEdBQUc7b0JBQ2IsVUFBVSxFQUFFLEdBQUc7b0JBQ2YsS0FBSyxFQUFFLEVBQUU7b0JBQ1QsS0FBSyxFQUFFLE9BQU8sQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLFVBQVU7aUJBQ2hELENBQ0YsQ0FBQzthQUNIO1lBRUQsUUFBUSxDQUFDLElBQUksQ0FBQyxPQUFPLENBQUMsVUFBVSxDQUFDLFVBQVUsQ0FBQyxLQUFLLENBQUMsTUFBTSxDQUFDLENBQUM7WUFDMUQsVUFBVSxDQUFDLElBQUksQ0FBQyxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsVUFBVSxDQUFDLEtBQUssQ0FBQyxDQUFDO1NBQ3pELFFBQVEsT0FBTyxDQUFDLFVBQVUsQ0FBQyxVQUFVLENBQUMsUUFBUSxDQUFDLFdBQVcsRUFBRTtRQUU3RCxJQUFJLE1BQU0sS0FBSyxNQUFNLEVBQUU7WUFDckIsS0FBSyxNQUFNLE9BQU8sSUFBSSxVQUFVLEVBQUU7Z0JBQ2hDLE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsSUFBSSxDQUFDLFNBQVMsQ0FBQyxPQUFPLENBQUMsSUFBSSxDQUFDLENBQUM7YUFDdEQ7U0FDRjthQUFNLElBQUksTUFBTSxLQUFLLEtBQUssRUFBRTtZQUMzQixNQUFNLEdBQUcsR0FBRyxNQUFNLFVBQVUsQ0FBQyxVQUFVLEVBQUUsRUFBRSxRQUFRLEVBQUUsSUFBSSxFQUFFLENBQUMsQ0FBQztZQUM3RCxPQUFPLENBQUMsTUFBTSxDQUFDLEtBQUssQ0FBQyxHQUFHLENBQUMsQ0FBQztTQUMzQjtJQUNILENBQUM7O0FBeERILGlDQXlEQztBQXhEUSwwQkFBVyxHQUFHLDJDQUEyQyxDQUFDO0FBRTFELG9CQUFLLHFCQUNQLGNBQVcsQ0FBQyxLQUFLLEVBQ3BCIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFscyBwcm9jZXNzICovXG5cbmltcG9ydCBjcmVhdGVEZWJ1Z2dlciBmcm9tIFwiZGVidWdcIjtcbmltcG9ydCAqIGFzIFByb2dyZXNzQmFyIGZyb20gXCJwcm9ncmVzc1wiO1xuaW1wb3J0ICogYXMganNvbmV4cG9ydCBmcm9tIFwianNvbmV4cG9ydFwiO1xuaW1wb3J0IEJhc2VDb21tYW5kIGZyb20gXCIuLi8uLi9iYXNlXCI7XG5pbXBvcnQgeyBSZXBvc2l0b3J5TWlsZXN0b25lcyB9IGZyb20gXCIuLi8uLi9naXRodWJcIjtcblxuY29uc3QgZGVidWcgPSBjcmVhdGVEZWJ1Z2dlcihcImV4cG9ydGVyOnJlcG86bWlsZXN0b25lc1wiKTtcblxuY29uc3QgTElTVF9SRUxFQVNFU19RVUVSWSA9IGBxdWVyeSBsaXN0TWlsZXN0b25lcygkb3duZXI6IFN0cmluZyEsICRyZXBvOiBTdHJpbmchLCAkcGVyX3BhZ2U6IEludCA9IDEwMCwgJGFmdGVyOiBTdHJpbmcpIHtcbiAgcmVwb3NpdG9yeShvd25lcjogJG93bmVyLCBuYW1lOiAkcmVwbykge1xuICAgIG1pbGVzdG9uZXMoZmlyc3Q6ICRwZXJfcGFnZSwgYWZ0ZXI6ICRhZnRlcikge1xuICAgICAgbm9kZXMge1xuICAgICAgICBjbG9zZWRcbiAgICAgICAgY2xvc2VkQXRcbiAgICAgICAgY3JlYXRlZEF0XG4gICAgICAgIGNyZWF0b3Ige1xuICAgICAgICAgIGxvZ2luXG4gICAgICAgIH1cbiAgICAgICAgZGVzY3JpcHRpb25cbiAgICAgICAgZHVlT25cbiAgICAgICAgaWRcbiAgICAgICAgbnVtYmVyXG4gICAgICAgIHN0YXRlXG4gICAgICAgIHRpdGxlXG4gICAgICAgIHVwZGF0ZWRBdFxuICAgICAgfVxuICAgICAgcGFnZUluZm8ge1xuICAgICAgICBlbmRDdXJzb3JcbiAgICAgICAgaGFzTmV4dFBhZ2VcbiAgICAgIH1cbiAgICAgIHRvdGFsQ291bnRcbiAgICB9XG4gIH1cbn1cbmA7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlcG9NaWxlc3RvbmVzIGV4dGVuZHMgQmFzZUNvbW1hbmQge1xuICBzdGF0aWMgZGVzY3JpcHRpb24gPSBcIkV4cG9ydCBHaXRIdWIgTWlsZXN0b25lcyBmb3IgYSByZXBvc2l0b3J5XCI7XG5cbiAgc3RhdGljIGZsYWdzID0ge1xuICAgIC4uLkJhc2VDb21tYW5kLmZsYWdzLFxuICB9O1xuXG4gIGFzeW5jIHJ1bigpIHtcbiAgICBjb25zdCBtaWxlc3RvbmVzID0gW107XG5cbiAgICBjb25zdCB7IGZsYWdzIH0gPSB0aGlzLnBhcnNlKFJlcG9NaWxlc3RvbmVzKTtcbiAgICBjb25zdCB7IG93bmVyLCByZXBvLCBmb3JtYXQgfSA9IGZsYWdzO1xuXG4gICAgbGV0IHJlc3VsdHM6IFJlcG9zaXRvcnlNaWxlc3RvbmVzO1xuICAgIGxldCBjdXJzb3I7XG4gICAgbGV0IHByb2dyZXNzO1xuXG4gICAgLy8gcGFnaW5hdGUgdGhyb3VnaCB0aGUgR3JhcGhRTCBxdWVyeSB1bnRpbCB3ZSBnZXQgZXZlcnl0aGluZ1xuICAgIGRlYnVnKFwiUHVsbGluZyBtaWxlc3RvbmVzIGZyb20gQVBJXCIpO1xuICAgIGRvIHtcbiAgICAgIHJlc3VsdHMgPSBhd2FpdCB0aGlzLmdpdGh1Yi5ncmFwaHFsKExJU1RfUkVMRUFTRVNfUVVFUlksIHtcbiAgICAgICAgb3duZXIsXG4gICAgICAgIHJlcG8sXG4gICAgICAgIGFmdGVyOiBjdXJzb3IsXG4gICAgICB9KTtcbiAgICAgIGN1cnNvciA9IHJlc3VsdHMucmVwb3NpdG9yeS5taWxlc3RvbmVzLnBhZ2VJbmZvLmVuZEN1cnNvcjtcblxuICAgICAgaWYgKCFwcm9ncmVzcykge1xuICAgICAgICBpZiAocmVzdWx0cy5yZXBvc2l0b3J5Lm1pbGVzdG9uZXMudG90YWxDb3VudCA9PT0gMCkge1xuICAgICAgICAgIHRoaXMud2FybihcIk5vIG1pbGVzdG9uZXMgZm91bmRcIik7XG4gICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvZ3Jlc3MgPSBuZXcgUHJvZ3Jlc3NCYXIoXG4gICAgICAgICAgXCJmZXRjaGluZyBtaWxlc3RvbmVzIFs6YmFyXSA6Y3VycmVudC86dG90YWwgOnBlcmNlbnRcIixcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjb21wbGV0ZTogXCI9XCIsXG4gICAgICAgICAgICBpbmNvbXBsZXRlOiBcIiBcIixcbiAgICAgICAgICAgIHdpZHRoOiAyMCxcbiAgICAgICAgICAgIHRvdGFsOiByZXN1bHRzLnJlcG9zaXRvcnkubWlsZXN0b25lcy50b3RhbENvdW50LFxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgcHJvZ3Jlc3MudGljayhyZXN1bHRzLnJlcG9zaXRvcnkubWlsZXN0b25lcy5ub2Rlcy5sZW5ndGgpO1xuICAgICAgbWlsZXN0b25lcy5wdXNoKC4uLnJlc3VsdHMucmVwb3NpdG9yeS5taWxlc3RvbmVzLm5vZGVzKTtcbiAgICB9IHdoaWxlIChyZXN1bHRzLnJlcG9zaXRvcnkubWlsZXN0b25lcy5wYWdlSW5mby5oYXNOZXh0UGFnZSk7XG5cbiAgICBpZiAoZm9ybWF0ID09PSBcIkpTT05cIikge1xuICAgICAgZm9yIChjb25zdCByZWxlYXNlIG9mIG1pbGVzdG9uZXMpIHtcbiAgICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoYCR7SlNPTi5zdHJpbmdpZnkocmVsZWFzZSl9XFxuYCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChmb3JtYXQgPT09IFwiQ1NWXCIpIHtcbiAgICAgIGNvbnN0IGNzdiA9IGF3YWl0IGpzb25leHBvcnQobWlsZXN0b25lcywgeyBmaWxsR2FwczogdHJ1ZSB9KTtcbiAgICAgIHByb2Nlc3Muc3Rkb3V0LndyaXRlKGNzdik7XG4gICAgfVxuICB9XG59XG4iXX0=