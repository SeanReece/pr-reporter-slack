import * as core from '@actions/core'
import axios from 'axios'
import * as github from '../src/github'
import { formatSlackMessage, formatSinglePR, BlockMessage } from '../src/message'
import prReporter from '../src/prReporter'

jest.mock('@actions/core')
jest.mock('../src/github')
jest.mock('../src/message')
jest.mock('axios')

const mockToken = '123'
const mockSlackWebhook = 'http://test'
const mockResponse: github.GraphQLResponse = {
  "nameWithOwner": "SeanReece/pr-reporter-slack",
  "pullRequests": {
    "nodes": [
      {
        "id": "MDExOlB1bGxSZXF1ZXN0Mzg4ODU2OTU0",
        "title": "Bump acorn from 5.7.3 to 5.7.4",
        "url": "https://github.com/SeanReece/pr-reporter-slack/pull/9",
        "createdAt": "2020-03-15T22:40:33Z",
        "isDraft": false,
        "reviews": {
          "totalCount": 1,
          "nodes": [
            {
              "state": "APPROVED"
            }
          ]
        },
        "comments": {
          "totalCount": 0
        },
        "headRef": {
          "name": "dependabot/npm_and_yarn/acorn-5.7.4"
        },
        "commits": {
          "nodes": [
            {
              "commit": {
                "status": null
              }
            }
          ]
        },
        "labels": {
          "nodes": [
            {
              "name": 'bug'
            }
          ]
        }
      },
      {
        "id": "MDExOlB1bGxSZXF1ZXN0Mzg4ODU2OTU1",
        "title": "Make stuff awesome",
        "url": "https://github.com/SeanReece/pr-reporter-slack/pull/10",
        "createdAt": "2020-03-16T22:45:33Z",
        "isDraft": false,
        "reviews": {
          "totalCount": 0,
          "nodes": []
        },
        "comments": {
          "totalCount": 0
        },
        "headRef": {
          "name": "stuff"
        },
        "commits": {
          "nodes": [
            {
              "commit": {
                "status": null
              }
            }
          ]
        },
        "labels": {
          "nodes": []
        }
      }
    ],
    "totalCount": 2
  }
}

const mockBlockMessage: BlockMessage = {
  username: 'PR Reporter',
  icon_emoji: ':rolled_up_newspaper:',
  blocks: [{
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `\n*SeanReece/pr-reporter-slack* has 5 PRs ready for review`,
    },
  }]
}

test('Queries for PRs and sends to slack webhook', async () => {
  (core.getInput as jest.Mock).mockImplementationOnce(() => mockToken);
  (core.getInput as jest.Mock).mockImplementationOnce(() => mockSlackWebhook);
  (core.getInput as jest.Mock).mockImplementationOnce(() => 'true');
  (github.queryPRs as jest.Mock).mockResolvedValue(mockResponse);
  (formatSinglePR as jest.Mock).mockReturnValue('test');
  (formatSlackMessage as jest.Mock).mockReturnValue(mockBlockMessage);
  await prReporter()
  expect(github.queryPRs).toHaveBeenCalledWith(mockToken)
  expect(formatSinglePR).toHaveBeenCalledTimes(2)
  expect(formatSinglePR).toHaveBeenCalledWith(mockResponse.pullRequests.nodes[0])
  expect(formatSinglePR).toHaveBeenCalledWith(mockResponse.pullRequests.nodes[1])
  expect(formatSlackMessage).toHaveBeenCalledWith(mockResponse.nameWithOwner, 'testtest', 2, 2)
  expect(axios.post).toHaveBeenCalledWith(mockSlackWebhook, mockBlockMessage)
})

test('Queries for PRs and sends empty message to slack webhook', async () => {
  const emptyResponse = {
    ...mockResponse,
    pullRequests: {
      nodes: []
    }
  };
  (core.getInput as jest.Mock).mockImplementationOnce(() => mockToken);
  (core.getInput as jest.Mock).mockImplementationOnce(() => mockSlackWebhook);
  (core.getInput as jest.Mock).mockImplementationOnce(() => 'true');
  (github.queryPRs as jest.Mock).mockResolvedValue(emptyResponse);
  (formatSinglePR as jest.Mock).mockReturnValue('test');
  (formatSlackMessage as jest.Mock).mockReturnValue(mockBlockMessage);
  await prReporter()
  expect(github.queryPRs).toHaveBeenCalledWith(mockToken)
  expect(formatSinglePR).toHaveBeenCalledTimes(0)
  expect(formatSlackMessage).toHaveBeenCalledWith(mockResponse.nameWithOwner, '👍 No PRs waiting for review!', 0, 0)
  expect(axios.post).toHaveBeenCalledWith(mockSlackWebhook, mockBlockMessage)
})

test('Queries for PRs and does not send message when notify-empty = false', async () => {
  const emptyResponse = {
    ...mockResponse,
    pullRequests: {
      nodes: []
    }
  };
  (core.getInput as jest.Mock).mockImplementationOnce(() => mockToken);
  (core.getInput as jest.Mock).mockImplementationOnce(() => mockSlackWebhook);
  (core.getInput as jest.Mock).mockImplementationOnce(() => 'false');
  (github.queryPRs as jest.Mock).mockResolvedValue(emptyResponse);
  (formatSinglePR as jest.Mock).mockReturnValue('test');
  (formatSlackMessage as jest.Mock).mockReturnValue(mockBlockMessage);
  await prReporter()
  expect(github.queryPRs).toHaveBeenCalledWith(mockToken)
  expect(formatSinglePR).toHaveBeenCalledTimes(0)
  expect(formatSlackMessage).toHaveBeenCalledTimes(0)
  expect(axios.post).toHaveBeenCalledTimes(0)
})

test('Excludes correct PRs when exlude-labels is set', async () => {
  (core.getInput as jest.Mock).mockImplementationOnce(() => mockToken);
  (core.getInput as jest.Mock).mockImplementationOnce(() => mockSlackWebhook);
  (core.getInput as jest.Mock).mockImplementationOnce(() => 'false');
  (core.getInput as jest.Mock).mockImplementationOnce(() => 'bug,stuff');
  (github.queryPRs as jest.Mock).mockResolvedValue(mockResponse);
  (formatSinglePR as jest.Mock).mockReturnValue('test');
  (formatSlackMessage as jest.Mock).mockReturnValue(mockBlockMessage);
  await prReporter()
  expect(github.queryPRs).toHaveBeenCalledWith(mockToken)
  expect(formatSinglePR).toHaveBeenCalledTimes(1)
  expect(formatSinglePR).toHaveBeenCalledWith(mockResponse.pullRequests.nodes[1])
  expect(formatSlackMessage).toHaveBeenCalledWith(mockResponse.nameWithOwner, 'test', 2, 1)
  expect(axios.post).toHaveBeenCalledWith(mockSlackWebhook, mockBlockMessage)
})

test('Sets action as failed when query fails', async () => {
  (core.getInput as jest.Mock).mockImplementationOnce(() => mockToken);
  (core.getInput as jest.Mock).mockImplementationOnce(() => mockSlackWebhook);
  (github.queryPRs as jest.Mock).mockRejectedValue(new Error('bad'));
  await prReporter()
  expect(github.queryPRs).toHaveBeenCalledWith(mockToken)
  expect(core.setFailed).toHaveBeenCalledWith('bad')
})
