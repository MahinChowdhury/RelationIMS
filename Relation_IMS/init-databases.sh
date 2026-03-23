#!/bin/bash

echo "Creating multiple databases: RelationIMS, YoloIMS"

psql --username "$POSTGRES_USER" <<-EOSQL
    SELECT 'CREATE DATABASE "RelationIMS"' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'RelationIMS')\gexec
    SELECT 'CREATE DATABASE "YoloIMS"' WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = 'YoloIMS')\gexec
EOSQL

echo "Databases created successfully!"
