import os
import time
import json
import uuid
import concurrent.futures
from unittest import mock

# Set up environment variables for moto/lambdas
os.environ['AWS_ACCESS_KEY_ID'] = 'testing'
os.environ['AWS_SECRET_ACCESS_KEY'] = 'testing'
os.environ['AWS_SECURITY_TOKEN'] = 'testing'
os.environ['AWS_SESSION_TOKEN'] = 'testing'
os.environ['AWS_DEFAULT_REGION'] = 'us-east-1'

os.environ['QUEUE_URL'] = 'https://sqs.us-east-1.amazonaws.com/123456789012/TaskQueue'
os.environ['TABLE_NAME'] = 'MetadataTable'
os.environ['TOPIC_ARN'] = 'arn:aws:sns:us-east-1:123456789012:NotificationTopic'

from moto import mock_aws
import boto3

@mock_aws
def run_stress_test():
    print("Setting up mock AWS environment...")
    
    # 1. Setup mock resources
    s3_client = boto3.client('s3', region_name='us-east-1')
    s3_client.create_bucket(Bucket='test-bucket')
    
    sqs_client = boto3.client('sqs', region_name='us-east-1')
    queue = sqs_client.create_queue(QueueName='TaskQueue')
    os.environ['QUEUE_URL'] = queue['QueueUrl']
    
    dynamodb = boto3.resource('dynamodb', region_name='us-east-1')
    table = dynamodb.create_table(
        TableName='MetadataTable',
        KeySchema=[{'AttributeName': 'imageId', 'KeyType': 'HASH'}],
        AttributeDefinitions=[
            {'AttributeName': 'imageId', 'AttributeType': 'S'},
            {'AttributeName': 'userId', 'AttributeType': 'S'},
            {'AttributeName': 'createdAt', 'AttributeType': 'S'}
        ],
        GlobalSecondaryIndexes=[{
            'IndexName': 'UserIndex',
            'KeySchema': [
                {'AttributeName': 'userId', 'KeyType': 'HASH'},
                {'AttributeName': 'createdAt', 'KeyType': 'RANGE'}
            ],
            'Projection': {'ProjectionType': 'ALL'}
        }],
        BillingMode='PAY_PER_REQUEST'
    )
    table.meta.client.get_waiter('table_exists').wait(TableName='MetadataTable')

    sns_client = boto3.client('sns', region_name='us-east-1')
    topic = sns_client.create_topic(Name='NotificationTopic')
    os.environ['TOPIC_ARN'] = topic['TopicArn']

    # Important: Import modules after mocking and env vars are set
    import orchestrator
    import dashboard
    import notifier

    # Mock rekognition since Moto's rekognition mock might be incomplete for our exact calls
    def mock_detect_labels(*args, **kwargs):
        return {'Labels': [{'Name': 'Person', 'Confidence': 99.0}]}
    
    def mock_detect_moderation(*args, **kwargs):
        return {'ModerationLabels': []}

    orchestrator.rekognition.detect_labels = mock_detect_labels
    orchestrator.rekognition.detect_moderation_labels = mock_detect_moderation

    NUM_EVENTS = 100
    WORKERS = 10

    print(f"\n--- 1. Stress Testing Orchestrator Lambda (Concurrency: {WORKERS}, Total: {NUM_EVENTS}) ---")
    
    def worker_orchestrator(i):
        event = {
            "Records": [{
                "s3": {
                    "bucket": {"name": "test-bucket"},
                    "object": {"key": f"user_123/image_{i}.jpg"}
                }
            }]
        }
        try:
            start_time = time.time()
            # The lambda prints to stdout, we might want to suppress it, but let's let it run
            orchestrator.lambda_handler(event, None)
            return time.time() - start_time
        except Exception as e:
            return e

    start_total = time.time()
    times = []
    errors = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as executor:
        futures = [executor.submit(worker_orchestrator, i) for i in range(NUM_EVENTS)]
        for f in concurrent.futures.as_completed(futures):
            res = f.result()
            if isinstance(res, Exception):
                errors += 1
                print(f"Error: {res}")
            else:
                times.append(res)
    
    total_time = time.time() - start_total
    print(f"Orchestrator test complete in {total_time:.2f}s")
    if times:
        print(f"Average time per invocation: {sum(times)/len(times):.4f}s")
    print(f"Errors: {errors}")

    print(f"\n--- 2. Stress Testing Dashboard Lambda (Concurrency: {WORKERS}, Total: {NUM_EVENTS}) ---")
    
    def worker_dashboard(i):
        event = {
            "queryStringParameters": {
                "userId": "user_123"
            }
        }
        try:
            start_time = time.time()
            res = dashboard.lambda_handler(event, None)
            if res['statusCode'] != 200:
                raise Exception(f"Bad status code: {res['statusCode']}")
            return time.time() - start_time
        except Exception as e:
            return e

    start_total = time.time()
    dash_times = []
    dash_errors = 0
    with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as executor:
        futures = [executor.submit(worker_dashboard, i) for i in range(NUM_EVENTS)]
        for f in concurrent.futures.as_completed(futures):
            res = f.result()
            if isinstance(res, Exception):
                dash_errors += 1
                print(f"Error: {res}")
            else:
                dash_times.append(res)
                
    total_time = time.time() - start_total
    print(f"Dashboard test complete in {total_time:.2f}s")
    if dash_times:
        print(f"Average time per invocation: {sum(dash_times)/len(dash_times):.4f}s")
    print(f"Errors: {dash_errors}")
    
    # Also test the DynamoDB Streams Notifier logic
    print(f"\n--- 3. Stress Testing Notifier Lambda (Concurrency: {WORKERS}, Total: {NUM_EVENTS}) ---")
    
    def worker_notifier(i):
        # Construct a mock DynamoDB stream event
        event = {
            "Records": [{
                "eventName": "INSERT",
                "dynamodb": {
                    "NewImage": {
                        "imageId": {"S": f"img_{i}"},
                        "userId": {"S": "user_123"},
                        "moderationStatus": {"S": "CLEAN"},
                        "labels": {"L": [{"M": {"name": {"S": "Person"}, "confidence": {"N": "99.0"}}}]}
                    }
                }
            }]
        }
        try:
            start_time = time.time()
            notifier.lambda_handler(event, None)
            return time.time() - start_time
        except Exception as e:
            return e

    start_total = time.time()
    notif_times = []
    notif_errors = 0
    
    # Suppress print statements for this one to keep output clean, using contextlib.redirect_stdout
    import io, contextlib
    with contextlib.redirect_stdout(io.StringIO()):
        with concurrent.futures.ThreadPoolExecutor(max_workers=WORKERS) as executor:
            futures = [executor.submit(worker_notifier, i) for i in range(NUM_EVENTS)]
            for f in concurrent.futures.as_completed(futures):
                res = f.result()
                if isinstance(res, Exception):
                    notif_errors += 1
                else:
                    notif_times.append(res)
                
    total_time = time.time() - start_total
    print(f"Notifier test complete in {total_time:.2f}s")
    if notif_times:
        print(f"Average time per invocation: {sum(notif_times)/len(notif_times):.4f}s")
    print(f"Errors: {notif_errors}")
    
    print("\n--- Summary ---")
    print(f"Items in Mock SQS Queue: {sqs_client.get_queue_attributes(QueueUrl=os.environ['QUEUE_URL'], AttributeNames=['ApproximateNumberOfMessages'])['Attributes']['ApproximateNumberOfMessages']}")
    scan_res = table.scan(Select='COUNT')
    print(f"Items in Mock DynamoDB Table: {scan_res['Count']}")
    print("Stress test completed successfully!")

if __name__ == "__main__":
    import sys
    # Add backend/src to path so we can import the lambdas
    sys.path.append(os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'backend', 'src')))
    run_stress_test()
