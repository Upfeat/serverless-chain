# notifications receipts

## Credentials 
- [Google Functions Framework](https://github.com/GoogleCloudPlatform/functions-framework-nodejs)

## Get Started 

### install dependencies
```
$ npm i
```

### local
```
$ functions-framework --target=notificationReceipts
$ curl -d "@mock.json" -X POST "http://localhost:8080" -H "Content-Type:application/json"
```

### deploy
If we want to use custom environment variables we can probably add `--env-vars-file=FILE_PATH`:
Path to a local YAML file with definitions for all environment variables. All existing environment variables will be removed before the new environment variables are added.
```
$ gcloud components update
$ gcloud functions deploy notification-receipts --project=updevops --runtime nodejs10 --trigger-http --allow-unauthenticated --memory=128MB --entry-point=notificationReceipts --service-account=
$ gcloud functions describe notification-receipts
```

`https://GCP_REGION-PROJECT_ID.cloudfunctions.net/FUNCTION_NAME`

