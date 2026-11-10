import { spawn } from "node:child_process";
import { mkdtemp, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";

const base = process.env.SMOKE_URL || "http://127.0.0.1:3000";
const debugPort = 9225;
const profile = await mkdtemp(join(tmpdir(), "gympro-e2e-"));
const browser = spawn("chromium", [
  "--headless=new", "--no-sandbox", "--disable-gpu", "--hide-scrollbars",
  `--remote-debugging-port=${debugPort}`, `--user-data-dir=${profile}`, "--window-size=1280,900", base,
], { stdio: "ignore" });

async function waitForJson(path, timeout = 10000) {
  const started = Date.now();
  while (Date.now() - started < timeout) {
    try {
      const response = await fetch(`http://127.0.0.1:${debugPort}${path}`);
      if (response.ok) return response.json();
    } catch {}
    await new Promise(resolve => setTimeout(resolve, 150));
  }
  throw new Error(`Timed out waiting for Chromium ${path}`);
}

let socket;
let nextId = 0;
const pending = new Map();
function cdp(method, params = {}) {
  return new Promise((resolve, reject) => {
    const id = ++nextId;
    pending.set(id, { resolve, reject });
    socket.send(JSON.stringify({ id, method, params }));
  });
}

try {
  const tabs = await waitForJson("/json/list");
  const tab = tabs.find(item => item.type === "page");
  if (!tab?.webSocketDebuggerUrl) throw new Error("Chromium page target was not created");
  socket = new WebSocket(tab.webSocketDebuggerUrl);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    const request = pending.get(message.id);
    if (!request) return;
    pending.delete(message.id);
    if (message.error) request.reject(new Error(message.error.message));
    else request.resolve(message.result);
  };
  await cdp("Runtime.enable");
  await new Promise(resolve => setTimeout(resolve, 700));
  const result = await cdp("Runtime.evaluate", { returnByValue: true, expression: `(() => {
    const root = document.querySelector('#root');
    const button = document.querySelector('.login-button');
    const shell = document.querySelector('.login-screen');
    return {
      title: document.title,
      hasAppRoot: Boolean(root),
      hasBrandCopy: document.body.innerText.includes('GYM PROGRESS PRO'),
      background: shell ? getComputedStyle(shell).backgroundColor : '',
      buttonBackground: button ? getComputedStyle(button).backgroundColor : '',
      stylesheetCount: document.styleSheets.length,
    };
  })()` });
  const details = result.result.value;
  if (!details.hasAppRoot || !details.hasBrandCopy) throw new Error(`App shell assertion failed: ${JSON.stringify(details)}`);
  if (details.background !== "rgb(29, 36, 33)" || details.buttonBackground !== "rgb(249, 115, 22)") {
    throw new Error(`Visible color assertion failed: ${JSON.stringify(details)}`);
  }
  if (!details.stylesheetCount) throw new Error("No stylesheet was attached to the page");
  console.log("✓ frontend shell and visible color assertions");
} finally {
  socket?.close();
  if (!browser.killed && browser.exitCode === null) {
    await new Promise(resolve => {
      const timer = setTimeout(resolve, 1500);
      browser.once("exit", () => { clearTimeout(timer); resolve(); });
      browser.kill("SIGTERM");
    });
  }
  await rm(profile, { recursive: true, force: true });
}
