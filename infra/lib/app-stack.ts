import * as cdk from "aws-cdk-lib";
import { Vpc, SubnetType } from "aws-cdk-lib/aws-ec2";
import { Cluster, ContainerImage, FargateService, FargateTaskDefinition, LogDriver } from "aws-cdk-lib/aws-ecs";
import { ApplicationLoadBalancer, ApplicationProtocol, ListenerAction, ListenerCondition } from "aws-cdk-lib/aws-elasticloadbalancingv2";
import { Repository } from "aws-cdk-lib/aws-ecr";
import { LogGroup, RetentionDays } from "aws-cdk-lib/aws-logs";
import { Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";
import type { Table } from "aws-cdk-lib/aws-dynamodb";
import type { Bucket } from "aws-cdk-lib/aws-s3";
import type { Construct } from "constructs";

export type AppStackProps = cdk.StackProps & {
  table: Table;
  uploadsBucket: Bucket;
};

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props: AppStackProps) {
    super(scope, id, props);

    const vpc = new Vpc(this, "Vpc", {
      maxAzs: 2,
      natGateways: 0,
      subnetConfiguration: [{ name: "public", subnetType: SubnetType.PUBLIC, cidrMask: 24 }],
    });

    const cluster = new Cluster(this, "Cluster", { vpc });

    const apiRepo = new Repository(this, "ApiRepo", {
      imageScanOnPush: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    });
    const webRepo = new Repository(this, "WebRepo", {
      imageScanOnPush: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      emptyOnDelete: true,
    });

    const apiLogs = new LogGroup(this, "ApiLogs", { retention: RetentionDays.ONE_WEEK });
    const webLogs = new LogGroup(this, "WebLogs", { retention: RetentionDays.ONE_WEEK });

    const apiTask = new FargateTaskDefinition(this, "ApiTask", { cpu: 256, memoryLimitMiB: 512 });
    apiTask.addContainer("api", {
      image: ContainerImage.fromEcrRepository(apiRepo, "latest"),
      portMappings: [{ containerPort: 4000 }],
      environment: {
        NODE_ENV: "production",
        API_PORT: "4000",
        AWS_REGION: this.region,
        DYNAMODB_TABLE_NAME: props.table.tableName,
        S3_BUCKET: props.uploadsBucket.bucketName,
        S3_PUBLIC_ENDPOINT: `https://${props.uploadsBucket.bucketRegionalDomainName}`,
        USE_REAL_TEXTRACT: "true",
        JWT_EXPIRES_IN: "7d",
      },
      secrets: {},
      logging: LogDriver.awsLogs({ streamPrefix: "api", logGroup: apiLogs }),
    });
    props.table.grantReadWriteData(apiTask.taskRole);
    props.uploadsBucket.grantReadWrite(apiTask.taskRole);
    apiTask.taskRole.addToPrincipalPolicy(
      new PolicyStatement({
        effect: Effect.ALLOW,
        actions: ["textract:DetectDocumentText", "textract:AnalyzeDocument"],
        resources: ["*"],
      }),
    );

    const webTask = new FargateTaskDefinition(this, "WebTask", { cpu: 256, memoryLimitMiB: 512 });
    webTask.addContainer("web", {
      image: ContainerImage.fromEcrRepository(webRepo, "latest"),
      portMappings: [{ containerPort: 3000 }],
      environment: {
        NODE_ENV: "production",
      },
      logging: LogDriver.awsLogs({ streamPrefix: "web", logGroup: webLogs }),
    });

    const apiService = new FargateService(this, "ApiService", {
      cluster,
      taskDefinition: apiTask,
      desiredCount: 1,
      assignPublicIp: true,
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
    });
    const webService = new FargateService(this, "WebService", {
      cluster,
      taskDefinition: webTask,
      desiredCount: 1,
      assignPublicIp: true,
      vpcSubnets: { subnetType: SubnetType.PUBLIC },
    });

    const alb = new ApplicationLoadBalancer(this, "Alb", { vpc, internetFacing: true });
    const listener = alb.addListener("Http", {
      port: 80,
      protocol: ApplicationProtocol.HTTP,
      open: true,
      defaultAction: ListenerAction.fixedResponse(404, { contentType: "text/plain", messageBody: "not found" }),
    });

    listener.addTargets("WebTargets", {
      priority: 100,
      conditions: [ListenerCondition.pathPatterns(["/*"])],
      port: 3000,
      protocol: ApplicationProtocol.HTTP,
      targets: [webService],
      healthCheck: { path: "/", healthyHttpCodes: "200,301,302,304,307,308" },
    });

    listener.addTargets("ApiTargets", {
      priority: 10,
      conditions: [ListenerCondition.pathPatterns(["/graphql", "/graphql/*", "/health"])],
      port: 4000,
      protocol: ApplicationProtocol.HTTP,
      targets: [apiService],
      healthCheck: { path: "/health", healthyHttpCodes: "200" },
    });

    new cdk.CfnOutput(this, "AlbDnsName", { value: alb.loadBalancerDnsName });
    new cdk.CfnOutput(this, "ApiRepoUri", { value: apiRepo.repositoryUri });
    new cdk.CfnOutput(this, "WebRepoUri", { value: webRepo.repositoryUri });
  }
}
