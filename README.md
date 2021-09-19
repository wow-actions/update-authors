# Update Authors

Automatically generate and update `AUTHORS.txt` for your repository.

## Usage

Create a workflow file such as `.github/workflows/authors.yml` in your repository:

```yml
name: Update Authors
on:
  push:
    branches:
      - master
jobs:
  run:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
        with:
          fetch-depth: 0
      - uses: wow-actions/update-authors@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

Various inputs are defined to let you configure the action:

> Note: [Workflow command and parameter names are not case-sensitive](https://docs.github.com/en/free-pro-team@latest/actions/reference/workflow-commands-for-github-actions#about-workflow-commands).

| Name | Description | Default |
| --- | --- | --- |
| `GITHUB_TOKEN` | The GitHub token for authentication | N/A |
| `sort` | Sort type(`'alphabet'` or `'commits'`) of authors | `'alphabet'` |
| `bots` | Include bots or not | `true` |
| `template` | Template to render each line of authors <br> Placeholders `{{commits}}`, `{{name}}`, `{{email}}` are supportted | `'{{name}} <{{email}}>'` |
| `commit` | Commit message | `'chore: update AUTHORS [skip ci]'` |
| `path` | Path of the `AUTHORS.txt` file | `'AUTHORS'` |

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).
