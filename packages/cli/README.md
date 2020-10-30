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
$ npm install -g @github/github-artifact-exporter
$ github-artifact-exporter COMMAND
running command...
$ github-artifact-exporter (-v|--version|version)
@github/github-artifact-exporter/1.5.8 darwin-x64 node-v12.18.3
$ github-artifact-exporter --help [COMMAND]
USAGE
  $ github-artifact-exporter COMMAND
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
* [`github-artifact-exporter help [COMMAND]`](#github-artifact-exporter-help-command)
* [`github-artifact-exporter repo`](#github-artifact-exporter-repo)
* [`github-artifact-exporter repo:commits`](#github-artifact-exporter-repocommits)
* [`github-artifact-exporter repo:milestones`](#github-artifact-exporter-repomilestones)
* [`github-artifact-exporter repo:projects`](#github-artifact-exporter-repoprojects)
* [`github-artifact-exporter repo:pulls`](#github-artifact-exporter-repopulls)
* [`github-artifact-exporter repo:releases`](#github-artifact-exporter-reporeleases)
* [`github-artifact-exporter search`](#github-artifact-exporter-search)
* [`github-artifact-exporter search:issues`](#github-artifact-exporter-searchissues)

## `github-artifact-exporter help [COMMAND]`

display help for github-artifact-exporter

```
USAGE
  $ github-artifact-exporter help [COMMAND]

ARGUMENTS
  COMMAND  command to show help for

OPTIONS
  --all  see all commands in CLI
```

_See code: [@oclif/plugin-help](https://github.com/oclif/plugin-help/blob/v3.1.0/src/commands/help.ts)_

## `github-artifact-exporter repo`

Export GitHub artifacts from a repository

```
USAGE
  $ github-artifact-exporter repo

OPTIONS
  --baseUrl=baseUrl    [default: https://api.github.com] GitHub base url
  --format=(JSON|CSV)  [default: JSON] export format
  --owner=owner        GitHub repository owner
  --repo=repo          GitHub repository name
  --token=token        (required) GitHub personal access token
```

_See code: [src/commands/repo.ts](https://github.com/github/github-artifact-exporter/blob/main/packages/cli/src/commands/repo.ts)_

## `github-artifact-exporter repo:commits`

Export GitHub Commits for a repository

```
USAGE
  $ github-artifact-exporter repo:commits

OPTIONS
  --baseUrl=baseUrl    [default: https://api.github.com] GitHub base url
  --branch=branch      [default: master] git branch to export commits for
  --format=(JSON|CSV)  [default: JSON] export format
  --owner=owner        GitHub repository owner
  --repo=repo          GitHub repository name
  --since=since        search commits created after yyyy-mm-dd
  --token=token        (required) GitHub personal access token
  --until=until        search commits created before yyyy-mm-dd
```

_See code: [src/commands/repo/commits.ts](https://github.com/github/github-artifact-exporter/blob/main/packages/cli/src/commands/repo/commits.ts)_

## `github-artifact-exporter repo:milestones`

Export GitHub Milestones for a repository

```
USAGE
  $ github-artifact-exporter repo:milestones

OPTIONS
  --baseUrl=baseUrl    [default: https://api.github.com] GitHub base url
  --format=(JSON|CSV)  [default: JSON] export format
  --owner=owner        GitHub repository owner
  --repo=repo          GitHub repository name
  --token=token        (required) GitHub personal access token
```

_See code: [src/commands/repo/milestones.ts](https://github.com/github/github-artifact-exporter/blob/main/packages/cli/src/commands/repo/milestones.ts)_

## `github-artifact-exporter repo:projects`

Export GitHub Milestones for a repository

```
USAGE
  $ github-artifact-exporter repo:projects

OPTIONS
  --baseUrl=baseUrl              [default: https://api.github.com] GitHub base url
  --format=(JSON|CSV)            [default: JSON] export format
  --owner=owner                  GitHub repository owner
  --projectNumber=projectNumber  Project number from where to pull cards
  --repo=repo                    GitHub repository name
  --token=token                  (required) GitHub personal access token
```

_See code: [src/commands/repo/projects.ts](https://github.com/github/github-artifact-exporter/blob/main/packages/cli/src/commands/repo/projects.ts)_

## `github-artifact-exporter repo:pulls`

Export GitHub Pull Requests for a repository

```
USAGE
  $ github-artifact-exporter repo:pulls

OPTIONS
  --baseUrl=baseUrl    [default: https://api.github.com] GitHub base url
  --format=(JSON|CSV)  [default: JSON] export format
  --owner=owner        (required) GitHub repository owner
  --repo=repo          (required) GitHub repository name
  --token=token        (required) GitHub personal access token
```

_See code: [src/commands/repo/pulls.ts](https://github.com/github/github-artifact-exporter/blob/main/packages/cli/src/commands/repo/pulls.ts)_

## `github-artifact-exporter repo:releases`

Export GitHub Releases for a repository

```
USAGE
  $ github-artifact-exporter repo:releases

OPTIONS
  --baseUrl=baseUrl    [default: https://api.github.com] GitHub base url
  --format=(JSON|CSV)  [default: JSON] export format
  --owner=owner        GitHub repository owner
  --repo=repo          GitHub repository name
  --token=token        (required) GitHub personal access token
```

_See code: [src/commands/repo/releases.ts](https://github.com/github/github-artifact-exporter/blob/main/packages/cli/src/commands/repo/releases.ts)_

## `github-artifact-exporter search`

GitHub Search base command

```
USAGE
  $ github-artifact-exporter search

OPTIONS
  --baseUrl=baseUrl    [default: https://api.github.com] GitHub base url
  --format=(JSON|CSV)  [default: JSON] export format
  --owner=owner        GitHub repository owner
  --repo=repo          GitHub repository name
  --token=token        (required) GitHub personal access token
```

_See code: [src/commands/search.ts](https://github.com/github/github-artifact-exporter/blob/main/packages/cli/src/commands/search.ts)_

## `github-artifact-exporter search:issues`

Export GitHub Issues using Search

```
USAGE
  $ github-artifact-exporter search:issues

OPTIONS
  --baseUrl=baseUrl            [default: https://api.github.com] GitHub base url
  --dateFormat=dateFormat      [default: isoDateTime] Date format to use when building issue list.  Examples: mm/dd/yyyy
  --format=(JSON|CSV)          [default: JSON] export format
  --jira                       transform output into a usable format for importing to Jira
  --labels=labels              search issues with these labels (comma seperated)
  --owner=owner                GitHub repository owner
  --query=query                Search query matching GitHub issue search syntax
  --repo=repo                  GitHub repository name
  --since=since                search issues created after yyyy-mm-dd
  --state=(open|closed)        search issues in this state
  --token=token                (required) GitHub personal access token
  --until=until                search issues created before yyyy-mm-dd
  --updatedSince=updatedSince  search issues updated after yyyy-mm-dd
  --updatedUntil=updatedUntil  search issues updated before yyyy-mm-dd
```

_See code: [src/commands/search/issues.ts](https://github.com/github/github-artifact-exporter/blob/main/packages/cli/src/commands/search/issues.ts)_
<!-- commandsstop -->
