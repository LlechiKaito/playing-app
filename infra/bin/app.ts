#!/usr/bin/env node
import * as cdk from "aws-cdk-lib";
import { DataStack } from "../lib/data-stack";
import { AppStack } from "../lib/app-stack";

const app = new cdk.App();
const env = { region: process.env.CDK_DEFAULT_REGION ?? "ap-northeast-1", account: process.env.CDK_DEFAULT_ACCOUNT };

const data = new DataStack(app, "PlayingApp-Data", { env });
new AppStack(app, "PlayingApp-App", {
  env,
  table: data.table,
  uploadsBucket: data.uploadsBucket,
});

cdk.Tags.of(app).add("Project", "playing-app");
cdk.Tags.of(app).add("Environment", "dev");
cdk.Tags.of(app).add("ManagedBy", "cdk");
