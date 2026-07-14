# Plan

1. Persist the mixed pre-change dependency tree and bind this record to the exact one-file build-config scope.
2. Remove the direct Testcontainers version override so Spring Boot dependency management is the single version authority.
3. Prove every resolved Testcontainers artifact converges on 1.21.4 with no 1.21.3 residue.
4. Run Maven unit tests, both existing MySQL Testcontainers integration tests, admin reactor compile, scanners, Node tests, the complete repository gate, and exact-scope closeout.
5. Obtain independent technical, verification, and scope GO before committing; do not release or deploy.
