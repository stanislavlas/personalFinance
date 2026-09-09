#!/bin/bash

echo "Starting LocalStack..."

export SERVICES=dynamodb
export DEFAULT_REGION=eu-central-1
export AWS_DEFAULT_REGION=eu-central-1
export DEBUG=1
export AWS_ACCESS_KEY_ID=test
export AWS_SECRET_ACCESS_KEY=test

# Persist LocalStack state to /data so it survives add-on restarts
export LOCALSTACK_VOLUME_DIR=/data/localstack
mkdir -p /data/localstack

# Start LocalStack using its own entrypoint in the background
/usr/local/bin/docker-entrypoint.sh &
LOCALSTACK_PID=$!

echo "Waiting for LocalStack to be ready..."

# Poll until the DynamoDB endpoint responds
until aws --endpoint-url=http://localhost:4566 \
          --region eu-central-1 \
          dynamodb list-tables \
          --output text > /dev/null 2>&1; do
    echo "LocalStack not ready yet, retrying in 3s..."
    sleep 3
done

echo "LocalStack is up. Checking if tables need to be created..."

TABLE_COUNT=$(aws --endpoint-url=http://localhost:4566 \
                  --region eu-central-1 \
                  dynamodb list-tables \
                  --query 'length(TableNames)' \
                  --output text 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" -lt 5 ]; then
    echo "Tables not found, running initialization..."
    /init-dynamodb.sh
    echo "DynamoDB tables initialized."
else
    echo "Tables already exist (count: $TABLE_COUNT), skipping init."
fi

echo "LocalStack ready."

# Keep container running
wait $LOCALSTACK_PID
