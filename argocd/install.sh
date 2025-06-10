#!/bin/bash

# Add ArgoCD Helm repository
helm repo add argo https://argoproj.github.io/argo-helm
helm repo update

# Create namespace
kubectl apply -f namespace.yaml

# Install ArgoCD
helm upgrade --install argocd argo/argo-cd \
  --namespace argocd \
  --create-namespace \
  --values values.yaml \
  --wait

# Wait for pods to be ready
kubectl wait --for=condition=ready pod -l app.kubernetes.io/name=argocd-server -n argocd --timeout=300s

echo "ArgoCD has been installed successfully!"
echo "You can access the UI using port-forward:"
echo "kubectl port-forward svc/argocd-server -n argocd 8080:443"
echo ""
echo "Default credentials:"
echo "Username: admin"
echo "Password: admin" 