#!/usr/bin/with-contenv bashio

bashio::log.info "Starting Personal Finance Backend..."

# Read JWT secret from HA add-on options
JWT_SECRET=$(bashio::config 'jwt_secret')
export JWT_SECRET

# LocalStack environment
export SERVICES=dynamodb
export DEFAULT_REGION=eu-central-1
export AWS_DEFAULT_REGION=eu-central-1
export AWS_ACCESS_KEY_ID=dummy
export AWS_SECRET_ACCESS_KEY=dummy
export LOCALSTACK_VOLUME_DIR=/data/localstack
mkdir -p /data/localstack

# Start LocalStack in the background
bashio::log.info "Starting LocalStack..."
python3 -m localstack.cli.main start &
LOCALSTACK_PID=$!

# Wait for LocalStack DynamoDB to be ready
bashio::log.info "Waiting for LocalStack to be ready..."
until aws --endpoint-url=http://localhost:4566 \
          --region eu-central-1 \
          dynamodb list-tables \
          --output text > /dev/null 2>&1; do
    bashio::log.info "LocalStack not ready yet, retrying in 3s..."
    sleep 3
done

# Create tables if they don't exist yet
TABLE_COUNT=$(aws --endpoint-url=http://localhost:4566 \
                  --region eu-central-1 \
                  dynamodb list-tables \
                  --query 'length(TableNames)' \
                  --output text 2>/dev/null || echo "0")

if [ "$TABLE_COUNT" -lt 5 ]; then
    bashio::log.info "Initializing DynamoDB tables..."
    /init-dynamodb.sh
    bashio::log.info "DynamoDB tables initialized."
else
    bashio::log.info "Tables already exist (count: $TABLE_COUNT), skipping init."
fi

bashio::log.info "Starting Spring Boot..."
exec java -jar /app/app.jar \
    --spring.config.location=/app/application.properties
