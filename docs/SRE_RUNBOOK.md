# FabZClean SRE Runbook

## Service objectives (SLOs)

| Metric | Target | Endpoint |
|--------|--------|----------|
| Availability | 99.5% | `GET /api/health/slo` |
| p95 API latency | < 1200ms | `GET /api/health/metrics` |
| Error rate | < 1% | `GET /api/health/slo` |

## Health endpoints

- **Liveness**: `GET /api/health/live` — process is running
- **Readiness**: `GET /api/health/ready` — database reachable
- **Metrics**: `GET /api/health/metrics` — performance + SLO snapshot

## Alert triggers

1. Readiness returns `503` for > 2 minutes
2. `serverError` count in SLO window exceeds 1% of traffic
3. p95 latency exceeds 1200ms for 5 consecutive minutes

## Incident response

1. Capture correlation ID from failing client response header `X-Correlation-Id`
2. Search server logs for the correlation ID
3. Check readiness and database health endpoints
4. If deploy-related, rollback to previous Render release

## Rollback procedure (Render)

1. Open Render dashboard → service `fabzclean-pos`
2. Deploys → select last known good deploy
3. Rollback
4. Verify `GET /api/health/ready` returns `ready`

## Safe release checklist

- [ ] `npm audit --omit=dev --audit-level=high` passes
- [ ] `npm run check` passes
- [ ] Wallet recharge/refund smoke test in staging
- [ ] Order list pagination smoke test
- [ ] Readiness probe green after deploy

## Graceful shutdown

The server handles `SIGTERM`/`SIGINT` with a 15s drain window before forced exit.
