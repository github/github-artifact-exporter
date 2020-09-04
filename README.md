# GitHub Exporter

The GitHub Exporter provides a set of packages to make exporting artifacts from GitHub easier

Supported artifacts that you can export are
- Issues (including filtered sub sets)

Supported formats of the export file are
- CSV
- JIRA formatted CSV
- JSON

## Packages

### CLI

[@github/github-exporter-cli](packages/cli)

### Core

[@github/github-exporter-core](packages/core)

### GUI

[@github/github-exporter-gui](packages/gui)

## Getting Started

This is a [lerna](https://github.com/lerna/lerna) project. Clone the repository then set everything up with [`bootstrap`](https://github.com/lerna/lerna/tree/master/commands/bootstrap#readme).

```
lerna clean
lerna link
lerna bootstrap
```
