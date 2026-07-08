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
  const { error, response } = await request("GET", {
    url: "https://www.youtube.com/generate_204",
    timeout: 8000,
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });

  if (error) {
    done("Network Error");
    return;
  }

  const status = Number(response && (response.status || response.statusCode));
  if (status === 204) {
    done("Available", "#88A788");
    return;
  }

  if ([200, 301, 302, 303, 307, 308].includes(status)) {
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

