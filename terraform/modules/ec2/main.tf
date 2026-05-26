locals {
  name_prefix = "${var.project_name}-${var.environment}"
}

resource "aws_security_group" "monitoring" {
  name        = "${local.name_prefix}-monitoring-sg"
  description = "Security group for the monitoring server (ELK, Grafana, Jenkins)"
  vpc_id      = var.vpc_id

  ingress {
    description = "SSH from operator IP only"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.your_ip_cidr]
  }

  ingress {
    description = "HTTP from anywhere (reverse proxy / health checks)"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS from anywhere"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Elasticsearch REST API — RESTRICT IN PRODUCTION"
    from_port   = 9200
    to_port     = 9200
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Kibana dashboard — RESTRICT IN PRODUCTION"
    from_port   = 5601
    to_port     = 5601
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Grafana dashboard — RESTRICT IN PRODUCTION"
    from_port   = 3000
    to_port     = 3000
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Jenkins CI/CD UI — RESTRICT IN PRODUCTION"
    from_port   = 8080
    to_port     = 8080
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "Logstash Beats input — RESTRICT IN PRODUCTION"
    from_port   = 5044
    to_port     = 5044
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  egress {
    description = "Allow all outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${local.name_prefix}-monitoring-sg"
  }

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_instance" "monitoring" {
  ami           = var.ami_id
  instance_type = var.instance_type

  subnet_id = var.subnet_id

  associate_public_ip_address = true

  key_name = var.key_name

  vpc_security_group_ids = [aws_security_group.monitoring.id]

  iam_instance_profile = var.iam_instance_profile != "" ? var.iam_instance_profile : null

  root_block_device {
    volume_type           = "gp3"
    volume_size           = 50
    iops                  = 3000
    throughput            = 125
    encrypted             = true
    delete_on_termination = true

    tags = {
      Name = "${local.name_prefix}-monitoring-root-vol"
    }
  }

  user_data = <<-EOF

    set -euo pipefail
    exec > >(tee /var/log/user-data.log | logger -t user-data) 2>&1

    echo "=== Starting bootstrap at $(date) ==="

    export DEBIAN_FRONTEND=noninteractive
    apt-get update -y
    apt-get upgrade -y

    apt-get install -y \
      apt-transport-https \
      ca-certificates \
      curl \
      gnupg \
      lsb-release \
      software-properties-common \
      unzip \
      jq \
      git \
      htop \
      net-tools

    echo "=== Installing Docker ==="
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] \
      https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | \
      tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -y
    apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

    usermod -aG docker ubuntu

    systemctl enable docker
    systemctl start docker

    echo "=== Installing Docker Compose ==="
    COMPOSE_VERSION=$(curl -s https://api.github.com/repos/docker/compose/releases/latest | jq -r .tag_name)
    curl -SL "https://github.com/docker/compose/releases/download/$${COMPOSE_VERSION}/docker-compose-linux-x86_64" \
      -o /usr/local/bin/docker-compose
    chmod +x /usr/local/bin/docker-compose
    ln -sf /usr/local/bin/docker-compose /usr/bin/docker-compose

    echo "=== Installing Python3 and AWS CLI ==="
    apt-get install -y python3 python3-pip python3-venv

    curl -fsSL "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o /tmp/awscliv2.zip
    unzip -q /tmp/awscliv2.zip -d /tmp/
    /tmp/aws/install
    rm -rf /tmp/awscliv2.zip /tmp/aws

    echo "=== Tuning kernel parameters for Elasticsearch ==="
    echo "vm.max_map_count=262144" >> /etc/sysctl.conf
    sysctl -w vm.max_map_count=262144

    cat >> /etc/security/limits.conf <<-LIMITS
    elasticsearch  soft  nofile  65536
    elasticsearch  hard  nofile  65536
    LIMITS

    mkdir -p /opt/monitoring/{elasticsearch,kibana,logstash,grafana,jenkins}
    chown -R ubuntu:ubuntu /opt/monitoring

    echo "=== Bootstrap complete at $(date) ==="
    echo "=== Instance is ready for Ansible provisioning ==="
  EOF

  metadata_options {
    http_endpoint               = "enabled"
    http_tokens                 = "required"
    http_put_response_hop_limit = 1
  }

  monitoring = true

  tags = {
    Name = "${local.name_prefix}-monitoring-server"
    Role = "monitoring"
  }

  lifecycle {
    ignore_changes = [user_data]
  }
}
