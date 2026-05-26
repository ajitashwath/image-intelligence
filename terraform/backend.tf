terraform {
  backend "s3" {
    bucket = "image-intelligence-tfstate"

    key = "devops/terraform.tfstate"

    region = "us-east-1"

    encrypt = true

    dynamodb_table = "image-intelligence-tf-locks"
  }

  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = var.project_name
      Environment = var.environment
      ManagedBy   = "Terraform"
    }
  }
}
