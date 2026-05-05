# Event-Driven Image Intelligence
A highly concurrent, resilient pipeline using AWS serverless services (S3, Lambda, Rekognition, SQS, DynamoDB, and SNS) to process and analyze images.

## Architecture

1. **S3 Storage**: Users upload images to an S3 bucket (`image-intelligence-raw`).
2. **Lambda Orchestrator**: An S3 event triggers the orchestrator Lambda function, which parses the event and fans out tasks concurrently.
3. **Amazon Rekognition**: Detects labels, objects, text, and moderation flags, returning JSON confidence scores.
4. **SQS Queue**: Enqueues processing tasks with image metadata and wired DLQs for retries.
5. **DynamoDB**: Stores image metadata, labels, moderation flags, timestamps, S3 URIs, and confidence scores.
6. **SNS + SES Notification**: Fires an SNS topic to notify users of processing completion via email or webhook callbacks.

## Features

- **Event-Driven**: Fully asynchronous processing triggered by file uploads.
- **Highly Concurrent**: Parallel fan-out pattern for faster processing.
- **Resilient**: Configured Dead-Letter Queues (DLQ) and retries via SQS.
- **Intelligent**: Automated image labeling and content moderation.

## Setup

1. Make sure you have the AWS CDK CLI installed (`npm install -g aws-cdk`).
2. Navigate to the `backend` directory and run `npm install`.
3. Deploy the infrastructure using `cdk deploy`.
4. Navigate to the `frontend` directory, run `npm install` and start the UI using `npm run dev`.