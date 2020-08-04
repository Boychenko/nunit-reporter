import {setFailed, getInput} from '@actions/core'
import {publishResults, UploadOptions} from './publish-results'

async function run(): Promise<void> {
  try {
    const path = getInput('path')
    const numFailures = parseInt(getInput('numFailures'))
    const accessToken = getInput('access-token')
    const title = getInput('reportTitle')
    const srcReplacement = getInput('src-replacement')

    const options = new UploadOptions(
      path,
      accessToken,
      title,
      numFailures,
      srcReplacement
    )

    await publishResults(options)
  } catch (error) {
    setFailed(error.message)
  }
}

run()
