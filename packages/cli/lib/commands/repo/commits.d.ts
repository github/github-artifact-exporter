import { flags as flagTypes } from "@oclif/command";
import BaseCommand from "../../base";
export default class RepoCommits extends BaseCommand {
    static description: string;
    static flags: {
        branch: flagTypes.IOptionFlag<string>;
        since: flagTypes.IOptionFlag<string | undefined>;
        until: flagTypes.IOptionFlag<string | undefined>;
        baseUrl: flagTypes.IOptionFlag<string>;
        token: flagTypes.IOptionFlag<string>;
        owner: flagTypes.IOptionFlag<string | undefined>;
        repo: flagTypes.IOptionFlag<string | undefined>;
        format: flagTypes.IOptionFlag<string>;
    };
    run(): Promise<void>;
}
//# sourceMappingURL=commits.d.ts.map