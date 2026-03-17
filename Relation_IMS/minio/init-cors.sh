#!/bin/bash
set -e

echo "Waiting for MinIO to be ready..."
until mc alias set myminio http://minio:9000 $MINIO_ROOT_USER $MINIO_ROOT_PASSWORD 2>/dev/null; do
  echo "MinIO not ready yet, retrying in 3s..."
  sleep 3
done

echo "Creating bucket if not exists..."
mc mb myminio/product-images --ignore-existing

echo "Setting public read policy on bucket..."
mc anonymous set download myminio/product-images

echo "MinIO bucket configured successfully!"
