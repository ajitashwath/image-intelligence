#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { BackendStack } from '../lib/backend-stack';

const app = new cdk.App();

// Bind the stack to the deploying account and region so that environment-aware
// constructs work correctly (e.g. S3 bucket event notifications, CloudFront OAC).
new BackendStack(app, 'BackendStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region:  process.env.CDK_DEFAULT_REGION ?? 'us-east-1',
  },
  description: 'Event-Driven Image Intelligence — application infrastructure stack.',
});
