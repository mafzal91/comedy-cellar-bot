/* This file is auto-generated by SST. Do not edit. */
/* tslint:disable */
/* eslint-disable */
import "sst"
export {}
declare module "sst" {
  export interface Resource {
    "Api": {
      "type": "sst.aws.ApiGatewayV2"
      "url": string
    }
    "DbUrl": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "FromEmail": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "FromEmailPw": {
      "type": "sst.sst.Secret"
      "value": string
    }
    "Frontend": {
      "type": "sst.aws.StaticSite"
      "url": string
    }
    "MyUserPool": {
      "id": string
      "type": "sst.aws.CognitoUserPool"
    }
    "Web": {
      "id": string
      "secret": string
      "type": "sst.aws.CognitoUserPoolClient"
    }
  }
}
