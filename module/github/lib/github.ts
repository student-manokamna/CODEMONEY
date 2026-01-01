import { Octokit } from "octokit";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";
import { de } from "date-fns/locale";

/**
 * Get GitHub access token of the currently logged-in user
 */
export const getGithubToken = async () => {
  // Get current session from auth
  const session = await auth.api.getSession({
    headers: await headers(),
  });


  // If user is not logged in
  if (!session?.user) {
    throw new Error("User is not authenticated");
  }

  // Find GitHub account linked with this user
  const account = await prisma.account.findFirst({
    where: {
      userId: session.user.id,
      providerId: "github",
    },
  });

  // If GitHub account is not linked
  if (!account?.accessToken) {
    throw new Error("GitHub account not linked");
  }

  // Return GitHub access token
  return account.accessToken;
};


/**
 * Fetch GitHub contribution calendar using GraphQL
 */
export const fetchGithubConstributions = async (
  username: string,
  token: string
) => {
  // Create Octokit instance with auth token
  const octokit = new Octokit({
    auth: token,
  });

  // GitHub GraphQL query (FULL & CORRECT)
  const query = `
    query ($username: String!) {
      user(login: $username) {
        contributionsCollection {
          contributionCalendar {
            totalContributions
            weeks {
              contributionDays {
                date
                contributionCount
                color
              }
            }
          }
        }
      }
    }
  `;

  try {
    // Call GitHub GraphQL API
    const response: any = await octokit.graphql(query, {
      username,
    });

    // Return only contribution calendar
    return response.user.contributionsCollection.contributionCalendar;
  } catch (error) {
    // Log real error for debugging
    console.error("GitHub contributions fetch error:", error);
    throw new Error("Failed to fetch contributions");
  }
};
export const getRepositories = async (page: number, perPage: number) => {
  const token = await getGithubToken();
  const octokit = new Octokit({ auth: token });
  const {data}=await octokit.rest.repos.listForAuthenticatedUser({
    sort:"updated",
    direction:"desc",
    per_page:perPage,   
    page:page
  });
  return data;
};

export const createWebhook = async (owner: string, repo: string) => {
  const token = await getGithubToken();
  const octokit = new Octokit({ auth: token });

  const webhookUrl = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/webhooks/github`;

  // 1️⃣ List existing webhooks
  const { data: hooks } = await octokit.rest.repos.listWebhooks({
    owner,
    repo,
  });

  // 2️⃣ Check if webhook already exists
  const existingHook = hooks.find(
    (hook) => hook.config?.url === webhookUrl
  );

  if (existingHook) {
    return existingHook;
  }

  // 3️⃣ Create webhook (ONLY HERE)
  const { data } = await octokit.rest.repos.createWebhook({
    owner,
    repo,
    config: {
      url: webhookUrl,       // ✅ REQUIRED
      content_type: "json",
    },
    events: ["push", "pull_request"],
    active: true,
  });

  return data;
};
export const deleteWebhook = async (owner: string, repo: string) => {
    const token = await getGithubToken();
    const octokit = new Octokit({ auth: token });
    const webhookUrl = `${process.env.NEXT_PUBLIC_APP_BASE_URL}/api/webhooks/github`;

    try {
        const { data: hooks } = await octokit.rest.repos.listWebhooks({
            owner,
            repo
        });

        const hookToDelete = hooks.find(hook => hook.config.url === webhookUrl);

        if (hookToDelete) {
            await octokit.rest.repos.deleteWebhook({
                owner,
                repo,
                hook_id: hookToDelete.id
            })

            return true
        }

    } catch (error) {
        console.error("Error deleting webhook:", error);
        return false;
    }

   
}

export const getRepoFileContents = async (
  token: string,
  owner: string,
  repo: string,
  path: string = ""
): Promise<{ path: string; content: string }[]>  => {
  const octokit = new Octokit({ auth: token });

  const { data } = await octokit.rest.repos.getContent({
    owner,
    repo,
    path
  });

  // if it is a FILE
  if (!Array.isArray(data)) {
    if(data.type === "file" && data.content){ 
    return [{
      path: data.path,
      content: Buffer.from(data.content, "base64").toString("utf-8")
    }];
  }

  return [];
}
let files: { path: string; content: string }[] = [];

  // if it is a DIRECTORY
  for (const item of data) {
    if (item.type === "file" && item.content) {
      const {data: fileData} = await octokit.rest.repos.getContent({
        owner,
        repo, 
        path: item.path
      });

      if (!Array.isArray(fileData) && fileData.type === "file" && fileData.content) {
        if(!item.path.match(/\.(png|jpg|jpeg|gif|svg|ico|pdf|zip|docx?|xlsx?|pptx?|mp3|mp4|mov|avi|wmv|flv|mkv)$/i)){
          files.push({
            path: item.path,
            content: Buffer.from(fileData.content, "base64").toString("utf-8")
          });
        }
      }
    }
    else if (item.type === "dir") {
      const subDirFiles = await getRepoFileContents(
        token,
        owner,
        repo,
        item.path
      );
      files = files.concat(subDirFiles);
    }
  }

  return files;
};

export async function getPullRequestDiff(token:string, owner:string, repo:string, prNumber:number){
  const octokit= new Octokit({ auth: token });
  const {data:pr}= await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber
  });
  
  const { data: diff } = await octokit.rest.pulls.get({
    owner,
    repo,
    pull_number: prNumber,
    mediaType: {
      format: "diff"
    }
  });
  return {
    diff: diff as unknown as string,
    title: pr.title,
    description: pr.body || ""
  }
}  
export async function postReviewComment(
  token:string,
  owner:string,
  repo:string,
  prNumber:number,
  review:string
)
{
const octokit = new Octokit({auth:token});

await octokit.rest.issues.createComment({
  owner,
  repo,
  issue_number:prNumber,
  body: `## 🤖 AI Code Review\n\n${review}\n\n---\n*Powered by CodeRabbit Clone*`,
})
}