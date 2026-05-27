#!/usr/bin/env bash
# terraform/bootstrap.sh
# ──────────────────────────────────────────────────────────────────────────────
# One-time bootstrap: creates the S3 state bucket and DynamoDB lock table that
# `terraform init` needs before it can run.
#
# Run this ONCE before any `terraform init` in a new AWS account:
#   chmod +x terraform/bootstrap.sh
#   ./terraform/bootstrap.sh
#
# This script is idempotent — safe to re-run if the resources already exist.
# ──────────────────────────────────────────────────────────────────────────────

set -euo pipefail

REGION="${AWS_DEFAULT_REGION:-us-east-1}"
STATE_BUCKET="image-intelligence-tfstate"
LOCK_TABLE="image-intelligence-tf-locks"

echo "=== Terraform State Bootstrap ==="
echo "Region       : ${REGION}"
echo "State bucket : ${STATE_BUCKET}"
echo "Lock table   : ${LOCK_TABLE}"
echo ""

# ── 1. S3 state bucket ─────────────────────────────────────────────────────
echo "[1/4] Creating S3 state bucket..."
aws s3api create-bucket \
  --bucket "${STATE_BUCKET}" \
  --region "${REGION}" \
  $([ "${REGION}" != "us-east-1" ] && echo "--create-bucket-configuration LocationConstraint=${REGION}") \
  2>/dev/null || echo "  → Bucket already exists, skipping."

echo "[2/4] Enabling versioning on state bucket..."
aws s3api put-bucket-versioning \
  --bucket "${STATE_BUCKET}" \
  --versioning-configuration Status=Enabled

echo "[3/4] Blocking public access on state bucket..."
aws s3api put-public-access-block \
  --bucket "${STATE_BUCKET}" \
  --public-access-block-configuration \
    "BlockPublicAcls=true,IgnorePublicAcls=true,BlockPublicPolicy=true,RestrictPublicBuckets=true"

# ── 2. DynamoDB lock table ─────────────────────────────────────────────────
echo "[4/4] Creating DynamoDB lock table..."
aws dynamodb create-table \
  --table-name "${LOCK_TABLE}" \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST \
  --region "${REGION}" \
  2>/dev/null || echo "  → Table already exists, skipping."

echo ""
echo "✅  Bootstrap complete!"
echo ""
echo "Next steps:"
echo "  1. Fill in terraform/environments/dev.tfvars (monitoring_key_name, your_ip_cidr)"
echo "  2. cd terraform/ && terraform init"
echo "  3. terraform plan -var-file=environments/dev.tfvars"
echo "  4. terraform apply -var-file=environments/dev.tfvars"
