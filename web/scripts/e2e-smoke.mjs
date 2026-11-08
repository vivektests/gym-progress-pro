const base = process.env.SMOKE_URL || "http://127.0.0.1:3000";

async function assertResponse(path, predicate, label) {
  const response = await fetch(`${base}${path}`);
  const body = await response.text();
  if (!response.ok || !predicate(body, response)) {
    throw new Error(`${label} failed: ${response.status} ${body.slice(0, 180)}`);
  }
  console.log(`✓ ${label}`);
}

await assertResponse("/api/health", body => body.includes('"status":"ok"'), "health endpoint");
await assertResponse("/manus-routes.json", body => {
  const manifest = JSON.parse(body);
  return manifest.routes.some(route => route.path === "/workout/:id") && manifest.routes.some(route => route.path === "/history/:id");
}, "route manifest");
await assertResponse("/", body => body.includes('<div id="root"></div>') && body.includes("Gym Progress Pro"), "HTML application shell");
console.log("Gym Progress Pro runtime smoke passed.");
