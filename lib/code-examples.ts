import { ATHUB_API_URL } from "./api"
import type { Endpoint } from "./navigation"

export const languages = ["cURL", "JavaScript", "Python"] as const
export type Language = typeof languages[number]

export function requestCode(endpoint: Endpoint, body: string | null, language: Language) {
  const url = `${ATHUB_API_URL}${endpoint.path}`
  if (language === "cURL") return `curl --request ${endpoint.method} '${url}' \\\n  --header "Authorization: Bearer $API_TOKEN"${body ? ` \\\n  --header 'Content-Type: application/json' \\\n  --data '${body.replace(/'/g, "'\\''")}'` : ""}`
  if (language === "JavaScript") return `// 仅在服务端运行，勿向浏览器暴露服务密钥\nconst response = await fetch(\n  ${JSON.stringify(url)},\n  {\n    method: ${JSON.stringify(endpoint.method)},\n    headers: {\n      Authorization: \`Bearer \${process.env.API_TOKEN}\`${body ? ',\n      "Content-Type": "application/json"' : ""}\n    }${body ? `,\n    body: JSON.stringify(${body.split("\n").join("\n    ")})` : ""}\n  }\n);\n\nif (!response.ok) throw new Error(\n  \`HTTP \${response.status}: \${await response.text()}\`\n);${endpoint.status === "204" ? '\n// 204 无响应体，不调用 response.json()' : '\nconst data = await response.json();\nconsole.log(data);'}`
  return `import json\nimport os\nimport urllib.request\n\nrequest = urllib.request.Request(\n    ${JSON.stringify(url)},\n    method=${JSON.stringify(endpoint.method)},\n    headers={\n        "Authorization": f"Bearer {os.environ['API_TOKEN']}"${body ? ',\n        "Content-Type": "application/json"' : ""}\n    }${body ? `,\n    data=${JSON.stringify(body)}.encode("utf-8")` : ""}\n)\n\nwith urllib.request.urlopen(request) as response:\n    ${endpoint.status === "204" ? "print(response.status)  # 204: no response body" : 'data = json.load(response)\n    print(data)'}`
}

export function responseCode(endpoint: Endpoint, response: string | null) {
  return response && endpoint.responseIsList ? JSON.stringify([JSON.parse(response)], null, 2) : response
}
