"use server"
import prisma from "@/lib/db"
import { auth } from "@/lib/auth"
import { headers } from "next/headers"

import {createWebhook, getRepositories} from "@/module/github/lib/github"
import { inngest } from "@/inngest/client"

export const fetchUserRepositories = async(page= 1, perPage=10)=>{
const session= await auth.api.getSession({
    headers: await headers()    
})
if(!session?.user){
    throw new Error("User is not authenticated")
}
const githubRepos = await getRepositories( page, perPage);

const dbRepos = await prisma.repository.findMany({
    where:{
        userId: session.user.id
    }
})
const connectedRepoIds = new Set(dbRepos.map(repo=> repo.githubId));
return githubRepos.map((repo:any)=> ({
    ...repo,
    isConnected: connectedRepoIds.has(BigInt(repo.id))
}))
}
export async function connectRepository(owner: string, repo: string, githubId: number)  {
    const session = await auth.api.getSession({
        headers: await headers()
    })
    if(!session?.user){
        throw new Error("User is not authenticated")
    }
    //  todo:check if user can connect more repo
    const webhook= await createWebhook(owner, repo);
    if(webhook){
        await prisma.repository.create({
            data:{
                githubId: BigInt(githubId),
                name: repo,
                owner: owner,
                fullName: `${owner}/${repo}`,
                url: `https://github.com/${owner}/${repo}`,
                userId: session.user.id,
            }
        })
    }
    //  todo: increment repository count for usage tracking
    //  todo: trigger repositry indexing for rag(fire and forget)
    try{
        await inngest.send({
            name:"repository.connected",
            data:{
                owner,
                repo,
                userId: session.user.id,
    }
        })
    }
    catch(error){
        console.error("Error sending repository.connected event to inngest:", error)
    }
    // so now create a function "repository.connected"→ inside ingest fucntions→ index.ts
    return webhook
    
}  