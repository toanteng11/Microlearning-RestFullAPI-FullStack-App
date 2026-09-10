# Phase 08 — Release Communications

## Communication controls

Communications state actual status and audience impact; no message may claim Production deployment, UAT pass or sign-off while corresponding evidence is `PENDING`.

| Communication | Audience | Timing | Owner | Status |
|---|---|---|---|---|
| UAT scope/persona briefing | solo personas and optional external participants | before G1/G3 | BA/QA | `PLANNED` |
| Go/No-Go outcome | stakeholders/team | after G5 | PO/TL | `PLANNED` |
| Maintenance/release notice | affected users/support | before G6 | PO/BA | `PLANNED` |
| Actual release note | users/stakeholders | after G6 smoke | PO/BA | `PLANNED` |
| Incident/rollback notice | affected users/team | immediately when needed | DevOps/PO | `PLANNED` |
| Hypercare closure | stakeholders/support | after G7 | TL/PO | `PLANNED` |

## Templates

### Release note

```text
Release ID/version: <PENDING>
Actual deployment UTC/environment: <PENDING>
Included behavior: <PENDING>
Known limitations/conditional items: <PENDING>
User action/downtime: <PENDING>
Support/escalation: <PENDING>
Evidence/decision link: <PENDING>
```

### No-Go/rollback notice

```text
Decision/incident ID: <PENDING>
Actual impact and time: <PENDING>
User action/workaround: <PENDING>
Current safe revision/status: <PENDING>
Next update owner/time: <PENDING>
```

Never include secrets, raw tokens, private data or unverified metrics.
