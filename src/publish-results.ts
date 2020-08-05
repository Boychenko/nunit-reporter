import {getOctokit, context} from '@actions/github'
import {readResults, Annotation} from './nunit'

function generateSummary(annotation: Annotation): string {
  return `* ${annotation.title}\n   ${annotation.message}`
}

export class UploadOptions {
  public constructor(
    public readonly path: string,
    public readonly access_token: string,
    public readonly title: string,
    public readonly num_failures: number,
    public readonly srcReplacement: string
  ) {}
}

export async function publishResults(options: UploadOptions): Promise<void> {
  const results = await readResults(options.path, options.srcReplacement)

  const octokit = getOctokit(options.access_token)

  const summary =
    results.failed > 0
      ? `${results.failed} tests failed`
      : `${results.passed} tests passed`

  let details =
    results.failed === 0
      ? `** ${results.passed} tests passed**`
      : `
**${results.passed} tests passed**
**${results.failed} tests failed**
`

  for (const ann of results.annotations) {
    const annStr = generateSummary(ann)
    const newDetails = `${details}\n${annStr}`
    if (newDetails.length > 65000) {
      details = `${details}\n\n ... and more.`
      break
    } else {
      details = newDetails
    }
  }

  const pr = context.payload.pull_request
  await octokit.checks.create({
    head_sha: (pr && pr['head'] && pr['head'].sha) || context.sha,
    name: options.title,
    owner: context.repo.owner,
    repo: context.repo.repo,
    status: 'completed',
    conclusion:
      results.failed > 0 || results.passed === 0 ? 'failure' : 'success',
    output: {
      title: options.title,
      summary,
      annotations: results.annotations.slice(0, options.num_failures),
      text: details
    }
  })
}
