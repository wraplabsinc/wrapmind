# GCP Setup Commands for GitHub Actions + Cloud Run Deployment
# Run these on your local machine with gcloud CLI authenticated

# 1. Enable APIs
gcloud services enable cloudrun.googleapis.com cloudbuild.googleapis.com artifactregistry.googleapis.com --project=wrapmind

# 2. Create service account
gcloud iam service-accounts create github-actions-deployer --project=wrapmind

# 3. Grant roles to service account
gcloud projects add-iam-policy-binding wrapmind \
  --member="serviceAccount:github-actions-deployer@wrapmind.iam.gserviceaccount.com" \
  --role="roles/run.admin"

gcloud projects add-iam-policy-binding wrapmind \
  --member="serviceAccount:github-actions-deployer@wrapmind.iam.gserviceaccount.com" \
  --role="roles/cloudbuild.builds.editor"

gcloud projects add-iam-policy-binding wrapmind \
  --member="serviceAccount:github-actions-deployer@wrapmind.iam.gserviceaccount.com" \
  --role="roles/artifactregistry.admin"

# 4. Create Workload Identity Pool
gcloud iam workload-identity-pools create github-pool \
  --location="global" \
  --project=wrapmind

# 5. Create Workload Identity Provider
gcloud iam workload-identity-pools providers create-github github-provider \
  --location="global" \
  --workload-identity-pool=github-pool \
  --project=wrapmind \
  --repository=wraplabsinc/wrapos-data

# 6. Allow GitHub to impersonate the service account
gcloud iam service-accounts add-iam-policy-binding \
  github-actions-deployer@wrapmind.iam.gserviceaccount.com \
  --member="principalSet://iam.googleapis.com/projects/337169955487/locations/global/workloadIdentityPools/github-pool/attribute.repository/wraplabsinc/wrapos-data" \
  --role="roles/iam.workloadIdentityUser"

# 7. Get provider resource name (output is the GCP_WORKLOAD_IDENTITY_PROVIDER value)
gcloud iam workload-identity-pools providers describe github-provider \
  --location="global" \
  --workload-identity-pool=github-pool \
  --project=wrapmind \
  --format="value(name)"