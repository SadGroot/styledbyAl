# Verification

Verified on 18 October 2026 against the production standalone application and the Ubuntu VPS.

## Application checks

- Production `npm run build` and TypeScript checks pass.
- Five Node tests cover enquiry validation, origin checks, rate limiting, disk reserves, and retryable email failure.
- Seven Playwright scenarios pass against the final public VPS release. They cover public pages at 1440, 390, and 320 px, the real WebGL exhibition, standard-gallery preference, reduced motion, unavailable WebGL, filtering, service preselection, enquiry persistence, duplicate prevention, notification retry/reset, owner uploads, authenticated preview, publishing, gallery ordering, unpublishing, and private data access.
- Owner login and the dashboard were checked through the public HTTPS tunnel. The authentication cookie is Secure and HttpOnly.
- Preview canonical URLs follow the generated tunnel hostname. A separate runtime check with a sample real domain confirmed the indexable robots, sitemap URL, canonical URL, and runtime indexing switch.
- Demonstration enquiries and temporary QA projects/media are removed by the tests.

## VPS checks

- Application and tunnel are supervised by systemd and enabled at boot; the application binds to loopback.
- Twenty public-page responses with four concurrent workers succeeded in 1.19 seconds in a local-to-server benchmark.
- During live browsing and upload checks, observed app memory peaked around 244 MiB; the tunnel used about 27 MiB. These are samples, not guarantees for arbitrary traffic or image workloads.
- Approximately 8.2 GB disk remains free after deployment and backup, with the current and previous releases retained.
- Consistent database/media backup, archive extraction, SQLite integrity verification, full restoration, service restart, release activation, and rollback were exercised successfully.
- The backup timer is enabled for approximately 02:30 IST daily. Backup, restoration, release activation, and tunnel-origin updates share a lifecycle lock.
- The tunnel uses IPv4 HTTP/2 because the VPS’s outbound IPv6 edge route failed. IPv4 connectivity checks succeeded for both Cloudflare regions.

## Remaining owner inputs and limits

- Genuine portfolio images, a portrait, final biography, contact details, and SMTP configuration remain intentionally deferred.
- Email notifications and password recovery need working SMTP. WhatsApp links appear after the owner supplies a number.
- Preview imagery is explicitly labelled. Indexing is disabled until the real-domain launch.
- Mobile checks use Chromium emulation and software WebGL; physical iOS/Android GPU performance has not been measured.
- Backups are local to the VPS. The README explains how to download an off-server copy; an automatic off-server destination has not been configured.
- Quick Tunnel addresses change on tunnel recreation and have no production uptime guarantee.
