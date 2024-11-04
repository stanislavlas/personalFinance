# Run locally

## Create localstack

```
docker run --name localstack -d -p 4566:4566 localstack/localstack
```

### Create Users table
```
aws --endpoint-url=http://localhost:4566 dynamodb create-table --table-name users \
    --key-schema \
        AttributeName=id,KeyType=HASH \
 AttributeName=username,KeyType=HASH \
    --billing-mode PAY_PER_REQUEST --region us-west-2
```

### Create Transaction table
```
aws --endpoint-url=http://localhost:4566 dynamodb create-table --table-name transactions \
    --key-schema \
        AttributeName=id,KeyType=HASH \
    --attribute-definitions \
        AttributeName=id,AttributeType=S \
    --billing-mode PAY_PER_REQUEST --region us-west-2
```

### DynamoDB reference
https://docs.aws.amazon.com/cli/latest/reference/dynamodb/create-table.html