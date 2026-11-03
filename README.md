# canary-demo (repositório da aplicação)

Aplicação Node.js mínima. Endpoints: `/`, `/version`, `/health/live`, `/health/ready`. A versão vem de `APP_VERSION` (fixada na imagem pelo build com o SHA curto) e aparece no corpo e no cabeçalho `X-App-Version`.

## Local

```bash
npm ci && npm run lint && npm test
docker build --build-arg APP_VERSION=1.0.0 -t canary-demo:local .
```

## Secrets e variáveis do GitHub Actions

| Nome                  | Tipo     | Uso                                                      |
| --------------------- | -------- | -------------------------------------------------------- |
| `GITOPS_TOKEN`        | secret   | PAT/deploy key com escrita apenas em `canary-demo-gitops` |
| `ARGOCD_SERVER`       | secret   | host:porta do Argo CD                                    |
| `ARGOCD_AUTH_TOKEN`   | secret   | token da role `ci` do AppProject (sem admin)             |
| `SMOKE_URL`           | secret   | URL do Istio Ingress Gateway (ex.: `https://IP:NODEPORT/`) |
| `STABLE_VERSION`      | variável | versão estável atual; atualizar após cada promoção       |

O job `smoke-test` usa um runner `self-hosted` com label `lab`, com acesso de rede ao cluster e à CLI `argocd`.
O job `deploy-with-argocd` roda em runner hospedado e exige que o Argo CD seja alcançável pela Internet;
para Argo CD privado, mova-o também para o runner `lab`.

## Pendências antes do primeiro uso

- Substituir `OWNER` pelo usuário/organização (neste repositório e no GitOps).
- Fixar as actions por SHA conforme a política de segurança.
- Garantir que `STABLE_VERSION` aponte para a versão realmente estável antes de cada deploy.
