# Part 09 - Build And Publish CD

## Goal

Tự động build/test/scan/push một Production image từ successful protected main commit và xuất exact digest
manifest.

## Parent PR

`P07-PR04 - Build Publish And Staging CD`

## Dependencies

- P07-PR01 image contract merged.
- Parts 04-05 registry/WIF ready.
- Existing main CI green.

## Work

1. create/reuse workflow trigger only after successful main CI;
2. checkout exact commit from trusted event;
3. configure scoped workflow permissions/WIF;
4. build Production image once;
5. run image route/non-root/shutdown/content checks;
6. pre-push scan local image;
7. push immutable tag and resolve digest;
8. scan/generate final SBOM against exact registry digest;
9. generate release manifest with checksums/URLs;
10. upload artifacts with retention;
11. expose trusted digest output to deploy workflow;
12. add concurrency/re-run behavior;
13. negative test untrusted PR/mutable tag path.

## Validation

- main CI failure cannot publish;
- exact commit/digest/manifest match;
- scan gate cannot be ignored;
- workflow has no long-lived cloud key;
- artifacts contain no secret.

## Evidence

`P07-EV-009`, `P07-EV-016`, successful build/publish workflow run.

## Stop Conditions

- PR code can push/deploy without trusted main gate;
- build uses Production secret;
- digest output derived from untrusted text;
- build and deploy rebuild different images.

## Definition Of Done

- AC-035..037 Pass;
- release manifest is consumable by Part 10.
