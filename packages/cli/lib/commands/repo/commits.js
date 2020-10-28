"use strict";
/* globals process */
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const debug_1 = require("debug");
const dot = require("dot-object");
const ProgressBar = require("progress");
const jsonexport = require("jsonexport");
const base_1 = require("../../base");
const debug = debug_1.default("exporter:repo:commits");
const LIST_COMMITS_QUERY = `query listCommits($owner: String!, $repo: String!, $branch: String!, $per_page: Int = 50, $after: String, $since: GitTimestamp, $until: GitTimestamp) {
  repository(owner: $owner, name: $repo) {
    ref(qualifiedName: $branch) {
      name
      target {
        ... on Commit {
          history(first: $per_page, after: $after, since: $since, until: $until) {
            nodes {
              author {
                name
                email
              }
              additions
              associatedPullRequests(first: 10) {
                nodes {
                  title
                  url
                }
              }
              messageHeadline
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
  }
}
`;
class RepoCommits extends base_1.default {
    async run() {
        const commits = [];
        const { flags } = this.parse(RepoCommits);
        const { branch, owner, repo, format, since, until } = flags;
        if (!since || !until) {
            this.warn("Exporting commits can be slow. Please consider narrowing your time range with `since` and `until`");
        }
        let start;
        let end;
        if (since) {
            start = this.parseDateFlag("since", since);
        }
        if (until) {
            end = this.parseDateFlag("end", until);
        }
        let results;
        let cursor;
        let progress;
        // paginate through the GraphQL query until we get everything
        debug("Pulling commits from API");
        do {
            results = await this.github.graphql(LIST_COMMITS_QUERY, {
                branch,
                owner,
                repo,
                after: cursor,
                since: start,
                until: end,
            });
            cursor = results.repository.ref.target.history.pageInfo.endCursor;
            if (!progress) {
                if (results.repository.ref.target.history.totalCount === 0) {
                    this.warn("No commits found");
                    process.exit(1);
                }
                progress = new ProgressBar("fetching commits [:bar] :current/:total :percent", {
                    complete: "=",
                    incomplete: " ",
                    width: 20,
                    total: results.repository.ref.target.history.totalCount,
                });
            }
            progress.tick(results.repository.ref.target.history.nodes.length);
            for (const commit of results.repository.ref.target.history.nodes) {
                dot.move("associatedPullRequests.nodes", "associatedPullRequests", commit);
            }
            commits.push(...results.repository.ref.target.history.nodes);
        } while (results.repository.ref.target.history.pageInfo.hasNextPage);
        if (format === "JSON") {
            for (const release of commits) {
                process.stdout.write(`${JSON.stringify(release)}\n`);
            }
        }
        else if (format === "CSV") {
            const csv = await jsonexport(commits, { fillGaps: true });
            process.stdout.write(csv);
        }
    }
}
exports.default = RepoCommits;
RepoCommits.description = "Export GitHub Commits for a repository";
RepoCommits.flags = Object.assign(Object.assign({}, base_1.default.flags), { branch: command_1.flags.string({
        default: "master",
        description: "git branch to export commits for",
    }), since: command_1.flags.string({
        description: "search commits created after yyyy-mm-dd",
    }), until: command_1.flags.string({
        description: "search commits created before yyyy-mm-dd",
    }) });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWl0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tYW5kcy9yZXBvL2NvbW1pdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFCQUFxQjs7QUFFckIsNENBQW9EO0FBQ3BELGlDQUFtQztBQUNuQyxrQ0FBa0M7QUFDbEMsd0NBQXdDO0FBQ3hDLHlDQUF5QztBQUN6QyxxQ0FBcUM7QUFHckMsTUFBTSxLQUFLLEdBQUcsZUFBYyxDQUFDLHVCQUF1QixDQUFDLENBQUM7QUFFdEQsTUFBTSxrQkFBa0IsR0FBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FnQzFCLENBQUM7QUFFRixNQUFxQixXQUFZLFNBQVEsY0FBVztJQWlCbEQsS0FBSyxDQUFDLEdBQUc7UUFDUCxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFFbkIsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDMUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBRTVELElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDcEIsSUFBSSxDQUFDLElBQUksQ0FDUCxtR0FBbUcsQ0FDcEcsQ0FBQztTQUNIO1FBRUQsSUFBSSxLQUFLLENBQUM7UUFDVixJQUFJLEdBQUcsQ0FBQztRQUVSLElBQUksS0FBSyxFQUFFO1lBQ1QsS0FBSyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQzVDO1FBRUQsSUFBSSxLQUFLLEVBQUU7WUFDVCxHQUFHLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDeEM7UUFFRCxJQUFJLE9BQTBCLENBQUM7UUFDL0IsSUFBSSxN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V0FBVyxFQUFFLDBDQUEwQztLQUN4RCxDQUFDLElBQ0YiLCJzb3VyY2VzQ29udGVudCI6WyIvKiBnbG9iYWxzIHByb2Nlc3MgKi9cblxuaW1wb3J0IHsgZmxhZ3MgYXMgZmxhZ1R5cGVzIH0gZnJvbSBcIkBvY2xpZi9jb21tYW5kXCI7XG5pbXBvcnQgY3JlYXRlRGVidWdnZXIgZnJvbSBcImRlYnVnXCI7XG5pbXBvcnQgKiBhcyBkb3QgZnJvbSBcImRvdC1vYmplY3RcIjtcbmltcG9ydCAqIGFzIFByb2dyZXNzQmFyIGZyb20gXCJwcm9ncmVzc1wiO1xuaW1wb3J0ICogYXMganNvbmV4cG9ydCBmcm9tIFwianNvbmV4cG9ydFwiO1xuaW1wb3J0IEJhc2VDb21tYW5kIGZyb20gXCIuLi8uLi9iYXNlXCI7XG5pbXBvcnQgeyBSZXBvc2l0b3J5Q29tbWl0cyB9IGZyb20gXCIuLi8uLi9naXRodWJcIjtcblxuY29uc3QgZGVidWcgPSBjcmVhdGVEZWJ1Z2dlcihcImV4cG9ydGVyOnJlcG86Y29tbWl0c1wiKTtcblxuY29uc3QgTElTVF9DT01NSVRTX1FVRVJZID0gYHF1ZXJ5IGxpc3RDb21taXRzKCRvd25lcjogU3RyaW5nISwgJHJlcG86IFN0cmluZyEsICRicmFuY2g6IFN0cmluZyEsICRwZXJfcGFnZTogSW50ID0gNTAsICRhZnRlcjogU3RyaW5nLCAkc2luY2U6IEdpdFRpbWVzdGFtcCwgJHVudGlsOiBHaXRUaW1lc3RhbXApIHtcbiAgcmVwb3NpdG9yeShvd25lcjogJG93bmVyLCBuYW1lOiAkcmVwbykge1xuICAgIHJlZihxdWFsaWZpZWROYW1lOiAkYnJhbmNoKSB7XG4gICAgICBuYW1lXG4gICAgICB0YXJnZXQge1xuICAgICAgICAuLi4gb24gQ29tbWl0IHtcbiAgICAgICAgICBoaXN0b3J5KGZpcnN0OiAkcGVyX3BhZ2UsIGFmdGVyOiAkYWZ0ZXIsIHNpbmNlOiAkc2luY2UsIHVudGlsOiAkdW50aWwpIHtcbiAgICAgICAgICAgIG5vZGVzIHtcbiAgICAgICAgICAgICAgYXV0aG9yIHtcbiAgICAgICAgICAgICAgICBuYW1lXG4gICAgICAgICAgICAgICAgZW1haWxcbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBhZGRpdGlvbnNcbiAgICAgICAgICAgICAgYXNzb2NpYXRlZFB1bGxSZXF1ZXN0cyhmaXJzdDogMTApIHtcbiAgICAgICAgICAgICAgICBub2RlcyB7XG4gICAgICAgICAgICAgICAgICB0aXRsZVxuICAgICAgICAgICAgICAgICAgdXJsXG4gICAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICB9XG4gICAgICAgICAgICAgIG1lc3NhZ2VIZWFkbGluZVxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgcGFnZUluZm8ge1xuICAgICAgICAgICAgICBlbmRDdXJzb3JcbiAgICAgICAgICAgICAgaGFzTmV4dFBhZ2VcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRvdGFsQ291bnRcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgIH1cbiAgICB9XG4gIH1cbn1cbmA7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFJlcG9Db21taXRzIGV4dGVuZHMgQmFzZUNvbW1hbmQge1xuICBzdGF0aWMgZGVzY3JpcHRpb24gPSBcIkV4cG9ydCBHaXRIdWIgQ29tbWl0cyBmb3IgYSByZXBvc2l0b3J5XCI7XG5cbiAgc3RhdGljIGZsYWdzID0ge1xuICAgIC4uLkJhc2VDb21tYW5kLmZsYWdzLFxuICAgIGJyYW5jaDogZmxhZ1R5cGVzLnN0cmluZyh7XG4gICAgICBkZWZhdWx0OiBcIm1hc3RlclwiLFxuICAgICAgZGVzY3JpcHRpb246IFwiZ2l0IGJyYW5jaCB0byBleHBvcnQgY29tbWl0cyBmb3JcIixcbiAgICB9KSxcbiAgICBzaW5jZTogZmxhZ1R5cGVzLnN0cmluZyh7XG4gICAgICBkZXNjcmlwdGlvbjogXCJzZWFyY2ggY29tbWl0cyBjcmVhdGVkIGFmdGVyIHl5eXktbW0tZGRcIixcbiAgICB9KSxcbiAgICB1bnRpbDogZmxhZ1R5cGVzLnN0cmluZyh7XG4gICAgICBkZXNjcmlwdGlvbjogXCJzZWFyY2ggY29tbWl0cyBjcmVhdGVkIGJlZm9yZSB5eXl5LW1tLWRkXCIsXG4gICAgfSksXG4gIH07XG5cbiAgYXN5bmMgcnVuKCkge1xuICAgIGNvbnN0IGNvbW1pdHMgPSBbXTtcblxuICAgIGNvbnN0IHsgZmxhZ3MgfSA9IHRoaXMucGFyc2UoUmVwb0NvbW1pdHMpO1xuICAgIGNvbnN0IHsgYnJhbmNoLCBvd25lciwgcmVwbywgZm9ybWF0LCBzaW5jZSwgdW50aWwgfSA9IGZsYWdzO1xuXG4gICAgaWYgKCFzaW5jZSB8fCAhdW50aWwpIHtcbiAgICAgIHRoaXMud2FybihcbiAgICAgICAgXCJFeHBvcnRpbmcgY29tbWl0cyBjYW4gYmUgc2xvdy4gUGxlYXNlIGNvbnNpZGVyIG5hcnJvd2luZyB5b3VyIHRpbWUgcmFuZ2Ugd2l0aCBgc2luY2VgIGFuZCBgdW50aWxgXCJcbiAgICAgICk7XG4gICAgfVxuXG4gICAgbGV0IHN0YXJ0O1xuICAgIGxldCBlbmQ7XG5cbiAgICBpZiAoc2luY2UpIHtcbiAgICAgIHN0YXJ0ID0gdGhpcy5wYXJzZURhdGVGbGFnKFwic2luY2VcIiwgc2luY2UpO1xuICAgIH1cblxuICAgIGlmICh1bnRpbCkge1xuICAgICAgZW5kID0gdGhpcy5wYXJzZURhdGVGbGFnKFwiZW5kXCIsIHVudGlsKTtcbiAgICB9XG5cbiAgICBsZXQgcmVzdWx0czogUmVwb3NpdG9yeUNvbW1pdHM7XG4gICAgbGV0IGN1cnNvcjtcbiAgICBsZXQgcHJvZ3Jlc3M7XG5cbiAgICAvLyBwYWdpbmF0ZSB0aHJvdWdoIHRoZSBHcmFwaFFMIHF1ZXJ5IHVudGlsIHdlIGdldCBldmVyeXRoaW5nXG4gICAgZGVidWcoXCJQdWxsaW5nIGNvbW1pdHMgZnJvbSBBUElcIik7XG4gICAgZG8ge1xuICAgICAgcmVzdWx0cyA9IGF3YWl0IHRoaXMuZ2l0aHViLmdyYXBocWwoTElTVF9DT01NSVRTX1FVRVJZLCB7XG4gICAgICAgIGJyYW5jaCxcbiAgICAgICAgb3duZXIsXG4gICAgICAgIHJlcG8sXG4gICAgICAgIGFmdGVyOiBjdXJzb3IsXG4gICAgICAgIHNpbmNlOiBzdGFydCxcbiAgICAgICAgdW50aWw6IGVuZCxcbiAgICAgIH0pO1xuICAgICAgY3Vyc29yID0gcmVzdWx0cy5yZXBvc2l0b3J5LnJlZi50YXJnZXQuaGlzdG9yeS5wYWdlSW5mby5lbmRDdXJzb3I7XG5cbiAgICAgIGlmICghcHJvZ3Jlc3MpIHtcbiAgICAgICAgaWYgKHJlc3VsdHMucmVwb3NpdG9yeS5yZWYudGFyZ2V0Lmhpc3RvcnkudG90YWxDb3VudCA9PT0gMCkge1xuICAgICAgICAgIHRoaXMud2FybihcIk5vIGNvbW1pdHMgZm91bmRcIik7XG4gICAgICAgICAgcHJvY2Vzcy5leGl0KDEpO1xuICAgICAgICB9XG5cbiAgICAgICAgcHJvZ3Jlc3MgPSBuZXcgUHJvZ3Jlc3NCYXIoXG4gICAgICAgICAgXCJmZXRjaGluZyBjb21taXRzIFs6YmFyXSA6Y3VycmVudC86dG90YWwgOnBlcmNlbnRcIixcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjb21wbGV0ZTogXCI9XCIsXG4gICAgICAgICAgICBpbmNvbXBsZXRlOiBcIiBcIixcbiAgICAgICAgICAgIHdpZHRoOiAyMCxcbiAgICAgICAgICAgIHRvdGFsOiByZXN1bHRzLnJlcG9zaXRvcnkucmVmLnRhcmdldC5oaXN0b3J5LnRvdGFsQ291bnQsXG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBwcm9ncmVzcy50aWNrKHJlc3VsdHMucmVwb3NpdG9yeS5yZWYudGFyZ2V0Lmhpc3Rvcnkubm9kZXMubGVuZ3RoKTtcblxuICAgICAgZm9yIChjb25zdCBjb21taXQgb2YgcmVzdWx0cy5yZXBvc2l0b3J5LnJlZi50YXJnZXQuaGlzdG9yeS5ub2Rlcykge1xuICAgICAgICBkb3QubW92ZShcbiAgICAgICAgICBcImFzc29jaWF0ZWRQdWxsUmVxdWVzdHMubm9kZXNcIixcbiAgICAgICAgICBcImFzc29jaWF0ZWRQdWxsUmVxdWVzdHNcIixcbiAgICAgICAgICBjb21taXRcbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGNvbW1pdHMucHVzaCguLi5yZXN1bHRzLnJlcG9zaXRvcnkucmVmLnRhcmdldC5oaXN0b3J5Lm5vZGVzKTtcbiAgICB9IHdoaWxlIChyZXN1bHRzLnJlcG9zaXRvcnkucmVmLnRhcmdldC5oaXN0b3J5LnBhZ2VJbmZvLmhhc05leHRQYWdlKTtcblxuICAgIGlmIChmb3JtYXQgPT09IFwiSlNPTlwiKSB7XG4gICAgICBmb3IgKGNvbnN0IHJlbGVhc2Ugb2YgY29tbWl0cykge1xuICAgICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZShgJHtKU09OLnN0cmluZ2lmeShyZWxlYXNlKX1cXG5gKTtcbiAgICAgIH1cbiAgICB9IGVsc2UgaWYgKGZvcm1hdCA9PT0gXCJDU1ZcIikge1xuICAgICAgY29uc3QgY3N2ID0gYXdhaXQganNvbmV4cG9ydChjb21taXRzLCB7IGZpbGxHYXBzOiB0cnVlIH0pO1xuICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoY3N2KTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==