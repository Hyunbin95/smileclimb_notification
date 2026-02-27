// netlify/functions/update-config.js
export async function handler(event, context) {
  try {
    // 1) Identity 인증 확인 (Authorization: Bearer <token>로 오면 context.user가 잡힘)
    const user = context.clientContext && context.clientContext.user;
    if (!user) {
      return { statusCode: 401, body: "Unauthorized (login required)" };
    }

    // (선택) 이메일 화이트리스트
    const allowed = (process.env.ALLOWED_EMAILS || "").split(",").map(s => s.trim()).filter(Boolean);
    const email = user.email;
    if (allowed.length > 0 && !allowed.includes(email)) {
      return { statusCode: 403, body: "Forbidden (not allowed)" };
    }

    // 2) 입력 파싱
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const body = JSON.parse(event.body || "{}");
    const newConfig = body.config;
    const commitMessage = body.message || `Update config.json by ${email}`;

    if (!newConfig || typeof newConfig !== "object") {
      return { statusCode: 400, body: "Bad Request: config must be an object" };
    }

    // 3) GitHub 커밋 준비
    const token = process.env.GITHUB_TOKEN;
    const repo = process.env.GITHUB_REPO;
    if (!token || !repo) {
      return { statusCode: 500, body: "Server misconfigured: missing GITHUB_TOKEN or GITHUB_REPO" };
    }

    const owner = repo.split("/")[0];
    const repoName = repo.split("/")[1];
    const path = "config.json";
    const apiBase = "https://api.github.com";

    // 4) 현재 파일 sha 조회 (업데이트하려면 필요)
    const getRes = await fetch(`${apiBase}/repos/${owner}/${repoName}/contents/${path}`, {
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github+json",
        "User-Agent": "smileclimb-netlify-function"
      }
    });

    if (!getRes.ok) {
      const txt = await getRes.text();
      return { statusCode: 500, body: `Failed to read config.json: ${getRes.status} ${txt}` };
    }

    const current = await getRes.json();
    const sha = current.sha;

    // 5) 새 내용 인코딩 (pretty JSON)
    const contentStr = JSON.stringify(newConfig, null, 2) + "\n";
    const contentB64 = Buffer.from(contentStr, "utf8").toString("base64");

    // 6) PUT으로 업데이트 커밋
    const putRes = await fetch(`${apiBase}/repos/${owner}/${repoName}/contents/${path}`, {
      method: "PUT",
      headers: {
        "Authorization": `Bearer ${token}`,
        "Accept": "application/vnd.github+json",
        "Content-Type": "application/json",
        "User-Agent": "smileclimb-netlify-function"
      },
      body: JSON.stringify({
        message: commitMessage,
        content: contentB64,
        sha
      })
    });

    const putTxt = await putRes.text();
    if (!putRes.ok) {
      return { statusCode: 500, body: `Failed to update config.json: ${putRes.status} ${putTxt}` };
    }

    return { statusCode: 200, body: putTxt };
  } catch (e) {
    return { statusCode: 500, body: `Error: ${e?.message || e}` };
  }
}
