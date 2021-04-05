import * as core from '@actions/core'
import axios from 'axios'
import * as github from './github'
import { formatSlackMessage, formatSinglePR } from './message'

export default async function run(): Promise<void> {
  try {
    const token: string = core.getInput('repo-token')
    const slackWebhook: string = core.getInput('slack-webhook')
    const notifyEmpty: boolean = core.getInput('notify-empty') === 'true'
    const excludeLabels: string[] = core.getInput('exclude-labels')?.split(',')
    core.debug(`Excluding: ${JSON.stringify(excludeLabels)}`)
    const response = await github.queryPRs(token)

    core.debug('Successful GraphQL response')

    const pullRequests = response?.pullRequests.nodes
    const repoName = response?.nameWithOwner
    const excludedCount = pullRequests.filter((pr: github.PullRequest) => {
      const excluded =
        excludeLabels &&
        pr.labels.nodes.some(label => excludeLabels.includes(label.name))
      core.debug(JSON.stringify(pr.labels.nodes))
      return excluded
    }).length
    core.debug(`Excluded-- ${excludedCount}`)
    const readyPRS = pullRequests.filter((pr: github.PullRequest) => {
      const inProgress =
        pr.isDraft || pr.title.toLowerCase().startsWith('[wip]')
      const excluded =
        excludeLabels &&
        pr.labels.nodes.some(label => excludeLabels.includes(label.name))
      core.debug
      return !inProgress && !excluded
    })

    let text = ''

    if (readyPRS.length === 0) {
      if (notifyEmpty) {
        text = '👍 No PRs waiting for review!'
      } else {
        return
      }
    }

    for (const pr of readyPRS) {
      text = text.concat(formatSinglePR(pr))
    }

    const message = formatSlackMessage(
      repoName,
      text,
      pullRequests.length,
      readyPRS.length,
    )
    core.debug(JSON.stringify(message))
    await axios.post(slackWebhook, message)
    core.debug('Successful Slack webhook response')
  } catch (error) {
    core.setFailed(error.message)
  }
}
