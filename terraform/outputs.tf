output "monitoring_instance_public_ip" {
  description = "Public IPv4 address of the monitoring EC2 instance (ELK + Grafana + Jenkins)."
  value       = module.ec2.public_ip
}

output "monitoring_instance_id" {
  description = "EC2 instance ID of the monitoring server. Use for AWS Console, CLI, or SSM."
  value       = module.ec2.instance_id
}

output "monitoring_ssh_command" {
  description = <<-EOT
    Ready-to-use SSH command to connect to the monitoring instance.
    Ensure your private key is available locally (chmod 400 <key>.pem).
  EOT
  value = "ssh ubuntu@${module.ec2.public_ip}"
}

output "vpc_id" {
  description = "ID of the VPC created for the DevOps monitoring infrastructure."
  value       = module.vpc.vpc_id
}

output "public_subnet_id" {
  description = "ID of the public subnet where the monitoring EC2 instance is deployed."
  value       = module.vpc.public_subnet_id
}

output "vpc_cidr_block" {
  description = "CIDR block of the monitoring VPC."
  value       = module.vpc.vpc_cidr_block
}

output "github_actions_role_arn" {
  description = <<-EOT
    ARN of the IAM role that GitHub Actions workflows assume via OIDC.
    Add this value to your GitHub repository secret: AWS_ROLE_ARN
    or reference it directly in your workflow:
      role-to-assume: <this value>
  EOT
  value = module.iam.github_actions_role_arn
}

output "ec2_instance_profile_name" {
  description = "Name of the IAM instance profile attached to the monitoring EC2 instance."
  value       = module.iam.ec2_instance_profile_name
}

output "ec2_role_arn" {
  description = "ARN of the IAM role used by the monitoring EC2 instance."
  value       = module.iam.ec2_role_arn
}
