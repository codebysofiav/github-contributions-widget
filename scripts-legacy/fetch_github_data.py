import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen


ENV_PATH = Path(".env")
OUTPUT_PATH = Path("data.json")


def load_env_file():
    if not ENV_PATH.exists():
        return

    for raw_line in ENV_PATH.read_text(encoding="utf-8").splitlines():
        line = raw_line.strip()

        if not line or line.startswith("#") or "=" not in line:
            continue

        key, value = line.split("=", 1)
        key = key.strip()
        value = value.strip().strip('"').strip("'")

        if key and key not in os.environ:
            os.environ[key] = value


load_env_file()

LOGIN = os.getenv("GITHUB_LOGIN", "codebysofiv")
TOKEN = os.getenv("GITHUB_TOKEN")
DEBUG_DATE = os.getenv("GITHUB_DEBUG_DATE", "2026-03-22")


def subtract_three_months(date_value):
    month = date_value.month - 3
    year = date_value.year

    while month <= 0:
      month += 12
      year -= 1

    day = min(date_value.day, 28)
    return date_value.replace(year=year, month=month, day=day)


def to_github_datetime(date_value):
    return date_value.strftime("%Y-%m-%dT%H:%M:%SZ")


def build_query_payload():
    today = datetime.now(timezone.utc).replace(hour=0, minute=0, second=0, microsecond=0)
    from_date = subtract_three_months(today)

    query = """
    query($login: String!, $from: DateTime!, $to: DateTime!) {
      user(login: $login) {
        contributionsCollection(from: $from, to: $to) {
          contributionCalendar {
            weeks {
              contributionDays {
                date
                contributionCount
                contributionLevel
                weekday
              }
            }
          }
        }
      }
    }
    """

    payload = {
        "query": query,
        "variables": {
            "login": LOGIN,
            "from": to_github_datetime(from_date),
            "to": to_github_datetime(today),
        },
    }

    return payload


def graphql_request(payload):
    body = json.dumps(payload).encode("utf-8")

    request = Request(
        "https://api.github.com/graphql",
        data=body,
        headers={
            "Content-Type": "application/json",
            "Authorization": f"Bearer {TOKEN}",
        },
        method="POST",
    )

    try:
        with urlopen(request) as response:
            return json.loads(response.read().decode("utf-8"))
    except HTTPError as error:
        details = error.read().decode("utf-8", errors="replace")
        raise RuntimeError(f"GitHub respondio con {error.code}: {details}") from error
    except URLError as error:
        raise RuntimeError(f"No se pudo conectar con GitHub: {error.reason}") from error


def get_viewer_login():
    payload = {
        "query": """
        query {
          viewer {
            login
          }
        }
        """
    }

    result = graphql_request(payload)

    if result.get("errors"):
        raise RuntimeError(json.dumps(result["errors"], indent=2))

    viewer_login = result.get("data", {}).get("viewer", {}).get("login")

    if not viewer_login:
        raise RuntimeError("No se pudo obtener el usuario autenticado con el token.")

    return viewer_login


def fetch_contributions():
    if not TOKEN:
        print("Falta la variable de entorno GITHUB_TOKEN.", file=sys.stderr)
        print('Ejemplo en PowerShell:', file=sys.stderr)
        print('$env:GITHUB_TOKEN="tu_token"', file=sys.stderr)
        print('$env:GITHUB_LOGIN="codebysofiv"', file=sys.stderr)
        sys.exit(1)

    payload = build_query_payload()
    result = graphql_request(payload)
    queried_login = payload["variables"]["login"]

    if result.get("errors"):
        user_not_found = any(
            error.get("type") == "NOT_FOUND"
            and error.get("path") == ["user"]
            for error in result["errors"]
        )

        if user_not_found:
            viewer_login = get_viewer_login()
            print(
                f"No se encontro el login '{LOGIN}'. "
                f"Se usara el usuario autenticado: '{viewer_login}'."
            )
            payload["variables"]["login"] = viewer_login
            result = graphql_request(payload)
            queried_login = viewer_login

    if result.get("errors"):
        raise RuntimeError(json.dumps(result["errors"], indent=2))

    weeks = (
        result.get("data", {})
        .get("user", {})
        .get("contributionsCollection", {})
        .get("contributionCalendar", {})
        .get("weeks", [])
    )

    contributions = []

    for week in weeks:
        for day in week.get("contributionDays", []):
            contributions.append(
                {
                    "date": day["date"],
                    "count": day["contributionCount"],
                    "level": day["contributionLevel"],
                    "weekday": day["weekday"],
                }
            )

    debug_day = next((day for day in contributions if day["date"] == DEBUG_DATE), None)
    print(f"Usuario consultado: {queried_login}")
    if debug_day:
        print(f"GitHub devolvio para {DEBUG_DATE}: {debug_day}")
    else:
        print(f"No se encontro la fecha {DEBUG_DATE} en la respuesta.")

    return contributions


def main():
    contributions = fetch_contributions()
    payload = {"contributions": contributions}
    OUTPUT_PATH.write_text(json.dumps(payload, indent=2) + "\n", encoding="utf-8")
    print(f"Se guardaron {len(contributions)} dias en {OUTPUT_PATH.resolve()}")


if __name__ == "__main__":
    try:
        main()
    except Exception as error:
        print("No se pudieron descargar las contribuciones.", file=sys.stderr)
        print(str(error), file=sys.stderr)
        sys.exit(1)
