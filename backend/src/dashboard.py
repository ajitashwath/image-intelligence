import os
import json
import boto3
from decimal import Decimal

dynamodb = boto3.resource('dynamodb')
TABLE_NAME = os.environ.get('TABLE_NAME')
table = dynamodb.Table(TABLE_NAME)

class DecimalEncoder(json.JSONEncoder):
    def default(self, obj):
        if isinstance(obj, Decimal):
            if obj % 1 == 0:
                return int(obj)
            return float(obj)
        return super(DecimalEncoder, self).default(obj)

def lambda_handler(event, context):
    query_params = event.get('queryStringParameters') or {}
    user_id = query_params.get('userId')
    
    if not user_id:
        return {
            'statusCode': 400,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': 'userId query parameter is required'})
        }
        
    try:
        response = table.query(
            IndexName = 'UserIndex',
            KeyConditionExpression = boto3.dynamodb.conditions.Key('userId').eq(user_id),
            ScanIndexForward = False,
            Limit = 50
        )
        
        return {
            'statusCode': 200,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'items': response.get('Items', [])}, cls=DecimalEncoder)
        }
    except Exception as e:
        print(f"Error querying dashboard data: {str(e)}")
        return {
            'statusCode': 500,
            'headers': {
                'Access-Control-Allow-Origin': '*',
                'Content-Type': 'application/json'
            },
            'body': json.dumps({'error': 'Internal Server Error'})
        }
