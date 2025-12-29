"use server"
import {auth} from "@/lib/auth"; // path to your auth file
import {headers} from "next/headers";
import prisma from "@/lib/db";
import { revalidatePath } from "next/cache";
import { success } from "zod";
import { deleteWebhook } from "@/module/github/lib/github";

export async function getUserProfile(){
    try{
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if(!session?.user){
            throw new Error("User is not authenticated");
        }
        const user = await prisma.user.findUnique({
            where:{
                id: session.user.id
            },
            select:{    
                id:true,
                name:true,
                email:true,
                image:true,
                createdAt:true,
            }
        });
        return user;

    }catch(error){
        console.error("Error fetching user profile:", error);
        return null;
    }
}

export async function updateUserProfile(name?:string, email?:string){
    try{
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if(!session?.user){
            throw new Error("User is not authenticated");
        }
        const updatedUser = await prisma.user.update({
            where:{
                id: session.user.id
            },
            data:{
                name: name,
                email: email
            },
            select:{
                id:true,
                name:true,
                email:true,
               
            }
        });
        // revalidate settings page to reflect updated profile
        revalidatePath("/dashboard/settings","page");
        return {
            success:true,
            user: updatedUser
        };

    }catch(error){
        console.error("Error updating user profile:", error);
        return null;
    }

}

export async function getConnectedRepositories(){
    try{
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if(!session?.user){
            throw new Error("User is not authenticated");
        }
        const repositories = await prisma.repository.findMany({
            where:{
                userId: session.user.id
            },
            select:{
                id:true,
               name:true,
               fullName:true,
               url:true,
               createdAt:true,
            },
            orderBy:{   
                createdAt:"desc"
            }
        });
        return repositories;
    }
    catch(error){
        console.error("Error fetching connected repositories:", error);
        return [];
    }
}

export async function disconnectRepository(repoId:number){
    try{
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if(!session?.user){
            throw new Error("User is not authenticated");
        }
        const repository = await prisma.repository.findUnique({
  where: {
    id: repositoryId,
    userId: session.user.id,
  },
});
if(!repository){
    return {
        success:false,
        message:"Repository not found or not authorized"
    };
}
await deleteWebhook(repository.owner, repository.name);

        await prisma.repository.delete({
            where:{
                id: repositoryId,
                userId: session.user.id
            }
        });
        revalidatePath("/dashboard/settings","page");
        revalidatePath("/dashboard/repository","page");

  return{success:true}
    }
    catch(error){
        console.error("Error disconnecting repository:", error);
        return {
            success:false,
            message:"Failed to disconnect repository"
        };
    }
}
export async function disconnectAllRepositories(){
    try{
        const session = await auth.api.getSession({
            headers: await headers(),
        });
        if(!session?.user){
            throw new Error("User is not authenticated");
        }
        const repositories = await prisma.repository.findMany({
            where:{
                userId: session.user.id
            }
        });
        await Promise.all(repositories.map(async(repo)=>{   
            await deleteWebhook(repo.owner, repo.name);
        }))
        //  delete all repositories from db
        const result = await prisma.repository.deleteMany({
            where:{
                userId: session.user.id
            }
        });
        revalidatePath("/dashboard/settings","page");
        revalidatePath("/dashboard/repository","page");
    }

    catch(error){
        console.error("Error disconnecting all repositories:", error);
        return {
            success:false,
            message:"Failed to disconnect all repositories"
        };
    }
}