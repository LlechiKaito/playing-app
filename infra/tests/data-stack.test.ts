import { describe, it, expect } from "vitest";
import * as cdk from "aws-cdk-lib";
import { Template } from "aws-cdk-lib/assertions";
import { DataStack } from "../lib/data-stack";

describe("DataStack", () => {
  it("creates one DynamoDB table with PK/SK and GSI1", () => {
    const app = new cdk.App();
    const stack = new DataStack(app, "T", { env: { region: "ap-northeast-1" } });
    const t = Template.fromStack(stack);
    t.resourceCountIs("AWS::DynamoDB::Table", 1);
    t.hasResourceProperties("AWS::DynamoDB::Table", {
      KeySchema: [
        { AttributeName: "PK", KeyType: "HASH" },
        { AttributeName: "SK", KeyType: "RANGE" },
      ],
      BillingMode: "PAY_PER_REQUEST",
    });
  });

  it("creates one private S3 bucket with TLS-only", () => {
    const app = new cdk.App();
    const stack = new DataStack(app, "T", { env: { region: "ap-northeast-1" } });
    const t = Template.fromStack(stack);
    t.resourceCountIs("AWS::S3::Bucket", 1);
    t.hasResourceProperties("AWS::S3::Bucket", {
      PublicAccessBlockConfiguration: {
        BlockPublicAcls: true,
        BlockPublicPolicy: true,
        IgnorePublicAcls: true,
        RestrictPublicBuckets: true,
      },
    });
  });
});
