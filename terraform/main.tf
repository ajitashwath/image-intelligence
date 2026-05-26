module "vpc" {
  source = "./modules/vpc"

  project_name = var.project_name
  environment  = var.environment

  vpc_cidr           = "10.0.0.0/16"
  public_subnet_cidr = "10.0.1.0/24"
  availability_zone  = "us-east-1a"
}

module "iam" {
  source = "./modules/iam"

  project_name = var.project_name
  environment  = var.environment

  github_org  = var.github_org
  github_repo = var.github_repo
}

module "ec2" {
  source = "./modules/ec2"

  project_name = var.project_name
  environment  = var.environment

  instance_type = var.monitoring_instance_type
  ami_id        = "ami-0c7217cdde317cfec"
  key_name      = var.monitoring_key_name

  subnet_id = module.vpc.public_subnet_id
  vpc_id    = module.vpc.vpc_id

  your_ip_cidr = var.your_ip_cidr

  iam_instance_profile = module.iam.ec2_instance_profile_name
}
