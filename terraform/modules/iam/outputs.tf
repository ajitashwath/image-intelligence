output "github_actions_role_arn" {
  description = <<-EOT
    ARN of the IAM role assumed by GitHub Actions workflows via OIDC.
    Add this to your GitHub repository secret as AWS_ROLE_ARN, or reference
    it directly in your workflow file:

      - uses: aws-actions/configure-aws-credentials@v4
        with:
          role-to-assume: <this value>
          aws-region: us-east-1
  EOT
  value = aws_iam_role.github_actions.arn
}

output "ec2_instance_profile_name" {
  description = <<-EOT
    Name of the IAM instance profile attached to the monitoring EC2 instance.
    The EC2 module references this output to associate the profile at launch time.
  EOT
  value = aws_iam_instance_profile.ec2_monitoring.name
}

output "ec2_role_arn" {
  description = "ARN of the IAM role used by the monitoring EC2 instance."
  value       = aws_iam_role.ec2_monitoring.arn
}

output "oidc_provider_arn" {
  description = "ARN of the GitHub Actions OIDC identity provider registered in IAM."
  value       = aws_iam_openid_connect_provider.github_actions.arn
}
