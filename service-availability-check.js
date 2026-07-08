/*
 * Stash response script for service availability checks.
 *
 * This script is called by the .stoverride http.script rules. It inspects the
 * real response returned through the current Stash route and posts a result.
 */

const BLOCKED_KEYWORDS = [
  "unsupported_country",
  "not available in your country",
  "not supported in your country",
  "services are not available",
  "sorry, you have been blocked",
  "gemini isn't currently supported",
  "gemini is not currently supported",
];

function parseArgument(argument) {
  return String(argument || "")
    .split("&")
    .filter(Boolean)
    .reduce((result, pair) => {
      const index = pair.indexOf("=");
      const key = index === -1 ? pair : pair.slice(0, index);
      const value = index === -1 ? "" : pair.slice(index + 1);
      result[decodeURIComponent(key)] = decodeURIComponent(value);
      return result;
    }, {});
}

function parseStatusList(value) {
  return String(value || "")
    .split(",")
    .map((item) => Number(item.trim()))
    .filter((item) => Number.isFinite(item));
}

function getStatus(response) {
  if (!response) return 0;
  return Number(response.status || response.statusCode || 0);
}

function findBlockedKeyword(body) {
  const text = String(body || "").toLowerCase();
  return BLOCKED_KEYWORDS.find((keyword) => text.includes(keyword));
}

function notify(title, subtitle, body) {
  if (typeof $notification !== "undefined" && $notification.post) {
    $notification.post(title, subtitle, body);
  }
}

const args = parseArgument(typeof $argument === "undefined" ? "" : $argument);
const service = args.service || "Service";
const okStatuses = parseStatusList(args.ok);
const reachableStatuses = parseStatusList(args.reachable);
const status = getStatus(typeof $response === "undefined" ? null : $response);
const body = typeof $response === "undefined" ? "" : $response.body || "";
const blockedKeyword = findBlockedKeyword(body);

let state = "WARN";
let detail = "unexpected response";

if (blockedKeyword) {
  state = "BLOCKED";
  detail = `matched keyword: ${blockedKeyword}`;
} else if (okStatuses.includes(status)) {
  state = "OK";
  detail = "available";
} else if (reachableStatuses.includes(status)) {
  state = "REACHABLE";
  detail = "service responded";
}

const message = `${service}: ${state}\nHTTP status: ${status}\n${detail}`;

console.log(message);
notify("Service Availability", service, `${state} | ${status} | ${detail}`);

$done({});
