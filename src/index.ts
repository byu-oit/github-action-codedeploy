import * as core from '@actions/core'
import * as fs from 'fs'
import CodeDeploy from 'aws-sdk/clients/codedeploy'
import IAM from 'aws-sdk/clients/iam'
import STS from 'aws-sdk/clients/sts'

async function run(): Promise<void> {
  try {
    const appName = core.getInput('application-name')
    const groupName = core.getInput('deployment-group-name')
    const appspecFile = core.getInput('appspec-file')
    core.debug(`Hello world! ${appName}, ${groupName}, ${appspecFile}`)

    const appspecJson = fs.readFileSync(appspecFile, 'utf8')

    core.debug('*** appspecJson ***')
    core.debug(appspecJson)
    core.debug('*** end appspecJson ***')

    const codeDeploy = new CodeDeploy()
    const deployment = await codeDeploy
      .createDeployment({
        applicationName: appName,
        deploymentGroupName: groupName,
        revision: {
          revisionType: 'AppSpecContent',
          appSpecContent: {
            content: appspecJson
          }
        }
      })
      .promise()
    core.debug(`deployment: ${JSON.stringify(deployment)}`)

    if (deployment.deploymentId == null) {
      core.setFailed('deploymentId should not be null')
      return
    }

    const {awsAccountAlias, awsAccountId} = await getAccountInformation()
    const region = codeDeploy.config.region
    const linkToLogIn = 'https://aws.byu.edu/'
    const linkToDeployment = `https://${region}.console.aws.amazon.com/codesuite/codedeploy/deployments/${deployment.deploymentId}?region=${region}`
    core.info(`Started deployment.
    
Deployment ID:    ${deployment.deploymentId}
AWS Account:      ${awsAccountAlias} (${awsAccountId})
Region:           ${region}

To view the progress of this deployment:
 • Log into the ${awsAccountAlias} AWS account at ${linkToLogIn}
 • Go to ${linkToDeployment}`)

    await codeDeploy
      .waitFor('deploymentSuccessful', {
        deploymentId: deployment.deploymentId
      })
      .promise()

    process.exit(0)
  } catch (error) {
    core.setFailed(error.message)
  }
}

run()

async function getAccountInformation(): Promise<{awsAccountAlias: string; awsAccountId: string}> {
  const iam = new IAM()
  const sts = new STS()
  const [
    {
      AccountAliases: [awsAccountAlias = '?']
    },
    {Account: awsAccountId = '?'}
  ] = await Promise.all([
    iam
      .listAccountAliases()
      .promise()
      .catch(() => {
        return {AccountAliases: ['?']}
      }),
    sts
      .getCallerIdentity()
      .promise()
      .catch(() => ({Account: '?'}))
  ])
  return {awsAccountAlias, awsAccountId}
}
