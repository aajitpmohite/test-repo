# Support & Incident Guide

This guide describes how the Payments Modernization team handles production support and incidents.

## Support model
- The team runs an on-call rota. The on-call engineer is the first responder for production issues.
- Incidents are tracked against an SLA (Service Level Agreement) for acknowledgement and resolution.
- Sev-1 and Sev-2 incidents require engaging the Incident Response Team (IRT).

## Common incidents
1. Failed enrichment due to missing or invalid routing codes. Resolution: check reference data and re-drive the payment.
2. Downstream settlement timeout. Resolution: confirm downstream health, allow automatic retry, escalate if persistent.
3. Batch job delay. Resolution: check the scheduler and upstream file delivery.
4. Duplicate payment suspicion. Resolution: rely on idempotency keys; never manually resubmit without checking.

## How to raise an incident
- Capture the payment reference, timestamp and error.
- Open an incident ticket and set the correct severity.
- For suspected security issues (for example phishing), report through the official security channel and engage the SOC.

## Escalation
- Production issues: Aisha Khan (Support Lead).
- Security incidents: Information Security Partner and the SOC / Incident Response Team.

## Post-incident
- Every Sev-1/Sev-2 incident requires a post-incident review with actions and owners.
