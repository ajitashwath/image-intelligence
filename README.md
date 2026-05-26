# Event-Driven Image Intelligence

A highly concurrent, resilient pipeline using AWS serverless services (S3, Lambda, Rekognition, SQS, DynamoDB, and SNS) to process and analyze images — with a full DevOps layer for provisioning, configuration, observability, and CI/CD.

## Architecture

1. **S3 Storage**: Users upload images to an S3 bucket (`image-intelligence-raw`).
2. **Lambda Orchestrator**: An S3 event triggers the orchestrator Lambda function, which parses the event and fans out tasks concurrently.
3. **Amazon Rekognition**: Detects labels, objects, text, and moderation flags, returning JSON confidence scores.
4. **SQS Queue**: Enqueues processing tasks with image metadata and wired DLQs for retries.
5. **DynamoDB**: Stores image metadata, labels, moderation flags, timestamps, S3 URIs, and confidence scores.
6. **SNS + SES Notification**: Fires an SNS topic to notify users of processing completion via email or webhook callbacks.

## Features

- **Event-Driven**: Fully asynchronous processing triggered by file uploads.
- **Highly Concurrent**: Parallel fan-out pattern for faster processing.
- **Resilient**: Configured Dead-Letter Queues (DLQ) and retries via SQS.
- **Intelligent**: Automated image labeling and content moderation.

---

## DevOps Stack

| Pillar | Tool | Location |
|--------|------|----------|
| Provisioning | Terraform | [`terraform/`](./terraform/) |
| Configuration Management | Ansible | [`ansible/`](./ansible/) |
| Log Management | Elastic Stack (ELK + Filebeat) | [`elastic/`](./elastic/) |
| CI/CD | GitHub Actions + Jenkins | [`.github/workflows/`](./.github/workflows/) · [`jenkins/`](./jenkins/) |
| Infrastructure Monitoring | Grafana + CloudWatch | [`grafana/`](./grafana/) |
| Containerization | Docker + Docker Compose | [`docker/`](./docker/) |

---

## 1. Terraform — Provisioning

Terraform manages **DevOps infrastructure only** (VPC, EC2 monitoring host, IAM/OIDC roles). Application resources (Lambda, S3, DynamoDB, etc.) are managed by AWS CDK.

### Prerequisites

```bash
# 1. Create the S3 state bucket
aws s3api create-bucket --bucket image-intelligence-tfstate --region us-east-1
aws s3api put-bucket-versioning --bucket image-intelligence-tfstate \
  --versioning-configuration Status=Enabled

# 2. Create DynamoDB lock table
aws dynamodb create-table \
  --table-name image-intelligence-tf-locks \
  --attribute-definitions AttributeName=LockID,AttributeType=S \
  --key-schema AttributeName=LockID,KeyType=HASH \
  --billing-mode PAY_PER_REQUEST --region us-east-1
```

### Usage

```bash
cd terraform/

# Edit environments/dev.tfvars — set monitoring_key_name and your_ip_cidr

terraform init
terraform plan -var-file="environments/dev.tfvars"
terraform apply -var-file="environments/dev.tfvars"

# Get the monitoring server IP
terraform output monitoring_ssh_command
```

### What it creates
- **VPC** (10.0.0.0/16) with public subnet, IGW, route tables
- **EC2** `t3.large` (Ubuntu 22.04) — the monitoring server for ELK + Grafana + Jenkins
- **IAM OIDC Provider** for GitHub Actions (keyless auth)
- **IAM Role** for GitHub Actions with CDK + deploy permissions
- **IAM Role** for EC2 with CloudWatch read access (for Grafana)

---

## 2. Ansible — Configuration Management

Ansible configures the monitoring EC2 — installs Docker, Elasticsearch, Logstash, Kibana, Grafana, and Jenkins.

### Prerequisites

```bash
pip install ansible ansible-lint
ansible-galaxy collection install community.docker community.general
```

### Usage

```bash
cd ansible/

# Set the EC2 IP (from Terraform output)
export MONITORING_HOST=$(cd ../terraform && terraform output -raw monitoring_instance_public_ip)

# Test connectivity
ansible monitoring -m ping

# Dry run
ansible-playbook playbooks/site.yml --check --diff

# Full deploy
ansible-playbook playbooks/site.yml

# Single role (e.g., just deploy Grafana)
ansible-playbook playbooks/monitoring.yml --tags grafana
```

### Role Execution Order
`common` → `docker` → `elasticsearch` → `logstash` → `kibana` → `grafana` → `jenkins`

> **Security**: Passwords in `group_vars/monitoring.yml` use `changeme_in_vault` placeholders. Use `ansible-vault encrypt_string` to encrypt secrets before committing.

---

## 3. Elastic Stack — Log Management

Ingests Lambda CloudWatch logs → **Filebeat** → **Logstash** → **Elasticsearch** → **Kibana**.

### Log Flow

```
Lambda CloudWatch Logs
        ↓
   Filebeat (container logs scraper)
        ↓ beats:5044
   Logstash (parse, tag, enrich)
        ↓
Elasticsearch (index: image-intelligence-YYYY.MM.dd)
        ↓
     Kibana (dashboard: Image Intelligence Pipeline)
```

### Kibana Dashboard

Import [`elastic/kibana/dashboards/image-pipeline.ndjson`](./elastic/kibana/dashboards/image-pipeline.ndjson) via **Kibana → Stack Management → Saved Objects → Import**.

