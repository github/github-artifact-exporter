/* globals process */

import { flags as flagTypes } from "@oclif/command";
import * as dot from "dot-object";
import createDebugger from "debug";
import * as ProgressBar from "progress";
import * as jsonexport from "jsonexport";
import SearchCommand from "../search";

import {
  Issue,
  IssueComment,
  getIssues,
  getComments,
  User,
  getIssuesWithComments,
  iterateObject,
} from "@github/github-artifact-exporter-core";

import dateformat = require("dateformat");

const debug = createDebugger("exporter:search:issues");

export default class SearchIssues extends SearchCommand {
  static description = "Export GitHub Issues using Search";

  static flags = {
    ...SearchCommand.flags,
    since: flagTypes.string({
      description: "search issues created after yyyy-mm-dd",
    }),
    until: flagTypes.string({
      description: "search issues created before yyyy-mm-dd",
    }),
    updatedSince: flagTypes.string({
      description: "search issues updated after yyyy-mm-dd",
    }),
    updatedUntil: flagTypes.string({
      description: "search issues updated before yyyy-mm-dd",
    }),
    state: flagTypes.enum({
      options: ["open", "closed"],
      description: "search issues in this state",
    }),
    labels: flagTypes.string({
      description: "search issues with these labels (comma seperated)",
    }),
    jira: flagTypes.boolean({
      description:
        "transform output into a usable format for importing to Jira",
      dependsOn: ["format"],
    }),
    query: flagTypes.string({
      description: "Search query matching GitHub issue search syntax",
    }),
    dateFormat: flagTypes.string({
      description:
        "Date format to use when building issue list.  Examples: mm/dd/yyyy",
      default: "isoDateTime",
    }),
  };

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
  jiraFormatComments(issue: Issue): void {
    let i;
    for (i = 0; i < (issue.comments.nodes as IssueComment[]).length; i++) {
      const comment = (issue.comments.nodes as IssueComment[])[i];
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
      issue[`comment${i}`] = [
        comment.createdAt,
        (comment.author as User).login,
        comment.body,
      ].join(";");
    }
  }

  async run() {
    const { flags } = this.parse(SearchIssues);
    const {
      owner,
      repo,
      since,
      until,
      format,
      updatedSince,
      updatedUntil,
      state,
      labels,
      jira,
      query,
      dateFormat,
    } = flags;
    const searchTerms = ["is:issue"];

    if (jira && format !== "CSV") {
      this.error("--jira is only compatible with --format=CSV.");
    }

    if (repo && owner) {
      searchTerms.push(`repo:${owner}/${repo}`);
    }
    if (query) {
      searchTerms.push(...query.split(" "));
    } else {
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

    let issueProgress: ProgressBar;

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const progressCallback = (result: any) => {
      if (!issueProgress) {
        issueProgress = new ProgressBar(
          "fetching issues [:bar] :current/:total :percent",
          {
            complete: "=",
            incomplete: " ",
            width: 20,
            total: result.search.issueCount,
          }
        );
      }
      const resultLength = result.search.nodes?.length;
      if (resultLength) {
        issueProgress.tick(resultLength);
      }
    };

    const issues = await getIssues(this.github, searchQuery, progressCallback);

    const issuesWithComments = getIssuesWithComments(issues);

    const remainingComments = issuesWithComments
      .map((issue: Issue) => {
        return (
          issue.comments.totalCount -
          (issue.comments.nodes as IssueComment[]).length
        );
      })
      .reduce((x: number, y: number) => x + y, 0);

    const progress = new ProgressBar(
      "fetching comments [:bar] :current/:total :percent",
      {
        complete: "=",
        incomplete: " ",
        width: 20,
        total: remainingComments,
      }
    );

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const commentProgressCallback = (result: any) => {
      progress.tick(
        ((result.node as Issue).comments.nodes as IssueComment[]).length
      );
    };

    if (issuesWithComments.length > 0) {
      await getComments(
        this.github,
        issuesWithComments,
        commentProgressCallback
      );
    }

    // massage the data to remove GraphQL pagination data
    for (const issue of issues) {
      if (jira) {
        // We have to do surgery on the Issue object
        this.jiraFormatComments(issue);
        dot.del("comments.nodes", issue);
      } else {
        dot.move("comments.nodes", "comments", issue);
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      iterateObject(issue, (obj: any, prop: any) => {
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
    } else if (format === "JSON") {
      process.stdout.write(JSON.stringify(issues));
    } else if (format === "CSV") {
      let mapHeaders: Function | null = null;

      if (jira) {
        // Jira expects all comments to have a header of just "comment"
        // so we map comment0, comment1, comment2 etc to comment
        mapHeaders = function (header: string) {
          return header.replace(/comment[0-9]+/, "comment");
        };
      }

      const csv = await jsonexport(issues, { fillGaps: true, mapHeaders });
      process.stdout.write(csv);
    }
  }
}
