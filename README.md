<p align="center">
  <a href="https://github.com/SeanReece/pr-reporter-slack/actions"><img alt="typescript-action status" src="https://github.com/SeanReece/pr-reporter-slack/workflows/build-test/badge.svg"></a>
</p>

# PR Reporter Slack

<p align="center">
  <span style="font-size: 128px;">🗞</span>
</p>

A github action that will bug you in slack when you have pull requests ready for review.

<p align="center">
  <img src="./slack.png" alt="PR Reporter logo"/>
</p>

## Installation

### Create Slack webhook
Add a incoming slack webhook here: https://qlikdev.slack.com/apps/new/A0F7XDUAZ-incoming-webhooks

Choose the slack channel you'd like your messages sent to.

### Add Slack webhook to github repo secrets
Add a new secret in your target repo caled `SLACK_WEBHOOK` and make the value the url of the slack webhook you created earlier.

### Create `.github/workflows/pr-reporter-slack.yml`
Copy and paste the following snippet into your .yml file.

```yml
name: PR Reporter

schedule:
    # Run this every day at 9am and 1pm
    - cron:  '0 9,13 * * *'

jobs:
  pr-reporter-slack:
    runs-on: ubuntu-latest
    steps:
    - uses: actions/checkout@v1
    - uses: SeanReece/pr-reporter-slack@v1
      with: 
        repo-token: ${{ secrets.GITHUB_TOKEN }}
        slack-webhook: ${{ secrets.SLACK_WEBHOOK }}
```

