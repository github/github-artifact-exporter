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
//# sourceMappingURL=data:application/json;base64,eyJ2ZXJzaW9uIjozLCJmaWxlIjoiaXNzdWVzLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXMiOlsiLi4vLi4vLi4vc3JjL2NvbW1hbmRzL3NlYXJjaC9pc3N1ZXMudHMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IjtBQUFBLHFCQUFxQjs7QUFFckIsNENBQW9EO0FBQ3BELGtDQUFrQztBQUNsQyxpQ0FBbUM7QUFDbkMsd0NBQXdDO0FBQ3hDLHlDQUF5QztBQUN6QyxzQ0FBc0M7QUFFdEMseUZBUStDO0FBRS9DLHlDQUEwQztBQUUxQyxNQUFNLEtBQUssR0FBRyxlQUFjLENBQUMsd0JBQXdCLENBQUMsQ0FBQztBQUV2RCxNQUFxQixZQUFhLFNBQVEsZ0JBQWE7SUF1Q3JEOzs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7Ozs7O09BK0JHO0lBQ0gsa0JBQWtCLENBQUMsS0FBWTtRQUM3QixJQUFJLENBQUMsQ0FBQztRQUNOLEtBQUssQ0FBQyxHQUFHLENBQUMsRUFBRSxDQUFDLEdBQUksS0FBSyxDQUFDLFFBQVEsQ0FBQyxLQUF3QixDQUFDLE1BQU0sRUFBRSxDQUFDLEVBQUUsRUFBRTtZQUNwRSxNQUFNLE9BQU8sR0FBSSxLQUFLLENBQUMsUUFBUSxDQUFDLEtBQXdCLENBQUMsQ0FBQyxDQUFDLENBQUM7WUFDNUQsNERBQTREO1lBQzVELGFBQWE7WUFDYixLQUFLLENBQUMsVUFBVSxDQUFDLEVBQUUsQ0FBQyxHQUFHO2dCQUNyQixPQUFPLENBQUMsU0FBUztnQkFDaEIsT0FBTyxDQUFDLE1BQWUsQ0FBQyxLQUFLO2dCQUM5QixPQUFPLENBQUMsSUFBSTthQUNiLENBQUMsSUFBSSxDQUFDLEdBQUcsQ0FBQyxDQUFDO1NBQ2I7SUFDSCxDQUFDO0lBRUQsS0FBSyxDQUFDLEdBQUc7UUFDUCxNQUFNLEVBQUUsS0FBSyxFQUFFLEdBQUcsSUFBSSxDQUFDLEtBQUssQ0FBQyxZQUFZLENBQUMsQ0FBQztRQUMzQyxNQUFNLEVBQ0osS0FBSyxFQUNMLElBQUksRUFDSixLQUFLLEVBQ0wsS0FBSyxFQUNMLE1B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REFBNkQ7UUFDL0QsU0FBUyxFQUFFLENBQUMsUUFBUSxDQUFDO0tBQ3RCLENBQUMsRUFDRixLQUFLLEVBQUUsZUFBUyxDQUFDLE1BQU0sQ0FBQztRQUN0QixXQUFXLEVBQUUsa0RBQWtEO0tBQ2hFLENBQUMsRUFDRixVQUFVLEVBQUUsZUFBUyxDQUFDLE1BQU0sQ0FBQztRQUMzQixXQUFXLEVBQ1Qsb0VBQW9FO1FBQ3RFLE9BQU8sRUFBRSxhQUFhO0tBQ3ZCLENBQUMsSUFDRiIsInNvdXJjZXNDb250ZW50IjpbIi8qIGdsb2JhbHMgcHJvY2VzcyAqL1xuXG5pbXBvcnQgeyBmbGFncyBhcyBmbGFnVHlwZXMgfSBmcm9tIFwiQG9jbGlmL2NvbW1hbmRcIjtcbmltcG9ydCAqIGFzIGRvdCBmcm9tIFwiZG90LW9iamVjdFwiO1xuaW1wb3J0IGNyZWF0ZURlYnVnZ2VyIGZyb20gXCJkZWJ1Z1wiO1xuaW1wb3J0ICogYXMgUHJvZ3Jlc3NCYXIgZnJvbSBcInByb2dyZXNzXCI7XG5pbXBvcnQgKiBhcyBqc29uZXhwb3J0IGZyb20gXCJqc29uZXhwb3J0XCI7XG5pbXBvcnQgU2VhcmNoQ29tbWFuZCBmcm9tIFwiLi4vc2VhcmNoXCI7XG5cbmltcG9ydCB7XG4gIElzc3VlLFxuICBJc3N1ZUNvbW1lbnQsXG4gIGdldElzc3VlcyxcbiAgZ2V0Q29tbWVudHMsXG4gIFVzZXIsXG4gIGdldElzc3Vlc1dpdGhDb21tZW50cyxcbiAgaXRlcmF0ZU9iamVjdCxcbn0gZnJvbSBcIkBnaXRodWIvZ2l0aHViLWFydGlmYWN0LWV4cG9ydGVyLWNvcmVcIjtcblxuaW1wb3J0IGRhdGVmb3JtYXQgPSByZXF1aXJlKFwiZGF0ZWZvcm1hdFwiKTtcblxuY29uc3QgZGVidWcgPSBjcmVhdGVEZWJ1Z2dlcihcImV4cG9ydGVyOnNlYXJjaDppc3N1ZXNcIik7XG5cbmV4cG9ydCBkZWZhdWx0IGNsYXNzIFNlYXJjaElzc3VlcyBleHRlbmRzIFNlYXJjaENvbW1hbmQge1xuICBzdGF0aWMgZGVzY3JpcHRpb24gPSBcIkV4cG9ydCBHaXRIdWIgSXNzdWVzIHVzaW5nIFNlYXJjaFwiO1xuXG4gIHN0YXRpYyBmbGFncyA9IHtcbiAgICAuLi5TZWFyY2hDb21tYW5kLmZsYWdzLFxuICAgIHNpbmNlOiBmbGFnVHlwZXMuc3RyaW5nKHtcbiAgICAgIGRlc2NyaXB0aW9uOiBcInNlYXJjaCBpc3N1ZXMgY3JlYXRlZCBhZnRlciB5eXl5LW1tLWRkXCIsXG4gICAgfSksXG4gICAgdW50aWw6IGZsYWdUeXBlcy5zdHJpbmcoe1xuICAgICAgZGVzY3JpcHRpb246IFwic2VhcmNoIGlzc3VlcyBjcmVhdGVkIGJlZm9yZSB5eXl5LW1tLWRkXCIsXG4gICAgfSksXG4gICAgdXBkYXRlZFNpbmNlOiBmbGFnVHlwZXMuc3RyaW5nKHtcbiAgICAgIGRlc2NyaXB0aW9uOiBcInNlYXJjaCBpc3N1ZXMgdXBkYXRlZCBhZnRlciB5eXl5LW1tLWRkXCIsXG4gICAgfSksXG4gICAgdXBkYXRlZFVudGlsOiBmbGFnVHlwZXMuc3RyaW5nKHtcbiAgICAgIGRlc2NyaXB0aW9uOiBcInNlYXJjaCBpc3N1ZXMgdXBkYXRlZCBiZWZvcmUgeXl5eS1tbS1kZFwiLFxuICAgIH0pLFxuICAgIHN0YXRlOiBmbGFnVHlwZXMuZW51bSh7XG4gICAgICBvcHRpb25zOiBbXCJvcGVuXCIsIFwiY2xvc2VkXCJdLFxuICAgICAgZGVzY3JpcHRpb246IFwic2VhcmNoIGlzc3VlcyBpbiB0aGlzIHN0YXRlXCIsXG4gICAgfSksXG4gICAgbGFiZWxzOiBmbGFnVHlwZXMuc3RyaW5nKHtcbiAgICAgIGRlc2NyaXB0aW9uOiBcInNlYXJjaCBpc3N1ZXMgd2l0aCB0aGVzZSBsYWJlbHMgKGNvbW1hIHNlcGVyYXRlZClcIixcbiAgICB9KSxcbiAgICBqaXJhOiBmbGFnVHlwZXMuYm9vbGVhbih7XG4gICAgICBkZXNjcmlwdGlvbjpcbiAgICAgICAgXCJ0cmFuc2Zvcm0gb3V0cHV0IGludG8gYSB1c2FibGUgZm9ybWF0IGZvciBpbXBvcnRpbmcgdG8gSmlyYVwiLFxuICAgICAgZGVwZW5kc09uOiBbXCJmb3JtYXRcIl0sXG4gICAgfSksXG4gICAgcXVlcnk6IGZsYWdUeXBlcy5zdHJpbmcoe1xuICAgICAgZGVzY3JpcHRpb246IFwiU2VhcmNoIHF1ZXJ5IG1hdGNoaW5nIEdpdEh1YiBpc3N1ZSBzZWFyY2ggc3ludGF4XCIsXG4gICAgfSksXG4gICAgZGF0ZUZvcm1hdDogZmxhZ1R5cGVzLnN0cmluZyh7XG4gICAgICBkZXNjcmlwdGlvbjpcbiAgICAgICAgXCJEYXRlIGZvcm1hdCB0byB1c2Ugd2hlbiBidWlsZGluZyBpc3N1ZSBsaXN0LiAgRXhhbXBsZXM6IG1tL2RkL3l5eXlcIixcbiAgICAgIGRlZmF1bHQ6IFwiaXNvRGF0ZVRpbWVcIixcbiAgICB9KSxcbiAgfTtcblxuICAvKipcbiAgICogVHJhbnNmb3JtIGFuIElzc3VlIG9iamVjdCdzIGNvbW1lbnRzIGZyb20gYW4gYXJyYXkgdG8gbnVtYmVyIHByb3BlcnRpZXNcbiAgICogYW5kIGZvcm1hdCB0aGVtIGluIGEgd2F5IHRoYXQgSmlyYSB1bmRlcnN0YW5kcy5cbiAgICpcbiAgICogRXhhbXBsZTpcbiAgICpcbiAgICogSXNzdWUge1xuICAgKiAgLi4uXG4gICAqICBjb21tZW50czogW3tcbiAgICogICAgYXV0aG9yOiB7XG4gICAqICAgICAgbG9naW46IFwibW9uYVwiXG4gICAqICAgIH0sXG4gICAqICAgIGNyZWF0ZWRBdDogXCIxOTcwLTAxLTAxVDAwOjAwOjAwXCIsXG4gICAqICAgIGJvZHk6IFwiSSB0aGluayB0aGlzIGlzIGdyZWF0XCJcbiAgICogIH0sIHtcbiAgICogICAgYXV0aG9yOiB7XG4gICAqICAgICAgbG9naW46IFwibW9uYVwiXG4gICAqICAgIH0sXG4gICAqICAgIGNyZWF0ZWRBdDogXCIxOTcwLTAxLTAyVDAwOjAwOjAwXCIsXG4gICAqICAgIGJvZHk6IFwiSSB0aGluayB0aGlzIGlzIGdyZWF0IGFzIHdlbGxcIlxuICAgKiAgfV1cbiAgICogfVxuICAgKlxuICAgKiBpcyB0cmFuc2Zvcm1lZCB0b1xuICAgKlxuICAgKiBJc3N1ZSB7XG4gICAqICBjb21tZW50MDogXCIxOTcwLTAxLTAxVDAwOjAwOjAwO21vbmE7SSB0aGluayB0aGlzIGlzIGdyZWF0XCJcbiAgICogIGNvbW1lbnQxOiBcIjE5NzAtMDEtMDJUMDA6MDA6MDA7bW9uYTtJIHRoaW5rIHRoaXMgaXMgZ3JlYXQgYXMgd2VsbFwiXG4gICAqIH1cbiAgICpcbiAgICogQHBhcmFtIGlzc3VlXG4gICAqL1xuICBqaXJhRm9ybWF0Q29tbWVudHMoaXNzdWU6IElzc3VlKTogdm9pZCB7XG4gICAgbGV0IGk7XG4gICAgZm9yIChpID0gMDsgaSA8IChpc3N1ZS5jb21tZW50cy5ub2RlcyBhcyBJc3N1ZUNvbW1lbnRbXSkubGVuZ3RoOyBpKyspIHtcbiAgICAgIGNvbnN0IGNvbW1lbnQgPSAoaXNzdWUuY29tbWVudHMubm9kZXMgYXMgSXNzdWVDb21tZW50W10pW2ldO1xuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9iYW4tdHMtaWdub3JlXG4gICAgICAvLyBAdHMtaWdub3JlXG4gICAgICBpc3N1ZVtgY29tbWVudCR7aX1gXSA9IFtcbiAgICAgICAgY29tbWVudC5jcmVhdGVkQXQsXG4gICAgICAgIChjb21tZW50LmF1dGhvciBhcyBVc2VyKS5sb2dpbixcbiAgICAgICAgY29tbWVudC5ib2R5LFxuICAgICAgXS5qb2luKFwiO1wiKTtcbiAgICB9XG4gIH1cblxuICBhc3luYyBydW4oKSB7XG4gICAgY29uc3QgeyBmbGFncyB9ID0gdGhpcy5wYXJzZShTZWFyY2hJc3N1ZXMpO1xuICAgIGNvbnN0IHtcbiAgICAgIG93bmVyLFxuICAgICAgcmVwbyxcbiAgICAgIHNpbmNlLFxuICAgICAgdW50aWwsXG4gICAgICBmb3JtYXQsXG4gICAgICB1cGRhdGVkU2luY2UsXG4gICAgICB1cGRhdGVkVW50aWwsXG4gICAgICBzdGF0ZSxcbiAgICAgIGxhYmVscyxcbiAgICAgIGppcmEsXG4gICAgICBxdWVyeSxcbiAgICAgIGRhdGVGb3JtYXQsXG4gICAgfSA9IGZsYWdzO1xuICAgIGNvbnN0IHNlYXJjaFRlcm1zID0gW1wiaXM6aXNzdWVcIl07XG5cbiAgICBpZiAoamlyYSAmJiBmb3JtYXQgIT09IFwiQ1NWXCIpIHtcbiAgICAgIHRoaXMuZXJyb3IoXCItLWppcmEgaXMgb25seSBjb21wYXRpYmxlIHdpdGggLS1mb3JtYXQ9Q1NWLlwiKTtcbiAgICB9XG5cbiAgICBpZiAocmVwbyAmJiBvd25lcikge1xuICAgICAgc2VhcmNoVGVybXMucHVzaChgcmVwbzoke293bmVyfS8ke3JlcG99YCk7XG4gICAgfVxuICAgIGlmIChxdWVyeSkge1xuICAgICAgc2VhcmNoVGVybXMucHVzaCguLi5xdWVyeS5zcGxpdChcIiBcIikpO1xuICAgIH0gZWxzZSB7XG4gICAgICBpZiAoc3RhdGUpIHtcbiAgICAgICAgc2VhcmNoVGVybXMucHVzaChgc3RhdGU6JHtzdGF0ZX1gKTtcbiAgICAgIH1cblxuICAgICAgaWYgKGxhYmVscykge1xuICAgICAgICBzZWFyY2hUZXJtcy5wdXNoKGBsYWJlbDpcIiR7bGFiZWxzfVwiYCk7XG4gICAgICB9XG5cbiAgICAgIC8qXG4gICAgICAgKiBDb252ZXJ0IC0tc2luY2UgYW5kIC0tdW50aWwgaW50byBhIHF1ZXJ5IHJhbmdlXG4gICAgICAgKi9cbiAgICAgIGlmIChzaW5jZSB8fCB1bnRpbCkge1xuICAgICAgICBjb25zdCBzdGFydCA9IHRoaXMucGFyc2VEYXRlRmxhZyhcInNpbmNlXCIsIHNpbmNlKTtcbiAgICAgICAgY29uc3QgZW5kID0gdGhpcy5wYXJzZURhdGVGbGFnKFwidW50aWxcIiwgdW50aWwpO1xuICAgICAgICBzZWFyY2hUZXJtcy5wdXNoKGBjcmVhdGVkOlwiJHtzdGFydH0uLiR7ZW5kfVwiYCk7XG4gICAgICB9XG5cbiAgICAgIC8qXG4gICAgICAgKiBDb252ZXJ0IC0tdXBkYXRlZFNpbmNlIGFuZCAtLXVwZGF0ZWRVbnRpbCBpbnRvIGEgcXVlcnkgcmFuZ2VcbiAgICAgICAqL1xuICAgICAgaWYgKHVwZGF0ZWRTaW5jZSB8fCB1cGRhdGVkVW50aWwpIHtcbiAgICAgICAgY29uc3QgdXBkYXRlU3RhcnQgPSB0aGlzLnBhcnNlRGF0ZUZsYWcoXCJ1cGRhdGVkU2luY2VcIiwgdXBkYXRlZFNpbmNlKTtcbiAgICAgICAgY29uc3QgdXBkYXRlRW5kID0gdGhpcy5wYXJzZURhdGVGbGFnKFwidXBkYXRlZFVudGlsXCIsIHVwZGF0ZWRVbnRpbCk7XG4gICAgICAgIHNlYXJjaFRlcm1zLnB1c2goYHVwZGF0ZWQ6XCIke3VwZGF0ZVN0YXJ0fS4uJHt1cGRhdGVFbmR9XCJgKTtcbiAgICAgIH1cbiAgICB9XG4gICAgY29uc3Qgc2VhcmNoUXVlcnkgPSBzZWFyY2hUZXJtcy5qb2luKFwiIFwiKTtcbiAgICBkZWJ1ZyhgVXNpbmcgcXVlcnk6ICR7c2VhcmNoUXVlcnl9YCk7XG5cbiAgICBsZXQgaXNzdWVQcm9ncmVzczogUHJvZ3Jlc3NCYXI7XG5cbiAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L25vLWV4cGxpY2l0LWFueVxuICAgIGNvbnN0IHByb2dyZXNzQ2FsbGJhY2sgPSAocmVzdWx0OiBhbnkpID0+IHtcbiAgICAgIGlmICghaXNzdWVQcm9ncmVzcykge1xuICAgICAgICBpc3N1ZVByb2dyZXNzID0gbmV3IFByb2dyZXNzQmFyKFxuICAgICAgICAgIFwiZmV0Y2hpbmcgaXNzdWVzIFs6YmFyXSA6Y3VycmVudC86dG90YWwgOnBlcmNlbnRcIixcbiAgICAgICAgICB7XG4gICAgICAgICAgICBjb21wbGV0ZTogXCI9XCIsXG4gICAgICAgICAgICBpbmNvbXBsZXRlOiBcIiBcIixcbiAgICAgICAgICAgIHdpZHRoOiAyMCxcbiAgICAgICAgICAgIHRvdGFsOiByZXN1bHQuc2VhcmNoLmlzc3VlQ291bnQsXG4gICAgICAgICAgfVxuICAgICAgICApO1xuICAgICAgfVxuICAgICAgY29uc3QgcmVzdWx0TGVuZ3RoID0gcmVzdWx0LnNlYXJjaC5ub2Rlcz8ubGVuZ3RoO1xuICAgICAgaWYgKHJlc3VsdExlbmd0aCkge1xuICAgICAgICBpc3N1ZVByb2dyZXNzLnRpY2socmVzdWx0TGVuZ3RoKTtcbiAgICAgIH1cbiAgICB9O1xuXG4gICAgY29uc3QgaXNzdWVzID0gYXdhaXQgZ2V0SXNzdWVzKHRoaXMuZ2l0aHViLCBzZWFyY2hRdWVyeSwgcHJvZ3Jlc3NDYWxsYmFjayk7XG5cbiAgICBjb25zdCBpc3N1ZXNXaXRoQ29tbWVudHMgPSBnZXRJc3N1ZXNXaXRoQ29tbWVudHMoaXNzdWVzKTtcblxuICAgIGNvbnN0IHJlbWFpbmluZ0NvbW1lbnRzID0gaXNzdWVzV2l0aENvbW1lbnRzXG4gICAgICAubWFwKChpc3N1ZTogSXNzdWUpID0+IHtcbiAgICAgICAgcmV0dXJuIChcbiAgICAgICAgICBpc3N1ZS5jb21tZW50cy50b3RhbENvdW50IC1cbiAgICAgICAgICAoaXNzdWUuY29tbWVudHMubm9kZXMgYXMgSXNzdWVDb21tZW50W10pLmxlbmd0aFxuICAgICAgICApO1xuICAgICAgfSlcbiAgICAgIC5yZWR1Y2UoKHg6IG51bWJlciwgeTogbnVtYmVyKSA9PiB4ICsgeSwgMCk7XG5cbiAgICBjb25zdCBwcm9ncmVzcyA9IG5ldyBQcm9ncmVzc0JhcihcbiAgICAgIFwiZmV0Y2hpbmcgY29tbWVudHMgWzpiYXJdIDpjdXJyZW50Lzp0b3RhbCA6cGVyY2VudFwiLFxuICAgICAge1xuICAgICAgICBjb21wbGV0ZTogXCI9XCIsXG4gICAgICAgIGluY29tcGxldGU6IFwiIFwiLFxuICAgICAgICB3aWR0aDogMjAsXG4gICAgICAgIHRvdGFsOiByZW1haW5pbmdDb21tZW50cyxcbiAgICAgIH1cbiAgICApO1xuXG4gICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICBjb25zdCBjb21tZW50UHJvZ3Jlc3NDYWxsYmFjayA9IChyZXN1bHQ6IGFueSkgPT4ge1xuICAgICAgcHJvZ3Jlc3MudGljayhcbiAgICAgICAgKChyZXN1bHQubm9kZSBhcyBJc3N1ZSkuY29tbWVudHMubm9kZXMgYXMgSXNzdWVDb21tZW50W10pLmxlbmd0aFxuICAgICAgKTtcbiAgICB9O1xuXG4gICAgaWYgKGlzc3Vlc1dpdGhDb21tZW50cy5sZW5ndGggPiAwKSB7XG4gICAgICBhd2FpdCBnZXRDb21tZW50cyhcbiAgICAgICAgdGhpcy5naXRodWIsXG4gICAgICAgIGlzc3Vlc1dpdGhDb21tZW50cyxcbiAgICAgICAgY29tbWVudFByb2dyZXNzQ2FsbGJhY2tcbiAgICAgICk7XG4gICAgfVxuXG4gICAgLy8gbWFzc2FnZSB0aGUgZGF0YSB0byByZW1vdmUgR3JhcGhRTCBwYWdpbmF0aW9uIGRhdGFcbiAgICBmb3IgKGNvbnN0IGlzc3VlIG9mIGlzc3Vlcykge1xuICAgICAgaWYgKGppcmEpIHtcbiAgICAgICAgLy8gV2UgaGF2ZSB0byBkbyBzdXJnZXJ5IG9uIHRoZSBJc3N1ZSBvYmplY3RcbiAgICAgICAgdGhpcy5qaXJhRm9ybWF0Q29tbWVudHMoaXNzdWUpO1xuICAgICAgICBkb3QuZGVsKFwiY29tbWVudHMubm9kZXNcIiwgaXNzdWUpO1xuICAgICAgfSBlbHNlIHtcbiAgICAgICAgZG90Lm1vdmUoXCJjb21tZW50cy5ub2Rlc1wiLCBcImNvbW1lbnRzXCIsIGlzc3VlKTtcbiAgICAgIH1cblxuICAgICAgLy8gZXNsaW50LWRpc2FibGUtbmV4dC1saW5lIEB0eXBlc2NyaXB0LWVzbGludC9uby1leHBsaWNpdC1hbnlcbiAgICAgIGl0ZXJhdGVPYmplY3QoaXNzdWUsIChvYmo6IGFueSwgcHJvcDogYW55KSA9PiB7XG4gICAgICAgIGlmIChbXCJjcmVhdGVkQXRcIiwgXCJ1cGRhdGVkQXRcIiwgXCJjbG9zZWRBdFwiXS5pbmRleE9mKHByb3ApID4gLTEpIHtcbiAgICAgICAgICBvYmpbcHJvcF0gPSBkYXRlZm9ybWF0KG9ialtwcm9wXSwgZGF0ZUZvcm1hdCk7XG4gICAgICAgIH1cbiAgICAgIH0pO1xuXG4gICAgICBkb3QuZGVsKFwiaWRcIiwgaXNzdWUpO1xuICAgICAgZG90Lm1vdmUoXCJhc3NpZ25lZXMubm9kZXNcIiwgXCJhc3NpZ25lZXNcIiwgaXNzdWUpO1xuICAgICAgZG90Lm1vdmUoXCJsYWJlbHMubm9kZXNcIiwgXCJsYWJlbHNcIiwgaXNzdWUpO1xuXG4gICAgICAvLyBlc2xpbnQtZGlzYWJsZS1uZXh0LWxpbmUgQHR5cGVzY3JpcHQtZXNsaW50L2Jhbi10cy1pZ25vcmVcbiAgICAgIC8vIEB0cy1pZ25vcmVcbiAgICAgIGlzc3VlLmxhYmVscyA9IGlzc3VlLmxhYmVscy5tYXAoKHsgbmFtZSB9KSA9PiBuYW1lKS5qb2luKFwiLCBcIik7XG4gICAgfVxuXG4gICAgaWYgKGZvcm1hdCA9PT0gXCJKU09OTFwiKSB7XG4gICAgICBmb3IgKGNvbnN0IGlzc3VlIG9mIGlzc3Vlcykge1xuICAgICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZShgJHtKU09OLnN0cmluZ2lmeShpc3N1ZSl9XFxuYCk7XG4gICAgICB9XG4gICAgfSBlbHNlIGlmIChmb3JtYXQgPT09IFwiSlNPTlwiKSB7XG4gICAgICBwcm9jZXNzLnN0ZG91dC53cml0ZShKU09OLnN0cmluZ2lmeShpc3N1ZXMpKTtcbiAgICB9IGVsc2UgaWYgKGZvcm1hdCA9PT0gXCJDU1ZcIikge1xuICAgICAgbGV0IG1hcEhlYWRlcnM6IEZ1bmN0aW9uIHwgbnVsbCA9IG51bGw7XG5cbiAgICAgIGlmIChqaXJhKSB7XG4gICAgICAgIC8vIEppcmEgZXhwZWN0cyBhbGwgY29tbWVudHMgdG8gaGF2ZSBhIGhlYWRlciBvZiBqdXN0IFwiY29tbWVudFwiXG4gICAgICAgIC8vIHNvIHdlIG1hcCBjb21tbWVudDAsIGNvbW1lbnQxLCBjb21tZW50MiBldGMgdG8gY29tbWVudFxuICAgICAgICBtYXBIZWFkZXJzID0gZnVuY3Rpb24gKGhlYWRlcjogc3RyaW5nKSB7XG4gICAgICAgICAgcmV0dXJuIGhlYWRlci5yZXBsYWNlKC9jb21tZW50WzAtOV0rLywgXCJjb21tZW50XCIpO1xuICAgICAgICB9O1xuICAgICAgfVxuXG4gICAgICBjb25zdCBjc3YgPSBhd2FpdCBqc29uZXhwb3J0KGlzc3VlcywgeyBmaWxsR2FwczogdHJ1ZSwgbWFwSGVhZGVycyB9KTtcbiAgICAgIHByb2Nlc3Muc3Rkb3V0LndyaXRlKGNzdik7XG4gICAgfVxuICB9XG59XG4iXX0=