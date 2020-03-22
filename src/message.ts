import { format } from 'timeago.js'
import * as github from './github'

export interface BlockMessage {
  username: string
  icon_emoji: string
  blocks: object[]
}

export function formatSinglePR(pr: github.PullRequest): string {
  let status = ''
  if (pr.reviews.totalCount === 0) {
    status = '*No reviews*'
  } else if (
    pr.reviews.nodes.some(
      review => review.state === github.ReviewStates.CHANGES_REQUESTED,
    )
  ) {
    status = '*Changes Requested*'
  } else {
    status = `*${pr.reviews.totalCount} approvals*`
  }
  return `\n👉 <${pr.url}|${pr.title}> | ${status} | ${format(
    pr.createdAt,
    'en_US',
  )}`
}

export function formatSlackMessage(
  repoName: string,
  text: string,
  totalPRs: number,
  readyPRs: number,
): BlockMessage {
  return {
    username: 'PR Reporter',
    // eslint-disable-next-line @typescript-eslint/camelcase
    icon_emoji: ':rolled_up_newspaper:',
    blocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `\n*${repoName}* has ${readyPRs} PRs ready for review`,
        },
      },
      {
        type: 'divider',
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text,
        },
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `You have *${totalPRs}* open PRs and *${readyPRs}* ready for review`,
          },
        ],
      },
      {
        type: 'divider',
      },
    ],
  }
}
