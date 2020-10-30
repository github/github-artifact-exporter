import { flags as flagTypes } from "@oclif/command";
import SearchCommand from "../search";
import { Issue } from "@department-of-veterans-affairs/github-exporter-core";
export default class SearchIssues extends SearchCommand {
    static description: string;
    static flags: {
        since: flagTypes.IOptionFlag<string | undefined>;
        until: flagTypes.IOptionFlag<string | undefined>;
        updatedSince: flagTypes.IOptionFlag<string | undefined>;
        updatedUntil: flagTypes.IOptionFlag<string | undefined>;
        state: flagTypes.IOptionFlag<string>;
        labels: flagTypes.IOptionFlag<string | undefined>;
        jira: import("@oclif/parser/lib/flags").IBooleanFlag<boolean>;
        query: flagTypes.IOptionFlag<string | undefined>;
        dateFormat: flagTypes.IOptionFlag<string>;
        baseUrl: flagTypes.IOptionFlag<string>;
        token: flagTypes.IOptionFlag<string>;
        owner: flagTypes.IOptionFlag<string | undefined>;
        repo: flagTypes.IOptionFlag<string | undefined>;
        format: flagTypes.IOptionFlag<string>;
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
    jiraFormatComments(issue: Issue): void;
    run(): Promise<void>;
}
//# sourceMappingURL=issues.d.ts.map