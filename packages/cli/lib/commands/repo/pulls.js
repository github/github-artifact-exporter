"use strict";
/* globals process */
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const dot = require("dot-object");
const debug_1 = require("debug");
const ProgressBar = require("progress");
const jsonexport = require("jsonexport");
const base_1 = require("../../base");
const debug = debug_1.default("exporter:repo:pulls");
const LIST_PULLS_QUERY = `query listPulls($owner: String!, $repo: String!, $per_page: Int = 10, $after: String) {
  repository(owner: $owner, name: $repo) {
    pullRequests(first: $per_page, after: $after) {
      nodes {
        reviewDecision
        merged
        mergedAt
        mergedBy {
          login
        }
        assignees(first: 10) {
          nodes {
            login
          }
        }
        author {
          login
        }
        comments(first: 10) {
          nodes {
            author {
              login
            }
            body
            createdAt
          }
          pageInfo {
            endCursor
            hasNextPage
          }
          totalCount
        }
        createdAt
        id
        labels(first: 100) {
          nodes {
            name
          }
        }
        state
        title
        updatedAt
        milestone {
          title
          state
          url
        }
        closedAt
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
const LIST_COMMENTS_QUERY = `query listComments($id: ID!, $per_page: Int = 100, $after: String) {
  node(id: $id) {
    ... on PullRequest {
      comments(first: $per_page, after: $after) {
        nodes {
          author {
            login
          }
          body
          createdAt
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
`;
class RepoPulls extends base_1.default {
    async fetchPulls(query, owner, repo) {
        const pulls = [];
        let results;
        let cursor;
        let progress;
        // paginate through the GraphQL Search query until we get everything
        debug("Pulling pull requests from API");
        do {
            results = await this.github.graphql(query, {
                owner,
                repo,
                after: cursor,
            });
            cursor = results.repository.pullRequests.pageInfo.endCursor;
            if (!progress) {
                if (results.repository.pullRequests.totalCount === 0) {
                    this.warn("No pull requests found");
                    process.exit(1);
                }
                progress = new ProgressBar("fetching pulls [:bar] :current/:total :percent", {
                    complete: "=",
                    incomplete: " ",
                    width: 20,
                    total: results.repository.pullRequests.totalCount,
                });
            }
            progress.tick(results.repository.pullRequests.nodes.length);
            pulls.push(...results.repository.pullRequests.nodes);
        } while (results.repository.pullRequests.pageInfo.hasNextPage);
        return pulls;
    }
    async fetchComments(query, pull, 
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    progress) {
        let results = {
            node: {
                comments: pull.comments,
            },
        };
        while (results.node.comments.pageInfo.hasNextPage) {
            results = await this.github.graphql(query, {
                id: pull.id,
                after: results.node.comments.pageInfo.endCursor,
            });
            pull.comments.nodes.push(...results.node.comments.nodes);
            progress.tick(results.node.comments.nodes.length);
        }
    }
    async run() {
        const { flags } = this.parse(RepoPulls);
        const { owner, repo, format, since, until } = flags;
        let pulls = await this.fetchPulls(LIST_PULLS_QUERY, owner, repo);
        // filter out pulls before since or after until
        if (since) {
            pulls = pulls.filter((pull) => {
                return +new Date(pull.createdAt) >= +new Date(since);
            });
        }
        if (until) {
            pulls = pulls.filter((pull) => {
                return +new Date(until) >= +new Date(pull.createdAt);
            });
        }
        const pullsWithComments = pulls.filter((issue) => issue.comments.totalCount - issue.comments.nodes.length > 0);
        if (pullsWithComments.length > 0) {
            const remainingComments = pullsWithComments
                .map((issue) => {
                return issue.comments.totalCount - issue.comments.nodes.length;
            })
                .reduce((x, y) => x + y);
            const progress = new ProgressBar("fetching comments [:bar] :current/:total :percent", {
                complete: "=",
                incomplete: " ",
                width: 20,
                total: remainingComments,
            });
            const promises = pullsWithComments.map((issue) => this.fetchComments(LIST_COMMENTS_QUERY, issue, progress));
            await Promise.all(promises);
        }
        // massage the data to remove GraphQL pagination data
        for (const pull of pulls) {
            dot.del("id", pull);
            dot.move("assignees.nodes", "assignees", pull);
            dot.move("comments.nodes", "comments", pull);
            dot.move("labels.nodes", "labels", pull);
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            pull.labels = pull.labels.map(({ name }) => name).join(", ");
        }
        if (format === "JSONL") {
            for (const pull of pulls) {
                process.stdout.write(`${JSON.stringify(pull)}\n`);
            }
        }
        else if (format === "JSON") {
            process.stdout.write(JSON.stringify(pulls));
        }
        else if (format === "CSV") {
            const csv = await jsonexport(pulls, { fillGaps: true });
            process.stdout.write(csv);
        }
    }
}
exports.default = RepoPulls;
RepoPulls.description = "Export GitHub Pull Requests for a repository";
RepoPulls.flags = Object.assign(Object.assign({}, base_1.default.flags), { owner: command_1.flags.string({
        dependsOn: ["repo"],
        description: "GitHub repository owner",
        required: true,
    }), repo: command_1.flags.string({
        dependsOn: ["owner"],
        description: "GitHub repository name",
        required: true,
    }), since: command_1.flags.string({
        description: "search pull requests created after yyyy-mm-dd",
    }), until: command_1.flags.string({
        description: "search pull requests created before yyyy-mm-dd",
    }) });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVsbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29tbWFuZHMvcmVwby9wdWxscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUJBQXFCOztBQUVyQiw0Q0FBb0Q7QUFDcEQsa0NBQWtDO0FBQ2xDLGlDQUFtQztBQUNuQyx3Q0FBd0M7QUFDeEMseUNBQXlDO0FBQ3pDLHFDQUFxQztBQU9yQyxNQUFNLEtBQUssR0FBRyxlQUFjLENBQUMscUJBQXFCLENBQUMsQ0FBQztBQUVwRCxNQUFNLGdCQUFnQixHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F5RHhCLENBQUM7QUFFRixNQUFNLG1CQUFtQixHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW9CM0IsQ0FBQztBQUVGLE1BQXFCLFNBQVUsU0FBUSxjQUFXO0lBdUJoRCxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQWEsRUFBRSxLQUFhLEVBQUUsSUFBWTtRQUN6RCxNQUFNLEtBQUssR0FBRyxFQUFFLENBQUM7UUFFakIsSUFBSSxPQUErQixDQUFDO1FBQ3BDLElBQUksTUFBTSxDQUFDO1FBQ1gsSUFBSSxRQUFRLENBQUM7UUFFYixvRUFBb0U7UUFDcEUsS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7UUFDeEMsR0FBRztZQUNELE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRTtnQkFDekMsS0FBSztnQkFDTCxJQUFJO2dCQUNKLEtBQUssRUFBRSxNQUFNO2FBQ2QsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUM7WUFFNUQsSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDYixJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLFVBQVUsS0FBSyxDQUFDLEVB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STtLQUNmLENBQUMsRUFDRixJQUFJLEVBQUUsZUFBUyxDQUFDLE1BQU0sQ0FBQztRQUNyQixTQUFTLEVBQUUsQ0FBQyxPQUFPLENBQUM7UUFDcEIsV0FBVyxFQUFFLHdCQUF3QjtRQUNyQyxRQUFRLEVBQUUsSUFBSTtLQUNmLENBQUMsRUFDRixLQUFLLEVBQUUsZUFBUyxDQUFDLE1BQU0sQ0FBQztRQUN0QixXQUFXLEVBQUUsK0NBQStDO0tBQzdELENBQUMsRUFDRixLQUFLLEVBQUUsZUFBUyxDQUFDLE1BQU0sQ0FBQztRQUN0QixXQUFXLEVBQUUsZ0RBQWdEO0tBQzlELENBQUMsSUFDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbHMgcHJvY2VzcyAqL1xuXG5pbXBvcnQgeyBmbGFncyBhcyBmbGFnVHlwZXMgfSBmcm9tIFwiQG9jbGlmL2NvbW1hbmRcIjtcbmltcG9ydCAqIGFzIGRvdCBmcm9tIFwiZG90LW9iamVjdFwiO1xuaW1wb3J0IGNyZWF0ZURlYnVnZ2VyIGZyb20gXCJkZWJ1Z1wiO1xuaW1wb3J0ICogYXMgUHJvZ3Jlc3NCYXIgZnJvbSBcInByb2dyZXNzXCI7XG5pbXBvcnQgKiBhcyBqc29uZXhwb3J0IGZyb20gXCJqc29uZXhwb3J0XCI7XG5pbXBvcnQgQmFzZUNvbW1hbmQgZnJvbSBcIi4uLy4uL2Jhc2VcIjtcbmltcG9ydCB7XG4gIENvbW1lbnRzTGlzdCxcbiAgUmVwb3NpdG9yeVB1bGxSZXF1ZXN0cyxcbiAgUHVsbFJlcXVlc3QsXG59IGZyb20gXCIuLi8uLi9naXRodWJcIjtcblxuY29uc3QgZGVidWcgPSBjcmVhdGVEZWJ1Z2dlcihcImV4cG9ydGVyOnJlcG86cHVsbHNcIik7XG5cbmNvbnN0IExJU1RfUFVMTFNfUVVFUlkgPSBgcXVlcnkgbGlzdFB1bGxzKCRvd25lcjogU3RyaW5nISwgJHJlcG86IFN0cmluZyEsICRwZXJfcGFnZTogSW50ID0gMTAsICRhZnRlcjogU3RyaW5nKSB7XG4gIHJlcG9zaXRvcnkob3duZXI6ICRvd25lciwgbmFtZTogJHJlcG8pIHtcbiAgICBwdWxsUmVxdWVzdHMoZmlyc3Q6ICRwZXJfcGFnZSwgYWZ0ZXI6ICRhZnRlcikge1xuICAgICAgbm9kZXMge1xuICAgICAgICByZXZpZXdEZWNpc2lvblxuICAgICAgICBtZXJnZWRcbiAgICAgICAgbWVyZ2VkQXRcbiAgICAgICAgbWVyZ2VkQnkge1xuICAgICAgICAgIGxvZ2luXG4gICAgICAgIH1cbiAgICAgICAgYXNzaWduZWVzKGZpcnN0OiAxMCkge1xuICAgICAgICAgIG5vZGVzIHtcbiAgICAgICAgICAgIGxvZ2luXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGF1dGhvciB7XG4gICAgICAgICAgbG9naW5cbiAgICAgICAgfVxuICAgICAgICBjb21tZW50cyhmaXJzdDogMTApIHtcbiAgICAgICAgICBub2RlcyB7XG4gICAgICAgICAgICBhdXRob3Ige1xuICAgICAgICAgICAgICBsb2dpblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYm9keVxuICAgICAgICAgICAgY3JlYXRlZEF0XG4gICAgICAgICAgfVxuICAgICAgICAgIHBhZ2VJbmZvIHtcbiAgICAgICAgICAgIGVuZEN1cnNvclxuICAgICAgICAgICAgaGFzTmV4dFBhZ2VcbiAgICAgICAgICB9XG4gICAgICAgICAgdG90YWxDb3VudFxuICAgICAgICB9XG4gICAgICAgIGNyZWF0ZWRBdFxuICAgICAgICBpZFxuICAgICAgICBsYWJlbHMoZmlyc3Q6IDEwMCkge1xuICAgICAgICAgIG5vZGVzIHtcbiAgICAgICAgICAgIG5hbWVcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGVcbiAgICAgICAgdGl0bGVcbiAgICAgICAgdXBkYXRlZEF0XG4gICAgICAgIG1pbGVzdG9uZSB7XG4gICAgICAgICAgdGl0bGVcbiAgICAgICAgICBzdGF0ZVxuICAgICAgICAgIHVybFxuICAgICAgICB9XG4gICAgICAgIGNsb3NlZEF0XG4gICAgICB9XG4gICAgICBwYWdlSW5mbyB7XG4gICAgICAgIGVuZEN1cnNvclxuICAgICAgICBoYXNOZXh0UGFnZVxuICAgICAgfVxuICAgICAgdG90YWxDb3VudFxuICAgIH1cbiAgfVxufVxuYDtcblxuY29uc3QgTElTVF9DT01NRU5UU19RVUVSWSA9IGBxdWVyeSBsaXN0Q29tbWVudHMoJGlkOiBJRCEsICRwZXJfcGFnZTogSW50ID0gMTAwLCAkYWZ0ZXI6IFN0cmluZykge1xuICBub2RlKGlkOiAkaWQpIHtcbiAgICAuLi4gb24gUHVsbFJlcXVlc3Qge1xuICAgICAgY29tbWVudHMoZmlyc3Q6ICRwZXJfcGFnZSwgYWZ0ZXI6ICRhZnRlcikge1xuICAgICAgICBub2RlcyB7XG4gICAgICAgICAgYXV0aG9yIHtcbiAgICAgICAgICAgIGxvZ2luXG4gICAgICAgICAgfVxuICAgICAgICAgIGJvZHlcbiAgICAgICAgICBjcmVhdGVkQXRcbiAgICAgICAgfVxuICAgICAgICBwYWdlSW5mbyB7XG4gICAgICAgICAgZW5kQ3Vyc29yXG4gICAgICAgICAgaGFzTmV4dFBhZ2VcbiAgICAgICAgfVxuICAgICAgICB0b3RhbENvdW50XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5gO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZXBvUHVsbHMgZXh0ZW5kcyBCYXNlQ29tbWFuZCB7XG4gIHN0YXRpYyBkZXNjcmlwdGlvbiA9IFwiRXhwb3J0IEdpdEh1YiBQdWxsIFJlcXVlc3RzIGZvciBhIHJlcG9zaXRvcnlcIjtcblxuICBzdGF0aWMgZmxhZ3MgPSB7XG4gICAgLi4uQmFzZUNvbW1hbmQuZmxhZ3MsXG4gICAgb3duZXI6IGZsYWdUeXBlcy5zdHJpbmcoe1xuICAgICAgZGVwZW5kc09uOiBbXCJyZXBvXCJdLFxuICAgICAgZGVzY3JpcHRpb246IFwiR2l0SHViIHJlcG9zaXRvcnkgb3duZXJcIixcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgIH0pLFxuICAgIHJlcG86IGZsYWdUeXBlcy5zdHJpbmcoe1xuICAgICAgZGVwZW5kc09uOiBbXCJvd25lclwiXSxcbiAgICAgIGRlc2NyaXB0aW9uOiBcIkdpdEh1YiByZXBvc2l0b3J5IG5hbWVcIixcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgIH0pLFxuICAgIHNpbmNlOiBmbGFnVHlwZXMuc3RyaW5nKHtcbiAgICAgIGRlc2NyaXB0aW9uOiBcInNlYXJjaCBwdWxsIHJlcXVlc3RzIGNyZWF0ZWQgYWZ0ZXIgeXl5eS1tbS1kZFwiLFxuICAgIH0pLFxuICAgIHVudGlsOiBmbGFnVHlwZXMuc3RyaW5nKHtcbiAgICAgIGRlc2NyaXB0aW9uOiBcInNlYXJjaCBwdWxsIHJlcXVlc3RzIGNyZWF0ZWQgYmVmb3JlIHl5eXktbW0tZGRcIixcbiAgICB9KSxcbiAgfTtcblxuICBhc3luYyBmZXRjaFB1bGxzKHF1ZXJ5OiBzdHJpbmcsIG93bmVyOiBzdHJpbmcsIHJlcG86IHN0cmluZykge1xuICAgIGNvbnN0IHB1bGxzID0gW107XG5cbiAgICBsZXQgcmVzdWx0czogUmVwb3NpdG9yeVB1bGxSZXF1ZXN0cztcbiAgICBsZXQgY3Vyc29yO1xuICAgIGxldCBwcm9ncmVzcztcblxuICAgIC8vIHBhZ2luYXRlIHRocm91Z2ggdGhlIEdyYXBoUUwgU2VhcmNoIHF1ZXJ5IHVudGlsIHdlIGdldCBldmVyeXRoaW5nXG4gICAgZGVidWcoXCJQdWxsaW5nIHB1bGwgcmVxdWVzdHMgZnJvbSBBUElcIik7XG4gICAgZG8ge1xuICAgICAgcmVzdWx0cyA9IGF3YWl0IHRoaXMuZ2l0aHViLmdyYXBocWwocXVlcnksIHtcbiAgICAgICAgb3duZXIsXG4gICAgICAgIHJlcG8sXG4gICAgICAgIGFmdGVyOiBjdXJzb3IsXG4gICAgICB9KTtcbiAgICAgIGN1cnNvciA9IHJlc3VsdHMucmVwb3NpdG9yeS5wdWxsUmVxdWVzdHMucGFnZUluZm8uZW5kQ3Vyc29yO1xuXG4gICAgICBpZiAoIXByb2dyZXNzKSB7XG4gICAgICAgIGlmIChyZXN1bHRzLnJlcG9zaXRvcnkucHVsbFJlcXVlc3RzLnRvdGFsQ291bnQgPT09IDApIHtcbiAgICAgICAgICB0aGlzLndhcm4oXCJObyBwdWxsIHJlcXVlc3RzIGZvdW5kXCIpO1xuICAgICAgICAgIHByb2Nlc3MuZXhpdCgxKTtcbiAgICAgICAgfVxuXG4gICAgICAgIHByb2dyZXNzID0gbmV3IFByb2dyZXNzQmFyKFxuICAgICAgICAgIFwiZmV0Y2hpbmcgcHVsbHMgWzpiYXJdIDpjdXJyZW50Lzp0b3RhbCA6cGVyY2VudFwiLFxuICAgICAgICAgIHtcbiAgICAgICAgICAgIGNvbXBsZXRlOiBcIj1cIixcbiAgICAgICAgICAgIGluY29tcGxldGU6IFwiIFwiLFxuICAgICAgICAgICAgd2lkdGg6IDIwLFxuICAgICAgICAgICAgdG90YWw6IHJlc3VsdHMucmVwb3NpdG9yeS5wdWxsUmVxdWVzdHMudG90YWxDb3VudCxcbiAgICAgICAgICB9XG4gICAgICAgICk7XG4gICAgICB9XG5cbiAgICAgIHByb2dyZXNzLnRpY2socmVzdWx0cy5yZXBvc2l0b3J5LnB1bGxSZXF1ZXN0cy5ub2Rlcy5sZW5ndGgpO1xuXG4gICAgICBwdWxscy5wdXNoKC4uLnJlc3VsdHMucmVwb3NpdG9yeS5wdWxsUmVxdWVzdHMubm9kZXMpO1xuICAgIH0gd2hpbGUgKHJlc3VsdHMucmVwb3NpdG9yeS5wdWxsUmVxdWVzdHMucGFnZUluZm8uaGFzTmV4dFBhZ2UpO1xuXG4gICAgcmV0dXJuIHB1bGxzO1xuICB9XG5cbiAgYXN5bmMgZmV0Y2hDb21tZW50cyhcbiAgICBxdWVyeTogc3RyaW5nLFxuICAgIHB1bGw6IFB1bGxSZXF1ZXN0LFxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgcHJvZ3Jlc3M6IGFueVxuICApOiBQcm9taXNlPHZvaWQ+IHtcbiAgICBsZXQgcmVzdWx0czogQ29tbWVudHNMaXN0ID0ge1xuICAgICAgbm9kZToge1xuICAgICAgICBjb21tZW50czogcHVsbC5jb21tZW50cyxcbiAgICAgIH0sXG4gICAgfTtcblxuICAgIHdoaWxlIChyZXN1bHRzLm5vZGUuY29tbWVudHMucGFnZUluZm8uaGFzTmV4dFBhZ2UpIHtcbiAgICAgIHJlc3VsdHMgPSBhd2FpdCB0aGlzLmdpdGh1Yi5ncmFwaHFsKHF1ZXJ5LCB7XG4gICAgICAgIGlkOiBwdWxsLmlkLFxuICAgICAgICBhZnRlcjogcmVzdWx0cy5ub2RlLmNvbW1lbnRzLnBhZ2VJbmZvLmVuZEN1cnNvcixcbiAgICAgIH0pO1xuICAgICAgcHVsbC5jb21tZW50cy5ub2Rlcy5wdXNoKC4uLnJlc3VsdHMubm9kZS5jb21tZW50cy5ub2Rlcyk7XG4gICAgICBwcm9ncmVzcy50aWNrKHJlc3VsdHMubm9kZS5jb21tZW50cy5ub2Rlcy5sZW5ndGgpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHJ1bigpIHtcbiAgICBjb25zdCB7IGZsYWdzIH0gPSB0aGlzLnBhcnNlKFJlcG9QdWxscyk7XG4gICAgY29uc3QgeyBvd25lciwgcmVwbywgZm9ybWF0LCBzaW5jZSwgdW50aWwgfSA9IGZsYWdzO1xuXG4gICAgbGV0IHB1bGxzID0gYXdhaXQgdGhpcy5mZXRjaFB1bGxzKExJU1RfUFVMTFNfUVVFUlksIG93bmVyLCByZXBvKTtcblxuICAgIC8vIGZpbHRlciBvdXQgcHVsbHMgYmVmb3JlIHNpbmNlIG9yIGFmdGVyIHVudGlsXG4gICAgaWYgKHNpbmNlKSB7XG4gICAgICBwdWxscyA9IHB1bGxzLmZpbHRlcigocHVsbCkgPT4ge1xuICAgICAgICByZXR1cm4gK25ldyBEYXRlKHB1bGwuY3JlYXRlZEF0KSA+PSArbmV3IERhdGUoc2luY2UpO1xuICAgICAgfSk7XG4gICAgfVxuICAgIGlmICh1bnRpbCkge1xuICAgICAgcHVsbHMgPSBwdWxscy5maWx0ZXIoKHB1bGwpID0+IHtcbiAgICAgICAgcmV0dXJuICtuZXcgRGF0ZSh1bnRpbCkgPj0gK25ldyBEYXRlKHB1bGwuY3JlYXRlZEF0KTtcbiAgICAgIH0pO1xuICAgIH1cblxuICAgIGNvbnN0IHB1bGxzV2l0aENvbW1lbnRzID0gcHVsbHMuZmlsdGVyKFxuICAgICAgKGlzc3VlKSA9PiBpc3N1ZS5jb21tZW50cy50b3RhbENvdW50IC0gaXNzdWUuY29tbWVudHMubm9kZXMubGVuZ3RoID4gMFxuICAgICk7XG5cbiAgICBpZiAocHVsbHNXaXRoQ29tbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgY29uc3QgcmVtYWluaW5nQ29tbWVudHMgPSBwdWxsc1dpdGhDb21tZW50c1xuICAgICAgICAubWFwKChpc3N1ZSkgPT4ge1xuICAgICAgICAgIHJldHVybiBpc3N1ZS5jb21tZW50cy50b3RhbENvdW50IC0gaXNzdWUuY29tbWVudHMubm9kZXMubGVuZ3RoO1xuICAgICAgICB9KVxuICAgICAgICAucmVkdWNlKCh4LCB5KSA9PiB4ICsgeSk7XG5cbiAgICAgIGNvbnN0IHByb2dyZXNzID0gbmV3IFByb2dyZXNzQmFyKFxuICAgICAgICBcImZldGNoaW5nIGNvbW1lbnRzIFs6YmFyXSA6Y3VycmVudC86dG90YWwgOnBlcmNlbnRcIixcbiAgICAgICAge1xuICAgICAgICAgIGNvbXBsZXRlOiBcIj1cIixcbiAgICAgICAgICBpbmNvbXBsZXRlOiBcIiBcIixcbiAgICAgICAgICB3aWR0aDogMjAsXG4gICAgICAgICAgdG90YWw6IHJlbWFpbmluZ0NvbW1lbnRzLFxuICAgICAgICB9XG4gICAgICApO1xuXG4gICAgICBjb25zdCBwcm9taXNlcyA9IHB1bGxzV2l0aENvbW1lbnRzLm1hcCgoaXNzdWUpID0+XG4gICAgICAgIHRoaXMuZmV0Y2hDb21tZW50cyhMSVNUX0NPTU1FTlRTX1FVRVJZLCBpc3N1ZSwgcHJvZ3Jlc3MpXG4gICAgICApO1xuXG4gICAgICBhd2FpdCBQcm9taXNlLmFsbChwcm9taXNlcyk7XG4gICAgfVxuXG4gICAgLy8gbWFzc2FnZSB0aGUgZGF0YSB0byByZW1vdmUgR3JhcGhRTCBwYWdpbmF0aW9uIGRhdGFcbiAgICBmb3IgKGNvbnN0IHB1bGwgb2YgcHVsbHMpIHtcbiAgICAgIGRvdC5kZWwoXCJpZFwiLCBwdWxsKTtcbiAgICAgIGRvdC5tb3ZlKFwiYXNzaWduZWVzLm5vZGVzXCIsIFwiYXNzaWduZWVzXCIsIHB1bGwpO1xuICAgICAgZG90Lm1vdmUoXCJjb21tZW50cy5ub2Rlc1wiLCBcImNvbW1lbnRzXCIsIHB1bGwpO1xuICAgICAgZG90Lm1vdmUoXCJsYWJlbHMubm9kZXNcIiwgXCJsYWJlbHNcIiwgcHVsbCk7XG5cbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvYmFuLXRzLWlnbm9yZVxuICAgICAgLy8gQHRzLWlnbm9yZVxuICAgICAgcHVsbC5sYWJlbHMgPSBwdWxsLmxhYmVscy5tYXAoKHsgbmFtZSB9KSA9PiBuYW1lKS5qb2luKFwiLCBcIik7XG4gICAgfVxuXG4gICAgaWYgKGZvcm1hdCA9PT0gXCJKU09OTFwiKSB7XG4gICAgICBmb3IgKGNvbnN0IHB1bGwgb2YgcHVsbHMpIHtcbiAgICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoYCR7SlNPTi5zdHJpbmdpZnkocHVsbCl9XFxuYCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChmb3JtYXQgPT09IFwiSlNPTlwiKSB7XG4gICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZShKU09OLnN0cmluZ2lmeShwdWxscykpO1xuICAgIH0gZWxzZSBpZiAoZm9ybWF0ID09PSBcIkNTVlwiKSB7XG4gICAgICBjb25zdCBjc3YgPSBhd2FpdCBqc29uZXhwb3J0KHB1bGxzLCB7IGZpbGxHYXBzOiB0cnVlIH0pO1xuICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoY3N2KTtcbiAgICB9XG4gIH1cbn1cbiJdfQ==