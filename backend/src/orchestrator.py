import os
import json
import boto3
import time
from concurrent.futures import ThreadPoolExecutor, as_completed

rekognition = boto3.client('rekognition')
sqs = boto3.client('sqs')
dynamodb = boto3.resource('dynamodb')

QUEUE_URL = os.environ.get('QUEUE_URL')
TABLE_NAME = os.environ.get('TABLE_NAME')
table = dynamodb.Table(TABLE_NAME)

def detect_labels(bucket, key):
    return rekognition.detect_labels(
        Image = {'S3Object': {'Bucket': bucket, 'Name': key}},
        MaxLabels = 20,
        MinConfidence = 70.0
    )

def detect_moderation(bucket, key):
    return rekognition.detect_moderation_labels(
        Image = {'S3Object': {'Bucket': bucket, 'Name': key}},
        MinConfidence = 70.0
    )

def enqueue_task(bucket, key):
    return sqs.send_message(
        QueueUrl = QUEUE_URL,
        MessageBody = json.dumps({
            'action': 'PROCESS_IMAGE',
            'bucket': bucket,
            'key': key,
            'timestamp': time.time()
        })
    )

def lambda_handler(event, context):
    print("Received S3 Event:", json.dumps(event))
    
    for record in event.get('Records', []):
        bucket = record['s3']['bucket']['name']
        key = record['s3']['object']['key']
        key = key.replace('+', ' ')
        
        image_id = key
        user_id = key.split('/')[0] if '/' in key else 'anonymous'
        
        try:
            print(f"Processing image {key} from bucket {bucket}...")
            
            with ThreadPoolExecutor(max_workers=3) as executor:
                future_labels = executor.submit(detect_labels, bucket, key)
                future_mod = executor.submit(detect_moderation, bucket, key)
                future_sqs = executor.submit(enqueue_task, bucket, key)
        
                labels_response = future_labels.result()
                moderation_response = future_mod.result()
                sqs_response = future_sqs.result()
            
            print(f"SQS Message Enqueued: {sqs_response.get('MessageId')}")
            
            labels = [{'name': l['Name'], 'confidence': l['Confidence']} for l in labels_response.get('Labels', [])]
            moderation_flags = [l['Name'] for l in moderation_response.get('ModerationLabels', [])]
            
            is_blocked = len(moderation_flags) > 0
            moderation_status = 'BLOCKED' if is_blocked else 'CLEAN'
            created_at = time.strftime('%Y-%m-%dT%H:%M:%SZ', time.gmtime())
            ttl = int(time.time()) + (90 * 24 * 60 * 60) # 90 days
            
            table.put_item(
                Item = {
                    'imageId': image_id,
                    'userId': user_id,
                    'createdAt': created_at,
                    's3Uri': f"s3://{bucket}/{key}",
                    'labels': labels,
                    'moderationFlags': moderation_flags,
                    'moderationStatus': moderation_status,
                    'status': 'PROCESSED',
                    'ttl': ttl
                }
            )
            print(f"Successfully stored metadata for {image_id}. Moderation: {moderation_status}")
            
        except Exception as e:
            print(f"Error processing image {key}: {str(e)}")
            raise e
