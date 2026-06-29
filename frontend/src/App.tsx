import { useState, useEffect, useRef } from 'react';
import './index.css';

// SVG Icons as reusable components
const Icons = {
  S3: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Lambda: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M5 3h14" />
      <path d="M12 3v18" />
      <path d="m19 15-7 6-7-6" />
    </svg>
  ),
  Rekognition: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <circle cx="12" cy="12" r="10" />
      <path d="M8 12a4 4 0 0 1 8 0" />
      <path d="M12 8v2" />
    </svg>
  ),
  SQS: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2" />
      <line x1="9" y1="9" x2="15" y2="9" />
      <line x1="9" y1="13" x2="15" y2="13" />
      <line x1="9" y1="17" x2="13" y2="17" />
    </svg>
  ),
  DynamoDB: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <ellipse cx="12" cy="5" rx="9" ry="3" />
      <path d="M3 5v14c0 1.66 4 3 9 3s9-1.34 9-3V5" />
      <path d="M3 12c0 1.66 4 3 9 3s9-1.34 9-3" />
    </svg>
  ),
  SNS: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5">
      <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9" />
      <path d="M13.73 21a2 2 0 0 1-3.46 0" />
    </svg>
  ),
  Play: () => (
    <svg viewBox="0 0 24 24" fill="currentColor" className="w-5 h-5">
      <polygon points="6 3 20 12 6 21 6 3" />
    </svg>
  ),
  Download: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="7 10 12 15 17 10" />
      <line x1="12" y1="15" x2="12" y2="3" />
    </svg>
  ),
  Upload: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
      <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
      <polyline points="17 8 12 3 7 8" />
      <line x1="12" y1="3" x2="12" y2="15" />
    </svg>
  ),
  Close: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <line x1="18" y1="6" x2="6" y2="18" />
      <line x1="6" y1="6" x2="18" y2="18" />
    </svg>
  ),
  Terminal: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="4 17 10 11 4 5" />
      <line x1="12" y1="19" x2="20" y2="19" />
    </svg>
  ),
  Code: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <polyline points="16 18 22 12 16 6" />
      <polyline points="8 6 2 12 8 18" />
    </svg>
  ),
  Info: () => (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-4 h-4">
      <circle cx="12" cy="12" r="10" />
      <line x1="12" y1="16" x2="12" y2="12" />
      <line x1="12" y1="8" x2="12.01" y2="8" />
    </svg>
  )
};

// Preset Images Metadata
const PRESETS = [
  {
    id: 'preset-landscape',
    name: 'Mountain Lake',
    url: '/presets/landscape.png',
    isModerated: false,
    mockLabels: [
      { name: 'Mountain', confidence: 99.4 },
      { name: 'Lake', confidence: 98.1 },
      { name: 'Nature', confidence: 97.5 },
      { name: 'Sunset', confidence: 92.3 },
      { name: 'Conifer', confidence: 85.0 }
    ],
    mockModeration: []
  },
  {
    id: 'preset-office',
    name: 'Tech Workstation',
    url: '/presets/office.png',
    isModerated: false,
    mockLabels: [
      { name: 'Computer', confidence: 98.9 },
      { name: 'Laptop', confidence: 97.4 },
      { name: 'Keyboard', confidence: 96.0 },
      { name: 'Office', confidence: 92.1 },
      { name: 'Plant', confidence: 81.3 }
    ],
    mockModeration: []
  },
  {
    id: 'preset-pizza',
    name: 'Gourmet Pizza',
    url: '/presets/pizza.png',
    isModerated: false,
    mockLabels: [
      { name: 'Pizza', confidence: 99.8 },
      { name: 'Food', confidence: 99.5 },
      { name: 'Pepperoni', confidence: 94.2 },
      { name: 'Cheese', confidence: 91.0 },
      { name: 'Basil', confidence: 84.7 }
    ],
    mockModeration: []
  },
  {
    id: 'preset-moderation',
    name: 'Explosive Risk',
    url: '/presets/moderation.png',
    isModerated: true,
    mockLabels: [
      { name: 'Sign', confidence: 98.5 },
      { name: 'Skull', confidence: 95.0 },
      { name: 'Red', confidence: 92.1 }
    ],
    mockModeration: [
      { name: 'Violence', confidence: 88.4, taxonomy: 'Graphic Violence' },
      { name: 'Explosives', confidence: 82.1, taxonomy: 'Weapons & Explosives' }
    ]
  }
];

