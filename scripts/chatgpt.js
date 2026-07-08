async function request(method, params) {
  return new Promise((resolve) => {
    const httpMethod = $httpClient[method.toLowerCase()];
    httpMethod(params, (error, response, data) => {
      resolve({ error, response, data });
    });
  });
}

function done(content, backgroundColor) {
  $done({ content, backgroundColor: backgroundColor || "" });
}

async function main() {
  const { error, response, data } = await request("GET", {
    url: "https://api.openai.com/compliance/cookie_requirements",
    timeout: 10000,
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (error) {
    done("Network Error");
    return;
  }

  const body = String(data || "").toLowerCase();
  if (body.includes("unsupported_country")) {
    done("Unsupported Country");
    return;
  }

  if (body.includes("been blocked")) {
    done("Blocked");
    return;
  }

  const status = Number(response && (response.status || response.statusCode));
  if ([200, 204].includes(status)) {
    done("Available", "#88A788");
    return;
  }

  if ([401, 403, 429].includes(status)) {
    done(`Reachable (${status})`, "#88A788");
    return;
  }

  done(`Status ${status || "Unknown"}`);
}

(async () => {
  main().catch(() => {
    $done({});
  });
})();

