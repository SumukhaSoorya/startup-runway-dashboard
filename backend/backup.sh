#!/bin/bash

# --- DATABASE AUTOMATED SNAPSHOT UTILITY ---
# Define backup storage paths and dynamic timestamp parameters
BACKUP_DIR="./backups"
TIMESTAMP=$(date +"%Y-%m-%d_%H-%M-%S")
OUTPUT_FILE="$BACKUP_DIR/runway_pulse_snapshot_$TIMESTAMP.sql"

# Ensure the backup storage directory path exists
mkdir -p "$BACKUP_DIR"

# Source variables securely from your .env structure
if [ -f .env ]; then
    export $(cat .env | grep -v '#' | xargs)
fi

echo "🔋 Initializing relational database hot-export sequence..."

# Execute dump matrix targeting your specific database
mysqldump -h "${DB_HOST:-localhost}" \
          -u "${DB_USER:-root}" \
          -p"$DB_PASSWORD" \
          "${DB_NAME:-runway_pulse_db}" > "$OUTPUT_FILE"

# Verify transaction resolution status
if [ $? -eq 0 ]; then
    echo "💾 Database state committed successfully: $OUTPUT_FILE"
    
    # Optional Optimization: Purge historical backups older than 7 days to conserve local block storage
    find "$BACKUP_DIR" -type f -name "*.sql" -mtime +7 -delete
else
    echo "❌ System Error: Database export transaction failed to execute."
    exit 1
fi