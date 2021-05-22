"use strict";
/* globals process */
Object.defineProperty(exports, "__esModule", { value: true });
const command_1 = require("@oclif/command");
const dot = require("dot-object");
const debug_1 = require("debug");
const ProgressBar = require("progress");
const jsonexport = require("jsonexport");
const search_1 = require("../search");
const github_artifact_exporter_core_1 = require("@github/github-artifact-exporter-core");
const dateformat = require("dateformat");
const debug = debug_1.default("exporter:search:issues");
class SearchIssues extends search_1.default {
    /**
     * Transform an Issue object's comments from an array to number properties
     * and format them in a way that Jira understands.
     *
     * Example:
     *
     * Issue {
     *  ...
     *  comments: [{
     *    author: {
     *      login: "mona"
     *    },
     *    createdAt: "1970-01-01T00:00:00",
     *    body: "I think this is great"
     *  }, {
     *    author: {
     *      login: "mona"
     *    },
     *    createdAt: "1970-01-02T00:00:00",
     *    body: "I think this is great as well"
     *  }]
     * }
     *
     * is transformed to
     *
     * Issue {
     *  comment0: "1970-01-01T00:00:00;mona;I think this is great"
     *  comment1: "1970-01-02T00:00:00;mona;I think this is great as well"
     * }
     *
     * @param issue
     */
    jiraFormatComments(issue) {
        let i;
        for (i = 0; i < issue.comments.nodes.length; i++) {
            const comment = issue.comments.nodes[i];
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            issue[`comment${i}`] = [
                comment.createdAt,
                comment.author.login,
                comment.body,
            ].join(";");
        }
    }
    async run() {
        const { flags } = this.parse(SearchIssues);
        const { owner, repo, since, until, format, updatedSince, updatedUntil, state, labels, jira, query, dateFormat, } = flags;
        const searchTerms = ["is:issue"];
        if (jira && format !== "CSV") {
            this.error("--jira is only compatible with --format=CSV.");
        }
        if (repo && owner) {
            searchTerms.push(`repo:${owner}/${repo}`);
        }
        if (query) {
            searchTerms.push(...query.split(" "));
        }
        else {
            if (state) {
                searchTerms.push(`state:${state}`);
            }
            if (labels) {
                searchTerms.push(`label:"${labels}"`);
            }
            /*
             * Convert --since and --until into a query range
             */
            if (since || until) {
                const start = this.parseDateFlag("since", since);
                const end = this.parseDateFlag("until", until);
                searchTerms.push(`created:"${start}..${end}"`);
            }
            /*
             * Convert --updatedSince and --updatedUntil into a query range
             */
            if (updatedSince || updatedUntil) {
                const updateStart = this.parseDateFlag("updatedSince", updatedSince);
                const updateEnd = this.parseDateFlag("updatedUntil", updatedUntil);
                searchTerms.push(`updated:"${updateStart}..${updateEnd}"`);
            }
        }
        const searchQuery = searchTerms.join(" ");
        debug(`Using query: ${searchQuery}`);
        let issueProgress;
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const progressCallback = (result) => {
            var _a;
            if (!issueProgress) {
                issueProgress = new ProgressBar("fetching issues [:bar] :current/:total :percent", {
                    complete: "=",
                    incomplete: " ",
                    width: 20,
                    total: result.search.issueCount,
                });
            }
            const resultLength = (_a = result.search.nodes) === null || _a === void 0 ? void 0 : _a.length;
            if (resultLength) {
                issueProgress.tick(resultLength);
            }
        };
        const issues = await github_artifact_exporter_core_1.getIssues(this.github, searchQuery, progressCallback);
        const issuesWithComments = github_artifact_exporter_core_1.getIssuesWithComments(issues);
        const remainingComments = issuesWithComments
            .map((issue) => {
            return (issue.comments.totalCount -
                issue.comments.nodes.length);
        })
            .reduce((x, y) => x + y, 0);
        const progress = new ProgressBar("fetching comments [:bar] :current/:total :percent", {
            complete: "=",
            incomplete: " ",
            width: 20,
            total: remainingComments,
        });
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const commentProgressCallback = (result) => {
            progress.tick(result.node.comments.nodes.length);
        };
        if (issuesWithComments.length > 0) {
            await github_artifact_exporter_core_1.getComments(this.github, issuesWithComments, commentProgressCallback);
        }
        // massage the data to remove GraphQL pagination data
        for (const issue of issues) {
            if (jira) {
                // We have to do surgery on the Issue object
                this.jiraFormatComments(issue);
                dot.del("comments.nodes", issue);
            }
            else {
                dot.move("comments.nodes", "comments", issue);
            }
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            github_artifact_exporter_core_1.iterateObject(issue, (obj, prop) => {
                if (["createdAt", "updatedAt", "closedAt"].indexOf(prop) > -1) {
                    obj[prop] = dateformat(obj[prop], dateFormat);
                }
            });
            dot.del("id", issue);
            dot.move("assignees.nodes", "assignees", issue);
            dot.move("labels.nodes", "labels", issue);
            // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
            // @ts-ignore
            issue.labels = issue.labels.map(({ name }) => name).join(", ");
        }
        if (format === "JSONL") {
            for (const issue of issues) {
                process.stdout.write(`${JSON.stringify(issue)}\n`);
            }
        }
        else if (format === "JSON") {
            process.stdout.write(JSON.stringify(issues));
        }
        else if (format === "CSV") {
            let mapHeaders = null;
            if (jira) {
                // Jira expects all comments to have a header of just "comment"
                // so we map commment0, comment1, comment2 etc to comment
                mapHeaders = function (header) {
                    return header.replace(/comment[0-9]+/, "comment");
                };
            }
            const csv = await jsonexport(issues, { fillGaps: true, mapHeaders });
            process.stdout.write(csv);
        }
    }
}
exports.default = SearchIssues;
SearchIssues.description = "Export GitHub Issues using Search";
SearchIssues.flags = Object.assign(Object.assign({}, search_1.default.flags), { since: command_1.flags.string({
        description: "search issues created after yyyy-mm-dd",
    }), until: command_1.flags.string({
        description: "search issues created before yyyy-mm-dd",
    }), updatedSince: command_1.flags.string({
        description: "search issues updated after yyyy-mm-dd",
    }), updatedUntil: command_1.flags.string({
        description: "search issues updated before yyyy-mm-dd",
    }), state: command_1.flags.enum({
        options: ["open", "closed"],
        description: "search issues in this state",
    }), labels: command_1.flags.string({
        description: "search issues with these labels (comma seperated)",
    }), jira: command_1.flags.boolean({
        description: "transform output into a usable format for importing to Jira",
        dependsOn: ["format"],
    }), query: command_1.flags.string({
        description: "Search query matching GitHub issue search syntax",
    }), dateFormat: command_1.flags.string({
        description: "Date format to use when building issue list.  Examples: mm/dd/yyyy",
        default: "isoDateTime",
    }) });
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNzdWVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvbW1hbmRzL3NlYXJjaC9pc3N1ZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFCQUFxQjs7QUFFckIsNENBQW9EO0FBQ3BELGtDQUFrQztBQUNsQyxpQ0FBbUM7QUFDbkMsd0NBQXdDO0FBQ3hDLHlDQUF5QztBQUN6QyxzQ0FBc0M7QUFFdEMseUZBUStDO0FBRS9DLHlDQUEwQztBQUUxQyxNQUFNLEtBQUssR0FBRyxlQUFjLENBQUMsd0JBQXdCLENBQUMsQ0FBQztBQUV2RCxNQUFxQixZQUFhLFNBQVEsZ0JBQWE7SUF1Q3JEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09BK0JHO0lBQ0gsa0JBQWtCLENBQUMsS0FBWTtRQUM3QixJQUFJLENBQUMsQ0FBQztRQUNOLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUF3QixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNwRSxNQUFNLE9BQU8sR0FBSSxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQXdCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUQsNERBQTREO1lBQzVELGFBQWE7WUFDYixLQUFLLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxHQUFHO2dCQUNyQixPQUFPLENBQUMsU0FBUztnQkFDaEIsT0FBTyxDQUFDLE1BQWUsQ0FBQyxLQUFLO2dCQUM5QixPQUFPLENBQUMsSUFBSTthQUNiLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ2I7SUFDSCxDQUFDO0lBRUQsS0FBSyxDQUFDLEdBQUc7UUFDUCxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMzQyxNQUFNLEVBQ0osS0FBSyxFQUNMLElBQUksRUFDSixLQUFLLEVBQ0wsS0FBSyxFQUNMLE1B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Q0FBQyxFQUNGLFVBQVUsRUFBRSxlQUFTLENBQUMsTUFBTSxDQUFDO1FBQzNCLFdBQVcsRUFDVCxvRUFBb0U7UUFDdEUsT0FBTyxFQUFFLGFBQWE7S0FDdkIsQ0FBQyxJQUNGIiwic291cmNlc0NvbnRlbnQiOlsiLyogZ2xvYmFscyBwcm9jZXNzICovXG5cbmltcG9ydCB7IGZsYWdzIGFzIGZsYWdUeXBlcyB9IGZyb20gXCJAb2NsaWYvY29tbWFuZFwiO1xuaW1wb3J0ICogYXMgZG90IGZyb20gXCJkb3Qtb2JqZWN0XCI7XG5pbXBvcnQgY3JlYXRlRGVidWdnZXIgZnJvbSBcImRlYnVnXCI7XG5pbXBvcnQgKiBhcyBQcm9ncmVzc0JhciBmcm9tIFwicHJvZ3Jlc3NcIjtcbmltcG9ydCAqIGFzIGpzb25leHBvcnQgZnJvbSBcImpzb25leHBvcnRcIjtcbmltcG9ydCBTZWFyY2hDb21tYW5kIGZyb20gXCIuLi9zZWFyY2hcIjtcblxuaW1wb3J0IHtcbiAgSXNzdWUsXG4gIElzc3VlQ29tbWVudCxcbiAgZ2V0SXNzdWVzLFxuICBnZXRDb21tZW50cyxcbiAgVXNlcixcbiAgZ2V0SXNzdWVzV2l0aENvbW1lbnRzLFxuICBpdGVyYXRlT2JqZWN0LFxufSBmcm9tIFwiQGdpdGh1Yi9naXRodWItYXJ0aWZhY3QtZXhwb3J0ZXItY29yZVwiO1xuXG5pbXBvcnQgZGF0ZWZvcm1hdCA9IHJlcXVpcmUoXCJkYXRlZm9ybWF0XCIpO1xuXG5jb25zdCBkZWJ1ZyA9IGNyZWF0ZURlYnVnZ2VyKFwiZXhwb3J0ZXI6c2VhcmNoOmlzc3Vlc1wiKTtcblxuZXhwb3J0IGRlZmF1bHQgY2xhc3MgU2VhcmNoSXNzdWVzIGV4dGVuZHMgU2VhcmNoQ29tbWFuZCB7XG4gIHN0YXRpYyBkZXNjcmlwdGlvbiA9IFwiRXhwb3J0IEdpdEh1YiBJc3N1ZXMgdXNpbmcgU2VhcmNoXCI7XG5cbiAgc3RhdGljIGZsYWdzID0ge1xuICAgIC4uLlNlYXJjaENvbW1hbmQuZmxhZ3MsXG4gICAgc2luY2U6IGZsYWdUeXBlcy5zdHJpbmcoe1xuICAgICAgZGVzY3JpcHRpb246IFwic2VhcmNoIGlzc3VlcyBjcmVhdGVkIGFmdGVyIHl5eXktbW0tZGRcIixcbiAgICB9KSxcbiAgICB1bnRpbDogZmxhZ1R5cGVzLnN0cmluZyh7XG4gICAgICBkZXNjcmlwdGlvbjogXCJzZWFyY2ggaXNzdWVzIGNyZWF0ZWQgYmVmb3JlIHl5eXktbW0tZGRcIixcbiAgICB9KSxcbiAgICB1cGRhdGVkU2luY2U6IGZsYWdUeXBlcy5zdHJpbmcoe1xuICAgICAgZGVzY3JpcHRpb246IFwic2VhcmNoIGlzc3VlcyB1cGRhdGVkIGFmdGVyIHl5eXktbW0tZGRcIixcbiAgICB9KSxcbiAgICB1cGRhdGVkVW50aWw6IGZsYWdUeXBlcy5zdHJpbmcoe1xuICAgICAgZGVzY3JpcHRpb246IFwic2VhcmNoIGlzc3VlcyB1cGRhdGVkIGJlZm9yZSB5eXl5LW1tLWRkXCIsXG4gICAgfSksXG4gICAgc3RhdGU6IGZsYWdUeXBlcy5lbnVtKHtcbiAgICAgIG9wdGlvbnM6IFtcIm9wZW5cIiwgXCJjbG9zZWRcIl0sXG4gICAgICBkZXNjcmlwdGlvbjogXCJzZWFyY2ggaXNzdWVzIGluIHRoaXMgc3RhdGVcIixcbiAgICB9KSxcbiAgICBsYWJlbHM6IGZsYWdUeXBlcy5zdHJpbmcoe1xuICAgICAgZGVzY3JpcHRpb246IFwic2VhcmNoIGlzc3VlcyB3aXRoIHRoZXNlIGxhYmVscyAoY29tbWEgc2VwZXJhdGVkKVwiLFxuICAgIH0pLFxuICAgIGppcmE6IGZsYWdUeXBlcy5ib29sZWFuKHtcbiAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICBcInRyYW5zZm9ybSBvdXRwdXQgaW50byBhIHVzYWJsZSBmb3JtYXQgZm9yIGltcG9ydGluZyB0byBKaXJhXCIsXG4gICAgICBkZXBlbmRzT246IFtcImZvcm1hdFwiXSxcbiAgICB9KSxcbiAgICBxdWVyeTogZmxhZ1R5cGVzLnN0cmluZyh7XG4gICAgICBkZXNjcmlwdGlvbjogXCJTZWFyY2ggcXVlcnkgbWF0Y2hpbmcgR2l0SHViIGlzc3VlIHNlYXJjaCBzeW50YXhcIixcbiAgICB9KSxcbiAgICBkYXRlRm9ybWF0OiBmbGFnVHlwZXMuc3RyaW5nKHtcbiAgICAgIGRlc2NyaXB0aW9uOlxuICAgICAgICBcIkRhdGUgZm9ybWF0IHRvIHVzZSB3aGVuIGJ1aWxkaW5nIGlzc3VlIGxpc3QuICBFeGFtcGxlczogbW0vZGQveXl5eVwiLFxuICAgICAgZGVmYXVsdDogXCJpc29EYXRlVGltZVwiLFxuICAgIH0pLFxuICB9O1xuXG4gIC8qKlxuICAgKiBUcmFuc2Zvcm0gYW4gSXNzdWUgb2JqZWN0J3MgY29tbWVudHMgZnJvbSBhbiBhcnJheSB0byBudW1iZXIgcHJvcGVydGllc1xuICAgKiBhbmQgZm9ybWF0IHRoZW0gaW4gYSB3YXkgdGhhdCBKaXJhIHVuZGVyc3RhbmRzLlxuICAgKlxuICAgKiBFeGFtcGxlOlxuICAgKlxuICAgKiBJc3N1ZSB7XG4gICAqICAuLi5cbiAgICogIGNvbW1lbnRzOiBbe1xuICAgKiAgICBhdXRob3I6IHtcbiAgICogICAgICBsb2dpbjogXCJtb25hXCJcbiAgICogICAgfSxcbiAgICogICAgY3JlYXRlZEF0OiBcIjE5NzAtMDEtMDFUMDA6MDA6MDBcIixcbiAgICogICAgYm9keTogXCJJIHRoaW5rIHRoaXMgaXMgZ3JlYXRcIlxuICAgKiAgfSwge1xuICAgKiAgICBhdXRob3I6IHtcbiAgICogICAgICBsb2dpbjogXCJtb25hXCJcbiAgICogICAgfSxcbiAgICogICAgY3JlYXRlZEF0OiBcIjE5NzAtMDEtMDJUMDA6MDA6MDBcIixcbiAgICogICAgYm9keTogXCJJIHRoaW5rIHRoaXMgaXMgZ3JlYXQgYXMgd2VsbFwiXG4gICAqICB9XVxuICAgKiB9XG4gICAqXG4gICAqIGlzIHRyYW5zZm9ybWVkIHRvXG4gICAqXG4gICAqIElzc3VlIHtcbiAgICogIGNvbW1lbnQwOiBcIjE5NzAtMDEtMDFUMDA6MDA6MDA7bW9uYTtJIHRoaW5rIHRoaXMgaXMgZ3JlYXRcIlxuICAgKiAgY29tbWVudDE6IFwiMTk3MC0wMS0wMlQwMDowMDowMDttb25hO0kgdGhpbmsgdGhpcyBpcyBncmVhdCBhcyB3ZWxsXCJcbiAgICogfVxuICAgKlxuICAgKiBAcGFyYW0gaXNzdWVcbiAgICovXG4gIGppcmFGb3JtYXRDb21tZW50cyhpc3N1ZTogSXNzdWUpOiB2b2lkIHtcbiAgICBsZXQgaTtcbiAgICBmb3IgKGkgPSAwOyBpIDwgKGlzc3VlLmNvbW1lbnRzLm5vZGVzIGFzIElzc3VlQ29tbWVudFtdKS5sZW5ndGg7IGkrKykge1xuICAgICAgY29uc3QgY29tbWVudCA9IChpc3N1ZS5jb21tZW50cy5ub2RlcyBhcyBJc3N1ZUNvbW1lbnRbXSlbaV07XG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2Jhbi10cy1pZ25vcmVcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIGlzc3VlW2Bjb21tZW50JHtpfWBdID0gW1xuICAgICAgICBjb21tZW50LmNyZWF0ZWRBdCxcbiAgICAgICAgKGNvbW1lbnQuYXV0aG9yIGFzIFVzZXIpLmxvZ2luLFxuICAgICAgICBjb21tZW50LmJvZHksXG4gICAgICBdLmpvaW4oXCI7XCIpO1xuICAgIH1cbiAgfVxuXG4gIGFzeW5jIHJ1bigpIHtcbiAgICBjb25zdCB7IGZsYWdzIH0gPSB0aGlzLnBhcnNlKFNlYXJjaElzc3Vlcyk7XG4gICAgY29uc3Qge1xuICAgICAgb3duZXIsXG4gICAgICByZXBvLFxuICAgICAgc2luY2UsXG4gICAgICB1bnRpbCxcbiAgICAgIGZvcm1hdCxcbiAgICAgIHVwZGF0ZWRTaW5jZSxcbiAgICAgIHVwZGF0ZWRVbnRpbCxcbiAgICAgIHN0YXRlLFxuICAgICAgbGFiZWxzLFxuICAgICAgamlyYSxcbiAgICAgIHF1ZXJ5LFxuICAgICAgZGF0ZUZvcm1hdCxcbiAgICB9ID0gZmxhZ3M7XG4gICAgY29uc3Qgc2VhcmNoVGVybXMgPSBbXCJpczppc3N1ZVwiXTtcblxuICAgIGlmIChqaXJhICYmIGZvcm1hdCA9PT0gXCJKU09OXCIpIHtcbiAgICAgIHRoaXMuZXJyb3IoXG4gICAgICAgIFwiLS1qaXJhIGlzIG5vdCBjb21wYXRpYmxlIHdpdGggLS1mb3JtYXQ9SlNPTi4gVHJ5IGFkZGluZyAtLWZvcm1hdD1DU1YuXCJcbiAgICAgICk7XG4gICAgfVxuXG4gICAgaWYgKHJlcG8gJiYgb3duZXIpIHtcbiAgICAgIHNlYXJjaFRlcm1zLnB1c2goYHJlcG86JHtvd25lcn0vJHtyZXBvfWApO1xuICAgIH1cbiAgICBpZiAocXVlcnkpIHtcbiAgICAgIHNlYXJjaFRlcm1zLnB1c2goLi4ucXVlcnkuc3BsaXQoXCIgXCIpKTtcbiAgICB9IGVsc2Uge1xuICAgICAgaWYgKHN0YXRlKSB7XG4gICAgICAgIHNlYXJjaFRlcm1zLnB1c2goYHN0YXRlOiR7c3RhdGV9YCk7XG4gICAgICB9XG5cbiAgICAgIGlmIChsYWJlbHMpIHtcbiAgICAgICAgc2VhcmNoVGVybXMucHVzaChgbGFiZWw6XCIke2xhYmVsc31cImApO1xuICAgICAgfVxuXG4gICAgICAvKlxuICAgICAgICogQ29udmVydCAtLXNpbmNlIGFuZCAtLXVudGlsIGludG8gYSBxdWVyeSByYW5nZVxuICAgICAgICovXG4gICAgICBpZiAoc2luY2UgfHwgdW50aWwpIHtcbiAgICAgICAgY29uc3Qgc3RhcnQgPSB0aGlzLnBhcnNlRGF0ZUZsYWcoXCJzaW5jZVwiLCBzaW5jZSk7XG4gICAgICAgIGNvbnN0IGVuZCA9IHRoaXMucGFyc2VEYXRlRmxhZyhcInVudGlsXCIsIHVudGlsKTtcbiAgICAgICAgc2VhcmNoVGVybXMucHVzaChgY3JlYXRlZDpcIiR7c3RhcnR9Li4ke2VuZH1cImApO1xuICAgICAgfVxuXG4gICAgICAvKlxuICAgICAgICogQ29udmVydCAtLXVwZGF0ZWRTaW5jZSBhbmQgLS11cGRhdGVkVW50aWwgaW50byBhIHF1ZXJ5IHJhbmdlXG4gICAgICAgKi9cbiAgICAgIGlmICh1cGRhdGVkU2luY2UgfHwgdXBkYXRlZFVudGlsKSB7XG4gICAgICAgIGNvbnN0IHVwZGF0ZVN0YXJ0ID0gdGhpcy5wYXJzZURhdGVGbGFnKFwidXBkYXRlZFNpbmNlXCIsIHVwZGF0ZWRTaW5jZSk7XG4gICAgICAgIGNvbnN0IHVwZGF0ZUVuZCA9IHRoaXMucGFyc2VEYXRlRmxhZyhcInVwZGF0ZWRVbnRpbFwiLCB1cGRhdGVkVW50aWwpO1xuICAgICAgICBzZWFyY2hUZXJtcy5wdXNoKGB1cGRhdGVkOlwiJHt1cGRhdGVTdGFydH0uLiR7dXBkYXRlRW5kfVwiYCk7XG4gICAgICB9XG4gICAgfVxuICAgIGNvbnN0IHNlYXJjaFF1ZXJ5ID0gc2VhcmNoVGVybXMuam9pbihcIiBcIik7XG4gICAgZGVidWcoYFVzaW5nIHF1ZXJ5OiAke3NlYXJjaFF1ZXJ5fWApO1xuXG4gICAgbGV0IGlzc3VlUHJvZ3Jlc3M6IFByb2dyZXNzQmFyO1xuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICBjb25zdCBwcm9ncmVzc0NhbGxiYWNrID0gKHJlc3VsdDogYW55KSA9PiB7XG4gICAgICBpZiAoIWlzc3VlUHJvZ3Jlc3MpIHtcbiAgICAgICAgaXNzdWVQcm9ncmVzcyA9IG5ldyBQcm9ncmVzc0JhcihcbiAgICAgICAgICBcImZldGNoaW5nIGlzc3VlcyBbOmJhcl0gOmN1cnJlbnQvOnRvdGFsIDpwZXJjZW50XCIsXG4gICAgICAgICAge1xuICAgICAgICAgICAgY29tcGxldGU6IFwiPVwiLFxuICAgICAgICAgICAgaW5jb21wbGV0ZTogXCIgXCIsXG4gICAgICAgICAgICB3aWR0aDogMjAsXG4gICAgICAgICAgICB0b3RhbDogcmVzdWx0LnNlYXJjaC5pc3N1ZUNvdW50LFxuICAgICAgICAgIH1cbiAgICAgICAgKTtcbiAgICAgIH1cbiAgICAgIGNvbnN0IHJlc3VsdExlbmd0aCA9IHJlc3VsdC5zZWFyY2gubm9kZXM/Lmxlbmd0aDtcbiAgICAgIGlmIChyZXN1bHRMZW5ndGgpIHtcbiAgICAgICAgaXNzdWVQcm9ncmVzcy50aWNrKHJlc3VsdExlbmd0aCk7XG4gICAgICB9XG4gICAgfTtcblxuICAgIGNvbnN0IGlzc3VlcyA9IGF3YWl0IGdldElzc3Vlcyh0aGlzLmdpdGh1Yiwgc2VhcmNoUXVlcnksIHByb2dyZXNzQ2FsbGJhY2spO1xuXG4gICAgY29uc3QgaXNzdWVzV2l0aENvbW1lbnRzID0gZ2V0SXNzdWVzV2l0aENvbW1lbnRzKGlzc3Vlcyk7XG5cbiAgICBjb25zdCByZW1haW5pbmdDb21tZW50cyA9IGlzc3Vlc1dpdGhDb21tZW50c1xuICAgICAgLm1hcCgoaXNzdWU6IElzc3VlKSA9PiB7XG4gICAgICAgIHJldHVybiAoXG4gICAgICAgICAgaXNzdWUuY29tbWVudHMudG90YWxDb3VudCAtXG4gICAgICAgICAgKGlzc3VlLmNvbW1lbnRzLm5vZGVzIGFzIElzc3VlQ29tbWVudFtdKS5sZW5ndGhcbiAgICAgICAgKTtcbiAgICAgIH0pXG4gICAgICAucmVkdWNlKCh4OiBudW1iZXIsIHk6IG51bWJlcikgPT4geCArIHksIDApO1xuXG4gICAgY29uc3QgcHJvZ3Jlc3MgPSBuZXcgUHJvZ3Jlc3NCYXIoXG4gICAgICBcImZldGNoaW5nIGNvbW1lbnRzIFs6YmFyXSA6Y3VycmVudC86dG90YWwgOnBlcmNlbnRcIixcbiAgICAgIHtcbiAgICAgICAgY29tcGxldGU6IFwiPVwiLFxuICAgICAgICBpbmNvbXBsZXRlOiBcIiBcIixcbiAgICAgICAgd2lkdGg6IDIwLFxuICAgICAgICB0b3RhbDogcmVtYWluaW5nQ29tbWVudHMsXG4gICAgICB9XG4gICAgKTtcblxuICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgY29uc3QgY29tbWVudFByb2dyZXNzQ2FsbGJhY2sgPSAocmVzdWx0OiBhbnkpID0+IHtcbiAgICAgIHByb2dyZXNzLnRpY2soXG4gICAgICAgICgocmVzdWx0Lm5vZGUgYXMgSXNzdWUpLmNvbW1lbnRzLm5vZGVzIGFzIElzc3VlQ29tbWVudFtdKS5sZW5ndGhcbiAgICAgICk7XG4gICAgfTtcblxuICAgIGlmIChpc3N1ZXNXaXRoQ29tbWVudHMubGVuZ3RoID4gMCkge1xuICAgICAgYXdhaXQgZ2V0Q29tbWVudHMoXG4gICAgICAgIHRoaXMuZ2l0aHViLFxuICAgICAgICBpc3N1ZXNXaXRoQ29tbWVudHMsXG4gICAgICAgIGNvbW1lbnRQcm9ncmVzc0NhbGxiYWNrXG4gICAgICApO1xuICAgIH1cblxuICAgIC8vIG1hc3NhZ2UgdGhlIGRhdGEgdG8gcmVtb3ZlIEdyYXBoUUwgcGFnaW5hdGlvbiBkYXRhXG4gICAgZm9yIChjb25zdCBpc3N1ZSBvZiBpc3N1ZXMpIHtcbiAgICAgIGlmIChqaXJhKSB7XG4gICAgICAgIC8vIFdlIGhhdmUgdG8gZG8gc3VyZ2VyeSBvbiB0aGUgSXNzdWUgb2JqZWN0XG4gICAgICAgIHRoaXMuamlyYUZvcm1hdENvbW1lbnRzKGlzc3VlKTtcbiAgICAgICAgZG90LmRlbChcImNvbW1lbnRzLm5vZGVzXCIsIGlzc3VlKTtcbiAgICAgIH0gZWxzZSB7XG4gICAgICAgIGRvdC5tb3ZlKFwiY29tbWVudHMubm9kZXNcIiwgXCJjb21tZW50c1wiLCBpc3N1ZSk7XG4gICAgICB9XG5cbiAgICAgIC8vIGVzbGludC1kaXNhYmxlLW5leHQtbGluZSBAdHlwZXNjcmlwdC1lc2xpbnQvbm8tZXhwbGljaXQtYW55XG4gICAgICBpdGVyYXRlT2JqZWN0KGlzc3VlLCAob2JqOiBhbnksIHByb3A6IGFueSkgPT4ge1xuICAgICAgICBpZiAoW1wiY3JlYXRlZEF0XCIsIFwidXBkYXRlZEF0XCIsIFwiY2xvc2VkQXRcIl0uaW5kZXhPZihwcm9wKSA+IC0xKSB7XG4gICAgICAgICAgb2JqW3Byb3BdID0gZGF0ZWZvcm1hdChvYmpbcHJvcF0sIGRhdGVGb3JtYXQpO1xuICAgICAgICB9XG4gICAgICB9KTtcblxuICAgICAgZG90LmRlbChcImlkXCIsIGlzc3VlKTtcbiAgICAgIGRvdC5tb3ZlKFwiYXNzaWduZWVzLm5vZGVzXCIsIFwiYXNzaWduZWVzXCIsIGlzc3VlKTtcbiAgICAgIGRvdC5tb3ZlKFwibGFiZWxzLm5vZGVzXCIsIFwibGFiZWxzXCIsIGlzc3VlKTtcblxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9iYW4tdHMtaWdub3JlXG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBpc3N1ZS5sYWJlbHMgPSBpc3N1ZS5sYWJlbHMubWFwKCh7IG5hbWUgfSkgPT4gbmFtZSkuam9pbihcIiwgXCIpO1xuICAgIH1cblxuICAgIGlmIChmb3JtYXQgPT09IFwiSlNPTlwiKSB7XG4gICAgICBmb3IgKGNvbnN0IGlzc3VlIG9mIGlzc3Vlcykge1xuICAgICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZShgJHtKU09OLnN0cmluZ2lmeShpc3N1ZSl9XFxuYCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChmb3JtYXQgPT09IFwiQ1NWXCIpIHtcbiAgICAgIGxldCBtYXBIZWFkZXJzOiBGdW5jdGlvbiB8IG51bGwgPSBudWxsO1xuXG4gICAgICBpZiAoamlyYSkge1xuICAgICAgICAvLyBKaXJhIGV4cGVjdHMgYWxsIGNvbW1lbnRzIHRvIGhhdmUgYSBoZWFkZXIgb2YganVzdCBcImNvbW1lbnRcIlxuICAgICAgICAvLyBzbyB3ZSBtYXAgY29tbW1lbnQwLCBjb21tZW50MSwgY29tbWVudDIgZXRjIHRvIGNvbW1lbnRcbiAgICAgICAgbWFwSGVhZGVycyA9IGZ1bmN0aW9uIChoZWFkZXI6IHN0cmluZykge1xuICAgICAgICAgIHJldHVybiBoZWFkZXIucmVwbGFjZSgvY29tbWVudFswLTldKy8sIFwiY29tbWVudFwiKTtcbiAgICAgICAgfTtcbiAgICAgIH1cblxuICAgICAgY29uc3QgY3N2ID0gYXdhaXQganNvbmV4cG9ydChpc3N1ZXMsIHsgZmlsbEdhcHM6IHRydWUsIG1hcEhlYWRlcnMgfSk7XG4gICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZShjc3YpO1xuICAgIH1cbiAgfVxufVxuIl19