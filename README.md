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
| `SMOKE_HOST`        | secret   | Host/SNI do gateway (ex.: `app.canary.lab`)                       |
| `STABLE_VERSION`    | variável | opcional: fallback se a versão servida não puder ser detectada    |
| `SMOKE_INSECURE`    | variável | `true` para aceitar o certificado self-signed do gateway          |
| `GH_TOKEN`          | secret   | GitOps; em `rollout-approval`, revisor de `canary-approval`       |

Os jobs `deploy-with-argocd` e `smoke-test` usam runners hospedados pelo GitHub. O Argo CD e o
endpoint de smoke test precisam estar acessíveis publicament.

## Modelos da pipeline canary (`gha-config.yml`)

| Chave                   | Uso                                                                |
| ----------------------- | ------------------------------------------------------------------ |
| `canary-pipeline-model` | `github-approval` (padrão), `rollout-approval` ou `rollout-link`   |
| `canary-wait-time`      | minutos de espera pela aprovação (o input `wait_time` sobrescreve) |
| `canary-status-url`     | URL base da UI usada no link do modelo `rollout-link`              |

- `github-approval`: o Rollout pausa com `pause: {}` e o Actions conta o tempo enquanto o environment
  `canary-approval` aguarda revisão. Sem aprovação o run é cancelado e o deploy é revertido.
- `rollout-approval`: o Rollout pausa com `pause: {duration: <canary-wait-time>m}` e o tempo restante é
  lido do Rollout. Aprovar `canary-approval` promove na hora, rejeitar reverte; ao fim da pausa o
  Rollout se promove e a aprovação pendente é concluída com o `GH_TOKEN`.
- `rollout-link`: mesma pausa, sem environment. Após a validação canary o run termina com um link
  (summary e annotation) para acompanhar o Rollout e promovê-lo ou abortá-lo. O link usa
  `canary-status-url`, pois valores de secrets aparecem como `***` em logs e summaries.

## Pendências antes do primeiro uso

- Substituir `OWNER` pelo usuário/organização (neste repositório e no GitOps).
- Fixar as actions por SHA conforme a política de segurança.
- A versão estável é, em ordem: o input `stable_version` do `workflow_dispatch`, a versão servida
  (`X-App-Version` em `SMOKE_URL`) antes do sync, ou a variável `STABLE_VERSION`.
