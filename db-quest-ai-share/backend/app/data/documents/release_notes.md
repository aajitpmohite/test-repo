# Release Notes — Q1 2026

## January
- API migration completed: all callers moved to the v2 payment submission API.
- Decision: the team approved deprecating the v1 API from March.

## February
- UBR (Unadjusted Business Requirement) restructuring impact analysis completed for the enrichment service.
- Added contract tests between the enrichment service and the reference data store.

## March
- Release automation added: deployments now run through the standard CI/CD pipeline with automated smoke tests.
- Decision: rollback is automated if post-deployment validation fails.

## April
- Incident in the overnight batch job fixed: a null routing code caused failed enrichment; a validation rule was added.
- New validation rules introduced for mandatory beneficiary fields.

## Notable changes this quarter
- Schema update to the reference data store (new routing fields).
- Deployment checklist revised to include automated smoke tests.
- New validation rules for beneficiary and routing data.

## Action items
- Action: decommission the legacy batch scheduler (owner: Data Engineering).
- Action: complete v1 API client migration reminders before the March deprecation.

## Risks
- Risk: teams still calling v1 will break at deprecation; mitigated by migration reminders.
