import * as github from '@actions/github'
import * as core from '@actions/core'
import axios from 'axios'
import { format } from 'timeago.js';

async function run(): Promise<void> {
  try {
    const token: string = core.getInput('repo-token')
    const slackWebhook: string = core.getInput('slack-webhook')

    const octokit = new github.GitHub(token)

    const response = await octokit.graphql(`query prs($owner: String!, $repo: String!) {
      repository(owner:$owner, name:$repo) {
        nameWithOwner,
        pullRequests(first: 100, states: OPEN) {
          nodes {
            id
            title
            url
            createdAt
            isDraft
            reviews(first: 10, states: [CHANGES_REQUESTED, APPROVED]) {
              totalCount
              nodes {
                state
              }
            }
            comments {
              totalCount
            }
            headRef {
              name
            }
            commits(first: 10) {
              nodes {
                commit {
                  status {
                    id
                    state
                  }
                }
              }
            }
          }
          totalCount
        }
      }
    }`, {
        ...github.context.repo, 
        headers: {
          accept: `application/vnd.github.shadow-cat-preview+json`
        }
      }
    )

    const pullRequests = response && response.repository.pullRequests.nodes
    const repoName = response && response.repository.nameWithOwner

    const readyPRS = pullRequests.filter((pr: any) => !pr.isDraft && !pr.title.toLowerCase().startsWith('[wip]'))

    let text = ''

    readyPRS.forEach((pr: any) => {
      let status = ''
      if (pr.reviews.totalCount === 0) {
        status = '*No reviews*'
      } else if (pr.reviews.nodes.some((review: any) => review.state === 'CHANGES_REQUESTED')) {
        status = '*Changes Requested*'
      } else {
        status = `*${pr.reviews.totalCount} approvals*`
      }
      text = text.concat(`\n👉 <${pr.url}|${pr.title}> | ${status} | ${format(pr.createdAt, 'en_US')}`)
    })

    const message = {
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: `\n*${repoName}* has ${readyPRS.length} PRs ready for review`
          }
        },
        {
          type: "divider"
        },
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text
          }
        },
        {
          type: "context",
          elements: [
            {
              type: "mrkdwn",
              text: `You have *${pullRequests.length}* open PRs and *${readyPRS.length}* ready for review`
            }
          ]
        }
      ],
      username: 'PR Reporter',
      icon_emoji: ':rolled_up_newspaper:' 
    }

    return await axios.post(slackWebhook, message)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()
