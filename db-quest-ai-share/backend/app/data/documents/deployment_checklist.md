# Production Deployment Checklist

This checklist must be completed for every production deployment of the Payments platform.

## Stages
1. Code freeze: confirm the release branch is frozen and no new changes are merged.
2. UAT sign-off: obtain User Acceptance Testing sign-off from the business.
3. Change approval: raise a change record and obtain approval from the Change Advisory Board.
4. Deployment: deploy through the standard CI/CD pipeline (no manual production changes).
5. Post-deployment validation: run automated smoke tests and health checks.
6. Rollback readiness: confirm automated rollback triggers if validation fails.

## Approvals required
- UAT sign-off from the business owner.
- Change approval before the deployment window.
- Release Manager (Marcus Weber) confirms the go/no-go decision.

## Controls
- No manual changes are permitted directly in production.
- All deployments must be traceable to an approved change record.
- Secrets must never be placed in code or configuration files; use the secrets manager.

## After deployment
- Confirm smoke tests passed and dashboards are green.
- Communicate completion to stakeholders.
- Record any issues for the post-deployment review.
