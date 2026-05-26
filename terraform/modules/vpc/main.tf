locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

resource "aws_vpc" "monitoring" {
  cidr_block = var.vpc_cidr

  enable_dns_hostnames = true

  enable_dns_support = true

  tags = {
    Name = "${local.name_prefix}-monitoring-vpc"
  }
}

resource "aws_internet_gateway" "monitoring" {
  vpc_id = aws_vpc.monitoring.id

  tags = {
    Name = "${local.name_prefix}-monitoring-igw"
  }
}

resource "aws_subnet" "public" {
  vpc_id            = aws_vpc.monitoring.id
  cidr_block        = var.public_subnet_cidr
  availability_zone = var.availability_zone

  map_public_ip_on_launch = false

  tags = {
    Name = "${local.name_prefix}-monitoring-public-subnet"
    Tier = "Public"
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.monitoring.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.monitoring.id
  }

  tags = {
    Name = "${local.name_prefix}-monitoring-public-rt"
  }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}
