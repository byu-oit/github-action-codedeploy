import * as core from '@actions/core'
import * as fs from 'fs'
import client from 'aws-sdk/clients/codedeploy'

async function run () {
  try {
    const appName = core.getInput('application-name')
    const groupName = core.getInput('deployment-group-name')
    const appspecFile = core.getInput('appspec-file')
    core.debug(`Hello world! ${appName}, ${groupName}, ${appspecFile}`)

    const appspecJson = fs.readFileSync(appspecFile, 'utf8')

    core.debug('*** appspecJson ***')
    core.debug(appspecJson)
    core.debug('*** end appspecJson ***')

    const codeDeploy = new client()
    const deployment = await codeDeploy.createDeployment({
      applicationName: appName,
      deploymentGroupName: groupName,
      revision: {
        revisionType: 'AppSpecContent',
        appSpecContent: {
          content: appspecJson
        }
      }
    }).promise()
    core.debug(`deployment: ${JSON.stringify(deployment)}`)
    await codeDeploy.waitFor('deploymentSuccessful', {
      deploymentId: deployment.deploymentId!
    }).promise()

    process.exit(0)
  } catch (error) {
    console.error(error)
    core.setFailed(error.message)
    process.exit(1)
  }
}

run()
