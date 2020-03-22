import * as core from '@actions/core'
import * as github from '@actions/github'

export enum ReviewStates {
  CHANGES_REQUESTED = 'CHANGES_REQUESTED',
  APPROVED = 'APPROVED',
}

export interface GraphQLResponse {
  nameWithOwner: string
  pullRequests: {
    nodes: PullRequest[]
    totalCount: number
  }
}

export interface PullRequest {
  id: string
  title: string
  url: string
  createdAt: string
  isDraft: boolean
  reviews: {
    totalCount: number
    nodes: [
      {
        state: keyof typeof ReviewStates
      },
    ]
  }
  comments: {
    totalCount: number
  }
  headRef: {
    name: string
  }
  commits: {
    nodes: object[]
  }
}

export async function queryPRs(token: string): Promise<GraphQLResponse> {
  try {
    const octokit = new github.GitHub(token)

    const response = await octokit.graphql(
      `query prs($owner: String!, $repo: String!) {
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
      }`,
      {
        ...github.context.repo,
        headers: {
          accept: `application/vnd.github.shadow-cat-preview+json`,
        },
      },
    )

    return response && response.repository
  } catch (err) {
    core.error(`Could not perform github query: ${err.message}`)
    throw err
  }
}
