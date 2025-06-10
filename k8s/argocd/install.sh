#!/bin/bash

# Exit on error
set -e

echo "Creating ArgoCD namespace..."
kubectl create namespace argocd

echo "Adding ArgoCD Helm repository..."
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update

echo "Installing ArgoCD..."
helm upgrade --install argocd argo/argo-cd \
  -f values.yaml \
  -n argocd \
  --create-namespace \
  --wait

echo "Waiting for ArgoCD server to be ready..."
kubectl wait --for=condition=available --timeout=300s deployment/argocd-server -n argocd

echo "Applying ArgoCD application..."
kubectl apply -f application.yaml

echo "Getting ArgoCD admin password..."
ARGOCD_PASSWORD=$(kubectl -n argocd get secret argocd-initial-admin-secret -o jsonpath="{.data.password}" | base64 -d)
echo "ArgoCD admin password: $ARGOCD_PASSWORD"

echo "Setting up port-forwarding for ArgoCD server..."
kubectl port-forward svc/argocd-server -n argocd 8080:443 &
PORT_FORWARD_PID=$!

echo "ArgoCD is now accessible at https://localhost:8080"
echo "Username: admin"
echo "Password: $ARGOCD_PASSWORD"
echo ""
echo "To stop port-forwarding, run: kill $PORT_FORWARD_PID" 