import { format } from 'timeago.js'
import * as core from '@actions/core'
import * as github from './github'
import { differenceInCalendarDays } from 'date-fns'
export interface BlockMessage {
  username: string
  icon_emoji: string
  blocks: object[]
}

export function formatSinglePR(pr: github.PullRequest): string {
  const stalePrDays: string = core.getInput('stale-pr') // Number of days before marking a PR as stale
  let status = ''
  let stalePr: boolean

  const createdAt = new Date(pr.createdAt)
  if (differenceInCalendarDays(createdAt, Date.now()) <= (stalePrDays || -15)) {
    stalePr = true
  }
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

  const dateString = (): string => {
    if (stalePr) {
      return `🚨 ${format(pr.createdAt, 'en_US')} 🚨`
    }
    return `${format(pr.createdAt, 'en_US')}`
  }

  return `\n👉 <${pr.url}|${pr.title}> | ${status} | ${dateString()}`
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
