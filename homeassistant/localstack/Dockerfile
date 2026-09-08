ARG BUILD_FROM
FROM $BUILD_FROM

# Install Python, pip, AWS CLI, and LocalStack
RUN apk add --no-cache python3 py3-pip aws-cli \
    && pip3 install --break-system-packages localstack

# Copy entrypoint and init script
COPY run.sh /run.sh
COPY init-dynamodb.sh /init-dynamodb.sh
RUN chmod +x /run.sh /init-dynamodb.sh

CMD ["/run.sh"]
