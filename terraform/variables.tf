variable "aws_region" {
  description = "AWS region where all DevOps infrastructure will be deployed."
  type        = string
  default     = "us-east-1"

  validation {
    condition     = can(regex("^[a-z]{2}-[a-z]+-[0-9]$", var.aws_region))
    error_message = "aws_region must be a valid AWS region identifier (e.g. us-east-1)."
  }
}

variable "environment" {
  description = "Deployment environment name. Used in resource naming and tagging."
  type        = string
  default     = "dev"

  validation {
    condition     = contains(["dev", "staging", "prod"], var.environment)
    error_message = "environment must be one of: dev, staging, prod."
  }
}

variable "project_name" {
  description = "Human-readable project identifier. Prefixed to most resource names."
  type        = string
  default     = "event-driven-image-intelligence"
}

variable "monitoring_instance_type" {
  description = <<-EOT
    EC2 instance type for the monitoring server.
    t3.large is the minimum recommended size to comfortably run the full
    ELK stack (Elasticsearch + Logstash + Kibana), Grafana, and Jenkins
    concurrently. Use t3.xlarge or larger in production.
  EOT
  type        = string
  default     = "t3.large"
}

variable "monitoring_key_name" {
  description = <<-EOT
    Name of an existing EC2 Key Pair to attach to the monitoring instance.
    This key pair must already exist in the target AWS account/region.
    Create one via: aws ec2 create-key-pair --key-name <name> --output text > <name>.pem
    Required — no default is provided to prevent accidental misconfiguration.
  EOT
  type        = string
}

variable "your_ip_cidr" {
  description = <<-EOT
    Your public IP address in CIDR notation (e.g. "203.0.113.10/32").
    Used to restrict SSH (port 22) access to the monitoring instance.
    Obtain your IP with: curl -s https://checkip.amazonaws.com
    Required — no default is provided to avoid accidentally opening SSH to 0.0.0.0/0.
  EOT
  type        = string
}

variable "github_org" {
  description = <<-EOT
    GitHub organisation (or username) that owns the repository.
    Used to scope the OIDC trust policy so only workflows in this org/repo
    can assume the GitHub Actions IAM role.
    Replace "YOUR_GITHUB_ORG" with your actual GitHub organisation name.
  EOT
  type    = string
  default = "YOUR_GITHUB_ORG"
}

variable "github_repo" {
  description = <<-EOT
    GitHub repository name (without the org prefix).
    Combined with github_org to form the full OIDC subject claim:
      repo:<github_org>/<github_repo>:ref:refs/heads/main
  EOT
  type    = string
  default = "event-driven-image-intelligence"
}
