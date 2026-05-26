variable "project_name" {
  description = "Project identifier used as a prefix in resource names and tags."
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev | staging | prod). Used in resource naming."
  type        = string
}

variable "vpc_cidr" {
  description = <<-EOT
    IPv4 CIDR block for the VPC.
    /16 provides 65,536 addresses, giving ample room for future subnet expansion.
  EOT
  type    = string
  default = "10.0.0.0/16"

  validation {
    condition     = can(cidrhost(var.vpc_cidr, 0))
    error_message = "vpc_cidr must be a valid CIDR block (e.g. 10.0.0.0/16)."
  }
}

variable "public_subnet_cidr" {
  description = <<-EOT
    IPv4 CIDR block for the public subnet that hosts the monitoring EC2 instance.
    Must be a subset of vpc_cidr. /24 provides 256 addresses (more than enough
    for a single monitoring server).
  EOT
  type    = string
  default = "10.0.1.0/24"

  validation {
    condition     = can(cidrhost(var.public_subnet_cidr, 0))
    error_message = "public_subnet_cidr must be a valid CIDR block (e.g. 10.0.1.0/24)."
  }
}

variable "availability_zone" {
  description = <<-EOT
    AWS Availability Zone where the public subnet is created.
    For a single-AZ monitoring server, us-east-1a provides a stable default.
    Change to match your preferred AZ for lower latency.
  EOT
  type    = string
  default = "us-east-1a"
}