Panels include: Lambda invocations over time, Moderation Blocked events count, Error rate by function.

---

## 4. Docker — Containerization

### Frontend Container

```bash
# Build
docker build \
  --build-arg VITE_API_URL=https://your-api-gateway-url \
  -t image-intelligence-frontend \
  docker/frontend/

# Run
docker run -p 80:80 image-intelligence-frontend
```

### Monitoring Stack (Local Docker Compose)

The fastest way to run the full observability stack locally:

```bash
cd docker/monitoring/

# Copy and configure environment
cp .env.example .env
# Edit .env: set ELASTIC_PASSWORD and GRAFANA_PASSWORD

# Start all services
docker compose up -d

# Check status
docker compose ps

# View logs
docker compose logs -f elasticsearch
```

| Service | URL | Default Credentials |
|---------|-----|---------------------|
| Elasticsearch | http://localhost:9200 | elastic / `$ELASTIC_PASSWORD` |
| Kibana | http://localhost:5601 | elastic / `$ELASTIC_PASSWORD` |
| Grafana | http://localhost:3000 | admin / `$GRAFANA_PASSWORD` |
| Logstash Beats | localhost:5044 | — |

> **Note**: On Linux hosts, run `sudo sysctl -w vm.max_map_count=262144` before starting Elasticsearch.

### Jenkins Container

```bash
docker build -t image-intelligence-jenkins docker/jenkins/
docker run -p 8080:8080 -v jenkins_home:/var/jenkins_home image-intelligence-jenkins
```

---

## 5. Grafana — Infrastructure Monitoring

Grafana reads **CloudWatch metrics** directly via the CloudWatch datasource (uses EC2 IAM role — no credentials needed).

### Dashboard: Image Intelligence Pipeline

The dashboard ([`grafana/dashboards/image-pipeline.json`](./grafana/dashboards/image-pipeline.json)) auto-provisions on startup and includes:

| Row | Panels |
|-----|--------|
| Lambda Functions | Total Invocations, Invocations by Function, Duration P95, Error Rate, Throttles |
| SQS Queues | TaskQueue Depth, DLQ Depth (alert ≥ 1), Messages Sent/Received |
| DynamoDB | Read/Write Capacity, Throttled Requests |
| API Gateway | 4xx/5xx Error Rate, Latency P99 |

### Manual Import

1. Open Grafana → **Dashboards → Import**
2. Upload `grafana/dashboards/image-pipeline.json`
3. Select **CloudWatch** as the datasource

---

## 6. CI/CD — GitHub Actions + Jenkins

### GitHub Actions

| Workflow | Trigger | What it does |
|----------|---------|--------------|
| [`ci.yml`](./.github/workflows/ci.yml) | PR / `feature/*` push | Lint, test, security scan (Trivy + Bandit), Terraform validate |
| [`cd-backend.yml`](./.github/workflows/cd-backend.yml) | Push to `main` (backend changes) | Terraform apply → CDK deploy |
| [`cd-frontend.yml`](./.github/workflows/cd-frontend.yml) | Push to `main` (frontend changes) | Vite build → S3 sync → CloudFront invalidation |

#### Required GitHub Secrets

| Secret | Description |
|--------|-------------|
| `AWS_ROLE_ARN` | ARN of the OIDC IAM role (from `terraform output github_actions_role_arn`) |
| `VITE_API_URL` | API Gateway URL from CDK deploy output |
| `FRONTEND_BUCKET_NAME` | S3 bucket for static site hosting |
| `CLOUDFRONT_DISTRIBUTION_ID` | (Optional) CloudFront distribution ID for cache invalidation |

### Jenkins Pipeline

The [`jenkins/Jenkinsfile`](./jenkins/Jenkinsfile) provides an 11-stage declarative pipeline:

```
Checkout → Install → Test (parallel) → Build (parallel) → Docker Build
  → Security Scan → Terraform Plan → Terraform Apply* → Deploy Backend
  → Deploy Frontend → Monitoring Stack
```

> `*` Terraform Apply to **prod** requires manual approval input in Jenkins UI with a 10-minute timeout.

#### Required Jenkins Credentials

| ID | Type | Description |
|----|------|-------------|
| `aws-access-key-id` | Secret text | AWS Access Key |
| `aws-secret-key` | Secret text | AWS Secret Key |
| `vite-api-url` | Secret text | API Gateway URL |
| `frontend-bucket` | Secret text | S3 bucket name |

---

## Application Setup

1. Make sure you have the AWS CDK CLI installed (`npm install -g aws-cdk`).
2. Navigate to the `backend` directory and run `npm install`.
3. Deploy the infrastructure using `cdk deploy`.
4. Navigate to the `frontend` directory, run `npm install` and start the UI using `npm run dev`.

---

## Repository Structure

```
event-driven-image-intelligence/
├── backend/               # AWS CDK stack (TypeScript) + Lambda functions (Python)
├── frontend/              # React + Vite frontend
├── stress_test/           # Python stress testing scripts
├── terraform/             # DevOps infra: EC2, VPC, IAM/OIDC
├── ansible/               # Configuration management: ELK, Grafana, Jenkins
├── docker/                # Dockerfiles + monitoring docker-compose
├── elastic/               # Logstash pipeline, Filebeat config, Kibana dashboard
├── grafana/               # Dashboard JSON + datasource provisioning
├── jenkins/               # Declarative Jenkinsfile
└── .github/workflows/     # GitHub Actions CI/CD workflows
```