// Octokit.js
// https://github.com/octokit/core.js#readme
import fs from "fs";
import { Octokit } from "octokit";
import OpenAI from "openai";
import path from "path";

const octokit = new Octokit({
  auth: "",
});

const openaiClient = new OpenAI({
  apiKey: "",
});

const fetchPullRequests = async () => {
  const commits = await octokit.paginate("GET /repos/{owner}/{repo}/commits", {
    owner: "VCNC",
    repo: "tada-server",
    headers: {
      "X-GitHub-Api-Version": "2022-11-28",
    },
    since: "2024-08-27T00:00:00Z",
    until: "2025-03-20T00:00:00Z",
    per_page: 100,
  });

  const pullRequestDetails = [];
  for (const commit of commits) {
    const pullRequests = await octokit.request(
      "GET /repos/VCNC/tada-server/commits/{commit_sha}/pulls",
      {
        owner: "VCNC",
        repo: "tada-server",
        headers: {
          "X-GitHub-Api-Version": "2022-11-28",
        },
        commit_sha: commit.sha,
      }
    );

    pullRequests.data.forEach((pr) => {
      pullRequestDetails.push({
        title: pr.title,
        body: pr.body,
        author: pr.user.login,
        date: pr.created_at,
      });
    });
  }
  fs.writeFileSync(
    "pull_requests.json",
    JSON.stringify(pullRequestDetails, null, 2)
  );
  console.log("Pull request details saved to pull_requests.json");
};

const groupByAuthorAndMonth = async () => {
  const pullRequests = JSON.parse(
    fs.readFileSync("pull_requests.json", "utf-8")
  );
  const groupedByAuthor = pullRequests.reduce((acc, pr) => {
    if (!acc[pr.author]) {
      acc[pr.author] = [];
    }
    acc[pr.author].push(pr);
    return acc;
  }, {});

  for (const author in groupedByAuthor) {
    const groupedByMonth = groupedByAuthor[author].reduce((acc, pr) => {
      const month = pr.date.substring(0, 7); // Extract YYYY-MM
      if (!acc[month]) {
        acc[month] = [];
      }
      acc[month].push(pr);
      return acc;
    }, {});

    for (const month in groupedByMonth) {
      const monthFileName = `pull_requests_${author}_${month}.json`;
      fs.writeFileSync(
        monthFileName,
        JSON.stringify(groupedByMonth[month], null, 2)
      );
      console.log(
        `Pull request details for ${author} in ${month} saved to ${monthFileName}`
      );
    }
  }
};

const summarizePullRequests = async (pullRequests) => {
  const messages = pullRequests.map((pr) => ({
    role: "user",
    content: `제목: ${pr.title}\n\n내용: ${pr.body}\n\n작성자: ${pr.author}\n\n날짜: ${pr.date}`,
  }));

  const completion = await openaiClient.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "GitHub PullRequest 에 대해 제목, 내용, 작성자 그리고 날짜를 줄테니 작성자가 해당 달에 어떤 일을 했는지 요약해줘. 요약할 때는 큰 카테고리 별로 먼저 묶어줘. 자세한 설명은 앞에 '-' 를 붙여서 써줘.",
      },
      {
        role: "system",
        content:
          "출력은 '## 1. 큰 카테고리\n - 세부 내용\n - 세부 내용2' 와 같이 써줘",
      },
      ...messages,
    ],
  });

  return completion.choices[0].message.content;
};

const summarizeFromFiles = async () => {
  const files = fs
    .readdirSync(".")
    .filter(
      (file) => file.startsWith("pull_requests_") && file.endsWith(".json")
    );

  for (const file of files) {
    const pullRequests = JSON.parse(fs.readFileSync(file, "utf-8"));
    const summary = await summarizePullRequests(pullRequests);
    const summaryFileName = `summary_${path.basename(file, ".json")}.txt`;
    fs.writeFileSync(summaryFileName, summary);
    console.log(`Summary saved to ${summaryFileName}`);
  }
};

const summarizeTotal = async () => {
  const summaryFiles = fs
    .readdirSync(".")
    .filter((file) => file.startsWith("summary_") && file.endsWith(".txt"));
  const summaries = summaryFiles
    .map((file) => fs.readFileSync(file, "utf-8"))
    .join("\n\n");

  const completion = await openaiClient.chat.completions.create({
    model: "gpt-4o",
    messages: [
      {
        role: "system",
        content:
          "다음은 여러 달의 GitHub PullRequest 요약입니다. 이 요약들을 바탕으로 전체 요약을 작성해 주세요. 큰 카테고리 별로 묶어주시고, 자세한 설명은 앞에 '-' 를 붙여서 써주세요.",
      },
      {
        role: "system",
        content:
          "출력은 '## 1. 큰 카테고리\n - 세부 내용\n - 세부 내용2' 와 같이 써주세요",
      },
      {
        role: "user",
        content: summaries,
      },
    ],
  });

  const totalSummary = completion.choices[0].message.content;
  fs.writeFileSync("total_summary.txt", totalSummary);
  console.log("Total summary saved to total_summary.txt");
};

const main = async () => {
  // await fetchPullRequests();
  // await groupByAuthorAndMonth();
  // await summarizeFromFiles();
  await summarizeTotal();
};

main().catch((error) => {
  console.error("Error:", error);
});
