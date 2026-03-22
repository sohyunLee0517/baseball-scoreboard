import { useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";

function parseRedirectionTarget(raw: string): string | null {
  let s = raw.trim();
  if (
    (s.startsWith("'") && s.endsWith("'")) ||
    (s.startsWith('"') && s.endsWith('"'))
  ) {
    s = s.slice(1, -1).trim();
  }
  try {
    s = decodeURIComponent(s);
  } catch {
    return null;
  }
  s = s.trim();
  if (!s) return null;
  if (/^https?:\/\//i.test(s) || s.startsWith("//")) return null;
  if (s.includes("..")) return null;

  const path = (s.startsWith("/") ? s : `/${s}`).replace(/\/+$/, "") || "/";

  if (
    /^\/games\/new$/.test(path) ||
    /^\/games\/[^/]+$/.test(path) ||
    /^\/players\/[^/]+$/.test(path)
  ) {
    return path;
  }
  return null;
}

/** 부모에서 scoreboard?redirectionUrl=players/… 형태로 진입 시 내부 라우트로 replace 이동 (히스토리에 쿼리 진입점 미남김) */
export function RedirectionUrlHandler() {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigate = useNavigate();

  useEffect(() => {
    const raw = searchParams.get("redirectionUrl");
    if (!raw) return;

    const next = new URLSearchParams(searchParams);
    next.delete("redirectionUrl");
    const rest = next.toString();
    const search = rest ? `?${rest}` : "";

    const target = parseRedirectionTarget(raw);
    if (!target) {
      setSearchParams(next, { replace: true });
      return;
    }

    navigate({ pathname: target, search }, { replace: true });
  }, [navigate, searchParams, setSearchParams]);

  return null;
}
