# GitHub Exporter
_Currently in used in production_

The GitHub Exporter is written in Typescript and provides a set of packages to make exporting artifacts from GitHub easier useful for those migrating information out of github.com

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
lerna run build
# Optional, start the gui to ensure its working
lerna run start
```

## Contributing
We welcome you to contribute to this project! Check out [Open Issues](https://github.com/github/github-artifact-exporter/issues) and our [`CONTRIBUTING.md`](./CONTRIBUTING.md) to jump in.

## License
[MIT](./LICENSE)  
When using the GitHub logos, be sure to follow the [GitHub logo guidelines](https://github.com/logos).
