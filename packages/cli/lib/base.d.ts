import Command, { flags as flagTypes } from "@oclif/command";
import { IConfig } from "@oclif/config";
import { Octokit } from "@octokit/rest";
export default abstract class Base extends Command {
    constructor(argv: string[], config: IConfig);
    github: Octokit;
    static flags: {
        baseUrl: flagTypes.IOptionFlag<string>;
        token: flagTypes.IOptionFlag<string>;
        owner: flagTypes.IOptionFlag<string | undefined>;
        repo: flagTypes.IOptionFlag<string | undefined>;
        format: flagTypes.IOptionFlag<string>;
    };
    /**
     * Parse date into ISO or "*" if null/undefined this
     * allows it to be used with the `created` filter
     * for GitHub Search
     *
     * @param {string} flagName
     * @param {string} date
     * @returns {string}
     */
    parseDateFlag(flagName: string, date: string | undefined): string;
    init(): Promise<void>;
}
//# sourceMappingURL=base.d.ts.map