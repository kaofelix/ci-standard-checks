import {mocked} from 'ts-jest/utils'
import jiraLinked, {hasJiraIssueKey} from './jiraLinked'
import {github, PullsGetResponse} from '../infrastructure/github'

const mockGithub = mocked(github, true)

jest.mock('../infrastructure/github')

describe('Jira Linked check', () => {
  describe('pul_request event', () => {
    const pullRequestResponse = {
      data: {
        title: '',
        head: {
          ref: ''
        }
      }
    }

    beforeEach(() => {
      mockGithub.context.eventName = 'pull_request'
      mockGithub.context.payload.pull_request = {
        number: 5
      }

      mockGithub.getPullRequest.mockResolvedValue(
        pullRequestResponse as PullsGetResponse
      )
    })

    it('returns true for PR with Jira Issue key in title', async () => {
      pullRequestResponse.data.title = 'JIRA-123: This title has a key'
      pullRequestResponse.data.head.ref = 'no-issue-name-here'

      await expect(jiraLinked.run()).resolves.toBeTruthy()
    })

    it('returns true for PR with Jira Issue key in branch name', async () => {
      pullRequestResponse.data.title = 'No Jira issue here'
      pullRequestResponse.data.head.ref = 'JIRA-123-there-is-an-issue-here'

      await expect(jiraLinked.run()).resolves.toBeTruthy()
    })

    it('throws error for PR without Jira Issue key', async () => {
      pullRequestResponse.data.title = 'No Jira isue here'
      pullRequestResponse.data.head.ref = 'neither-here'

      await expect(jiraLinked.run()).rejects.toThrow()
    })
  })
})

describe('hasJiraIssueKey', () => {
  it('returns true with issue key', () => {
    expect(hasJiraIssueKey('SETI-123')).toBeTruthy()
  })

  it('it returns false with text without issue key', () => {
    expect(hasJiraIssueKey('No Jira issue here')).toBeFalsy()
  })

  it('it returns false with branch name without issue key', () => {
    expect(hasJiraIssueKey('neither-here')).toBeFalsy()
  })
})
