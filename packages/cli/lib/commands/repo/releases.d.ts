import BaseCommand from "../../base";
export default class RepoReleases extends BaseCommand {
    static description: string;
    static flags: {
        baseUrl: import("@oclif/command/lib/flags").IOptionFlag<string>;
        token: import("@oclif/command/lib/flags").IOptionFlag<string>;
        owner: import("@oclif/command/lib/flags").IOptionFlag<string | undefined>;
        repo: import("@oclif/command/lib/flags").IOptionFlag<string | undefined>;
        format: import("@oclif/command/lib/flags").IOptionFlag<string>;
    };
    run(): Promise<void>;
}
//# sourceMappingURL=releases.d.ts.map