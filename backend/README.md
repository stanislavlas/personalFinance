# Run locally

## Create localstack

```
docker run --name localstack -d -p 4566:4566 localstack/localstack
```

## Users table
### Create
```
aws --endpoint-url=http://localhost:4566 dynamodb create-table --table-name users \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=email,AttributeType=S \
  --billing-mode PAY_PER_REQUEST --region us-west-2 \
  --global-secondary-indexes '[
    {
      "IndexName": "emailIndex",
      "KeySchema": [
        {
          "AttributeName": "email",
          "KeyType": "HASH"
        }
      ],
      "Projection": {
        "ProjectionType": "ALL"
      }
    }
  ]'
```
### Describe
```
aws --endpoint-url=http://localhost:4566 dynamodb describe-table --table-name users
```

### Scan
```
aws --endpoint-url=http://localhost:4566 dynamodb scan --table-name users
```

### Delete
```
aws --endpoint-url=http://localhost:4566 dynamodb delete-table --table-name users
```

### Get
```
aws --endpoint-url=http://localhost:4566 dynamodb get-item --table-name users --key '{"username": {"S": "test"}}'
```

## Transaction table
### Create
```
aws --endpoint-url=http://localhost:4566 dynamodb create-table --table-name transactions \
  --key-schema \
    AttributeName=userId,KeyType=HASH \
    AttributeName=dateOfTransaction,KeyType=SORT \
  --attribute-definitions \
    AttributeName=userId,AttributeType=S \
    AttributeName=dateOfTransaction,AttributeType=S \
  --billing-mode PAY_PER_REQUEST --region us-west-2
```

### Describe
```
aws --endpoint-url=http://localhost:4566 dynamodb describe-table --table-name transactions
```

### Scan
```
aws --endpoint-url=http://localhost:4566 dynamodb scan --table-name transactions
```

### Delete
```
aws --endpoint-url=http://localhost:4566 dynamodb delete-table --table-name transactions
```

### Get
```
aws --endpoint-url=http://localhost:4566 dynamodb get-item --table-name transactions --key '{"username": {"S": "test"}}'
```

### DynamoDB reference
https://docs.aws.amazon.com/cli/latest/reference/dynamodb/create-table.html