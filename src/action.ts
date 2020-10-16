import * as core from '@actions/core'
import * as github from '@actions/github'
import mustache from 'mustache'

export namespace Action {
  function getOctokit() {
    const token = core.getInput('GITHUB_TOKEN', { required: true })
    return github.getOctokit(token)
  }

  function getOptions() {
    return {
      bots: core.getInput('bots') === 'true',
      template: core.getInput('template') || '{{ name }} <{{ email }}>',
      path: core.getInput('path') || 'AUTHORS',
      commit: core.getInput('commit'),
    }
  }

  function getRepo() {
    const raw = core.getInput('repo') || ''
    const parts = raw.split('/')
    const context = github.context
    const owner = parts.length === 2 ? parts[0] : context.repo.owner
    const repo = parts.length === 2 ? parts[1] : context.repo.repo
    return { owner, repo }
  }

  export async function run() {
    try {
      const context = github.context
      const options = getOptions()
      const octokit = getOctokit()
      const { owner, repo } = getRepo()
      const { data: authors } = await octokit.migrations.getCommitAuthors({
        owner,
        repo,
      })

      const lines: string[] = []

      core.debug(JSON.stringify(authors, null, 2))

      mustache.parse(options.template)

      authors.forEach((author) => {
        if (options.bots || !author.name.includes('[bot]')) {
          lines.push(mustache.render(options.template, author))
        }
      })

      const path = options.path
      const content = lines.join('\n')
      const preres = await octokit.repos.getContent({
        ...github.context.repo,
        path,
      })
      const preContent = preres
        ? Buffer.from(preres.data.content, 'base64').toString()
        : null

      core.debug(`content: \n${content}`)

      if (preContent !== content) {
        await octokit.repos.createOrUpdateFileContents({
          ...context.repo,
          path: options.path,
          content: Buffer.from(lines).toString('base64'),
          message: options.commit,
          sha: preres ? preres.data.sha : undefined,
        })
      }

      core.info(`Generated: "${options.path}"`)
    } catch (e) {
      core.error(e)
      core.setFailed(e.message)
    }
  }
}
