# canary-demo (repositório da aplicação)

Aplicação Node.js mínima. Endpoints: `/`, `/version`, `/health/live`, `/health/ready`. A versão vem de `APP_VERSION` (fixada na imagem pelo build com o SHA curto) e aparece no corpo e no cabeçalho `X-App-Version`.

## Local

```bash
npm ci && npm run lint && npm test
docker build --build-arg APP_VERSION=1.0.0 -t canary-demo:local .
```

## Secrets e variáveis do GitHub Actions

| Nome                | Tipo     | Uso                                                               |
| ------------------- | -------- | ----------------------------------------------------------------- |
| `GITOPS_TOKEN`      | secret   | PAT/deploy key com escrita apenas em `canary-demo-gitops`         |
| `ARGOCD_SERVER`     | secret   | hostname do Argo CD, sem `https://` (ex.: `argo.diegovieira.app`) |
| `ARGOCD_AUTH_TOKEN` | secret   | token da role `ci` do AppProject (sem admin)                      |
| `SMOKE_URL`         | secret   | URL do Istio Ingress Gateway (ex.: `https://IP:NODEPORT/`)        |
| `STABLE_VERSION`    | variável | opcional: fallback se a versão servida não puder ser detectada    |

Os jobs `deploy-with-argocd` e `smoke-test` usam runners hospedados pelo GitHub. O Argo CD e o
endpoint de smoke test precisam estar acessíveis publicamente.

## Pendências antes do primeiro uso

- Substituir `OWNER` pelo usuário/organização (neste repositório e no GitOps).
- Fixar as actions por SHA conforme a política de segurança.
- A versão estável é, em ordem: o input `stable_version` do `workflow_dispatch`, a versão servida
  (`X-App-Version` em `SMOKE_URL`) antes do sync, ou a variável `STABLE_VERSION`.
