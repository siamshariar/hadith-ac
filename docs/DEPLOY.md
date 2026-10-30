# Deploying hadith-vn

hadith-vn is a Next.js 13.5 site (Pages Router) that reads everything from the hadith
endpoints of the Quran API. The same code serves every country. Each country is a
separate build, run by its own Node.js process behind nginx.

- The API has its own runbook: `quran-api/docs/HADITH_DEPLOY.md`
  (on the dev machine: `/home/siam-al-sahariar/workspace/dit/quran-api/docs/HADITH_DEPLOY.md`).
  Deploy the API first: the site builds and renders from it.
- Production API: `https://api.alquranarabia.com/api` (hadith under `/api/hadith`).

## 1. Requirements

- **Node.js 20 or 22 LTS** (20.19+ or 22.12+; the scripts in `scripts/` need these) and npm.
- About 1.5 GB of free memory while `next build` runs, and 150–250 MB per running site.
- nginx with a TLS certificate per domain (e.g. Let's Encrypt via certbot).
- Outbound HTTPS from the server to the API. Readers' browsers call the API directly
  too (search, paging, lists), so the API must be public and HTTPS. Its CORS policy
  allows any origin.

## 2. One build per country

Every `NEXT_PUBLIC_*` value (and `GOOGLE_ANALYTICS_ID`) is written into the build, in
server and browser code, when `next build` runs. Changing one means building again.
Setting it only at `npm start` has no effect.

| Variable | Required | Meaning |
|---|---|---|
| `NEXT_PUBLIC_COUNTRY_CODE` | yes | Key of `config/countries.json`: `vn`, `bd`, `usa`, `kh`, `fr`, `ph`, `jp`, `de`, `cn`, `pt`, `kr`, `dk`, `sa`, `pk`, `ru`, `iq`. |
| `NEXT_PUBLIC_SITE_URL` | yes | The site's public address at the root of its domain, e.g. `https://hadith.vn`. Used for canonical links, citations, share links, robots.txt and the sitemap. |
| `NEXT_PUBLIC_API_BASE_URL` | yes | The Quran API, e.g. `https://api.alquranarabia.com/api`. Must be HTTPS. |
| `NEXT_PUBLIC_SITE_NAME` | no | Site name in titles, the header and the web app manifest. Default: the country's `siteName`, else "Hadith". |
| `NEXT_PUBLIC_CONTACT_EMAIL` | no | The address readers write to. Default: the country's `contactEmail`. |
| `GOOGLE_ANALYTICS_ID` | no | GA4 measurement ID (`G-…`). Empty: no analytics. |
| `ALLOW_LOCAL_BUILD` | no | `1` lets a **local test build** use local or http addresses. Never set it for a build you deploy. |

The country decides:

- the default content language (the reader can pick another; the cookie `hadith_lang`
  and `?lang=` override it);
- the interface language, which is the same for every reader of that site;
- `<html lang>`, `og:locale`, and the default site name, logo and contact email.

The interface is the country's `ui` language when `lib/locales` has a catalog for it.
Today that is Vietnamese (vn), Bengali (bd) and English (usa). Every other country gets
the English interface. There is **no right-to-left interface yet**, so `sa` (ar), `pk`
(ur) and `iq` (ku) get the English, left-to-right interface even after a catalog is
added, until the layout supports RTL. Their content (Arabic, Urdu, Kurdish) is still
shown right to left, because each text block carries its own `dir`.
`npm run check:sites` prints which interface each country gets.

`next build` stops with an explanation, before compiling anything, when:

- `NEXT_PUBLIC_COUNTRY_CODE` is missing or not a key of `config/countries.json`, or that
  entry lacks `name`, `localization`, `language`, `ui` or `ogLocale`;
- `NEXT_PUBLIC_SITE_URL` is missing, not an absolute http(s) URL, has a path, or points
  at localhost, 127.0.0.1, 0.0.0.0 or ::1 (http works but triggers a warning);
- `NEXT_PUBLIC_API_BASE_URL` is missing, not https, or local;
- `GOOGLE_ANALYTICS_ID` contains anything other than letters, digits and dashes.

`ALLOW_LOCAL_BUILD=1` skips the two URL checks, and only those, for trying a production
build on your own machine:

```bash
NEXT_PUBLIC_COUNTRY_CODE=bd NEXT_PUBLIC_SITE_URL=http://127.0.0.1:3001 \
NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8090/api ALLOW_LOCAL_BUILD=1 npm run build
npm start -- -p 3001 -H 127.0.0.1
```

## 3. Build and run one site

The layout used below, for each country:

```
/srv/hadith/<country>/
  build.env             the build variables (section 2)
  releases/<timestamp>/ one checkout each, with its node_modules and .next
  current -> releases/<timestamp>
```

`/srv/hadith/vn/build.env`:

```bash
NEXT_PUBLIC_COUNTRY_CODE=vn
NEXT_PUBLIC_SITE_URL=https://hadith.vn
NEXT_PUBLIC_API_BASE_URL=https://api.alquranarabia.com/api
GOOGLE_ANALYTICS_ID=
```

`/srv/hadith/bd/build.env` (use the real Bangladesh domain):

```bash
NEXT_PUBLIC_COUNTRY_CODE=bd
NEXT_PUBLIC_SITE_URL=https://bd.hadith.example
NEXT_PUBLIC_API_BASE_URL=https://api.alquranarabia.com/api
NEXT_PUBLIC_SITE_NAME=Hadith
GOOGLE_ANALYTICS_ID=
```

Build a release, as the `hadith` user:

```bash
SITE=bd
REL=/srv/hadith/$SITE/releases/$(date +%Y%m%d-%H%M%S)
git clone --depth 1 --branch <release-tag-or-branch> <repository-url> "$REL"
cd "$REL"
npm ci                                   # exact versions from package-lock.json
set -a; . /srv/hadith/$SITE/build.env; set +a
npm run check:sites -- $SITE             # the country's table entry against the API it will use
npm run build                            # fails early on a wrong variable (section 2)
```

Try it before switching, on a free port (the live site keeps its own). `npm start` is
`next start`:

```bash
npm start -- -p 3199 -H 127.0.0.1 &      # then browse or curl http://127.0.0.1:3199/
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3199/
kill %1
```

Switch `current` and restart the service (section 4):

```bash
ln -sfn "$REL" /srv/hadith/$SITE/current.new && mv -T /srv/hadith/$SITE/current.new /srv/hadith/$SITE/current
sudo systemctl restart hadith@$SITE
```

`check:sites` reads the API from `API`, else from `NEXT_PUBLIC_API_BASE_URL`. It checks
that `/api/localizations` maps the country's localization to it, and that
`/api/hadith/home/localizations/{localization}` answers in the country's language.

## 4. Keep it running

Use one process per country, bound to 127.0.0.1. Only nginx is public.

### systemd (recommended)

`/etc/systemd/system/hadith@.service` (`%i` is the country):

```ini
[Unit]
Description=Hadith site (%i)
After=network-online.target
Wants=network-online.target

[Service]
User=hadith
Group=hadith
WorkingDirectory=/srv/hadith/%i/current
# PORT=3101 for vn, 3102 for bd ...
EnvironmentFile=/srv/hadith/%i/run.env
Environment=NODE_ENV=production NEXT_TELEMETRY_DISABLED=1
ExecStart=/usr/bin/node node_modules/next/dist/bin/next start -H 127.0.0.1 -p ${PORT}
Restart=always
RestartSec=5
NoNewPrivileges=true
PrivateTmp=true
ProtectSystem=strict
ProtectHome=true
ReadWritePaths=/srv/hadith/%i

[Install]
WantedBy=multi-user.target
```

```bash
echo PORT=3102 | sudo tee /srv/hadith/bd/run.env
sudo systemctl daemon-reload
sudo systemctl enable --now hadith@bd
journalctl -u hadith@bd -f               # the logs; API failures are logged as [hadith-api] ...
```

- `WorkingDirectory` follows the `current` link when the service starts, so a restart
  picks up the new release.
- `ExecStart` needs a system-wide Node.js (e.g. the NodeSource package in `/usr/bin`).
  A Node.js installed with nvm under a home directory is hidden by `ProtectHome`.

### PM2 (alternative)

`/srv/hadith/ecosystem.config.js`:

```js
module.exports = {
  apps: [
    { name: "hadith-vn", cwd: "/srv/hadith/vn/current", script: "/srv/hadith/vn/current/node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3101", env: { NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1" } },
    { name: "hadith-bd", cwd: "/srv/hadith/bd/current", script: "/srv/hadith/bd/current/node_modules/next/dist/bin/next",
      args: "start -H 127.0.0.1 -p 3102", env: { NODE_ENV: "production", NEXT_TELEMETRY_DISABLED: "1" } },
  ],
};
```

```bash
pm2 start /srv/hadith/ecosystem.config.js && pm2 save && pm2 startup   # then: pm2 restart hadith-bd
```

## 5. nginx

The same headers for every response, in `/etc/nginx/snippets/hadith-headers.conf`. Next.js
sends the last four itself, so nginx hides those copies to avoid duplicates. Keep
`includeSubDomains` off HSTS unless every subdomain is HTTPS.

```nginx
proxy_hide_header X-Content-Type-Options;
proxy_hide_header X-Frame-Options;
proxy_hide_header Referrer-Policy;
proxy_hide_header Permissions-Policy;
add_header Strict-Transport-Security "max-age=31536000" always;
add_header X-Content-Type-Options "nosniff" always;
add_header X-Frame-Options "SAMEORIGIN" always;
add_header Referrer-Policy "strict-origin-when-cross-origin" always;
add_header Permissions-Policy "camera=(), microphone=(), geolocation=()" always;
```

`/etc/nginx/sites-available/hadith-bd.conf` (one file per country: change the domain,
the port and the certificate paths):

```nginx
upstream hadith_bd {
    server 127.0.0.1:3102;
    keepalive 16;
}

server {
    listen 80;
    listen [::]:80;
    server_name bd.hadith.example;
    return 301 https://$host$request_uri;
}

server {
    # nginx 1.25.1+: "listen 443 ssl;" and "listen [::]:443 ssl;" plus "http2 on;"
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name bd.hadith.example;

    ssl_certificate     /etc/letsencrypt/live/bd.hadith.example/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/bd.hadith.example/privkey.pem;
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_session_cache shared:SSL:10m;

    include snippets/hadith-headers.conf;

    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_min_length 1024;
    gzip_types text/plain text/css application/javascript application/json application/xml
               application/manifest+json image/svg+xml;

    client_max_body_size 1m;             # the site takes no uploads

    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header Connection "";
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
    proxy_read_timeout 60s;

    # Next.js's image optimizer is off (images.unoptimized in next.config.js); refuse
    # the route anyway, as defense in depth against its known vulnerabilities.
    location ^~ /_next/image {
        deny all;
    }

    # Build assets have content hashes in their names: cache them for a year.
    location ^~ /_next/static/ {
        proxy_pass http://hadith_bd;
        proxy_hide_header Cache-Control;
        include snippets/hadith-headers.conf;   # add_header here replaces the server's
        add_header Cache-Control "public, max-age=31536000, immutable";
        access_log off;
    }

    location / {
        proxy_pass http://hadith_bd;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/hadith-bd.conf /etc/nginx/sites-enabled/
sudo nginx -t && sudo systemctl reload nginx
```

Without `always`, the year-long `Cache-Control` only applies to successful answers. A 404
for a file of an older build is therefore not cached.

This configuration was checked with nginx 1.24 in front of a bd production build:
- http redirects to https;
- every header above appears once, and `X-Powered-By` is gone;
- HTML and scripts are gzipped and served over HTTP/2;
- `/_next/image` answers 403;
- hashed assets carry the immutable header, and a missing asset's 404 does not.

## 6. Health check

```bash
# the Node process (no API call):
curl -fsS -o /dev/null -w '%{http_code}\n' http://127.0.0.1:3102/robots.txt
# the whole path: nginx, Node and the API (the home page renders from the API):
curl -fsS -o /dev/null -w '%{http_code} %{time_total}s\n' https://bd.hadith.example/
# the API alone:
curl -fsS -o /dev/null https://api.alquranarabia.com/api/hadith/languages
```

- When the API is down, pages answer **502** with an error message and a retry button.
- An exception in a page answers **500** with the site's error page.
- Unknown books, chapters, hadiths and categories answer **404**.
- `/sitemap.xml` answers **503** with `Retry-After` while the API is unreachable.

Point the uptime monitor at the home page (`200`) and the Node check at `robots.txt`.

## 7. Update and roll back

- **Update:** build a new release (section 3), check it on its port, switch `current`,
  then `systemctl restart hadith@<country>`. The old release stays on disk. Keep the
  last three and delete older ones:

  ```bash
  ls -1dt /srv/hadith/bd/releases/* | tail -n +4 | xargs -r rm -rf
  ```

- **Roll back:** point `current` at the previous release and restart. Nothing has to be
  rebuilt:

  ```bash
  PREV=$(ls -1dt /srv/hadith/bd/releases/* | sed -n 2p)
  ln -sfn "$PREV" /srv/hadith/bd/current.new && mv -T /srv/hadith/bd/current.new /srv/hadith/bd/current
  sudo systemctl restart hadith@bd
  ```

- Readers who have a page open during a switch may request a script of the old build
  that no longer exists. Next.js then reloads the page, so nothing breaks.
- Changing a variable (a new domain, another API, the analytics ID) is a new build.

## 8. Several countries on one server

Each country gets its own directory, build, port, service and nginx server block:

| Country | Domain (example) | Port | Directory | Service |
|---|---|---|---|---|
| vn | hadith.vn | 3101 | /srv/hadith/vn | hadith@vn |
| bd | bd.hadith.example | 3102 | /srv/hadith/bd | hadith@bd |
| usa | en.hadith.example | 3103 | /srv/hadith/usa | hadith@usa |

- Give each country its own domain or subdomain. The site must be at the root of its
  domain: it has no base path.
- Each domain also keeps its own reader cookies (preferred content language, settings).
- Build one country at a time on small servers (`next build` is memory hungry).
- The running sites share nothing and can be updated or rolled back one by one.

## 9. Before launch

Run these against a production build of the country (`ALLOW_LOCAL_BUILD=1` on a test
machine, or the staging domain). The browser tests need playwright-core and its
browsers; set `PLAYWRIGHT_CORE` to the installed package.

- [ ] `npm run check:sites -- <country>` against the production API: "matches the API".
- [ ] `npm run i18n:missing`: no gaps in any catalog.
- [ ] `PLAYWRIGHT_CORE=… npm run check:countries [-- <country> …]` on a checkout with the
      API reachable: it serves the site once per country (on port 3001, from a temporary
      worktree) and checks the interface language, og:locale, site name, book names,
      category titles and the translations shown against the API. "0 failed check(s)".
- [ ] The interface catalog has been reviewed by a native speaker. `lib/locales/bn.js`
      was drafted by an AI and needs this before the bd launch.
- [ ] End-to-end suite: `BASE=<vn site> BASE_BD=<bd site> PLAYWRIGHT_CORE=… npm run test:e2e`.
      All tests pass. The Vietnamese suite runs against a vn site; `scripts/e2e/country.js`
      runs against `BASE_BD`.
- [ ] Responsive audit of the main pages, Chromium at every viewport and WebKit at phone and
      tablet sizes: `BASE=<site> node scripts/responsive-audit/audit.js <out> --engine=chromium`,
      then `python3 scripts/responsive-audit/summarize.py <out>/results-chromium.json`.
      No horizontal overflow.
- [ ] `https://<domain>/robots.txt` names `https://<domain>/sitemap.xml`. The sitemap lists
      `https://<domain>/…` URLs. Submit it in Google Search Console.
- [ ] `curl -sI https://<domain>/` shows HSTS and the other headers, with no `X-Powered-By`.
      `/_next/image` answers 403, and an unknown URL answers 404 with the site's page.
- [ ] Titles end in the right site name. `og:locale` is the country's (e.g. `bn_BD`), and
      `<html lang>` is the interface language.
- [ ] The contact address (`NEXT_PUBLIC_CONTACT_EMAIL` or the country's `contactEmail`) is
      read by someone.
