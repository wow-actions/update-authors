# Update Authors

A Github Action to automate generate and update AUTHORS.txt for your repository.

## Usage

Create a workflow file such as `.github/workflows/authors.yml`:

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
      - uses: bubkoo/update-authors@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

- `GITHUB_TOKEN`: Your GitHub token for authentication.
- `sort`: Sort type(alphabet or commits) of authors. Default `alphabet`.
- `bots`: Include bots or not. Default `true`.
- `template`: Template to render author line. Support `{{ commits }}`, `{{ name }}`, `{{ email }}` placeholders. Default `'{{ name }} <{{ email }}>'`.
- `path`: Path and name to save the generated AUTHORS.txt. Default `'AUTHORS'`.
- `commit`: Commit message on push to repo. Default `'chore: update AUTHORS'`.

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).
