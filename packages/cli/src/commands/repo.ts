import BaseCommand from "../base";

export default class Repo extends BaseCommand {
  static description = "Export GitHub artifacts from a repository";

  async run() {
    this._help();
  }
}
