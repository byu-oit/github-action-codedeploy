import {getInput, debug, info, setFailed} from '@actions/core'
import {readFileSync} from 'fs'
import {
  CodeDeployClient,
  CreateDeploymentCommand,
  waitUntilDeploymentSuccessful
} from '@aws-sdk/client-codedeploy'
import {IAMClient, ListAccountAliasesCommand} from '@aws-sdk/client-iam'
import {STSClient, GetCallerIdentityCommand} from '@aws-sdk/client-sts'

async function run(): Promise<void> {
  try {
    const appName = getInput('application-name', {required: true})
    const groupName = getInput('deployment-group-name', {required: true})
    const appspecFile = getInput('appspec-file', {required: true})
    const maxWaitTime = parseInt(getInput('max-wait-time'), 10) || 3600 // Default to one hour
    debug(`Hello world! ${appName}, ${groupName}, ${appspecFile}`)

    const appspecJson = readFileSync(appspecFile, 'utf8')

    debug('*** appspecJson ***')
    debug(appspecJson)
    debug('*** end appspecJson ***')

    const codedeployClient = new CodeDeployClient()
    const {deploymentId} = await codedeployClient.send(
      new CreateDeploymentCommand({
        applicationName: appName,
        deploymentGroupName: groupName,
        revision: {
          revisionType: 'AppSpecContent',
          appSpecContent: {
            content: appspecJson
          }
        }
      })
    )

    if (deploymentId == null) {
      setFailed('deploymentId should not be null')
      return
    }

    const {awsAccountAlias, awsAccountId} = await getAccountInformation()
    const region = process.env.AWS_REGION
    const iamRole = `PowerUser-${awsAccountId}`
    const destinationUrl = `https://${region}.console.aws.amazon.com/codesuite/codedeploy/deployments/${deploymentId}?region=${region}`
    const shortcutLink = `https://byulogin.awsapps.com/start/#/console?account_id=${encodeURIComponent(
      awsAccountId
    )}&role_name=${encodeURIComponent(iamRole)}&destination=${encodeURIComponent(destinationUrl)}`
    info(`Started deployment.
    
Deployment ID:    ${deploymentId}
AWS Account:      ${awsAccountAlias} (${awsAccountId})
Region:           ${region}

Link to deployment: ${shortcutLink}`)

    await waitUntilDeploymentSuccessful({client: codedeployClient, maxWaitTime}, {deploymentId})

    process.exit(0)
  } catch (error) {
    if (error instanceof Error) {
      setFailed(error.message)
    } else if (typeof error === 'string') {
      setFailed(error)
    } else {
      setFailed(`An unexpected error occurred: ${error}`)
    }
  }
}

const iamClient = new IAMClient()
const stsClient = new STSClient()
async function getAccountInformation(): Promise<{awsAccountAlias: string; awsAccountId: string}> {
  const [{AccountAliases: [awsAccountAlias] = ['?']}, {Account: awsAccountId = '?'}] =
    await Promise.all([
      iamClient.send(new ListAccountAliasesCommand()).catch(() => ({AccountAliases: ['?']})),
      stsClient.send(new GetCallerIdentityCommand()).catch(() => ({Account: '?'}))
    ])
  return {awsAccountAlias, awsAccountId}
}

run()
