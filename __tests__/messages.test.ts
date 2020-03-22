import * as core from '@actions/core'
import { formatSinglePR, formatSlackMessage } from '../src/message'
import { PullRequest } from '../src/github'

const mockPR: PullRequest = {
  id: 'MDExOlB1bGxSZXF1ZXN0Mzg4ODU2OTU0',
  title: 'Bump acorn from 5.7.3 to 5.7.4',
  url: 'https://github.com/SeanReece/pr-reporter-slack/pull/9',
  createdAt: '2020-03-15T22:40:33Z',
  isDraft: false,
  reviews: {
    totalCount: 1,
    nodes: [
      {
        state: 'APPROVED',
      },
    ],
  },
  comments: {
    totalCount: 0,
  },
  headRef: {
    name: 'dependabot/npm_and_yarn/acorn-5.7.4',
  },
  commits: {
    nodes: [
      {
        commit: {
          status: null,
        },
      },
    ],
  },
}

test('formats single PR', () => {
  const formattedPR = formatSinglePR(mockPR)
  expect(formattedPR).toMatchSnapshot()
})

test('formats slack message', () => {
  const formattedPR = formatSinglePR(mockPR)
  const formattedSlackMessage = formatSlackMessage('SeanReece/pr-reporter-slack', formattedPR, 2, 1)
  expect(formattedSlackMessage).toMatchSnapshot()
})
