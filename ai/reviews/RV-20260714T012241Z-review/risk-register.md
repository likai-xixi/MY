# Risk Register

| Risk | Impact | Mitigation | Owner |
| --- | --- | --- | --- |
| Sensitive detail remains aggregated | Permission bypass | Basic endpoint returns only customer; dedicated endpoints and UI permission mapping are tested | Backend/frontend |
| GET still mutates missing accounts | Audit and integrity violation | Remove initialization from read path; assert no insert in tests and DB acceptance | Backend/QA |
| Client invents a sample order or repeats it with a new key | Forged financial credit | Fail closed until an authoritative order adapter exists; authoritative snapshot replaces client identity/amount; unique order keys and zero-write tests | Backend/QA |
| Normal edit changes ownership | Audit bypass | Reject changed owner fields and remove owner columns from generic SQL | Backend |
| Invalid salesman assignment | Corrupt ownership snapshot | Require normal, undeleted user and assigned active controlled roleKey; display names do not grant eligibility | Backend |
| Concurrent owner transfers corrupt audit history | Misleading ownership audit | Lock customer row and require exactly one owner update before inserting the audit row | Backend/QA |
| Masterdata orphan references | Hidden parent with active child | Concrete reference counts before logical delete | Backend/QA |
| Stored notice content executes | Session compromise | Empty sandbox iframe, no raw notice `v-html`, malicious browser probe | Frontend/QA |
| Production profile regresses | Startup failure | Required-key checker plus packaged startup probe | Platform/governance |
| Unrelated review is reused | Unauthorized implementation | Active `impact.reviewId`, feature/scope matching, negative fixtures | Governance |
| Clean tree hides missing handoff files | False-green closeout | Record base revision and validate committed plus working changes | Governance |
| CI compiles but does not test | Regression reaches remote | Maven test reactor and integration job; reject skip-tests evidence | Governance/QA |
| Scope mixes business and governance | Rule-lock bypass | Five change records and separate commits, pushed together only after final review | Primary agent |
