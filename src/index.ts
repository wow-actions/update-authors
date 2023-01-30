import * as core from '@actions/core'
import * as github from '@actions/github'
import { exec } from 'child_process'
import mustache from 'mustache'
import parseInputs from '@wow-actions/parse-inputs'

function getOctokit() {
  const token = core.getInput('GITHUB_TOKEN', { required: true })
  return github.getOctokit(token)
}

function getOptions() {
  return parseInputs({
    sort: { type: 'string', defaultValue: 'alphabet' },
    template: { type: 'string', defaultValue: '{{ name }} <{{ email }}>' },
    path: { type: 'string', defaultValue: 'AUTHORS' },
    commit: { type: 'string', defaultValue: 'chore: update AUTHORS [skip ci]' },
    bots: { type: 'boolean', defaultValue: false },
  })
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
        core.debug(`raw: ${stdout}`)
        const authors = stdout
          .split(/\n/)
          .map((line) => line.trim())
          .filter((line) => line.length > 0)
          .map((line) => {
            const parts = line.split(/[\t\s]+/)
            const lastIndex = parts.length - 1
            return {
              commits: parseInt(parts[0], 10),
              name: parts.slice(1, lastIndex).join(' '),
              email: parts[lastIndex].substring(1, parts[lastIndex].length - 1),
            }
          })
        resolve(authors)
      }
    })
  })
}

export async function run() {
  try {
    const { context } = github
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

    const { path } = options
    const getContent = async () => {
      try {
        return await octokit.rest.repos.getContent({
          ...github.context.repo,
          path,
        })
      } catch (err) {
        return null
      }
    }

    const res = await getContent()
    const oldContent = res
      ? Buffer.from((res.data as any).content, 'base64').toString()
      : null

    core.debug(`previous content: ${oldContent}`)

    if (oldContent !== content) {
      await octokit.rest.repos.createOrUpdateFileContents({
        ...context.repo,
        path: options.path,
        content: Buffer.from(content).toString('base64'),
        message: options.commit,
        sha: res ? (res.data as any).sha : undefined,
      })
    }

    core.info(`Generated: "${options.path}"`)
  } catch (e) {
    core.error(e)
    core.setFailed(e.message)
  }
}

run()
