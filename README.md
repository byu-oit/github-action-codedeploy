![CI](https://github.com/byu-oit/github-action-codedeploy/workflows/CI/badge.svg)
![Test](https://github.com/byu-oit/github-action-codedeploy/workflows/Test/badge.svg)

# ![BYU logo](https://www.hscripts.com/freeimages/logos/university-logos/byu/byu-logo-clipart-128.gif) github-action-codedeploy
A GitHub Action for deploying an application with AWS CodeDeploy

## Usage

```yaml
on: push
# ...
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    # ... Initial setup of AWS Creds, etc.
    - name: CodeDeploy
      uses: byu-oit/github-action-codedeploy@v2
      with:
        application-name: some-cd-app
        deployment-group-name: some-cd-group
        appspec-file: some-appspec-file
    # ... The rest of your deployment
```

If you are using Terraform to manage your AWS resources, you can add your CodeDeploy resources as outputs. Then you can use `terraform output` to get the values:

```yaml
on: push
# ...
jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
    # ... Initial setup of AWS Creds, Terraform, etc.
    - name: 'Get CD App Name'
      id: cd-app-name
      working-directory: ${{ env.tf_working_dir }}
      run: terraform output codedeploy_app_name

    - name: 'Get CD Deployment Group Name'
      id: cd-group-name
      working-directory: ${{ env.tf_working_dir }}
      run: terraform output codedeploy_deployment_group_name

    - name: 'Get CD Appspec File'
      id: cd-appspec-file
      working-directory: ${{ env.tf_working_dir }}
      run: terraform output codedeploy_appspec_json_file

    - name: 'CodeDeploy'
      uses: byu-oit/github-action-codedeploy@v2
      with:
        application-name: ${{ steps.cd-app-name.outputs.stdout }}
        deployment-group-name: ${{ steps.cd-group-name.outputs.stdout }}
        appspec-file: ${{ steps.cd-appspec-file.outputs.stdout }}
    # ... The rest of your deployment
```

## Contributing
Hopefully this is useful to others at BYU. Feel free to ask me some questions about it, but I make no promises about being able to commit time to support it.

### Modifying Source Code

Just run `npm install` locally. There aren't many files here, so hopefully it should be pretty straightforward.

### Cutting new releases

GitHub Actions will run the entry point from the `action.yml`. In our case, that happens to be `/dist/index.js`.

Actions run from GitHub repos. We don't want to check in `node_modules`. Hence, we package the app using `npm run package`.

Then, be sure to create a new GitHub release, following SemVer.
