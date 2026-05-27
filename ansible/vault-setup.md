# Ansible Vault Setup Guide

Secrets in `inventory/group_vars/monitoring.yml` must be encrypted with
**Ansible Vault** before you run any playbook. This guide walks through the
full setup.

---

## 1. Create a vault password file

```bash
# Generate a strong random password and store it locally
openssl rand -base64 32 > ansible/.vault-password
chmod 600 ansible/.vault-password
```

> [!CAUTION]
> `.vault-password` is gitignored — **never commit it**. Back it up securely
> (e.g., in AWS Secrets Manager or 1Password).

---

## 2. Encrypt each secret

Run the following for each variable that has a `REPLACE_WITH_OUTPUT_OF_...`
placeholder in `monitoring.yml`:

```bash
# From the repo root:
ansible-vault encrypt_string 'your_actual_password' \
  --name elastic_password \
  --vault-password-file ansible/.vault-password
```

Copy the **entire output block** (starting from `elastic_password: !vault |`)
and paste it into `inventory/group_vars/monitoring.yml`, replacing the
corresponding placeholder block.

Repeat for `grafana_admin_password` and `jenkins_admin_password`.

---

## 3. Verify the encrypted file parses correctly

```bash
ansible-vault view inventory/group_vars/monitoring.yml \
  --vault-password-file ansible/.vault-password
# Should print the decrypted YAML without errors
```

---

## 4. Run playbooks with vault decryption

```bash
# Option A — use the vault password file (recommended for local dev):
ansible-playbook playbooks/site.yml \
  --vault-password-file ansible/.vault-password

# Option B — interactive prompt (useful on a one-off basis):
ansible-playbook playbooks/site.yml --ask-vault-pass
```

---

## 5. CI/CD: store vault password as a secret

For **GitHub Actions**, add a secret named `ANSIBLE_VAULT_PASSWORD` and write it
to a temp file before running Ansible:

```yaml
- name: Write vault password file
  run: echo "${{ secrets.ANSIBLE_VAULT_PASSWORD }}" > /tmp/.vault-password

- name: Run Ansible playbook
  run: |
    ansible-playbook ansible/playbooks/site.yml \
      --vault-password-file /tmp/.vault-password
  env:
    MONITORING_HOST: ${{ steps.tf-output.outputs.monitoring_ip }}
```

For **Jenkins**, add a `Secret text` credential with ID `ansible-vault-password`
and inject it:

```groovy
withCredentials([string(credentialsId: 'ansible-vault-password', variable: 'VAULT_PASS')]) {
    sh '''
        echo "${VAULT_PASS}" > /tmp/.vault-password
        ansible-playbook ansible/playbooks/site.yml \
          --vault-password-file /tmp/.vault-password
        rm -f /tmp/.vault-password
    '''
}
```

---

## 6. Re-encrypting / changing a password

```bash
# Decrypt, edit, re-encrypt a single string:
ansible-vault encrypt_string 'new_password' \
  --name elastic_password \
  --vault-password-file ansible/.vault-password
```
