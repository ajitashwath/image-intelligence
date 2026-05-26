output "instance_id" {
  description = "EC2 instance ID of the monitoring server (e.g. i-0abc123def456789)."
  value       = aws_instance.monitoring.id
}

output "public_ip" {
  description = "Public IPv4 address of the monitoring server. Use for SSH and dashboard access."
  value       = aws_instance.monitoring.public_ip
}

output "private_ip" {
  description = "Private IPv4 address of the monitoring server within the VPC."
  value       = aws_instance.monitoring.private_ip
}

output "security_group_id" {
  description = "ID of the security group attached to the monitoring instance."
  value       = aws_security_group.monitoring.id
}

output "public_dns" {
  description = "Public DNS hostname of the monitoring instance (requires enable_dns_hostnames on VPC)."
  value       = aws_instance.monitoring.public_dns
}
