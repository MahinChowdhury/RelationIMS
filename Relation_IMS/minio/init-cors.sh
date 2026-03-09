#!/bin/bash
set -e

echo "Waiting for MinIO to start..."
sleep 5

echo "Configuring MinIO client..."
mc alias set myminio http://minio:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD

echo "Creating bucket if not exists..."
mc mb myminio/product-images --ignore-existing

echo "Setting CORS on bucket..."
mc admin bucket cors set myminio/product-images /cors.json || true

echo "Setting public read policy on bucket..."
mc anonymous set download myminio/product-images

echo "CORS and policy configured successfully!"
