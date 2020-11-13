/* globals __dirname */

import * as fs from "fs";
import * as path from "path";
import { Issue, IssueComment } from "./github";

export function loadQuery(name: string): string {
  return fs.readFileSync(
    path.join(__dirname, "..", "queries", `${name}.graphql`),
    "utf8"
  );
}

export const getIssuesWithComments = (issues: Issue[]): Issue[] => {
  return issues.filter(
    (issue: Issue) =>
      issue.comments.totalCount -
      (issue.comments.nodes as IssueComment[]).length
  );
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const iterateObject = (obj: any, callback: Function): any => {
  for (const property in obj) {
    if (obj.hasOwnProperty(property)) {
      if (typeof obj[property] == "object") {
        iterateObject(obj[property], callback);
      } else {
        callback(obj, property);
      }
    }
  }
};
