#!/usr/bin/with-contenv bashio

bashio::log.info "Starting LocalStack..."

export SERVICES=dynamodb
export DEFAULT_REGION=eu-central-1
export AWS_DEFAULT_REGION=eu-central-1
export DEBUG=1

# Persist LocalStack state to /data so it survives add-on restarts
export LOCALSTACK_VOLUME_DIR=/data/localstack

mkdir -p /data/localstack

# Start LocalStack in the background
localstack start &
LOCALSTACK_PID=$!

bashio::log.info "Waiting for LocalStack to be ready..."

# Poll until the DynamoDB endpoint responds
until aws --endpoint-url=http://localhost:4566 \
          --region eu-central-1 \
          dynamodb list-tables \
          --output text > /dev/null 2>&1; do
    bashio::log.info "LocalStack not ready yet, retrying in 3s..."
    sleep 3
done

bashio::log.info "LocalStack is up. Checking if tables need to be created..."

TABLE_COUNT=$(aws --endpoint-url=http://localhost:4566 \
                  --region eu-central-1 \
                  dynamodb list-tables \
                  --query 'length(TableNames)' \
                  --output text 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" -lt 5 ]; then
    bashio::log.info "Tables not found, running initialization..."
    /init-dynamodb.sh
    bashio::log.info "DynamoDB tables initialized."
else
    bashio::log.info "Tables already exist (count: $TABLE_COUNT), skipping init."
fi

bashio::log.info "LocalStack ready."

# Keep LocalStack running
wait $LOCALSTACK_PID
