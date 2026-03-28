import { writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const login = process.env.GITHUB_LOGIN || "codebysofiv";
const token = process.env.GITHUB_TOKEN;
const outputPath = resolve("data.json");

if (!token) {
  console.error("Falta la variable de entorno GITHUB_TOKEN.");
  console.error("Ejemplo en PowerShell:");
  console.error('$env:GITHUB_TOKEN="tu_token"');
  console.error('$env:GITHUB_LOGIN="codebysofiv"');
  process.exit(1);
}

const today = new Date();
today.setHours(0, 0, 0, 0);

const fromDate = new Date(today);
fromDate.setMonth(fromDate.getMonth() - 3);
fromDate.setHours(0, 0, 0, 0);

const query = `
  query($login: String!, $from: DateTime!, $to: DateTime!) {
    user(login: $login) {
      contributionsCollection(from: $from, to: $to) {
        contributionCalendar {
          totalContributions
          weeks {
            contributionDays {
              date
              contributionCount
            }
          }
        }
      }
    }
  }
`;

async function fetchContributions() {
  const response = await fetch("https://api.github.com/graphql", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`
    },
    body: JSON.stringify({
      query,
      variables: {
        login,
        from: fromDate.toISOString(),
        to: today.toISOString()
      }
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`GitHub respondio con ${response.status}: ${errorText}`);
  }

  const result = await response.json();

  if (result.errors) {
    throw new Error(JSON.stringify(result.errors, null, 2));
  }

  const weeks =
    result.data?.user?.contributionsCollection?.contributionCalendar?.weeks ?? [];

  const contributions = weeks
    .flatMap((week) => week.contributionDays)
    .map((day) => ({
      date: day.date,
      count: day.contributionCount
    }));

  return contributions;
}

async function main() {
  const contributions = await fetchContributions();
  const payload = {
    contributions
  };

  await writeFile(outputPath, `${JSON.stringify(payload, null, 2)}\n`, "utf8");

  console.log(`Se guardaron ${contributions.length} dias en ${outputPath}`);
}

main().catch((error) => {
  console.error("No se pudieron descargar las contribuciones.");
  console.error(error.message);
  process.exit(1);
});
