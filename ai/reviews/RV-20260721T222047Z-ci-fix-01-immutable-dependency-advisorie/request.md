# Request

功能预审：CI-FIX-01 immutable dependency advisories remediation

Approve or reject a narrowly scoped follow-up dependency-security repair for the newly published immutable High advisories discovered by the exact pre-push CI audit. The proposed implementation is a normal npm lockfile resolution from immutable 5.1.6 to the smallest compatible safe 5.x release, with focused regression coverage and no push.
