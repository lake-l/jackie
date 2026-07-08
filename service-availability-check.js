/*
 * Stash / Surge-compatible availability checker.
 *
 * Replace CHECKS or thresholds as needed. A 401/403 response can still mean
 * that the service is reachable, because some endpoints require login.
 */

const CONFIG = {
  timeoutMs: 12000,
  notifyOnlyOnFailure: false,
  checks: [
    {
      name: "YouTube",
      url: "https://www.youtube.com/generate_204",
      method: "GET",
      okStatuses: [204],
      reachableStatuses: [200, 204, 301, 302, 303, 307, 308],
      blockedKeywords: [
        "This page isn't available",
        "This video is unavailable",
        "Our services aren't available right now",
      ],
    },
    {
      name: "Gemini",
      url: "https://gemini.google.com/app",
      method: "GET",
      okStatuses: [200, 301, 302, 303, 307, 308],
      reachableStatuses: [200, 301, 302, 303, 307, 308, 401, 403],
      blockedKeywords: [
        "Gemini isn't currently supported",
        "Gemini is not currently supported",
        "not available in your country",
        "not supported in your country",
      ],
    },
    {
      name: "ChatGPT",
      url: "https://chatgpt.com/backend-api/accounts/check/v4-2023-04-27",
      method: "GET",
      okStatuses: [200, 401, 403],
      reachableStatuses: [200, 401, 403, 429],
      blockedKeywords: [
        "unsupported_country",
        "not available in your country",
        "OpenAI's services are not available",
        "Sorry, you have been blocked",
      ],
    },
  ],
};

function request(check) {
  return new Promise((resolve) => {
    const startedAt = Date.now();
    const options = {
      url: check.url,
      method: check.method || "GET",
      timeout: CONFIG.timeoutMs,
      headers: {
        "User-Agent":
          "Mozilla/5.0 (iPhone; CPU iPhone OS 17_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1",
        Accept: "text/html,application/json,text/plain,*/*",
      },
    };

    $httpClient[options.method.toLowerCase()](options, (error, response, body) => {
      const elapsedMs = Date.now() - startedAt;
      if (error) {
        resolve({
          name: check.name,
          state: "fail",
          status: "-",
          elapsedMs,
          detail: String(error),
        });
        return;
      }

      const status = response && response.status ? response.status : 0;
      const text = typeof body === "string" ? body : "";
      const blockedKeyword = (check.blockedKeywords || []).find((keyword) =>
        text.toLowerCase().includes(keyword.toLowerCase())
      );

      if (blockedKeyword) {
        resolve({
          name: check.name,
          state: "blocked",
          status,
          elapsedMs,
          detail: `matched "${blockedKeyword}"`,
        });
        return;
      }

      if ((check.okStatuses || []).includes(status)) {
        resolve({
          name: check.name,
          state: "ok",
          status,
          elapsedMs,
          detail: "available",
        });
        return;
      }

      if ((check.reachableStatuses || []).includes(status)) {
        resolve({
          name: check.name,
          state: "reachable",
          status,
          elapsedMs,
          detail: "service responded",
        });
        return;
      }

      resolve({
        name: check.name,
        state: "warn",
        status,
        elapsedMs,
        detail: "unexpected status",
      });
    });
  });
}

function symbol(state) {
  const icons = {
    ok: "OK",
    reachable: "REACHABLE",
    blocked: "BLOCKED",
    warn: "WARN",
    fail: "FAIL",
  };
  return icons[state] || "WARN";
}

async function main() {
  const results = await Promise.all(CONFIG.checks.map(request));
  const hasFailure = results.some((item) =>
    ["blocked", "warn", "fail"].includes(item.state)
  );

  const lines = results.map(
    (item) =>
      `${symbol(item.state)} ${item.name}: ${item.status}, ${item.elapsedMs}ms, ${item.detail}`
  );

  if (!CONFIG.notifyOnlyOnFailure || hasFailure) {
    const title = hasFailure
      ? "Service Availability: Attention needed"
      : "Service Availability: All reachable";
    $notification.post(title, "", lines.join("\n"));
  }

  console.log(lines.join("\n"));
  $done();
}

main().catch((error) => {
  $notification.post("Service Availability: Script error", "", String(error));
  console.log(String(error));
  $done();
});

