# Root Cause

## Finding

The exact fail-closed frontend CI audit began reporting a new High vulnerability after the earlier brace-expansion repair was committed. The npm audit record combines two immutable advisories into one vulnerable package entry:

- npm advisory `1124007`, `CVE-2026-59879`, `GHSA-v56q-mh7h-f735`, High, affected 5.x `>=5.0.0-beta.1 <5.1.8`, first patched 5.x `5.1.8`.
- npm advisory `1124017`, `CVE-2026-59880`, `GHSA-xvcm-6775-5m9r`, High, affected 5.x `>=5.0.0-beta.1 <5.1.8`, first patched 5.x `5.1.8`.
- Both records were published on 2026-07-21 UTC and report `fixAvailable=true`.

## Vulnerable Path

The lockfile contains one deduplicated `immutable@5.1.6` node. The authorized and CI-relevant path is:

`sass-embedded@1.97.2 -> immutable@5.1.6`

`sass-embedded` is a direct frontend dev dependency, declares `immutable:^5.0.2`, and is used by Vite to compile the project's SCSS during production build. The immutable node is marked `dev=true`, so it is not shipped as application runtime code. No application source imports immutable directly. Practical exposure through ordinary business request data was not established, but the vulnerable library is reachable in the production-build toolchain and the required audit correctly blocks it.

## Security Invariant

Every immutable node in the deterministic frontend lockfile must be outside both advisory-affected ranges. For the current 5.x line this means `>=5.1.8`; older affected lines must also be rejected by the regression.

## Selected Repair

Normal npm resolution temporarily installed exact `immutable@5.1.8` package-lock-only and then removed the temporary direct declaration. The final package.json is unchanged. The existing `sass-embedded@1.97.2` range naturally resolves the one transitive node to the first safe 5.x release, without an override, parent upgrade, framework migration, workflow change, or unrelated dependency version movement.

## Regression Proof

The focused platform dependency regression was added before the lockfile repair and failed 4/5 on `immutable@5.1.6`. After normal resolution to `5.1.8`, the same suite passed 5/5. It asserts one auditable immutable node and rejects all releases below 4.3.9, 5.x releases below 5.1.8, and any unrecognized older major line.
