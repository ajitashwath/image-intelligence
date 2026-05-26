output "vpc_id" {
  description = "ID of the monitoring VPC. Passed to the EC2 module for security group creation."
  value       = aws_vpc.monitoring.id
}

output "public_subnet_id" {
  description = "ID of the public subnet where the monitoring EC2 instance will be launched."
  value       = aws_subnet.public.id
}

output "vpc_cidr_block" {
  description = "CIDR block of the monitoring VPC. Useful for security group rules in peer resources."
  value       = aws_vpc.monitoring.cidr_block
}

output "internet_gateway_id" {
  description = "ID of the Internet Gateway attached to the monitoring VPC."
  value       = aws_internet_gateway.monitoring.id
}

output "public_route_table_id" {
  description = "ID of the public route table associated with the monitoring subnet."
  value       = aws_route_table.public.id
}
