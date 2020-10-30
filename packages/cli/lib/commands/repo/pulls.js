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
        const { owner, repo, format } = flags;
        const pulls = await this.fetchPulls(LIST_PULLS_QUERY, owner, repo);
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
        if (format === "JSON") {
            for (const pull of pulls) {
                process.stdout.write(`${JSON.stringify(pull)}\n`);
            }
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
    }) });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoicHVsbHMuanMiLCJzb3VyY2VSb290IjoiIiwic291cmNlcyI6WyIuLi8uLi8uLi9zcmMvY29tbWFuZHMvcmVwby9wdWxscy50cyJdLCJuYW1lcyI6W10sIm1hcHBpbmdzIjoiO0FBQUEscUJBQXFCOztBQUVyQiw0Q0FBb0Q7QUFDcEQsa0NBQWtDO0FBQ2xDLGlDQUFtQztBQUNuQyx3Q0FBd0M7QUFDeEMseUNBQXlDO0FBQ3pDLHFDQUFxQztBQU9yQyxNQUFNLEtBQUssR0FBRyxlQUFjLENBQUMscUJBQXFCLENBQUMsQ0FBQztBQUVwRCxNQUFNLGdCQUFnQixHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Q0F5RHhCLENBQUM7QUFFRixNQUFNLG1CQUFtQixHQUFHOzs7Ozs7Ozs7Ozs7Ozs7Ozs7OztDQW9CM0IsQ0FBQztBQUVGLE1BQXFCLFNBQVUsU0FBUSxjQUFXO0lBa0JoRCxLQUFLLENBQUMsVUFBVSxDQUFDLEtBQWEsRUFBRSxLQUFhLEVBQUUsSUFBWTtRQUN6RCxNQUFNLEtBQUssR0FBRyxFQUFFLENBQUM7UUFFakIsSUFBSSxPQUErQixDQUFDO1FBQ3BDLElBQUksTUFBTSxDQUFDO1FBQ1gsSUFBSSxRQUFRLENBQUM7UUFFYixvRUFBb0U7UUFDcEUsS0FBSyxDQUFDLGdDQUFnQyxDQUFDLENBQUM7UUFDeEMsR0FBRztZQUNELE9BQU8sR0FBRyxNQUFNLElBQUksQ0FBQyxNQUFNLENBQUMsT0FBTyxDQUFDLEtBQUssRUFBRTtnQkFDekMsS0FBSztnQkFDTCxJQUFJO2dCQUNKLEtBQUssRUFBRSxNQUFNO2FBQ2QsQ0FBQyxDQUFDO1lBQ0gsTUFBTSxHQUFHLE9BQU8sQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLFFBQVEsQ0FBQyxTQUFTLENBQUM7WUFFNUQsSUFBSSxDQUFDLFFBQVEsRUFBRTtnQkFDYixJQUFJLE9BQU8sQ0FBQyxVQUFVLENBQUMsWUFBWSxDQUFDLFVBQVUsS0FBSyxDQUFDLEVB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RDtTQUNGO2FBQU0sSUFBSSxNQUFNLEtBQUssS0FBSyxFQUFFO1lBQzNCLE1BQU0sR0FBRyxHQUFHLE1BQU0sVUFBVSxDQUFDLEtBQUssRUFBRSxFQUFFLFFBQVEsRUFBRSxJQUFJLEVBQUUsQ0FBQyxDQUFDO1lBQ3hELE9BQU8sQ0FBQyxNQUFNLENBQUMsS0FBSyxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQzNCO0lBQ0gsQ0FBQzs7QUF4SUgsNEJBeUlDO0FBeElRLHFCQUFXLEdBQUcsOENBQThDLENBQUM7QUFFN0QsZUFBSyxtQ0FDUCxjQUFXLENBQUMsS0FBSyxLQUNwQixLQUFLLEVBQUUsZUFBUyxDQUFDLE1BQU0sQ0FBQztRQUN0QixTQUFTLEVBQUUsQ0FBQyxNQUFNLENBQUM7UUFDbkIsV0FBVyxFQUFFLHlCQUF5QjtRQUN0QyxRQUFRLEVBQUUsSUFBSTtLQUNmLENBQUMsRUFFRixJQUFJLEVBQUUsZUFBUyxDQUFDLE1BQU0sQ0FBQztRQUNyQixTQUFTLEVBQUUsQ0FBQyxPQUFPLENBQUM7UUFDcEIsV0FBVyxFQUFFLHdCQUF3QjtRQUNyQyxRQUFRLEVBQUUsSUFBSTtLQUNmLENBQUMsSUFDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbHMgcHJvY2VzcyAqL1xuXG5pbXBvcnQgeyBmbGFncyBhcyBmbGFnVHlwZXMgfSBmcm9tIFwiQG9jbGlmL2NvbW1hbmRcIjtcbmltcG9ydCAqIGFzIGRvdCBmcm9tIFwiZG90LW9iamVjdFwiO1xuaW1wb3J0IGNyZWF0ZURlYnVnZ2VyIGZyb20gXCJkZWJ1Z1wiO1xuaW1wb3J0ICogYXMgUHJvZ3Jlc3NCYXIgZnJvbSBcInByb2dyZXNzXCI7XG5pbXBvcnQgKiBhcyBqc29uZXhwb3J0IGZyb20gXCJqc29uZXhwb3J0XCI7XG5pbXBvcnQgQmFzZUNvbW1hbmQgZnJvbSBcIi4uLy4uL2Jhc2VcIjtcbmltcG9ydCB7XG4gIENvbW1lbnRzTGlzdCxcbiAgUmVwb3NpdG9yeVB1bGxSZXF1ZXN0cyxcbiAgUHVsbFJlcXVlc3QsXG59IGZyb20gXCIuLi8uLi9naXRodWJcIjtcblxuY29uc3QgZGVidWcgPSBjcmVhdGVEZWJ1Z2dlcihcImV4cG9ydGVyOnJlcG86cHVsbHNcIik7XG5cbmNvbnN0IExJU1RfUFVMTFNfUVVFUlkgPSBgcXVlcnkgbGlzdFB1bGxzKCRvd25lcjogU3RyaW5nISwgJHJlcG86IFN0cmluZyEsICRwZXJfcGFnZTogSW50ID0gMTAsICRhZnRlcjogU3RyaW5nKSB7XG4gIHJlcG9zaXRvcnkob3duZXI6ICRvd25lciwgbmFtZTogJHJlcG8pIHtcbiAgICBwdWxsUmVxdWVzdHMoZmlyc3Q6ICRwZXJfcGFnZSwgYWZ0ZXI6ICRhZnRlcikge1xuICAgICAgbm9kZXMge1xuICAgICAgICByZXZpZXdEZWNpc2lvblxuICAgICAgICBtZXJnZWRcbiAgICAgICAgbWVyZ2VkQXRcbiAgICAgICAgbWVyZ2VkQnkge1xuICAgICAgICAgIGxvZ2luXG4gICAgICAgIH1cbiAgICAgICAgYXNzaWduZWVzKGZpcnN0OiAxMCkge1xuICAgICAgICAgIG5vZGVzIHtcbiAgICAgICAgICAgIGxvZ2luXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIGF1dGhvciB7XG4gICAgICAgICAgbG9naW5cbiAgICAgICAgfVxuICAgICAgICBjb21tZW50cyhmaXJzdDogMTApIHtcbiAgICAgICAgICBub2RlcyB7XG4gICAgICAgICAgICBhdXRob3Ige1xuICAgICAgICAgICAgICBsb2dpblxuICAgICAgICAgICAgfVxuICAgICAgICAgICAgYm9keVxuICAgICAgICAgICAgY3JlYXRlZEF0XG4gICAgICAgICAgfVxuICAgICAgICAgIHBhZ2VJbmZvIHtcbiAgICAgICAgICAgIGVuZEN1cnNvclxuICAgICAgICAgICAgaGFzTmV4dFBhZ2VcbiAgICAgICAgICB9XG4gICAgICAgICAgdG90YWxDb3VudFxuICAgICAgICB9XG4gICAgICAgIGNyZWF0ZWRBdFxuICAgICAgICBpZFxuICAgICAgICBsYWJlbHMoZmlyc3Q6IDEwMCkge1xuICAgICAgICAgIG5vZGVzIHtcbiAgICAgICAgICAgIG5hbWVcbiAgICAgICAgICB9XG4gICAgICAgIH1cbiAgICAgICAgc3RhdGVcbiAgICAgICAgdGl0bGVcbiAgICAgICAgdXBkYXRlZEF0XG4gICAgICAgIG1pbGVzdG9uZSB7XG4gICAgICAgICAgdGl0bGVcbiAgICAgICAgICBzdGF0ZVxuICAgICAgICAgIHVybFxuICAgICAgICB9XG4gICAgICAgIGNsb3NlZEF0XG4gICAgICB9XG4gICAgICBwYWdlSW5mbyB7XG4gICAgICAgIGVuZEN1cnNvclxuICAgICAgICBoYXNOZXh0UGFnZVxuICAgICAgfVxuICAgICAgdG90YWxDb3VudFxuICAgIH1cbiAgfVxufVxuYDtcblxuY29uc3QgTElTVF9DT01NRU5UU19RVUVSWSA9IGBxdWVyeSBsaXN0Q29tbWVudHMoJGlkOiBJRCEsICRwZXJfcGFnZTogSW50ID0gMTAwLCAkYWZ0ZXI6IFN0cmluZykge1xuICBub2RlKGlkOiAkaWQpIHtcbiAgICAuLi4gb24gUHVsbFJlcXVlc3Qge1xuICAgICAgY29tbWVudHMoZmlyc3Q6ICRwZXJfcGFnZSwgYWZ0ZXI6ICRhZnRlcikge1xuICAgICAgICBub2RlcyB7XG4gICAgICAgICAgYXV0aG9yIHtcbiAgICAgICAgICAgIGxvZ2luXG4gICAgICAgICAgfVxuICAgICAgICAgIGJvZHlcbiAgICAgICAgICBjcmVhdGVkQXRcbiAgICAgICAgfVxuICAgICAgICBwYWdlSW5mbyB7XG4gICAgICAgICAgZW5kQ3Vyc29yXG4gICAgICAgICAgaGFzTmV4dFBhZ2VcbiAgICAgICAgfVxuICAgICAgICB0b3RhbENvdW50XG4gICAgICB9XG4gICAgfVxuICB9XG59XG5gO1xuXG5leHBvcnQgZGVmYXVsdCBjbGFzcyBSZXBvUHVsbHMgZXh0ZW5kcyBCYXNlQ29tbWFuZCB7XG4gIHN0YXRpYyBkZXNjcmlwdGlvbiA9IFwiRXhwb3J0IEdpdEh1YiBQdWxsIFJlcXVlc3RzIGZvciBhIHJlcG9zaXRvcnlcIjtcblxuICBzdGF0aWMgZmxhZ3MgPSB7XG4gICAgLi4uQmFzZUNvbW1hbmQuZmxhZ3MsXG4gICAgb3duZXI6IGZsYWdUeXBlcy5zdHJpbmcoe1xuICAgICAgZGVwZW5kc09uOiBbXCJyZXBvXCJdLFxuICAgICAgZGVzY3JpcHRpb246IFwiR2l0SHViIHJlcG9zaXRvcnkgb3duZXJcIixcbiAgICAgIHJlcXVpcmVkOiB0cnVlLFxuICAgIH0pLFxuXG4gICAgcmVwbzogZmxhZ1R5cGVzLnN0cmluZyh7XG4gICAgICBkZXBlbmRzT246IFtcIm93bmVyXCJdLFxuICAgICAgZGVzY3JpcHRpb246IFwiR2l0SHViIHJlcG9zaXRvcnkgbmFtZVwiLFxuICAgICAgcmVxdWlyZWQ6IHRydWUsXG4gICAgfSksXG4gIH07XG5cbiAgYXN5bmMgZmV0Y2hQdWxscyhxdWVyeTogc3RyaW5nLCBvd25lcjogc3RyaW5nLCByZXBvOiBzdHJpbmcpIHtcbiAgICBjb25zdCBwdWxscyA9IFtdO1xuXG4gICAgbGV0IHJlc3VsdHM6IFJlcG9zaXRvcnlQdWxsUmVxdWVzdHM7XG4gICAgbGV0IGN1cnNvcjtcbiAgICBsZXQgcHJvZ3Jlc3M7XG5cbiAgICAvLyBwYWdpbmF0ZSB0aHJvdWdoIHRoZSBHcmFwaFFMIFNlYXJjaCBxdWVyeSB1bnRpbCB3ZSBnZXQgZXZlcnl0aGluZ1xuICAgIGRlYnVnKFwiUHVsbGluZyBwdWxsIHJlcXVlc3RzIGZyb20gQVBJXCIpO1xuICAgIGRvIHtcbiAgICAgIHJlc3VsdHMgPSBhd2FpdCB0aGlzLmdpdGh1Yi5ncmFwaHFsKHF1ZXJ5LCB7XG4gICAgICAgIG93bmVyLFxuICAgICAgICByZXBvLFxuICAgICAgICBhZnRlcjogY3Vyc29yLFxuICAgICAgfSk7XG4gICAgICBjdXJzb3IgPSByZXN1bHRzLnJlcG9zaXRvcnkucHVsbFJlcXVlc3RzLnBhZ2VJbmZvLmVuZEN1cnNvcjtcblxuICAgICAgaWYgKCFwcm9ncmVzcykge1xuICAgICAgICBpZiAocmVzdWx0cy5yZXBvc2l0b3J5LnB1bGxSZXF1ZXN0cy50b3RhbENvdW50ID09PSAwKSB7XG4gICAgICAgICAgdGhpcy53YXJuKFwiTm8gcHVsbCByZXF1ZXN0cyBmb3VuZFwiKTtcbiAgICAgICAgICBwcm9jZXNzLmV4aXQoMSk7XG4gICAgICAgIH1cblxuICAgICAgICBwcm9ncmVzcyA9IG5ldyBQcm9ncmVzc0JhcihcbiAgICAgICAgICBcImZldGNoaW5nIHB1bGxzIFs6YmFyXSA6Y3VycmVudC86dG90YWwgOnBlcmNlbnRcIixcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjb21wbGV0ZTogXCI9XCIsXG4gICAgICAgICAgICBpbmNvbXBsZXRlOiBcIiBcIixcbiAgICAgICAgICAgIHdpZHRoOiAyMCxcbiAgICAgICAgICAgIHRvdGFsOiByZXN1bHRzLnJlcG9zaXRvcnkucHVsbFJlcXVlc3RzLnRvdGFsQ291bnQsXG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgfVxuXG4gICAgICBwcm9ncmVzcy50aWNrKHJlc3VsdHMucmVwb3NpdG9yeS5wdWxsUmVxdWVzdHMubm9kZXMubGVuZ3RoKTtcblxuICAgICAgcHVsbHMucHVzaCguLi5yZXN1bHRzLnJlcG9zaXRvcnkucHVsbFJlcXVlc3RzLm5vZGVzKTtcbiAgICB9IHdoaWxlIChyZXN1bHRzLnJlcG9zaXRvcnkucHVsbFJlcXVlc3RzLnBhZ2VJbmZvLmhhc05leHRQYWdlKTtcblxuICAgIHJldHVybiBwdWxscztcbiAgfVxuXG4gIGFzeW5jIGZldGNoQ29tbWVudHMoXG4gICAgcXVlcnk6IHN0cmluZyxcbiAgICBwdWxsOiBQdWxsUmVxdWVzdCxcbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgIHByb2dyZXNzOiBhbnlcbiAgKTogUHJvbWlzZTx2b2lkPiB7XG4gICAgbGV0IHJlc3VsdHM6IENvbW1lbnRzTGlzdCA9IHtcbiAgICAgIG5vZGU6IHtcbiAgICAgICAgY29tbWVudHM6IHB1bGwuY29tbWVudHMsXG4gICAgICB9LFxuICAgIH07XG5cbiAgICB3aGlsZSAocmVzdWx0cy5ub2RlLmNvbW1lbnRzLnBhZ2VJbmZvLmhhc05leHRQYWdlKSB7XG4gICAgICByZXN1bHRzID0gYXdhaXQgdGhpcy5naXRodWIuZ3JhcGhxbChxdWVyeSwge1xuICAgICAgICBpZDogcHVsbC5pZCxcbiAgICAgICAgYWZ0ZXI6IHJlc3VsdHMubm9kZS5jb21tZW50cy5wYWdlSW5mby5lbmRDdXJzb3IsXG4gICAgICB9KTtcbiAgICAgIHB1bGwuY29tbWVudHMubm9kZXMucHVzaCguLi5yZXN1bHRzLm5vZGUuY29tbWVudHMubm9kZXMpO1xuICAgICAgcHJvZ3Jlc3MudGljayhyZXN1bHRzLm5vZGUuY29tbWVudHMubm9kZXMubGVuZ3RoKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBydW4oKSB7XG4gICAgY29uc3QgeyBmbGFncyB9ID0gdGhpcy5wYXJzZShSZXBvUHVsbHMpO1xuICAgIGNvbnN0IHsgb3duZXIsIHJlcG8sIGZvcm1hdCB9ID0gZmxhZ3M7XG5cbiAgICBjb25zdCBwdWxscyA9IGF3YWl0IHRoaXMuZmV0Y2hQdWxscyhMSVNUX1BVTExTX1FVRVJZLCBvd25lciwgcmVwbyk7XG5cbiAgICBjb25zdCBwdWxsc1dpdGhDb21tZW50cyA9IHB1bGxzLmZpbHRlcihcbiAgICAgIChpc3N1ZSkgPT4gaXNzdWUuY29tbWVudHMudG90YWxDb3VudCAtIGlzc3VlLmNvbW1lbnRzLm5vZGVzLmxlbmd0aCA+IDBcbiAgICApO1xuXG4gICAgaWYgKHB1bGxzV2l0aENvbW1lbnRzLmxlbmd0aCA+IDApIHtcbiAgICAgIGNvbnN0IHJlbWFpbmluZ0NvbW1lbnRzID0gcHVsbHNXaXRoQ29tbWVudHNcbiAgICAgICAgLm1hcCgoaXNzdWUpID0+IHtcbiAgICAgICAgICByZXR1cm4gaXNzdWUuY29tbWVudHMudG90YWxDb3VudCAtIGlzc3VlLmNvbW1lbnRzLm5vZGVzLmxlbmd0aDtcbiAgICAgICAgfSlcbiAgICAgICAgLnJlZHVjZSgoeCwgeSkgPT4geCArIHkpO1xuXG4gICAgICBjb25zdCBwcm9ncmVzcyA9IG5ldyBQcm9ncmVzc0JhcihcbiAgICAgICAgXCJmZXRjaGluZyBjb21tZW50cyBbOmJhcl0gOmN1cnJlbnQvOnRvdGFsIDpwZXJjZW50XCIsXG4gICAgICAgIHtcbiAgICAgICAgICBjb21wbGV0ZTogXCI9XCIsXG4gICAgICAgICAgaW5jb21wbGV0ZTogXCIgXCIsXG4gICAgICAgICAgd2lkdGg6IDIwLFxuICAgICAgICAgIHRvdGFsOiByZW1haW5pbmdDb21tZW50cyxcbiAgICAgICAgfVxuICAgICAgKTtcblxuICAgICAgY29uc3QgcHJvbWlzZXMgPSBwdWxsc1dpdGhDb21tZW50cy5tYXAoKGlzc3VlKSA9PlxuICAgICAgICB0aGlzLmZldGNoQ29tbWVudHMoTElTVF9DT01NRU5UU19RVUVSWSwgaXNzdWUsIHByb2dyZXNzKVxuICAgICAgKTtcblxuICAgICAgYXdhaXQgUHJvbWlzZS5hbGwocHJvbWlzZXMpO1xuICAgIH1cblxuICAgIC8vIG1hc3NhZ2UgdGhlIGRhdGEgdG8gcmVtb3ZlIEdyYXBoUUwgcGFnaW5hdGlvbiBkYXRhXG4gICAgZm9yIChjb25zdCBwdWxsIG9mIHB1bGxzKSB7XG4gICAgICBkb3QuZGVsKFwiaWRcIiwgcHVsbCk7XG4gICAgICBkb3QubW92ZShcImFzc2lnbmVlcy5ub2Rlc1wiLCBcImFzc2lnbmVlc1wiLCBwdWxsKTtcbiAgICAgIGRvdC5tb3ZlKFwiY29tbWVudHMubm9kZXNcIiwgXCJjb21tZW50c1wiLCBwdWxsKTtcbiAgICAgIGRvdC5tb3ZlKFwibGFiZWxzLm5vZGVzXCIsIFwibGFiZWxzXCIsIHB1bGwpO1xuXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2Jhbi10cy1pZ25vcmVcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIHB1bGwubGFiZWxzID0gcHVsbC5sYWJlbHMubWFwKCh7IG5hbWUgfSkgPT4gbmFtZSkuam9pbihcIiwgXCIpO1xuICAgIH1cblxuICAgIGlmIChmb3JtYXQgPT09IFwiSlNPTlwiKSB7XG4gICAgICBmb3IgKGNvbnN0IHB1bGwgb2YgcHVsbHMpIHtcbiAgICAgICAgcHJvY2Vzcy5zdGRvdXQud3JpdGUoYCR7SlNPTi5zdHJpbmdpZnkocHVsbCl9XFxuYCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChmb3JtYXQgPT09IFwiQ1NWXCIpIHtcbiAgICAgIGNvbnN0IGNzdiA9IGF3YWl0IGpzb25leHBvcnQocHVsbHMsIHsgZmlsbEdhcHM6IHRydWUgfSk7XG4gICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZShjc3YpO1xuICAgIH1cbiAgfVxufVxuIl19