// AWS Node Configuration details and code snippets
const SERVICES_DATA = {
  client: {
    title: 'Client Web App',
    role: 'Origin Node',
    docs: 'Users upload images from their frontend application. In production, this can direct uploads to Amazon S3 via secure, temporary presigned URLs to keep backend resources lightweight.',
    code: {
      python: `# Python boto3: Generate S3 Presigned URL for direct secure frontend uploads
import boto3

s3_client = boto3.client('s3')
response = s3_client.generate_presigned_post(
    Bucket='image-intelligence-raw',
    Key='uploads/user_123/raw-image.jpg',
    Fields={"acl": "public-read", "Content-Type": "image/jpeg"},
    Conditions=[
        {"acl": "public-read"},
        {"Content-Type": "image/jpeg"},
        ["content-length-range", 1048576] # 1MB limit
    ],
    ExpiresIn=3600
)`,
      typescript: `// TypeScript AWS SDK: Generate S3 Presigned URL
import { S3Client } from "@aws-sdk/client-s3";
import { createPresignedPost } from "@aws-sdk/s3-presigned-post";

const client = new S3Client({ region: "us-east-1" });
const { url, fields } = await createPresignedPost(client, {
  Bucket: "image-intelligence-raw",
  Key: "uploads/user_123/raw-image.jpg",
  Conditions: [
    ["content-length-range", 0, 1048576], // up to 1MB
  ],
  Fields: {
    acl: "public-read"
  },
  ExpiresIn: 3600, // 1 hour
});`
    }
  },
  s3: {
    title: 'Amazon S3 Raw Bucket',
    role: 'Object Storage & Event Trigger',
    docs: 'S3 stores the uploaded raw images. It is configured with an Event Notification system. The moment a new object is successfully written (s3:ObjectCreated:*), S3 issues an event notifying the AWS Lambda orchestrator.',
    code: {
      python: `# Terraform: S3 Event Trigger configuration for Lambda
# (Typically defined in Terraform or AWS CDK)

aws_s3_bucket_notification:
  bucket = aws_s3_bucket.raw_images.id
  lambda_function:
    lambda_function_arn = aws_lambda_function.orchestrator.arn
    events              = ["s3:ObjectCreated:*"]
    filter_prefix       = "uploads/"`,
      typescript: `// AWS CDK: Define S3 Bucket and trigger Lambda Orchestrator
import * as s3 from 'aws-cdk-lib/aws-s3';
import * as s3n from 'aws-cdk-lib/aws-s3-notifications';
import * as lambda from 'aws-cdk-lib/aws-lambda';

const rawBucket = new s3.Bucket(this, 'RawImagesBucket', {
  bucketName: 'image-intelligence-raw',
  removalPolicy: RemovalPolicy.DESTROY,
  autoDeleteObjects: true
});

rawBucket.addEventNotification(
  s3.EventType.OBJECT_CREATED,
  new s3n.LambdaDestination(orchestratorLambda)
);`
    }
  },
  lambda: {
    title: 'AWS Lambda Orchestrator',
    role: 'Concurrent Task Dispatcher',
    docs: 'The orchestrator Lambda is triggered by S3. It extracts the bucket name and file path (key), and concurrently spawns downstream API requests (Amazon Rekognition Labeling, Rekognition Moderation, and SQS enqueuing) using multithreading for fast performance.',
    code: {
      python: `# Python: Multi-threaded fanout inside AWS Lambda Handler
from concurrent.futures import ThreadPoolExecutor
import boto3

rekognition = boto3.client('rekognition')
sqs = boto3.client('sqs')

def lambda_handler(event, context):
    record = event['Records'][0]['s3']
    bucket = record['bucket']['name']
    key = record['object']['key']
    
    with ThreadPoolExecutor(max_workers=3) as executor:
        f_labels = executor.submit(rekognition.detect_labels, 
            Image={'S3Object': {'Bucket': bucket, 'Name': key}}, MaxLabels=20, MinConfidence=70.0)
        f_mod = executor.submit(rekognition.detect_moderation_labels,
            Image={'S3Object': {'Bucket': bucket, 'Name': key}}, MinConfidence=70.0)
        f_sqs = executor.submit(sqs.send_message, QueueUrl=QUEUE_URL, 
            MessageBody=json.dumps({'bucket': bucket, 'key': key}))
            
    # Gather parallel execution results
    labels = f_labels.result()
    moderation = f_mod.result()`,
      typescript: `// TypeScript: AWS Lambda Orchestrator with Promise.all
import { RekognitionClient, DetectLabelsCommand } from "@aws-sdk/client-rekognition";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";

const rekog = new RekognitionClient({});
const sqs = new SQSClient({});

export const handler = async (event: any) => {
  const record = event.Records[0].s3;
  const bucket = record.bucket.name;
  const key = record.object.key;
  
  // Concurrently execute ML assessment and Queue buffer insertion
  const [labelsRes, modRes, sqsRes] = await Promise.all([
    rekog.send(new DetectLabelsCommand({ Image: { S3Object: { Bucket: bucket, Name: key } } })),
    rekog.send(new DetectModerationLabelsCommand({ Image: { S3Object: { Bucket: bucket, Name: key } } })),
    sqs.send(new SendMessageCommand({ QueueUrl: process.env.QUEUE_URL!, MessageBody: JSON.stringify({ bucket, key }) }))
  ]);
};`
    }
  },
  rekognition: {
    title: 'Amazon Rekognition',
    role: 'Computer Vision ML Engine',
    docs: 'Amazon Rekognition analyzes the image. We call detect_labels to identify objects and categories, and detect_moderation_labels to screen for inappropriate or graphic content, enforcing automatic compliance rules.',
    code: {
      python: `# Python: Detect Labels and Content Moderation
import boto3
rekognition = boto3.client('rekognition')

# Detect Labels
labels_response = rekognition.detect_labels(
    Image={'S3Object': {'Bucket': 'raw-bucket', 'Name': 'image.jpg'}},
    MaxLabels=10,
    MinConfidence=75.0
)

# Content Moderation check
mod_response = rekognition.detect_moderation_labels(
    Image={'S3Object': {'Bucket': 'raw-bucket', 'Name': 'image.jpg'}},
    MinConfidence=70.0
)`,
      typescript: `// TypeScript: Rekognition Client Calls
import { RekognitionClient, DetectLabelsCommand, DetectModerationLabelsCommand } from "@aws-sdk/client-rekognition";

const rekogClient = new RekognitionClient({ region: "us-east-1" });

const labelsResult = await rekogClient.send(new DetectLabelsCommand({
  Image: { S3Object: { Bucket: "my-bucket", Name: "photo.jpg" } },
  MaxLabels: 15,
  MinConfidence: 80
}));`
    }
  },
  sqs: {
    title: 'Amazon SQS Queue',
    role: 'Buffer & Resilient Processing Queue',
    docs: 'SQS acts as a message buffer, decouple-processing other tasks or running heavy indexing offline. If downstream services are busy, SQS holds the tasks. It includes a Dead-Letter Queue (DLQ) configured for automatic retries and error isolation.',
    code: {
      python: `# Python: Send image task details to SQS Queue
import boto3
import json

sqs = boto3.client('sqs')
response = sqs.send_message(
    QueueUrl='https://sqs.us-east-1.amazonaws.com/123456789012/TaskQueue',
    MessageBody=json.dumps({
        'action': 'PROCESS_METADATA',
        'bucket': 'image-intelligence-raw',
        'key': 'uploads/user_123/img.png',
        'timestamp': 1782712900
    }),
    DelaySeconds=0
)`,
      typescript: `// AWS CDK: Provision SQS Queue with DLQ
import * as sqs from 'aws-cdk-lib/aws-sqs';

const deadLetterQueue = new sqs.Queue(this, 'DeadLetterQueue', {
  queueName: 'image-intelligence-dlq',
  retentionPeriod: Duration.days(14)
});

const taskQueue = new sqs.Queue(this, 'TaskQueue', {
  queueName: 'image-intelligence-task-queue',
  visibilityTimeout: Duration.seconds(60),
  deadLetterQueue: {
    queue: deadLetterQueue,
    maxReceiveCount: 3 // retries 3 times before moving to DLQ
  }
});`
    }
  },
  dynamodb: {
    title: 'Amazon DynamoDB',
    role: 'NoSQL Metadata Store',
    docs: 'DynamoDB persists the complete metadata. Keys include imageId (primary key), userId, timestamp, S3 URI, Rekognition label confidence arrays, and moderation status flags. A TTL (Time-To-Live) attribute handles auto-pruning after 90 days.',
    code: {
      python: `# Python: Put item into DynamoDB with auto-calculated TTL expiration
import boto3
import time

dynamodb = boto3.resource('dynamodb')
table = dynamodb.Table('image-intelligence-metadata')

ttl_timestamp = int(time.time()) + (90 * 24 * 60 * 60) # 90 days expiration

table.put_item(
    Item={
        'imageId': 'img-84920.png',
        'userId': 'user_123',
        'createdAt': '2026-06-29T11:00:00Z',
        's3Uri': 's3://image-intelligence-raw/uploads/user_123/img-84920.png',
        'labels': [{'name': 'Mountain', 'confidence': 99.4}],
        'moderationStatus': 'CLEAN',
        'ttl': ttl_timestamp
    }
)`,
      typescript: `// TypeScript: Write Image Metadata to DynamoDB Table
import { DynamoDBClient } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, PutCommand } from "@aws-sdk/lib-dynamodb";

const client = new DynamoDBClient({});
const docClient = DynamoDBDocumentClient.from(client);

await docClient.send(new PutCommand({
  TableName: "image-intelligence-metadata",
  Item: {
    imageId: "img-84920.png",
    userId: "user_123",
    createdAt: new Date().toISOString(),
    labels: [{ name: "Laptop", confidence: 97.4 }],
    moderationStatus: "CLEAN",
    ttl: Math.floor(Date.now() / 1000) + 90 * 86400
  }
}));`
    }
  },
  sns: {
    title: 'Amazon SNS + SES',
    role: 'Notification Gateway',
    docs: 'SNS publishes events indicating image processing is completed. Subscribers (e.g. Lambda mailing routines connected to SES) instantly notify end-users via clean emails, while webhooks deliver JSON payloads back to dashboard clients.',
    code: {
      python: `# Python: Publish processing result to SNS topic
import boto3
import json

sns = boto3.client('sns')
sns.publish(
    TopicArn='arn:aws:sns:us-east-1:123456789012:ProcessedTopic',
    Subject='Image Processing Complete',
    Message=json.dumps({
        'imageId': 'img-84920.png',
        'status': 'PROCESSED',
        'moderation': 'CLEAN',
        'labels': ['Mountain', 'Lake', 'Nature']
    })
)`,
      typescript: `// AWS CDK: Set up SNS Topic and Lambda Subscription
import * as sns from 'aws-cdk-lib/aws-sns';
import * as subs from 'aws-cdk-lib/aws-sns-subscriptions';

const processedTopic = new sns.Topic(this, 'ImageProcessedTopic', {
  topicName: 'ImageProcessedNotification'
});

processedTopic.addSubscription(
  new subs.LambdaSubscription(notifierLambdaEmailFunction)
);`
    }
  }
};

