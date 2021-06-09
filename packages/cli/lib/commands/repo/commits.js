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
        if (format === "JSONL") {
            for (const release of commits) {
                process.stdout.write(`${JSON.stringify(release)}\n`);
            }
        }
        else if (format === "JSON") {
            process.stdout.write(JSON.stringify(commits));
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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiY29tbWl0cy5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzIjpbIi4uLy4uLy4uL3NyYy9jb21tYW5kcy9yZXBvL2NvbW1pdHMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFCQUFxQjs7QUFFckIsNENBQW9EO0FBQ3BELGlDQUFtQztBQUNuQyxrQ0FBa0M7QUFDbEMsd0NBQXdDO0FBQ3hDLHlDQUF5QztBQUN6QyxxQ0FBcUM7QUFHckMsTUFBTSxLQUFLLEdBQUcsZUFBYyxDQUFDLHVCQUF1QixDQUFDLENBQUM7QUFFdEQsTUFBTSxrQkFBa0IsR0FBRzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0FnQzFCLENBQUM7QUFFRixNQUFxQixXQUFZLFNBQVEsY0FBVztJQWlCbEQsS0FBSyxDQUFDLEdBQUc7UUFDUCxNQUFNLE9BQU8sR0FBRyxFQUFFLENBQUM7UUFFbkIsTUFBTSxFQUFFLEtBQUssRUFBRSxHQUFHLElBQUksQ0FBQyxLQUFLLENBQUMsV0FBVyxDQUFDLENBQUM7UUFDMUMsTUFBTSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsSUFBSSxFQUFFLE1BQU0sRUFBRSxLQUFLLEVBQUUsS0FBSyxFQUFFLEdBQUcsS0FBSyxDQUFDO1FBRTVELElBQUksQ0FBQyxLQUFLLElBQUksQ0FBQyxLQUFLLEVBQUU7WUFDcEIsSUFBSSxDQUFDLElBQUksQ0FDUCxtR0FBbUcsQ0FDcEcsQ0FBQztTQUNIO1FBRUQsSUFBSSxLQUFLLENBQUM7UUFDVixJQUFJLEdBQUcsQ0FBQztRQUVSLElBQUksS0FBSyxFQUFFO1lBQ1QsS0FBSyxHQUFHLElBQUksQ0FBQyxhQUFhLENBQUMsT0FBTyxFQUFFLEtBQUssQ0FBQyxDQUFDO1NBQzVDO1FBRUQsSUFBSSxLQUFLLEVBQUU7WUFDVCxHQUFHLEdBQUcsSUFBSSxDQUFDLGFBQWEsQ0FBQyxLQUFLLEVBQUUsS0FBSyxDQUFDLENBQUM7U0FDeEM7UUFFRCxJQUFJLE9BQTBCLENBQUM7UUFDL0IsSUFBSSxN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QyxFQUNGLEtBQUssRUFBRSxlQUFTLENBQUMsTUFBTSxDQUFDO1FBQ3RCLFdBQVcsRUFBRSx5Q0FBeUM7S0FDdkQsQ0FBQyxFQUNGLEtBQUssRUFBRSxlQUFTLENBQUMsTUFBTSxDQUFDO1FBQ3RCLFdBQVcsRUFBRSwwQ0FBMEM7S0FDeEQsQ0FBQyxJQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFscyBwcm9jZXNzICovXG5cbmltcG9ydCB7IGZsYWdzIGFzIGZsYWdUeXBlcyB9IGZyb20gXCJAb2NsaWYvY29tbWFuZFwiO1xuaW1wb3J0IGNyZWF0ZURlYnVnZ2VyIGZyb20gXCJkZWJ1Z1wiO1xuaW1wb3J0ICogYXMgZG90IGZyb20gXCJkb3Qtb2JqZWN0XCI7XG5pbXBvcnQgKiBhcyBQcm9ncmVzc0JhciBmcm9tIFwicHJvZ3Jlc3NcIjtcbmltcG9ydCAqIGFzIGpzb25leHBvcnQgZnJvbSBcImpzb25leHBvcnRcIjtcbmltcG9ydCBCYXNlQ29tbWFuZCBmcm9tIFwiLi4vLi4vYmFzZVwiO1xuaW1wb3J0IHsgUmVwb3NpdG9yeUNvbW1pdHMgfSBmcm9tIFwiLi4vLi4vZ2l0aHViXCI7XG5cbmNvbnN0IGRlYnVnID0gY3JlYXRlRGVidWdnZXIoXCJleHBvcnRlcjpyZXBvOmNvbW1pdHNcIik7XG5cbmNvbnN0IExJU1RfQ09NTUlUU19RVUVSWSA9IGBxdWVyeSBsaXN0Q29tbWl0cygkb3duZXI6IFN0cmluZyEsICRyZXBvOiBTdHJpbmchLCAkYnJhbmNoOiBTdHJpbmchLCAkcGVyX3BhZ2U6IEludCA9IDUwLCAkYWZ0ZXI6IFN0cmluZywgJHNpbmNlOiBHaXRUaW1lc3RhbXAsICR1bnRpbDogR2l0VGltZXN0YW1wKSB7XG4gIHJlcG9zaXRvcnkob3duZXI6ICRvd25lciwgbmFtZTogJHJlcG8pIHtcbiAgICByZWYocXVhbGlmaWVkTmFtZTogJGJyYW5jaCkge1xuICAgICAgbmFtZVxuICAgICAgdGFyZ2V0IHtcbiAgICAgICAgLi4uIG9uIENvbW1pdCB7XG4gICAgICAgICAgaGlzdG9yeShmaXJzdDogJHBlcl9wYWdlLCBhZnRlcjogJGFmdGVyLCBzaW5jZTogJHNpbmNlLCB1bnRpbDogJHVudGlsKSB7XG4gICAgICAgICAgICBub2RlcyB7XG4gICAgICAgICAgICAgIGF1dGhvciB7XG4gICAgICAgICAgICAgICAgbmFtZVxuICAgICAgICAgICAgICAgIGVtYWlsXG4gICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgYWRkaXRpb25zXG4gICAgICAgICAgICAgIGFzc29jaWF0ZWRQdWxsUmVxdWVzdHMoZmlyc3Q6IDEwKSB7XG4gICAgICAgICAgICAgICAgbm9kZXMge1xuICAgICAgICAgICAgICAgICAgdGl0bGVcbiAgICAgICAgICAgICAgICAgIHVybFxuICAgICAgICAgICAgICAgIH1cbiAgICAgICAgICAgICAgfVxuICAgICAgICAgICAgICBtZXNzYWdlSGVhZGxpbmVcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHBhZ2VJbmZvIHtcbiAgICAgICAgICAgICAgZW5kQ3Vyc29yXG4gICAgICAgICAgICAgIGhhc05leHRQYWdlXG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0b3RhbENvdW50XG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5gO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZXBvQ29tbWl0cyBleHRlbmRzIEJhc2VDb21tYW5kIHtcbiAgc3RhdGljIGRlc2NyaXB0aW9uID0gXCJFeHBvcnQgR2l0SHViIENvbW1pdHMgZm9yIGEgcmVwb3NpdG9yeVwiO1xuXG4gIHN0YXRpYyBmbGFncyA9IHtcbiAgICAuLi5CYXNlQ29tbWFuZC5mbGFncyxcbiAgICBicmFuY2g6IGZsYWdUeXBlcy5zdHJpbmcoe1xuICAgICAgZGVmYXVsdDogXCJtYXN0ZXJcIixcbiAgICAgIGRlc2NyaXB0aW9uOiBcImdpdCBicmFuY2ggdG8gZXhwb3J0IGNvbW1pdHMgZm9yXCIsXG4gICAgfSksXG4gICAgc2luY2U6IGZsYWdUeXBlcy5zdHJpbmcoe1xuICAgICAgZGVzY3JpcHRpb246IFwic2VhcmNoIGNvbW1pdHMgY3JlYXRlZCBhZnRlciB5eXl5LW1tLWRkXCIsXG4gICAgfSksXG4gICAgdW50aWw6IGZsYWdUeXBlcy5zdHJpbmcoe1xuICAgICAgZGVzY3JpcHRpb246IFwic2VhcmNoIGNvbW1pdHMgY3JlYXRlZCBiZWZvcmUgeXl5eS1tbS1kZFwiLFxuICAgIH0pLFxuICB9O1xuXG4gIGFzeW5jIHJ1bigpIHtcbiAgICBjb25zdCBjb21taXRzID0gW107XG5cbiAgICBjb25zdCB7IGZsYWdzIH0gPSB0aGlzLnBhcnNlKFJlcG9Db21taXRzKTtcbiAgICBjb25zdCB7IGJyYW5jaCwgb3duZXIsIHJlcG8sIGZvcm1hdCwgc2luY2UsIHVudGlsIH0gPSBmbGFncztcblxuICAgIGlmICghc2luY2UgfHwgIXVudGlsKSB7XG4gICAgICB0aGlzLndhcm4oXG4gICAgICAgIFwiRXhwb3J0aW5nIGNvbW1pdHMgY2FuIGJlIHNsb3cuIFBsZWFzZSBjb25zaWRlciBuYXJyb3dpbmcgeW91ciB0aW1lIHJhbmdlIHdpdGggYHNpbmNlYCBhbmQgYHVudGlsYFwiXG4gICAgICApO1xuICAgIH1cblxuICAgIGxldCBzdGFydDtcbiAgICBsZXQgZW5kO1xuXG4gICAgaWYgKHNpbmNlKSB7XG4gICAgICBzdGFydCA9IHRoaXMucGFyc2VEYXRlRmxhZyhcInNpbmNlXCIsIHNpbmNlKTtcbiAgICB9XG5cbiAgICBpZiAodW50aWwpIHtcbiAgICAgIGVuZCA9IHRoaXMucGFyc2VEYXRlRmxhZyhcImVuZFwiLCB1bnRpbCk7XG4gICAgfVxuXG4gICAgbGV0IHJlc3VsdHM6IFJlcG9zaXRvcnlDb21taXRzO1xuICAgIGxldCBjdXJzb3I7XG4gICAgbGV0IHByb2dyZXNzO1xuXG4gICAgLy8gcGFnaW5hdGUgdGhyb3VnaCB0aGUgR3JhcGhRTCBxdWVyeSB1bnRpbCB3ZSBnZXQgZXZlcnl0aGluZ1xuICAgIGRlYnVnKFwiUHVsbGluZyBjb21taXRzIGZyb20gQVBJXCIpO1xuICAgIGRvIHtcbiAgICAgIHJlc3VsdHMgPSBhd2FpdCB0aGlzLmdpdGh1Yi5ncmFwaHFsKExJU1RfQ09NTUlUU19RVUVSWSwge1xuICAgICAgICBicmFuY2gsXG4gICAgICAgIG93bmVyLFxuICAgICAgICByZXBvLFxuICAgICAgICBhZnRlcjogY3Vyc29yLFxuICAgICAgICBzaW5jZTogc3RhcnQsXG4gICAgICAgIHVudGlsOiBlbmQsXG4gICAgICB9KTtcbiAgICAgIGN1cnNvciA9IHJlc3VsdHMucmVwb3NpdG9yeS5yZWYudGFyZ2V0Lmhpc3RvcnkucGFnZUluZm8uZW5kQ3Vyc29yO1xuXG4gICAgICBpZiAoIXByb2dyZXNzKSB7XG4gICAgICAgIGlmIChyZXN1bHRzLnJlcG9zaXRvcnkucmVmLnRhcmdldC5oaXN0b3J5LnRvdGFsQ291bnQgPT09IDApIHtcbiAgICAgICAgICB0aGlzLndhcm4oXCJObyBjb21taXRzIGZvdW5kXCIpO1xuICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb2dyZXNzID0gbmV3IFByb2dyZXNzQmFyKFxuICAgICAgICAgIFwiZmV0Y2hpbmcgY29tbWl0cyBbOmJhcl0gOmN1cnJlbnQvOnRvdGFsIDpwZXJjZW50XCIsXG4gICAgICAgICAge1xuICAgICAgICAgICAgY29tcGxldGU6IFwiPVwiLFxuICAgICAgICAgICAgaW5jb21wbGV0ZTogXCIgXCIsXG4gICAgICAgICAgICB3aWR0aDogMjAsXG4gICAgICAgICAgICB0b3RhbDogcmVzdWx0cy5yZXBvc2l0b3J5LnJlZi50YXJnZXQuaGlzdG9yeS50b3RhbENvdW50LFxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH1cblxuICAgICAgcHJvZ3Jlc3MudGljayhyZXN1bHRzLnJlcG9zaXRvcnkucmVmLnRhcmdldC5oaXN0b3J5Lm5vZGVzLmxlbmd0aCk7XG5cbiAgICAgIGZvciAoY29uc3QgY29tbWl0IG9mIHJlc3VsdHMucmVwb3NpdG9yeS5yZWYudGFyZ2V0Lmhpc3Rvcnkubm9kZXMpIHtcbiAgICAgICAgZG90Lm1vdmUoXG4gICAgICAgICAgXCJhc3NvY2lhdGVkUHVsbFJlcXVlc3RzLm5vZGVzXCIsXG4gICAgICAgICAgXCJhc3NvY2lhdGVkUHVsbFJlcXVlc3RzXCIsXG4gICAgICAgICAgY29tbWl0XG4gICAgICAgICk7XG4gICAgICB9XG4gICAgICBjb21taXRzLnB1c2goLi4ucmVzdWx0cy5yZXBvc2l0b3J5LnJlZi50YXJnZXQuaGlzdG9yeS5ub2Rlcyk7XG4gICAgfSB3aGlsZSAocmVzdWx0cy5yZXBvc2l0b3J5LnJlZi50YXJnZXQuaGlzdG9yeS5wYWdlSW5mby5oYXNOZXh0UGFnZSk7XG5cbiAgICBpZiAoZm9ybWF0ID09PSBcIkpTT05MXCIpIHtcbiAgICAgIGZvciAoY29uc3QgcmVsZWFzZSBvZiBjb21taXRzKSB7XG4gICAgICAgIHByb2Nlc3Muc3Rkb3V0LndyaXRlKGAke0pTT04uc3RyaW5naWZ5KHJlbGVhc2UpfVxcbmApO1xuICAgICAgfVxuICAgIH0gZWxzZSBpZiAoZm9ybWF0ID09PSBcIkpTT05cIikge1xuICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoSlNPTi5zdHJpbmdpZnkoY29tbWl0cykpO1xuICAgIH0gZWxzZSBpZiAoZm9ybWF0ID09PSBcIkNTVlwiKSB7XG4gICAgICBjb25zdCBjc3YgPSBhd2FpdCBqc29uZXhwb3J0KGNvbW1pdHMsIHsgZmlsbEdhcHM6IHRydWUgfSk7XG4gICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZShjc3YpO1xuICAgIH1cbiAgfVxufVxuIl19