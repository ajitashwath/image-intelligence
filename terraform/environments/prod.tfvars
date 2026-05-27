aws_region = "us-east-1"

environment = "prod"

project_name = "event-driven-image-intelligence"

monitoring_instance_type = "t3.xlarge"

github_org  = "YOUR_GITHUB_ORG"
github_repo = "event-driven-image-intelligence"

# ── Required: set before running `terraform apply` ──────────────────────────
#
# Create the key pair first (prod-specific key recommended):
#   aws ec2 create-key-pair --key-name image-intelligence-monitoring-prod \
#     --query 'KeyMaterial' --output text > monitoring-key-prod.pem
#   chmod 400 monitoring-key-prod.pem
monitoring_key_name = "REPLACE_ME_key_name"

# Get your current public IP:
#   curl -s https://checkip.amazonaws.com
# Then append /32, e.g. "203.0.113.10/32"
# WARNING: never commit a real IP to source control.
# Use terraform/environments/prod.tfvars.local (gitignored) for real values.
your_ip_cidr = "REPLACE_ME/32"
