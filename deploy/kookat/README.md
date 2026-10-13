# kookat deployment — 2026-10-13

Prepared under `/home/monkey/apps/portfolio-agent/releases/20261013-stream`, with `current` pointing there. The user unit is installed at `/home/monkey/.config/systemd/user/portfolio-agent.service`; systemd verification passes. Node 24.14.1 already exists. Linger is enabled. The service has NOT been started or enabled.

The private runtime file is `/home/monkey/.config/portfolio-agent/runtime.env` (0600). Its signing secret was generated on the server without printing it. Provider/model, Redis and Turnstile credentials remain empty; budget is zero and activation is off. No secrets were copied from another application. Fill through a private server session; never put secrets in repository files or chat.

`agent.kookat.icu` resolved to the server on this inspection. Nginx template is staged at `/home/monkey/apps/portfolio-agent/setup/agent.nginx.conf`; it disables response buffering for SSE. Certbot is installed. Existing nginx sites have not been modified. Admin activation is a separate step:

```sh
sudo install -m 644 /home/monkey/apps/portfolio-agent/setup/agent.nginx.conf /etc/nginx/sites-available/portfolio-agent
sudo ln -s /etc/nginx/sites-available/portfolio-agent /etc/nginx/sites-enabled/portfolio-agent
sudo nginx -t && sudo systemctl reload nginx
sudo certbot --nginx -d agent.kookat.icu --redirect
```

If the enabled symlink already exists, inspect it rather than blindly replacing it. The upstream will be unavailable until runtime configuration is completed and the user service is started. HTTPS success alone does not prove the agent works. After the owner sets model and budget choices, complete service configuration, initialize the dedicated shared state once, run the preflight, activate the user service, and verify the public origin and actual browser challenge/model streaming. Frontend public settings remain disabled; GitHub Pages has not been republished.

After the owner's admin step, public HTTPS verification succeeded (certificate verification 0); `/health` returned 502 because the user service is deliberately inactive/disabled. The enabled nginx site contains the correct agent hostname, Certbot certificate path, TLS listener and `proxy_buffering off`. Runtime preflight still reports model/model key, Redis endpoint/token, Turnstile secret and nonzero budget missing. This is not a successful live-agent deployment yet.

## Bailian configuration

Owner selected Bailian and a maximum of 500 CNY/month. The confirmed public endpoint is `https://llm-wjdjxs6f0x41w996.cn-beijing.maas.aliyuncs.com/compatible-mode/v1`. The `20261013-bailian` release supports the endpoint, streaming usage-only chunks, and model switching through server configuration. Default evaluation model: `qwen-plus`, non-thinking. Provider compatibility and answer quality still require real-key tests.

Money reservations use integer micro-CNY and a Beijing-calendar month in shared persistent state. The price ceiling is bound to `AGENT_PRICED_MODEL`; changing `AGENT_MODEL` without reviewing price fails preflight. Reservations survive model switching and refund at the original reservation price. The upper bound is applied to both input and output tokens; discounts are not assumed. This is an application spending guard, not an account-wide vendor invoice guarantee. Other apps using the same account/key are outside this ledger.

At the October 13 review, the [official Beijing pricing table](https://help.aliyun.com/zh/model-studio/model-pricing) lists qwen-plus input at 0.8 CNY/million and non-thinking output at 2 CNY/million for input <=128K. We use a ceiling of 2 CNY/million for ALL counted tokens. The request bound is <48KB serialized input plus framing allowance and 1,024 output tokens; pricing must be rechecked if model, mode, region or bounds change. AGENT_MONTHLY_CNY=500; secondary daily token cap=1000000. Activation remains off.

Private key entry (requires interactive terminal, masks input, never accepts key as an argument):

```sh
ssh -t kookat 'python3 /home/monkey/apps/portfolio-agent/current/scripts/set-agent-key.py'
```

The helper preserves other configuration and writes the runtime file atomically with mode 0600. It does not start or activate the service. Redis and Turnstile configuration still remain prerequisites in this runtime.

## Single-server durable storage

`AGENT_STORE=sqlite` selects the Node 24 SQLite backend; `AGENT_SQLITE_PATH` must be an absolute path outside the checkout, with a 0700 parent directory and a 0600 regular file. Redis credentials are not required in this mode. This option is for processes on the same host and local disk, not network filesystems or multiple hosts. Transactions use BEGIN IMMEDIATE, WAL and synchronous=FULL. A missing or corrupt ledger fails closed. Create the empty private file explicitly and initialize once with AGENT_INITIALIZE=1; remove that flag for normal startup. Never recreate or restore an old ledger to recover service without reconciling provider usage, since that could lower recorded spending. Backups must include committed WAL state (use SQLite's backup mechanism or stop the service and checkpoint before copying). Conversation history is stored in this private ledger, subject to the existing session expiration; cleanup occurs on subsequent transactions.

Local restart, independent-connection, rollback and missing/corrupt-state tests cover this adapter. The remote current release is now `20261013-sqlite`. Its private SQLite ledger was initialized once and successfully reopened on Node 24.14.1. The earlier 3,907 smoke-test tokens were accounted at the conservative 2 CNY/million rate (0.007814 CNY). AGENT_INITIALIZE=0 and AGENT_ENABLED=0 remain set. Real Bailian streaming and a biography tool round-trip have now passed; Turnstile setup remains pending.

Turnstile secret entry (the public Site Key is configured separately in the frontend):

```sh
ssh -t kookat 'python3 /home/monkey/apps/portfolio-agent/current/scripts/set-agent-key.py turnstile'
```

The helper accepts only model/turnstile selectors, requires a terminal and masked input, and does not enable the service.

## Existing Turnstile widget integration

The owner supplied public site key `0x4AAAAAAFVve3G5FMItr1cO`. The frontend uses this existing widget; no replacement widget was created. Only `/v2/sessions` redeems a fresh token, with action `agent_session`, expected hostname `houx15.github.io`, strict success/freshness checks and replay protection. The widget is removed after each attempt and recreated on retry to obtain a new token. The public backend origin remains empty until activation checks pass.

Reviewed the owner's linked existing-widget flow at https://developers.cloudflare.com/turnstile/spin/prompt.md. Automatic credential recovery was not attempted: there is no approved Wrangler/account setup. The server-side hidden-input helper is prepared for the owner to enter the secret directly. Real widget success, token replay rejection through the deployed handler, and widget-domain metadata verification remain pending. Mock tests do not prove those live checks.

## Trusted visitor address (pending ingress rollout)

By default the backend uses its TCP peer for address limits; behind nginx this groups visitors under the loopback address. To enable separate limits without trusting visitor-controlled headers, add `proxy_set_header X-Portfolio-Client-IP $remote_addr;` inside this site's existing `/v2/` location. Preserve Certbot settings. Validate with `sudo nginx -t` and reload nginx. Only after checking that ingress overwrites the header, set `AGENT_TRUST_LOOPBACK_PROXY=1` in the private runtime and restart the service. The backend must remain bound to loopback; it rejects non-loopback peers and missing/invalid single IP values in this mode. Never use an appended X-Forwarded-For chain. IP-based limits are coarse: visitors sharing an address still share that limit; sessions and the global money cap remain separate guards.

Local tests cover spoofed/untrusted headers, equivalent IP formats, missing ingress metadata and separate issuance limits through actual HTTP requests. This option has not been enabled on kookat yet.
