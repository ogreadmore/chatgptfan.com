# Maintenance operations

The owner transferred daily maintenance to the designated local computer on October 26, 2026. The editorial schedule is **01:00 America/New_York**. Keep the computer awake, online and the ChatGPT desktop app running; GitHub Pages deployment does not write the edition. If a run is missed, catch up on the current editorial date when available, without inventing retrospective editions. Do not assume the scheduler wakes a sleeping computer.

## Ownership and safe startup

1. Work in the actual publication checkout. Read git status, branch and origin. Preserve in-progress work. Fetch and fast-forward only when clean and non-divergent. Reread changed operating instructions after the fetch.
2. Run npm run maintenance:preflight. It checks the designated runner, machine binding, matching publishing destination when enabled, clean synchronized checkout, Node version, at least 1 GiB of disk headroom, and required article/art files. Disabling publishing allows local preparation on the designated runner; the publish check still fails closed. A public owner ID is an operational coordination marker, not a credential or a security boundary. Do not infer permission to enroll another host from the public ID.
3. The private enrollment is .maintenance/runner.json and is deliberately ignored by Git. A restored copy on a different computer fails the machine binding. Changing the active runner requires an explicit owner-authorized handoff. The npm prefeeds hook checks ownership even if an older daily prompt tries to refresh from a retired computer.
4. Perform the full daily editorial guide. Before publishing, fetch origin again and run npm run maintenance:preflight -- --publish; inspect the complete intended diff. Stop on remote advancement, unrelated commits or a mismatch. Normal non-force push protects against a last-second race. Confirm the workflow for the exact pushed SHA and the actual live content/images.

## Windows toolchain

Use PowerShell: ./scripts/run.ps1 verify, ./scripts/run.ps1 feeds, ./scripts/run.ps1 resources:review, ./scripts/run.ps1 build, or ./scripts/run.ps1 dev. The wrapper prefers the project’s ignored portable Node installation, temporarily adjusts only its own PATH and propagates failure codes. Standard npm commands remain valid when Node/npm are on PATH. Use ./scripts/run.ps1 feeds --dry-run for a feed-connectivity check that leaves the saved snapshot and its review date untouched.

The October 26 setup uses official Node v24.22.1 LTS (npm 11.19.1) under output/toolchain/node-v24.22.1-win-x64. Its official ZIP SHA-256 is d2046d28c2c3dcd211ac5145c0bf30e2047ef9dfb306693c8c6e2eccd8b95fa5. It was checked against https://nodejs.org/dist/v24.22.1/SHASUMS256.txt before extraction. To provision another approved Windows x64 installation, download the corresponding ZIP from that official release, verify the checksum, extract into output/toolchain and run npm ci with that directory on PATH. Do not copy old node_modules as a substitute for a locked install. The app’s bundled Node can be a fallback, but may not include npm.

No external model API key is required. Built-in image generation and web/browser tools provide editorial capabilities. Image generation failure uses the documented typography fallback. Browser failure is an unverified visual check, never a claimed pass. The publication remains static, so it has no production server credential. Git push credentials are held by the existing credential manager or connected GitHub account, never in this repository.

## Durable records and recovery

Git holds every published article, original illustration, approved purple reference, artwork hash review, feed/resource/social data, tests and operating guides. Chat attachment previews may point to another computer; repository originals are authoritative. A deterministic build regenerates responsive images and sharing cards.

Private records are docs/daily-runs/, docs/editorial-revisions/, docs/brief-image-*.md, local integration notes and .maintenance/. Keep them in the owner’s private backup, never the public repository. Preserve actual records; missing reviews must be labeled missing, never reconstructed as though performed. A handoff needs current private run logs, pending drafts, rejected-art reasons, image provenance and outstanding issues in addition to Git. Raw generated alternatives are useful historical evidence, but published originals and the reference are the operational image dependencies.

Before retiring an old runner: synchronize the latest public commit, archive its private records to the owner’s local handoff folder, confirm its scheduler is paused, test dependencies/feed access/build/browser/Git push from the new computer, then verify the new schedule. Do not shut down the old host or claim it is paused without evidence. If the old runner is inaccessible, record the private-record gap explicitly and retain the ownership guard.

Keep an ignored private handoff report in docs/daily-runs/. Record schedule ID, next due time, toolchain, tested capabilities, original commit, transfer gaps and retirement status. Do not publish hostnames, account details, internal paths or private research.
