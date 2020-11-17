## Contributing

[fork]: https://github.com/github/github-artifact-exporter/fork
[pr]: https://github.com/github/github-artifact-exporter/compare
[style]: https://styleguide.github.com/js/
[code-of-conduct]: CODE_OF_CONDUCT.md

Hi there! We're thrilled that you'd like to contribute to this project. Your help is essential for keeping it great.

Contributions to this project are [released](https://docs.github.com/en/github/site-policy/github-terms-of-service#6-contributions-under-repository-license) to the public under the [project's open source license](LICENSE).

Please note that this project is released with a [Contributor Code of Conduct][code-of-conduct]. By participating in this project you agree to abide by its terms.

## Submitting a pull request

0. [Fork][fork] and clone the repository
0. Configure and install the dependencies: `npm install`
0. Make sure the tests pass on your machine: `npm test`
0. Create a new branch: `git checkout -b my-branch-name`
0. Make your change, add tests, and make sure the tests still pass
0. Push to your fork and [submit a pull request][pr]
0. Pat your self on the back and wait for your pull request to be reviewed and merged.

Here are a few things you can do that will increase the likelihood of your pull request being accepted:

- Follow the [style guide][style].
- Write tests.
- Keep your change as focused as possible. If there are multiple changes you would like to make that are not dependent upon each other, consider submitting them as separate pull requests.
- Write a [good commit message](http://tbaggery.com/2008/04/19/a-note-about-git-commit-messages.html).

## Releases
- Release are to follow [semantic versioning](https://semver.org/)
- Releases are to utilize the [Release](https://github.com/github/github-artifact-exporter/releases) feature of GitHub

1. Create a branch from the master branch `git checkout master; git checkout -b release-x.x`
1. Run locally `lerna version`
1. Select the correct next version _ie. v2.0.1_
1. Commit changed files with the exact commit message `chore(release): lerna publish`
1. Push these changes `git push`
1. Open a pull request, get approval, and merge
1. Once these changes are merged into `master` branch, automation will [create a release](https://github.com/github/github-artifact-exporter/blob/main/.github/workflows/release.yml), [build the artifacts, and upload them to the release](https://github.com/github/github-artifact-exporter/blob/main/.github/workflows/build.yml)

## Resources

- [How to Contribute to Open Source](https://opensource.guide/how-to-contribute/)
- [Using Pull Requests](https://docs.github.com/en/github/collaborating-with-issues-and-pull-requests/about-pull-requests)
- [GitHub Docs](https://docs.github.com)
