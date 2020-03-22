import * as core from '@actions/core'
import { queryPRs } from '../src/github'

const mockGraphQl = jest.fn()

jest.mock('@actions/github', () => ({
  GitHub: jest.fn().mockImplementation(() => {
    return { graphql: mockGraphQl }
  }),
  context: {
    repo: 'SeanReece/pr-reporter-slack'
  }
}))
jest.mock('@actions/core')

test('performs query', async () => {
    await queryPRs('123')
    expect(mockGraphQl.mock.calls[0]).toMatchSnapshot()
})

test('throws on error', async () => {
    mockGraphQl.mockRejectedValue(new Error('bad'))
    await expect(queryPRs('123')).rejects.toThrow()
    expect(core.error).toHaveBeenCalledWith('Could not perform github query: bad')
})
