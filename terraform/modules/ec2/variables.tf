variable "project_name" {
  description = "Project identifier used as a prefix in resource names and tags."
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev | staging | prod). Used in resource naming."
  type        = string
}

variable "instance_type" {
  description = <<-EOT
    EC2 instance type for the monitoring server.
    Minimum recommended: t3.large (2 vCPU, 8 GB RAM) to run the full ELK stack,
    Grafana, and Jenkins simultaneously.
    For production workloads with high log volume, consider t3.xlarge or m5.xlarge.
  EOT
  type    = string
  default = "t3.large"
}

variable "ami_id" {
  description = <<-EOT
    AMI ID for the monitoring instance OS.
    Default: Ubuntu Server 22.04 LTS (HVM), SSD Volume Type — us-east-1.
    ami-0c7217cdde317cfec is the canonical Canonical Ubuntu 22.04 AMI for us-east-1.
    If deploying to a different region, replace with the region-specific AMI ID:
      aws ec2 describe-images --owners 099720109477 \
        --filters "Name=name,Values=ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*" \
        --query "sort_by(Images,&CreationDate)[-1].ImageId" --output text
  EOT
  type    = string
  default = "ami-0c7217cdde317cfec"
}

variable "subnet_id" {
  description = "ID of the public subnet (from the VPC module) where the instance will be launched."
  type        = string
}

variable "vpc_id" {
  description = "ID of the VPC (from the VPC module) used to scope the security group."
  type        = string
}

variable "key_name" {
  description = <<-EOT
    Name of an existing EC2 Key Pair to attach for SSH access.
    The corresponding private key (.pem) must be stored securely by the operator.
  EOT
  type = string
}

variable "your_ip_cidr" {
  description = <<-EOT
    Operator's public IP in CIDR notation (e.g. "203.0.113.10/32").
    SSH (port 22) is restricted to this CIDR only.
  EOT
  type = string
}

variable "iam_instance_profile" {
  description = <<-EOT
    Name of the IAM instance profile to attach to the monitoring EC2 instance.
    This grants the instance permissions to call AWS APIs (CloudWatch, DynamoDB)
    without storing static credentials on disk.
  EOT
  type    = string
  default = ""
}
