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
  contributors:
    runs-on: ubuntu-latest
    steps:
      - uses: bubkoo/update-authors@v1
        with:
          GITHUB_TOKEN: ${{ secrets.GITHUB_TOKEN }}
```

## Inputs

- `GITHUB_TOKEN`: Your GitHub token for authentication.
- `bots`: Include bots or not. Default `true`.
- `template`: Template to render author line. Default `'{{ name }} <{{ email }}>'`.
- `path`: Path and name to save the generated AUTHORS.txt. Default `'AUTHORS'`.
- `commit`: Commit message on push to repo. Default `'chore: update AUTHORS'`.

## License

The scripts and documentation in this project are released under the [MIT License](LICENSE).
