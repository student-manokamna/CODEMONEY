import { Octokit } from "octokit";
import { auth } from "@/lib/auth";
import prisma from "@/lib/db";
import { headers } from "next/headers";

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