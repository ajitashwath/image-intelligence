variable "project_name" {
  description = "Project identifier used as a prefix in IAM resource names."
  type        = string
}

variable "environment" {
  description = "Deployment environment (dev | staging | prod). Used in IAM resource naming."
  type        = string
}

variable "github_org" {
  description = <<-EOT
    GitHub organisation or username that owns the repository.
    Used to construct the OIDC subject claim:
      repo:<github_org>/<github_repo>:ref:refs/heads/main
    Replace "YOUR_GITHUB_ORG" with the actual organisation name before deploying.
  EOT
  type = string
}

variable "github_repo" {
  description = <<-EOT
    GitHub repository name (without the org prefix).
    Combined with github_org to scope the OIDC trust policy to a specific repository.
  EOT
  type = string
}