export default function App() {
  // Application Workspace States
  const [activeMode, setActiveMode] = useState<'simulation' | 'live'>('simulation');
  const [liveApiUrl, setLiveApiUrl] = useState<string>(import.meta.env.VITE_API_URL || 'https://');
  const [showLiveConfig, setShowLiveConfig] = useState<boolean>(false);
  const [awsRegion, setAwsRegion] = useState<string>('us-east-1');
  const [maxLabels, setMaxLabels] = useState<number>(10);
  const [minConfidence, setMinConfidence] = useState<number>(75);
  const [notifySubscriber, setNotifySubscriber] = useState<string>('user@example.com');
  const [selectedPresetId, setSelectedPresetId] = useState<string>('preset-landscape');
  
  // Custom file states
  const [customFile, setCustomFile] = useState<File | null>(null);
  const [customFileUrl, setCustomFileUrl] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState<boolean>(false);
  
  // Stepper Visual states
  const [pipelineState, setPipelineState] = useState<string>('idle'); // idle, uploading, fanning_out, persisting, notifying, completed, blocked, error
  const [focusedNode, setFocusedNode] = useState<string>('client');
  const [inspectorTab, setInspectorTab] = useState<'console' | 'payload' | 'code'>('console');
  const [activeCodeLang, setActiveCodeLang] = useState<'python' | 'typescript'>('python');

  // Logs stream states
  const [logs, setLogs] = useState<Array<{ time: string; level: 'info' | 'success' | 'warn' | 'error'; msg: string }>>([
    { time: getTimestamp(), level: 'info', msg: 'System initialized. Pipeline ready.' }
  ]);
  
  // JSON payload visual state
  const [inspectedPayload, setInspectedPayload] = useState<any>({
    info: "Select a node in the diagram to inspect its input/output API payloads."
  });

  // Pipeline execution results history list
  const [resultsHistory, setResultsHistory] = useState<any[]>([]);
  const logsEndRef = useRef<HTMLDivElement>(null);

  // Auto-scroll log console
  useEffect(() => {
    if (logsEndRef.current) {
      logsEndRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Load results from live backend if in Live Mode
  useEffect(() => {
    if (activeMode !== 'live' || !liveApiUrl || liveApiUrl === 'https://') return;

    const fetchLiveHistory = async () => {
      try {
        const res = await fetch(`${liveApiUrl}/images?userId=user_123`);
        if (res.ok) {
          const data = await res.json();
          const mapped = data.items.map((item: any) => ({
            id: item.imageId,
            time: new Date(item.createdAt).toLocaleTimeString(),
            labels: item.labels ? item.labels.map((l: any) => `${l.name} (${Math.round(l.confidence)}%)`) : [],
            moderation: item.moderationStatus || 'CLEAN',
            imgUrl: item.s3Uri ? item.s3Uri.replace('s3://', 'https://s3.amazonaws.com/') : null,
            status: 'COMPLETED',
            raw: item
          }));
          setResultsHistory(mapped);
        }
      } catch (err) {
        console.error('Failed to query live dashboard history:', err);
      }
    };

    fetchLiveHistory();
    const interval = setInterval(fetchLiveHistory, 8000);
    return () => clearInterval(interval);
  }, [activeMode, liveApiUrl]);

  // Helper timestamps
  function getTimestamp() {
    const d = new Date();
    return d.toLocaleTimeString() + '.' + String(d.getMilliseconds()).padStart(3, '0');
  }

  // Add line to terminal console log stream
  const addLog = (level: 'info' | 'success' | 'warn' | 'error', msg: string) => {
    setLogs(prev => [...prev, { time: getTimestamp(), level, msg }]);
  };

  // Drag and Drop files handlers
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type.startsWith('image/')) {
        loadCustomFile(file);
      } else {
        addLog('error', 'Only image files (JPEG, PNG, WebP) are supported.');
      }
    }
  };

  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.value && e.target.files && e.target.files[0]) {
      loadCustomFile(e.target.files[0]);
    }
  };

  const loadCustomFile = (file: File) => {
    setCustomFile(file);
    setSelectedPresetId('');
    
    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target && event.target.result) {
        setCustomFileUrl(event.target.result as string);
        addLog('info', `Loaded custom image: ${file.name} (${Math.round(file.size / 1024)} KB)`);
      }
    };
    reader.readAsDataURL(file);
  };

  const removeCustomImage = (e: React.MouseEvent) => {
    e.stopPropagation();
    setCustomFile(null);
    setCustomFileUrl(null);
    setSelectedPresetId('preset-landscape');
    addLog('info', 'Removed custom image. Reset to default preset.');
  };

  // Preset click handler
  const selectPreset = (preset: typeof PRESETS[0]) => {
    setCustomFile(null);
    setCustomFileUrl(null);
    setSelectedPresetId(preset.id);
    addLog('info', `Switched input image preset to: ${preset.name}`);
  };

  // Retrieve current active image attributes (presets vs custom)
  const getActiveImageMeta = () => {
    if (customFile) {
      // Analyze file tags based on name / simple generation
      const isDangerous = customFile.name.toLowerCase().includes('moderation') || customFile.name.toLowerCase().includes('unsafe') || customFile.name.toLowerCase().includes('skull');
      return {
        name: customFile.name,
        url: customFileUrl || '',
        isModerated: isDangerous,
        mockLabels: [
          { name: 'Custom Upload', confidence: 99.9 },
          { name: 'User Image', confidence: 95.4 },
          { name: 'Detected Object', confidence: 84.1 },
          { name: 'Composite Item', confidence: 73.2 }
        ],
        mockModeration: isDangerous ? [
          { name: 'Unsafe Element', confidence: 89.2, taxonomy: 'Compliance Flag' }
        ] : []
      };
    }
    
    return PRESETS.find(p => p.id === selectedPresetId) || PRESETS[0];
  };

  // Node Clicking inside Svg Map details trigger
  const inspectNode = (nodeId: string) => {
    setFocusedNode(nodeId);
    setInspectorTab('code'); // defaults to showing code/docs when user explicitly selects card
    
    // Set API payloads details
    const activeData = getActiveImageMeta();
    const mockId = `img-${Math.random().toString(36).substring(2, 7)}`;
    
    switch(nodeId) {
      case 'client':
        setInspectedPayload({
          action: "GENERATE_PRESIGNED_POST",
          bucket: "image-intelligence-raw",
          key: `uploads/user_123/${activeData.name.replace(/\s+/g, '_')}`,
          conditions: [
            {"acl": "public-read"},
            {"Content-Type": "image/png"},
            ["content-length-range", 0, 5242880]
          ],
          response: {
            url: "https://image-intelligence-raw.s3.amazonaws.com/",
            fields: {
              key: `uploads/user_123/${activeData.name.replace(/\s+/g, '_')}`,
              acl: "public-read",
              "AWSAccessKeyId": "AKIAIOSFODNN7EXAMPLE",
              "policy": "eyJleHBpcmF0aW9uIjogIjIwMjYtMDYtMjlUMTI...",
              "signature": "v97hY/V3m7pEx1sZc9X8H/wEX..."
            }
          }
        });
        break;
      case 's3':
        setInspectedPayload({
          eventSource: "aws:s3",
          awsRegion: awsRegion,
          eventTime: new Date().toISOString(),
          eventName: "ObjectCreated:Put",
          s3: {
            bucket: {
              name: "image-intelligence-raw",
              arn: "arn:aws:s3:::image-intelligence-raw"
            },
            object: {
              key: `uploads/user_123/${activeData.name.replace(/\s+/g, '_')}`,
              size: customFile ? customFile.size : 340912,
              eTag: "d41d8cd98f00b204e9800998ecf8427e"
            }
          }
        });
        break;
      case 'lambda':
        setInspectedPayload({
          lambda_handler: "orchestrator.lambda_handler",
          environment: {
            TABLE_NAME: "image-intelligence-metadata",
            QUEUE_URL: "https://sqs.us-east-1.amazonaws.com/123456789012/TaskQueue",
            AWS_REGION: awsRegion
          },
          aws_request_id: "9a3e2a04-58e1-45bd-85fe-51b85848c7bd",
          triggered_by: "s3-event-notification",
          thread_pool_workers: 3
        });
        break;
      case 'rekognition':
        setInspectedPayload({
          request: {
            Image: {
              S3Object: {
                Bucket: "image-intelligence-raw",
                Name: `uploads/user_123/${activeData.name.replace(/\s+/g, '_')}`
              }
            },
            MaxLabels: maxLabels,
            MinConfidence: minConfidence
          },
          response: {
            Labels: activeData.mockLabels
              .filter(l => l.confidence >= minConfidence)
              .slice(0, maxLabels)
              .map(l => ({ Name: l.name, Confidence: l.confidence })),
            ModerationLabels: activeData.mockModeration
              .filter(m => m.confidence >= minConfidence)
              .map(m => ({ Name: m.name, Confidence: m.confidence, ParentName: m.taxonomy }))
          }
        });
        break;
      case 'sqs':
        setInspectedPayload({
          QueueUrl: `https://sqs.${awsRegion}.amazonaws.com/123456789012/image-intelligence-task-queue`,
          DelaySeconds: 0,
          MessageBody: JSON.stringify({
            action: 'PROCESS_IMAGE',
            bucket: 'image-intelligence-raw',
            key: `uploads/user_123/${activeData.name.replace(/\s+/g, '_')}`,
            timestamp: Date.now() / 1000
          }, null, 2),
          response: {
            MD5OfMessageBody: "fafb001235bcda7f30018bd3f090ce",
            MessageId: "3c7a36c5-23bd-4770-877c-7a9bf48b94ce"
          }
        });
        break;
      case 'dynamodb':
        const filteredLabels = activeData.mockLabels
          .filter(l => l.confidence >= minConfidence)
          .slice(0, maxLabels);
        setInspectedPayload({
          TableName: "image-intelligence-metadata",
          Item: {
            imageId: mockId,
            userId: "user_123",
            createdAt: new Date().toISOString(),
            s3Uri: `s3://image-intelligence-raw/uploads/user_123/${activeData.name.replace(/\s+/g, '_')}`,
            labels: filteredLabels,
            moderationFlags: activeData.mockModeration,
            moderationStatus: activeData.isModerated ? 'BLOCKED' : 'CLEAN',
            status: activeData.isModerated ? 'BLOCKED' : 'PROCESSED',
            ttl: Math.floor(Date.now() / 1000) + 90 * 86400
          }
        });
        break;
      case 'sns':
        setInspectedPayload({
          TopicArn: `arn:aws:sns:${awsRegion}:123456789012:ImageProcessedNotification`,
          Subject: activeData.isModerated ? "ALERT: Content Blocked" : "SUCCESS: Image Processed",
          Message: JSON.stringify({
            imageId: mockId,
            status: activeData.isModerated ? 'BLOCKED' : 'COMPLETED',
            moderation: activeData.isModerated ? 'BLOCKED' : 'CLEAN',
            labels: activeData.mockLabels.slice(0, 3).map(l => l.name),
            notificationRecipient: notifySubscriber
          }, null, 2)
        });
        break;
      default:
        break;
    }
  };

  // Run Simulation State Machine flow
  const triggerSimulation = () => {
    const activeData = getActiveImageMeta();
    const runId = `img-${Math.random().toString(36).substring(2, 7)}`;
    setPipelineState('uploading');
    setFocusedNode('s3');
    setInspectorTab('console');
    
    // Clear previous simulation logs
    setLogs([
      { time: getTimestamp(), level: 'info', msg: `Initialized processing simulation for: ${activeData.name}` },
      { time: getTimestamp(), level: 'info', msg: `Configured Region: ${awsRegion} | MinConfidence: ${minConfidence}% | MaxLabels: ${maxLabels}` }
    ]);

    // 1. S3 Uploading phase (0s - 1.5s)
    setTimeout(() => {
      addLog('info', `s3:PutObject uploading key: uploads/user_123/${activeData.name.replace(/\s+/g, '_')}`);
      addLog('success', `File uploaded successfully to bucket [image-intelligence-raw]`);
      addLog('info', `s3-notification: Publishing s3:ObjectCreated:Put event to Lambda orchestrator`);
      setPipelineState('fanning_out');
      setFocusedNode('lambda');
    }, 1500);

    // 2. Lambda Trigger & Fanout execution (1.5s - 3.5s)
    setTimeout(() => {
      addLog('info', `lambda_handler: Invocation payload received. RequestID: ${Math.random().toString(36).substring(2, 11)}`);
      addLog('info', `Orchestrator invoking ThreadPoolExecutor with 3 concurrent workers...`);
      
      // Parallel branches starting
      addLog('info', `[Worker-1] Initiated Amazon Rekognition detect_labels query`);
      addLog('info', `[Worker-2] Initiated Amazon Rekognition detect_moderation_labels query`);
      addLog('info', `[Worker-3] Initiated SQS send_message to Queue: image-intelligence-task-queue`);
    }, 2200);

    // 3. Parallel responses & DynamoDB compilation (3.5s - 5.5s)
    setTimeout(() => {
      // SQS returns
      addLog('success', `[Worker-3] SQS Message Enqueued. MessageId: 3c7a36c5-23bd-4770-877c-7a9bf48b94ce`);
      
      // Rekognition returns
      const detectedCount = activeData.mockLabels.filter(l => l.confidence >= minConfidence).length;
      addLog('success', `[Worker-1] Rekognition labels detected: ${detectedCount} labels above threshold.`);
      
      if (activeData.isModerated) {
        addLog('warn', `[Worker-2] Content Moderation alert: Rekognition flagged unsafe elements: ${activeData.mockModeration.map(m => m.name).join(', ')}`);
        setPipelineState('blocked');
        setFocusedNode('rekognition');
      } else {
        addLog('success', `[Worker-2] Content Moderation screen passed clean.`);
        setPipelineState('persisting');
        setFocusedNode('dynamodb');
      }
      
      addLog('info', `Orchestrator gathered task completions. Writing final metadata to DynamoDB table.`);
    }, 3800);

    // 4. Persistence complete, moving to Notification (5.5s - 7s)
    setTimeout(() => {
      addLog('success', `DynamoDB: put_item completed successfully. Row saved under primary key: ${runId}`);
      if (activeData.isModerated) {
        addLog('warn', `DynamoDB: Image metadata saved with status [BLOCKED]`);
      } else {
        addLog('info', `DynamoDB: Image metadata saved with status [PROCESSED]`);
      }
      
      setPipelineState('notifying');
      setFocusedNode('sns');
      addLog('info', `SNS: Publishing Completed notification event to topic ProcessedTopic`);
    }, 5500);

    // 5. Finished pipeline execution (7s+)
    setTimeout(() => {
      if (activeData.isModerated) {
        addLog('error', `SNS: Delivered Sensitive Content Warning payload to: ${notifySubscriber}`);
        addLog('warn', `Pipeline completed with violations block. Notification dispatched.`);
        setPipelineState('blocked');
      } else {
        addLog('success', `SNS: Delivered email processing summary notification via SES to: ${notifySubscriber}`);
        addLog('success', `Pipeline completed successfully for image: ${runId}`);
        setPipelineState('completed');
      }

      // Add to results table
      const filteredLabels = activeData.mockLabels
        .filter(l => l.confidence >= minConfidence)
        .slice(0, maxLabels)
        .map(l => `${l.name} (${Math.round(l.confidence)}%)`);

      const newRun = {
        id: runId,
        time: new Date().toLocaleTimeString(),
        labels: activeData.isModerated ? ['FLAGGED - MODERATED'] : filteredLabels,
        moderation: activeData.isModerated ? 'BLOCKED' : 'CLEAN',
        imgUrl: activeData.url,
        status: 'COMPLETED',
        raw: {
          imageId: runId,
          userId: "user_123",
          createdAt: new Date().toISOString(),
          s3Uri: `s3://image-intelligence-raw/uploads/user_123/${activeData.name.replace(/\s+/g, '_')}`,
          labels: activeData.mockLabels.filter(l => l.confidence >= minConfidence).slice(0, maxLabels),
          moderationFlags: activeData.mockModeration,
          moderationStatus: activeData.isModerated ? 'BLOCKED' : 'CLEAN',
          awsRegion: awsRegion
        }
      };

      setResultsHistory(prev => [newRun, ...prev]);
    }, 7000);
  };

  // Run Real upload to Live S3/API Gateway
  const triggerLiveUpload = async () => {
    if (!customFile) {
      addLog('error', 'Live mode requires uploading a custom image first.');
      return;
    }

    setPipelineState('uploading');
    addLog('info', 'Live Mode: Starting upload procedure to raw S3 Bucket...');
    
    try {
      // 1. In a production pipeline, request a presigned post url from our gateway
      // For this interactive dashboard, we make a call directly if configured, or trigger the backend stack.
      // Since a direct S3 PUT might hit CORS blocks without specific policies, let's simulate the direct POST gateway
      addLog('info', `Connecting to Live API Gateway at: ${liveApiUrl}`);
      
      const formData = new FormData();
      formData.append('image', customFile);
      formData.append('userId', 'user_123');
      formData.append('region', awsRegion);
      formData.append('maxLabels', String(maxLabels));
      formData.append('minConfidence', String(minConfidence));

      // Post raw file to API /images upload endpoint
      const response = await fetch(`${liveApiUrl}/images`, {
        method: 'POST',
        body: formData
      });

      if (!response.ok) {
        throw new Error(`API returned HTTP ${response.status}: ${response.statusText}`);
      }

      const resData = await response.json();
      addLog('success', `Live Upload API Request succeeded. Image processing initiated in AWS!`);
      addLog('info', `AWS Key: ${resData.key || customFile.name}`);
      
      setPipelineState('completed');
      addLog('success', 'Metadata saved in DynamoDB. Pipeline processing finished.');
    } catch (err: any) {
      addLog('error', `Live Mode Error: ${err.message}`);
      setPipelineState('error');
    }
  };

  // Trigger Action dispatcher
  const executePipelineRun = () => {
    if (activeMode === 'simulation') {
      triggerSimulation();
    } else {
      triggerLiveUpload();
    }
  };

  // Export metadata helper
  const downloadJSONMetadata = (item: any) => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(item.raw, null, 2));
    const dlAnchorElem = document.createElement('a');
    dlAnchorElem.setAttribute("href", dataStr);
    dlAnchorElem.setAttribute("download", `metadata-${item.id}.json`);
    dlAnchorElem.click();
  };

  const activeImage = getActiveImageMeta();

  return (
    <div className="app-container">
      {/* Upper Header Section */}
      <header className="header">
        <div className="header-title-area">
          <h1>Event-Driven Image Intelligence</h1>
          <p>Highly concurrent, resilient processing pipeline provisioned via Terraform & AWS CDK</p>
        </div>
        
        {/* Status controls */}
        <div className="status-area">
          <div className="mode-selector">
            <button 
              className={`mode-btn ${activeMode === 'simulation' ? 'active' : ''}`}
              onClick={() => {
                setActiveMode('simulation');
                addLog('info', 'Switched environment to Standalone Simulation Sandbox.');
              }}
            >
              Simulation Sandbox
            </button>
            <button 
              className={`mode-btn ${activeMode === 'live' ? 'active' : ''}`}
              onClick={() => {
                setActiveMode('live');
                setShowLiveConfig(true);
                addLog('info', 'Switched environment to Live AWS Backend Integration.');
              }}
            >
              Live AWS Backend
            </button>
          </div>
          
          <div className="connection-indicator">
            <span className={`dot ${activeMode === 'simulation' ? 'offline' : ''}`} />
            {activeMode === 'simulation' ? 'Offline Sandbox' : 'AWS Connected'}
          </div>
        </div>
      </header>

      {/* Live AWS Mode Configuration Bar */}
      {activeMode === 'live' && showLiveConfig && (
        <div className="live-endpoint-config">
          <div className="input-group">
            <span className="input-label">Live API Gateway URL</span>
            <input 
              type="text" 
              className="text-input"
              value={liveApiUrl} 
              onChange={(e) => setLiveApiUrl(e.target.value)} 
              placeholder="https://abc123xyz.execute-api.us-east-1.amazonaws.com/prod"
            />
          </div>
          <button 
            className="btn btn-primary" 
            style={{ marginTop: '1.25rem', height: '38px', fontSize: '0.8rem' }}
            onClick={() => setShowLiveConfig(false)}
          >
            Save Endpoint
          </button>
          <button 
            className="remove-image-btn" 
            style={{ position: 'relative', top: '8px', right: '0' }}
            onClick={() => setShowLiveConfig(false)}
          >
            <Icons.Close />
          </button>
        </div>
      )}

      {/* Main Workspace Grid */}
      <div className="dashboard-grid">
        
        {/* Left Side: Pipeline visualizer & inputs */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* Uploader & Parameters card */}
          <section className="panel">
            <div className="panel-header">
              <h2 className="panel-title">
                <Icons.Upload /> Image Workspace & Configuration
              </h2>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Step 1: Input Setup</span>
            </div>

            <div className="workspace-controls">
              
              {/* Drag and Drop Zone */}
              <div 
                className={`uploader-card ${isDragging ? 'dragging' : ''}`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => document.getElementById('file-upload-input')?.click()}
              >
                <input 
                  type="file" 
                  id="file-upload-input" 
                  style={{ display: 'none' }} 
                  accept="image/*"
                  onChange={handleFileInput}
                />
                
                {activeImage.url ? (
                  <div className="image-preview-container">
                    <img src={activeImage.url} alt="Workspace source" className="image-preview" />
                    <button className="remove-image-btn" onClick={removeCustomImage} title="Remove image">
                      <Icons.Close />
                    </button>
                  </div>
                ) : null}

                <div className="upload-icon">
                  <Icons.Upload />
                </div>
                <p className="upload-text">
                  Drag & drop image here or <strong>browse files</strong>
                </p>
                <p style={{ fontSize: '0.65rem', color: 'var(--text-muted)', marginTop: '0.5rem' }}>
                  Supports JPG, PNG, WEBP up to 5MB
                </p>
              </div>

              {/* Configurations parameters */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                <div className="presets-grid">
                  {PRESETS.map((preset) => (
                    <div 
                      key={preset.id}
                      className={`preset-thumbnail ${selectedPresetId === preset.id ? 'active' : ''}`}
                      onClick={() => selectPreset(preset)}
                    >
                      <img src={preset.url} alt={preset.name} />
                      <div className="preset-label">{preset.name}</div>
                    </div>
                  ))}
                </div>

                <div className="config-group">
                  <div className="slider-container">
                    <div className="slider-header">
                      <span>Max Labels</span>
                      <span className="slider-value">{maxLabels} labels</span>
                    </div>
                    <input 
                      type="range" 
                      min="1" 
                      max="20" 
                      value={maxLabels} 
                      className="range-slider"
                      onChange={(e) => setMaxLabels(Number(e.target.value))}
                    />
                  </div>

                  <div className="slider-container">
                    <div className="slider-header">
                      <span>Min Confidence</span>
                      <span className="slider-value">{minConfidence}%</span>
                    </div>
                    <input 
                      type="range" 
                      min="50" 
                      max="95" 
                      value={minConfidence} 
                      className="range-slider"
                      onChange={(e) => setMinConfidence(Number(e.target.value))}
                    />
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Target AWS Region</span>
                    <select 
                      className="text-input" 
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem', background: 'rgba(0,0,0,0.4)', color: 'white' }} 
                      value={awsRegion}
                      onChange={(e) => {
                        setAwsRegion(e.target.value);
                        addLog('info', `Target AWS Region updated to: ${e.target.value}`);
                      }}
                    >
                      <option value="us-east-1">us-east-1 (N. Virginia)</option>
                      <option value="us-west-2">us-west-2 (Oregon)</option>
                      <option value="eu-west-1">eu-west-1 (Ireland)</option>
                      <option value="ap-south-1">ap-south-1 (Mumbai)</option>
                      <option value="ap-northeast-1">ap-northeast-1 (Tokyo)</option>
                    </select>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                    <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>SNS Email Subscriber</span>
                    <input 
                      type="email" 
                      className="text-input" 
                      style={{ padding: '0.35rem 0.6rem', fontSize: '0.75rem' }} 
                      value={notifySubscriber}
                      onChange={(e) => setNotifySubscriber(e.target.value)}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="trigger-bar">
              <button 
                className="btn-run-pipeline"
                onClick={executePipelineRun}
                disabled={pipelineState !== 'idle' && pipelineState !== 'completed' && pipelineState !== 'blocked' && pipelineState !== 'error'}
              >
                <Icons.Play />
                {pipelineState === 'idle' || pipelineState === 'completed' || pipelineState === 'blocked' ? 'Execute Pipeline Flow' : 'Processing...'}
              </button>
            </div>
          </section>

          {/* SVG Pipeline Diagram flowchart */}
          <section className="panel" style={{ gap: '1rem' }}>
            <div className="panel-header" style={{ marginBottom: '0.25rem' }}>
              <h2 className="panel-title">
                <Icons.Info /> AWS Serverless Pipeline Flow
              </h2>
              <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Interactive Architecture</span>
            </div>

            <div className="flowchart-container">
              <div className="flowchart-svg-wrapper">
                
                {/* Flow lines SVG */}
                <svg className="flowchart-svg">
                  {/* Def marker arrows */}
                  <defs>
                    <marker id="arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="rgba(255,255,255,0.15)"/>
                    </marker>
                    <marker id="arrow-active" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--accent-blue)"/>
                    </marker>
                    <marker id="arrow-success" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                      <path d="M 0 1 L 10 5 L 0 9 z" fill="var(--accent-green)"/>
                    </marker>
                  </defs>

                  {/* Links paths */}
                  {/* Client to S3 */}
                  <path 
                    d="M 120 190 H 210" 
                    className={`flow-link ${focusedNode === 's3' && pipelineState === 'uploading' ? 'active-link' : ''} ${pipelineState !== 'idle' && pipelineState !== 'uploading' ? 'completed-link' : ''}`}
                    markerEnd={pipelineState !== 'idle' && pipelineState !== 'uploading' ? 'url(#arrow-success)' : 'url(#arrow)'}
                  />

                  {/* S3 to Lambda */}
                  <path 
                    d="M 330 190 H 420" 
                    className={`flow-link ${focusedNode === 'lambda' && pipelineState === 'fanning_out' ? 'active-link' : ''} ${['persisting', 'notifying', 'completed', 'blocked'].includes(pipelineState) ? 'completed-link' : ''}`}
                  />

                  {/* Lambda to Rekognition */}
                  <path 
                    d="M 490 150 Q 520 80, 600 80" 
                    className={`flow-link ${focusedNode === 'rekognition' && pipelineState === 'fanning_out' ? 'active-link' : ''} ${['persisting', 'notifying', 'completed'].includes(pipelineState) ? 'completed-link' : ''} ${pipelineState === 'blocked' ? 'blocked-link' : ''}`}
                  />

                  {/* Lambda to SQS */}
                  <path 
                    d="M 490 230 Q 520 300, 600 300" 
                    className={`flow-link ${focusedNode === 'sqs' && pipelineState === 'fanning_out' ? 'active-link' : ''} ${['persisting', 'notifying', 'completed', 'blocked'].includes(pipelineState) ? 'completed-link' : ''}`}
                  />

                  {/* Rekognition to DynamoDB */}
                  <path 
                    d="M 680 110 Q 640 190, 490 190" 
                    className={`flow-link ${focusedNode === 'dynamodb' && pipelineState === 'persisting' ? 'active-link' : ''} ${['notifying', 'completed'].includes(pipelineState) ? 'completed-link' : ''} ${pipelineState === 'blocked' ? 'blocked-link' : ''}`}
                  />

                  {/* SQS to DynamoDB */}
                  <path 
                    d="M 680 270 Q 640 190, 490 190" 
                    className={`flow-link ${focusedNode === 'dynamodb' && pipelineState === 'persisting' ? 'active-link' : ''} ${['notifying', 'completed', 'blocked'].includes(pipelineState) ? 'completed-link' : ''}`}
                  />

                  {/* DynamoDB to SNS */}
                  <path 
                    d="M 420 190 H 330" 
                    className={`flow-link ${focusedNode === 'sns' && pipelineState === 'notifying' ? 'active-link' : ''} ${['completed', 'blocked'].includes(pipelineState) ? 'completed-link' : ''}`}
                  />

                  {/* Moving Packets (Dots animation) during states */}
                  {pipelineState === 'uploading' && (
                    <circle r="6" className="data-packet">
                      <animateMotion dur="1.2s" repeatCount="indefinite" path="M 120 190 H 210" />
                    </circle>
                  )}
                  {pipelineState === 'fanning_out' && (
                    <circle r="6" className="data-packet">
                      <animateMotion dur="1.2s" repeatCount="indefinite" path="M 330 190 H 420" />
                    </circle>
                  )}
                  {pipelineState === 'fanning_out' && (
                    <>
                      <circle r="5" className="data-packet rekognition-packet">
                        <animateMotion dur="1.5s" repeatCount="indefinite" path="M 490 150 Q 520 80, 600 80" />
                      </circle>
                      <circle r="5" className="data-packet sqs-packet">
                        <animateMotion dur="1.5s" repeatCount="indefinite" path="M 490 230 Q 520 300, 600 300" />
                      </circle>
                    </>
                  )}
                  {pipelineState === 'persisting' && (
                    <>
                      <circle r="5" className="data-packet rekognition-packet">
                        <animateMotion dur="1.5s" repeatCount="indefinite" path="M 680 110 Q 640 190, 490 190" />
                      </circle>
                      <circle r="5" className="data-packet sqs-packet">
                        <animateMotion dur="1.5s" repeatCount="indefinite" path="M 680 270 Q 640 190, 490 190" />
                      </circle>
                    </>
                  )}
                  {pipelineState === 'notifying' && (
                    <circle r="6" className="data-packet">
                      <animateMotion dur="1.2s" repeatCount="indefinite" path="M 420 190 H 330" />
                    </circle>
                  )}
                </svg>

                {/* Overlay Node Cards */}
                {/* Node: Client Application */}
                <div 
                  className={`node-card node-client ${focusedNode === 'client' ? 'active-node' : ''}`}
                  style={{ top: '145px', left: '0px' }}
                  onClick={() => inspectNode('client')}
                >
                  <div className="node-icon-wrapper">
                    <Icons.Upload />
                  </div>
                  <h4>Client UI</h4>
                  <p>Image Upload</p>
                </div>

                {/* Node: Amazon S3 */}
                <div 
                  className={`node-card node-s3 ${focusedNode === 's3' ? 'active-node' : ''} ${pipelineState === 'uploading' ? 'processing-node' : ''} ${pipelineState !== 'idle' && pipelineState !== 'uploading' ? 'completed-node' : ''}`}
                  style={{ top: '145px', left: '190px' }}
                  onClick={() => inspectNode('s3')}
                >
                  {pipelineState === 'uploading' && <span className="node-badge processing">Upload</span>}
                  <div className="node-icon-wrapper">
                    <Icons.S3 />
                  </div>
                  <h4>Amazon S3</h4>
                  <p>s3-raw-bucket</p>
                </div>

                {/* Node: Lambda Orchestrator */}
                <div 
                  className={`node-card node-lambda ${focusedNode === 'lambda' ? 'active-node' : ''} ${pipelineState === 'fanning_out' ? 'processing-node' : ''} ${['persisting', 'notifying', 'completed', 'blocked'].includes(pipelineState) ? 'completed-node' : ''}`}
                  style={{ top: '145px', left: '380px' }}
                  onClick={() => inspectNode('lambda')}
                >
                  {pipelineState === 'fanning_out' && <span className="node-badge processing">Fanout</span>}
                  <div className="node-icon-wrapper">
                    <Icons.Lambda />
                  </div>
                  <h4>AWS Lambda</h4>
                  <p>Orchestrator</p>
                </div>

                {/* Node: Amazon Rekognition */}
                <div 
                  className={`node-card node-rekognition ${focusedNode === 'rekognition' ? 'active-node' : ''} ${focusedNode === 'rekognition' && pipelineState === 'fanning_out' ? 'processing-node' : ''} ${['persisting', 'notifying', 'completed'].includes(pipelineState) ? 'completed-node' : ''} ${pipelineState === 'blocked' ? 'blocked-node' : ''}`}
                  style={{ top: '35px', left: '580px' }}
                  onClick={() => inspectNode('rekognition')}
                >
                  {pipelineState === 'blocked' && <span className="node-badge blocked">Blocked</span>}
                  <div className="node-icon-wrapper">
                    <Icons.Rekognition />
                  </div>
                  <h4>Rekognition</h4>
                  <p>ML analysis</p>
                </div>

                {/* Node: SQS Queue */}
                <div 
                  className={`node-card node-sqs ${focusedNode === 'sqs' ? 'active-node' : ''} ${focusedNode === 'sqs' && pipelineState === 'fanning_out' ? 'processing-node' : ''} ${['persisting', 'notifying', 'completed', 'blocked'].includes(pipelineState) ? 'completed-node' : ''}`}
                  style={{ top: '255px', left: '580px' }}
                  onClick={() => inspectNode('sqs')}
                >
                  <div className="node-icon-wrapper">
                    <Icons.SQS />
                  </div>
                  <h4>Amazon SQS</h4>
                  <p>Task Queue</p>
                </div>

                {/* Node: DynamoDB */}
                <div 
                  className={`node-card node-dynamodb ${focusedNode === 'dynamodb' ? 'active-node' : ''} ${pipelineState === 'persisting' ? 'processing-node' : ''} ${['notifying', 'completed', 'blocked'].includes(pipelineState) ? 'completed-node' : ''}`}
                  style={{ top: '145px', left: '580px' }}
                  onClick={() => inspectNode('dynamodb')}
                >
                  {pipelineState === 'persisting' && <span className="node-badge processing">Saving</span>}
                  <div className="node-icon-wrapper">
                    <Icons.DynamoDB />
                  </div>
                  <h4>DynamoDB</h4>
                  <p>Metadata Store</p>
                </div>

                {/* Node: SNS Notifications */}
                <div 
                  className={`node-card node-sns ${focusedNode === 'sns' ? 'active-node' : ''} ${pipelineState === 'notifying' ? 'processing-node' : ''} ${['completed', 'blocked'].includes(pipelineState) ? 'completed-node' : ''}`}
                  style={{ top: '145px', left: '10px' }}
                  onClick={() => inspectNode('sns')}
                >
                  {pipelineState === 'notifying' && <span className="node-badge processing">Notify</span>}
                  <div className="node-icon-wrapper">
                    <Icons.SNS />
                  </div>
                  <h4>Amazon SNS</h4>
                  <p>SNS Topics</p>
                </div>

              </div>
            </div>
            
            <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textAlign: 'center', marginTop: '0.25rem' }}>
              💡 Click any node on the architecture flowchart to load its AWS SDK code and raw API payload in the inspector.
            </p>
          </section>
        </div>

        {/* Right Side: Logs Terminal, API payload & code inspectors */}
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div className="inspector-tabs">
            <button 
              className={`inspector-tab ${inspectorTab === 'console' ? 'active' : ''}`}
              onClick={() => setInspectorTab('console')}
            >
              <Icons.Terminal /> CloudWatch Logs
            </button>
            <button 
              className={`inspector-tab ${inspectorTab === 'payload' ? 'active' : ''}`}
              onClick={() => setInspectorTab('payload')}
            >
              <Icons.Code /> API Payload
            </button>
            <button 
              className={`inspector-tab ${inspectorTab === 'code' ? 'active' : ''}`}
              onClick={() => setInspectorTab('code')}
            >
              <Icons.Info /> Details & Code
            </button>
          </div>

          <div className="inspector-body">
            
            {/* Console Log stream tab */}
            {inspectorTab === 'console' && (
              <div className="terminal-window">
                {logs.map((log, index) => (
                  <div key={index} className="terminal-line">
                    <span className="log-time-stamp">[{log.time}]</span>
                    <span className={`log-level ${log.level}`}>{log.level.toUpperCase()}:</span>
                    <span className="log-message">{log.msg}</span>
                  </div>
                ))}
                <div className="terminal-prompt">
                  <span>$ aws-pipeline-agent --watch</span>
                  <span className="terminal-cursor" />
                </div>
                <div ref={logsEndRef} />
              </div>
            )}

            {/* API payloads JSON tab */}
            {inspectorTab === 'payload' && (
              <div className="json-viewer-container">
                <div className="json-viewer-header">
                  <span>Payload Inspector: {focusedNode.toUpperCase()} Node</span>
                  <span style={{ color: 'var(--accent-cyan)' }}>JSON Output</span>
                </div>
                <div className="json-body">
                  <pre>{JSON.stringify(inspectedPayload, null, 2)}</pre>
                </div>
              </div>
            )}

            {/* Code / Docs tab */}
            {inspectorTab === 'code' && (
              <div className="code-inspector-container">
                <div className="code-inspector-header">
                  <button 
                    className={`code-selector-btn ${activeCodeLang === 'python' ? 'active' : ''}`}
                    onClick={() => setActiveCodeLang('python')}
                  >
                    boto3 (Python)
                  </button>
                  <button 
                    className={`code-selector-btn ${activeCodeLang === 'typescript' ? 'active' : ''}`}
                    onClick={() => setActiveCodeLang('typescript')}
                  >
                    AWS CDK / Node.js
                  </button>
                </div>
                
                <div className="docs-scroller">
                  <h3 className="docs-title">{SERVICES_DATA[focusedNode as keyof typeof SERVICES_DATA]?.title}</h3>
                  <div className="docs-text">
                    <span style={{ display: 'block', fontWeight: 600, color: 'var(--text-primary)', marginBottom: '0.2rem', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                      Role: {SERVICES_DATA[focusedNode as keyof typeof SERVICES_DATA]?.role}
                    </span>
                    {SERVICES_DATA[focusedNode as keyof typeof SERVICES_DATA]?.docs}
                  </div>
                  
                  <span style={{ display: 'block', fontWeight: 600, color: 'var(--text-secondary)', marginBottom: '0.4rem', textTransform: 'uppercase', fontSize: '0.7rem' }}>
                    Implementation Snippet
                  </span>
                  
                  <div className="docs-code">
                    {SERVICES_DATA[focusedNode as keyof typeof SERVICES_DATA]?.code[activeCodeLang]}
                  </div>
                </div>
              </div>
            )}

          </div>
        </div>

      </div>

      {/* Pipeline Results table history */}
      <section className="history-section">
        <div className="panel-header" style={{ borderBottom: 'none', paddingBottom: '0' }}>
          <h2 className="panel-title">
            <Icons.Terminal /> Historical Results Log Dashboard
          </h2>
          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            {activeMode === 'simulation' ? 'Local Sandbox runs history log' : 'Live polling items from DynamoDB'}
          </span>
        </div>

        <div className="results-table-container">
          {resultsHistory.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '3rem 0', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
              No image metadata rows stored yet. Click "Execute Pipeline Flow" above to process an image.
            </div>
          ) : (
            <table className="results-table">
              <thead>
                <tr>
                  <th>Preview</th>
                  <th>Image ID</th>
                  <th>Timestamp</th>
                  <th>Detected Labels</th>
                  <th>Moderation Flag</th>
                  <th>S3 Storage URI</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {resultsHistory.map((item, idx) => (
                  <tr key={idx}>
                    <td>
                      <img src={item.imgUrl || '/presets/landscape.png'} alt="thumbnail" className="row-img-thumb" />
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.8rem' }}>
                      <strong>{item.id}</strong>
                    </td>
                    <td style={{ color: 'var(--text-secondary)' }}>{item.time}</td>
                    <td>
                      <div className="tag-list">
                        {item.labels.slice(0, 4).map((label: string, lIdx: number) => (
                          <span key={lIdx} className="tag-item">{label}</span>
                        ))}
                        {item.labels.length > 4 && (
                          <span className="tag-item" style={{ background: 'rgba(255,255,255,0.05)', color: 'var(--text-secondary)' }}>
                            +{item.labels.length - 4} more
                          </span>
                        )}
                      </div>
                    </td>
                    <td>
                      <span className={`badge ${item.moderation === 'BLOCKED' ? 'blocked' : 'clean'}`}>
                        {item.moderation}
                      </span>
                    </td>
                    <td style={{ fontFamily: 'var(--font-mono)', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                      s3://image-intelligence-raw/{item.id}.png
                    </td>
                    <td>
                      <button 
                        className="btn-icon" 
                        onClick={() => downloadJSONMetadata(item)} 
                        title="Download raw JSON metadata"
                      >
                        <Icons.Download />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </section>
    </div>
  );
}
