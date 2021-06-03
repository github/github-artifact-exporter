import { flags as flagTypes } from "@oclif/command";
import BaseCommand from "../../base";
import { PullRequest } from "../../github";
export default class RepoPulls extends BaseCommand {
    static description: string;
    static flags: {
        owner: flagTypes.IOptionFlag<string>;
        repo: flagTypes.IOptionFlag<string>;
        since: flagTypes.IOptionFlag<string | undefined>;
        until: flagTypes.IOptionFlag<string | undefined>;
        baseUrl: flagTypes.IOptionFlag<string>;
        token: flagTypes.IOptionFlag<string>;
        format: flagTypes.IOptionFlag<string>;
    };
    fetchPulls(query: string, owner: string, repo: string): Promise<PullRequest[]>;
    fetchComments(query: string, pull: PullRequest, progress: any): Promise<void>;
    run(): Promise<void>;
}
//# sourceMappingURL=pulls.d.ts.map