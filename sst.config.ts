import type { SSTConfig } from "sst";
import * as sst from "sst/constructs";
import * as cdk from 'aws-cdk-lib/core';
import * as fs from "fs"
import {aws_rds, aws_ec2, aws_secretsmanager} from "aws-cdk-lib";

export default {
  config(_input) {
    return {
      name: "myapp",
      region: "us-east-1",
    };
  },
  stacks(app) {
    if (app.stage.startsWith("common")) {
      app.stack(Common)
    } else {
      app.stack(Import)
        .stack(Main)
    }

  },
} satisfies SSTConfig;


// For prod, this is commonprod. For everything else, it's commondev. This keeps prod silo'd from the rest;
// but saves you money for dev,staging,testing, and any other local envs setup by your developers
function commonStage(stage: string) {
  if (stage.endsWith("prod")) {
    return "prod"
  }
  return "dev"
}

function Common({app, stack}: sst.StackContext) {
  const commonStage_ = commonStage(app.stage)
  const vpc = new aws_ec2.Vpc(stack, 'Vpc', {
    natGateways: 0,
    maxAzs: 2 // minimum required by RDS is 2
  })

  const sg = new aws_ec2.SecurityGroup(stack, 'PostgresSG', {
    vpc,
    description: 'Postgres SG',
    allowAllOutbound: true,
  });
  sg.addIngressRule(aws_ec2.Peer.anyIpv4(), aws_ec2.Port.tcp(5432));

  const rdsCluster = new aws_rds.DatabaseCluster(stack, "Database", {
    engine: aws_rds.DatabaseClusterEngine.auroraPostgres({
      version: aws_rds.AuroraPostgresEngineVersion.VER_14_7,
    }),
    instances: 1,
    instanceProps: {
      vpc,
      vpcSubnets: {
        subnetType: aws_ec2.SubnetType.PRIVATE_ISOLATED,
      },
      securityGroups: [sg],
      instanceType: "serverless" as any,
    },
  });
  (
    rdsCluster.node.findChild("Resource") as aws_rds.CfnDBCluster
  ).serverlessV2ScalingConfiguration = {
    minCapacity: 0.5,
    maxCapacity: 8,
  };
  new cdk.CfnOutput(stack, `VpcId${commonStage_}`, { value: vpc.vpcId, exportName: `CommonStack:VpcId:${commonStage_}` });
  new cdk.CfnOutput(stack, `SecretArn${commonStage_}`, { value: rdsCluster.secret?.secretArn || '', exportName: `CommonStack:SecretArn:${commonStage_}` });
}

function Import({app, stack}: sst.StackContext) {
  if (app.stage === "dev") {
    return {secret: undefined, vpc: undefined}
  }
  const commonStage_ = commonStage(app.stage)
  const vpcId = cdk.Fn.importValue(`CommonStack:VpcId:${commonStage_}`)
  const rdsSecretArn = cdk.Fn.importValue(`CommonStack:SecretArn:${commonStage_}`)
  const secret = aws_secretsmanager.Secret.fromSecretCompleteArn(stack, 'ImportedSecret', rdsSecretArn);
  const vpc = aws_ec2.Vpc.fromLookup(stack, 'ImportedVpc', { vpcId })
  return {secret, vpc}
}

function Main({app, stack}: sst.StackContext) {
  const {vpc, secret} = sst.use(Import)

  const fnHttp = new sst.Function(stack, "FnHttp", {
    handler: "packages/http.main",
    vpc,
    environment: {
      REGION: app.region,
      IS_LOCAL: app.mode === "dev" ? "true" : "false",
      RDS_DB_NAME: `myapp${app.stage}`,
      RDS_SECRET_ARN: secret?.secretArn || "",
    }
  })
  secret?.grantRead?.(fnHttp)
  const apiHttp = new sst.Api(stack, "ApiHttp", {
    routes: { "$default": fnHttp }
  })

  stack.addOutputs({
    apiHttpUrl: apiHttp.url
  })
}