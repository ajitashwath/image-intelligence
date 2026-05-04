import os
import json
import boto3
from boto3.dynamodb.types import TypeDeserializer

sns = boto3.client('sns')
TOPIC_ARN = os.environ.get('TOPIC_ARN')
deserializer = TypeDeserializer()

def deserialize(dynamo_obj):
    return {k: deserializer.deserialize(v) for k, v in dynamo_obj.items()}

def lambda_handler(event, context):
    for record in event.get('Records', []):
        if record['eventName'] in ['INSERT', 'MODIFY']:
            new_image = record.get('dynamodb', {}).get('NewImage')
            if not new_image:
                continue
                
            item = deserialize(new_image)
            
            image_id = item.get('imageId', 'unknown')
            user_id = item.get('userId', 'unknown')
            moderation_status = item.get('moderationStatus', 'CLEAN')
            moderation_flags = item.get('moderationFlags', [])
            labels = item.get('labels', [])
            
            subject = ''
            message = ''
            
            if moderation_status == 'BLOCKED':
                subject = f"[ALERT] Moderation Flag Triggered for Image: {image_id}"
                flags_str = ", ".join(moderation_flags)
                message = f"Image ID: {image_id}\nUser: {user_id}\nFlags: {flags_str}\n\nThis image was flagged by the moderation filter and blocked from processing."
                
                print(f"Emitting CloudWatch Metric: ModerationBlocked = 1 for imageId = {image_id}")
            else:
                subject = f"[SUCCESS] Image Processed: {image_id}"
                labels_str = "\n".join([f"- {l['name']} ({round(l['confidence'])}%)" for l in labels])
                message = f"Image ID: {image_id}\nUser: {user_id}\nLabels Detected:\n{labels_str}\n\nThis image was processed successfully."
                
            print(f"Publishing SNS Notification: {subject}")
            
            sns.publish(
                TopicArn = TOPIC_ARN,
                Subject = subject[:100],
                Message = message
            )
