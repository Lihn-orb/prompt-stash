import { createServer } from "node:http";

const server = createServer(async (request, response) => {
  if (request.url === "/health") {
    response.writeHead(200).end("ok");
    return;
  }
  let body = "";
  for await (const chunk of request) body += chunk;
  const payload = JSON.parse(body);
  const content = payload.messages.at(-1).content;
  if (content.includes("HTTP_ERROR")) {
    response.writeHead(503).end("unavailable");
    return;
  }
  const metadata = {
    title: "Organized workflow",
    description: "A structured code review workflow.",
    category: content.includes("INVALID_CATEGORY") ? "Unknown" : "Coding",
    tags: ["review", "engineering"],
    type: "skill",
    ...(content.includes("REWRITTEN_CONTENT") ? { content: "Changed by AI" } : {}),
  };
  const reply = () => {
    response.writeHead(200, { "Content-Type": "application/json" }).end(
      JSON.stringify({
        choices: [
          {
            message: {
              content: content.includes("INVALID_JSON") ? "{not json" : JSON.stringify(metadata),
            },
          },
        ],
      }),
    );
  };
  if (content.includes("TIMEOUT")) {
    const timer = setTimeout(reply, 15_000);
    response.on("close", () => clearTimeout(timer));
  } else reply();
});

server.listen(3101, "127.0.0.1");
