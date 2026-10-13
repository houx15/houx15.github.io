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
