import { flags as flagTypes } from "@oclif/command";
import BaseCommand from "../../base";
export default class RepoProjects extends BaseCommand {
    static description: string;
    static flags: {
        projectNumber: import("@oclif/parser/lib/flags").IOptionFlag<number | undefined>;
        baseUrl: flagTypes.IOptionFlag<string>;
        token: flagTypes.IOptionFlag<string>;
        owner: flagTypes.IOptionFlag<string | undefined>;
        repo: flagTypes.IOptionFlag<string | undefined>;
        format: flagTypes.IOptionFlag<string>;
    };
    run(): Promise<void>;
}
//# sourceMappingURL=projects.d.ts.map