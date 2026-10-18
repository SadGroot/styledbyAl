# Styled by Al

A self-hosted dark couture portfolio with a genuine scroll-driven 3D exhibition, an accessible editorial archive, and a private Payload content studio. Next.js and Payload run together in one Node process; SQLite and media live outside releases.

## Local development

Requires Node 24 and npm.

```bash
npm ci
cp .env.example .env
# Set a random PAYLOAD_SECRET, OWNER_EMAIL, and a strong OWNER_PASSWORD in .env.
npm run db:migrate
npm run seed
npm run dev
```

Open http://localhost:3000. The owner editor is http://localhost:3000/studio. Seeding is idempotent; the owner account is created only when none exists. Public registration is disabled. Keep `.env` private and outside Git. The initial owner credentials for this deployment are in the ignored `OWNER-ACCESS.txt` file.

```bash
npm run typecheck
npm test
# With the app running:
npm run test:e2e
npm run build
python3 scripts/package-release.py
```

Do not run a production build while running browser checks against the development server: generated Next.js files can change underneath it. Test a finished standalone build when verifying deployment.

## Publishing and enquiries

1. Upload JPEG, PNG, or WebP photographs in **Media**, including meaningful alt text. Uploads are limited to 10 MB / 24 megapixels. The server creates thumbnail, gallery, and detail images, with constrained Sharp processing.
2. Create a **Project** with a unique lowercase slug, cover, category, and description. Order the gallery rows and add genuine creative credits. External video links support HTTPS Instagram, YouTube, and Vimeo URLs.
3. Save a draft and use Preview while logged in. Choose **Publish** to make it public immediately. The `featured` checkbox selects projects for the homepage, ordered by the numeric `order` field; at most six appear in 3D.
4. **Site settings** edits the introduction, biography, portrait, hero, and contact details. Replace the illustrative assets, then turn off **Show preview edition labels**. Uncheck each real project’s **Preview imagery** flag.
5. **Enquiries** stores validated submissions independently of email. Mark them New, Contacted, or Closed. The retry checkbox attempts notification again when the record is saved.

Only published projects and media referenced by public content are publicly readable. Removing the last published reference makes the media private. Referenced media cannot be deleted until removed from projects/settings. Visitor enquiry records and owner account operations require authentication. The public form uses a honeypot, bounded request size, same-origin checks, rate limiting, and an indexed unique submission key.

The studio displays media usage and available disk. The initial media budget is 2 GB, preserving room for two releases, a replacement backup, and at least 1 GB free disk. This is deliberately sized for the 10 GB VPS.

## VPS operation

Deployment files are in `deploy/`. Runtime paths:

- `/opt/styledbyal/releases/<release>`: immutable standalone builds; `current` and `previous` select releases.
- `/var/lib/styledbyal/styledbyal.db` and `/var/lib/styledbyal/media`: persistent content.
- `/etc/styledbyal/app.env`: private runtime settings, readable only by root and the application group.
- `/var/lib/styledbyal/preview-url`: current temporary Cloudflare URL.

The application runs as the `styledbyal` system user, bound to `127.0.0.1:3000`. No application or database port is publicly exposed. Node uses a 384 MB JavaScript heap; native image processing is limited separately. Builds run in the development workspace, not on the 1 GB VPS.

```bash
systemctl status styledbyal styledbyal-tunnel
journalctl -u styledbyal -n 80 --no-pager
cat /var/lib/styledbyal/preview-url
```

To deploy an update, build and package locally, extract it into a **new** release directory, and run:

```bash
bash /opt/styledbyal/ops/activate.sh /opt/styledbyal/releases/RELEASE_NAME
```

Activation changes the release link, restarts the app, checks `/api/health`, and restores the old release if startup fails. Keep only the current and previous release after verifying the new one. The app runs committed SQLite migrations on production startup. Make a backup before a schema change. Code rollback preserves content; reverting an incompatible schema also requires restoring its matching backup.

```bash
bash /opt/styledbyal/ops/rollback.sh
```

The supervised Quick Tunnel uses IPv4 HTTP/2 on this VPS and changes hostname when recreated. Lifecycle operations share a lock so backups, restores, deployments, and tunnel-origin restarts cannot overlap. Its launcher captures the new hostname, updates `SITE_URL` atomically, and restarts **only the app** to synchronize canonical URLs, CMS preview links, and trusted origins. Quick Tunnels are temporary review hosting, without an uptime guarantee. Restarting the app alone preserves the current tunnel URL.

## Backups and recovery

`styledbyal-backup.timer` runs around **02:30 Asia/Kolkata** daily. It briefly stops writes, makes a consistent SQLite backup and hard-linked media snapshot, restarts the app, then compresses the snapshot. A successful archive atomically replaces the previous archive; failure retains the last good one. It checks disk headroom first. Logs are in `journalctl -u styledbyal-backup`.

```bash
systemctl start styledbyal-backup.service
python3 /opt/styledbyal/ops/restore.py /var/lib/styledbyal/backups/latest.tar.gz --verify-only
# Restore both database and media only when intentionally reverting content:
python3 /opt/styledbyal/ops/restore.py /var/lib/styledbyal/backups/latest.tar.gz
```

Download a backup from your computer to keep a copy outside the VPS:

```bash
scp -P 20012 root@167.114.117.71:/var/lib/styledbyal/backups/latest.tar.gz ./styledbyal-backup.tar.gz
```

The archive contains private enquiry information and must be stored privately. Save runtime secrets separately; they are deliberately absent from code releases and content backups. Continuous off-server backup storage is not configured yet.

## Activate email and WhatsApp

Set `SMTP_HOST`, `SMTP_PORT`, `SMTP_FROM`, and any `SMTP_USER` / `SMTP_PASSWORD` in the server’s private environment file. Port 465 uses TLS; other SMTP ports use the transport’s STARTTLS support. Restart `styledbyal`. Enter a real **Private email for enquiry notifications** in Site settings. Add the public contact email and full international WhatsApp number there too.

Until configured, the form still stores enquiries, and contact links remain absent. Failed email delivery is recorded and can be retried from the studio. Password recovery also needs working email; the owner can change the password while logged in.

## Switch to the real domain

Create a named Cloudflare Tunnel with the domain in your Cloudflare account and route it to `http://127.0.0.1:3000`. Stop/disable the temporary tunnel service once the named tunnel works, set `SITE_URL=https://YOUR_DOMAIN` and `SITE_INDEXABLE=true`, and restart the application. The runtime proxy, metadata, canonical URLs, robots, and sitemap use these settings. Verify the public pages, studio login, uploads, and enquiry submission after switching. The studio, API, and draft previews always remain `noindex`.

## Preview photography

Photography is illustrative and is not attributed to the stylist. Sources are Unsplash images: `photo-1701519664307-a402295fc7c7` (Vladislav Nahorny), `photo-1640745691934-1403879c3ae6`, `photo-1539109136881-3be0616acf4b`, `photo-1595777457583-95e059d581b8`, `photo-1515886657613-9f3515b0c78f`, and `photo-1524504388940-b1c1722653e1`. Replace preview projects, biography copy, and portrait before the real-domain launch. Fonts are self-hosted Cormorant Garamond and Manrope, distributed under their included OFL licenses.

The requested `ibelick/ui-skills` skills were installed in the development environment. `DESIGN.md` records the agreed design direction.
