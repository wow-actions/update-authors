import * as core from '@actions/core'
import * as github from '@actions/github'
import { exec } from 'child_process'
import mustache from 'mustache'

export namespace Action {
  export async function run() {
    try {
      const context = github.context
      const options = getOptions()
      const octokit = getOctokit()
      const authors = await getAuthors()
      const lines: string[] = []

      core.debug(JSON.stringify(options, null, 2))
      core.debug(JSON.stringify(authors, null, 2))

      mustache.parse(options.template)

      if (options.sort === 'commits') {
        authors.sort((a, b) => a.commits - b.commits)
      }

      authors.forEach((author) => {
        if (options.bots || !author.name.includes('[bot]')) {
          lines.push(mustache.render(options.template, author))
        }
      })

      const content = lines.join('\n')
      core.debug(`generated content: \n${content}`)

      const path = options.path
      const getContent = async () => {
        try {
          return await octokit.repos.getContent({
            ...github.context.repo,
            path,
          })
        } catch (err) {
          return null
        }
      }

      const preres = await getContent()
      const preContent = preres
        ? Buffer.from(preres.data.content, 'base64').toString()
        : null

      core.debug(`previous content: ${preContent}`)

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

  function getOctokit() {
    const token = core.getInput('GITHUB_TOKEN', { required: true })
    return github.getOctokit(token)
  }

  function getOptions() {
    return {
      sort: core.getInput('sort') || 'alphabet',
      bots: core.getInput('bots') === 'true',
      template: core.getInput('template') || '{{ name }} <{{ email }}>',
      path: core.getInput('path') || 'AUTHORS',
      commit: core.getInput('commit'),
    }
  }

  function getAuthors(): Promise<
    {
      commits: number
      name: string
      email: string
    }[]
  > {
    return new Promise((resolve, reject) => {
      exec('git shortlog -se --all', (err, stdout) => {
        if (err) {
          reject(err)
        } else {
          const authors = stdout
            .split(/\n/)
            .map((line) => line.trim())
            .filter((line) => line.length > 0)
            .map((line) => {
              const parts = line.split(/[\t\s]+/)
              return {
                commits: parseInt(parts[0], 10),
                name: parts[1],
                email: parts[2].substr(1, parts[2].length - 2),
              }
            })
          resolve(authors)
        }
      })
    })
  }
}
