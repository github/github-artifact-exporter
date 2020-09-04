import * as VAAgent from "@github/agent";
import Command, { flags as flagTypes } from "@oclif/command";
import { IConfig } from "@oclif/config";
import { Octokit } from "@octokit/rest";
import { DateTime } from "luxon";

export default abstract class Base extends Command {
  constructor(argv: string[], config: IConfig) {
    super(argv, config);
  }
  // this is immediately overwritten in the init method
  github: Octokit = new Octokit();

  static flags = {
    baseUrl: flagTypes.string({
      description: "GitHub base url",
      default: "https://api.github.com",
    }),

    token: flagTypes.string({
      description: "GitHub personal access token",
      env: "GITHUB_TOKEN",
      required: true,
    }),

    owner: flagTypes.string({
      dependsOn: ["repo"],
      description: "GitHub repository owner",
    }),

    repo: flagTypes.string({
      dependsOn: ["owner"],
      description: "GitHub repository name",
    }),

    format: flagTypes.enum({
      options: ["JSON", "CSV"],
      default: "JSON",
      description: "export format",
    }),
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
  parseDateFlag(flagName: string, date: string | undefined): string {
    let searchDate = "*";

    if (date) {
      const datetime = DateTime.fromFormat(date, "yyyy-MM-dd");

      if (!datetime.isValid) {
        throw new Error(
          `unable to parse flag "${flagName}"\n${datetime.invalidExplanation}`
        );
      }

      searchDate = datetime.toISO();
    }

    return searchDate;
  }

  async init() {
    const {
      flags: { baseUrl, token },
      /*
       * These next lines are required for parsing flags on commands
       * that extend from this base class since there is a type mismatch
       * between this.parse and this.constructor.
       *
       * See `init` in https://oclif.io/docs/base_class showing that is the
       * right way even though we have to disable our linter
       */
      // eslint-disable-next-line @typescript-eslint/ban-ts-ignore
      // @ts-ignore
    } = this.parse(this.constructor);

    this.github = new Octokit({
      baseUrl,
      auth: token,
      request: { agent: new VAAgent() },
    });
  }
}
