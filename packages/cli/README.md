# github-artifact-exporter

Exporter for GitHub

<!-- toc -->
* [github-artifact-exporter](#github-artifact-exporter)
* [Usage](#usage)
* [Commands](#commands)
<!-- tocstop -->

# Usage

This script requires a `personal access token` with access to the repository you are exporting from. The `owner` and `repo` arguments can be found in the repository url.

See the table below for examples of `owner` and `repo`

| Description               | URL                        | owner | repo |
| ------------------------- | -------------------------- | ----- | ---- |
| GitHub.com example        | https://github.com/foo/bar | foo   | bar  |
| GitHub Enterprise example | https://ghe.host/foo/bar   | foo   | bar  |

<!-- usage -->
```sh-session
$ npm install -g @github/github-artifact-exporter-cli
$ github-artifacts-exporter COMMAND
running command...
$ github-artifacts-exporter (-v|--version|version)
@github/github-artifact-exporter-cli/1.6.0 darwin-x64 node-v14.4.0
$ github-artifacts-exporter --help [COMMAND]
USAGE
  $ github-artifacts-exporter COMMAND
...
```
<!-- usagestop -->

## Examples

### Exporting issues

```
github-artifact-exporter.exe search:issues --owner github --repo caseflow --token <github-token> --since 2020-06-01 --until 2020-06-08 --format CSV > issue_export.csv
```

### Exporting closed issues with specific labels

```
github-artifact-exporter.exe search:issues --owner github --repo caseflow --token <github-token> --state closed --updatedSince 2020-06-01 --updatedUntil 2020-06-08 --labels "Type: Bug" --format CSV > issue_export.csv
```

### Exporting commits

```
github-artifact-exporter.exe repo:commits --owner github --repo caseflow --token <github-token> --since 2020-06-01 --until 2020-06-08 --format CSV > commit_export.csv
```

### Exporting pull requests

```
github-artifact-exporter.exe repo:pulls --owner github --repo caseflow --token $GITHUB_TOKEN --format CSV > pulls_export.csv
```

# Commands

<!-- commands -->
* [`github-artifacts-exporter help [COMMAND]`](#github-artifacts-exporter-help-command)

## `github-artifacts-exporter help [COMMAND]`

display help for github-artifacts-exporter

```
USAGE
  $ github-artifacts-exporter help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.1.0/src/commands/help.ts)_
<!-- commandsstop -->
