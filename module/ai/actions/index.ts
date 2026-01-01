"use server"

import { inngest } from "@/inngest/client";
import prisma from "@/lib/db"
import { getPullRequestDiff } from "@/module/github/lib/github";
import { da } from "date-fns/locale";
import { success } from "zod";

export async function reviewPullRequest(owner: string, repo: string, prNumber: number) {
    try{
const repository = await prisma.repository.findFirst({
        where: {
            owner,
            name: repo
        },
        include: {  
            user: {
                include: {
                    accounts: { 
                        where: {
                            providerId: "github"
                        }
                    }
                }
            }
        }
    });
    if (!repository) {
        throw new Error("Repository not found");
    }
    const githubAccount = repository.user.accounts[0];
    if (!githubAccount || !githubAccount.accessToken) {
        throw new Error("GitHub account not linked");
    }
    // Now you have the access token, you can use it to authenticate GitHub API requests
    const accessToken = githubAccount.accessToken;
    const {title}= await getPullRequestDiff(accessToken, owner, repo, prNumber);
    //  define getPullRequestDiff in module/github/lib/github.ts
    //  Now you can use the access token to call GitHub API and get the PR diff
    //  Then you can use your AI module to review the PR based on the diff
    console.log(`Reviewing PR #${prNumber} in ${owner}/${repo} with title: ${title}`);
    //  Call your AI review function here

    await inngest.send({
        name: "pr.review.requested",
        data: {
            owner,
            repo,
            prNumber,
            userId: repository.userId,
    }
    });
    return {success:true, message:`Review requested for PR #${prNumber}`
};

    }

    catch(error){
      try{
  const repository = await prisma.repository.findFirst({
        where: {
            owner,
            name: repo
        },
    })
    if(repository){
  await prisma.review.create({
    data:{
      repositoryId:repository.id,
      prNumber,
      prTitle:"Failed to fetch PR",
      prUrl:`https://github.com/${owner}/${repo}/pull/${prNumber}`,
      review:`Error: ${error instanceof Error ? error.message : "Unknown Error"}`,
      status:"failed"
    }
  })
}

      } catch(dberror){
        console.error("Error sending pr.review.failed event to inngest:", dberror)
      }
        
    }

}