import prisma from "@/lib/db";
import { inngest } from "../client";
import { use } from "react";
import { getRepoFileContents } from "@/module/github/lib/github";
import { indexCodebase } from "@/module/ai/lib/rag";


// export const helloWorld = inngest.createFunction(
//   { id: "hello-world" },
//   { event: "test/hello.world" },
//   async ({ event, step }) => {
//     await step.sleep("wait-a-moment", "1s");
//     return { message: `Hello ${event.data.email}!` };
//   },
// );   only for practise

//  then we have to export it to be used in our inngest route and we import the inngest client from our client file that is route.ts 

export const indexRepo =inngest.createFunction(
    {id:"index-repo"},
    {event:"repository.connected"},
    async({event, step})=>{
        const {owner, repo, userId}= event.data;
        // files
        const files = await step.run("fetch-files", async()=>{
            const account= await prisma.account.findFirst({
                where:{
                    userId: userId,
                    providerId:"github"
                }
            })
            if(!account?.accessToken){
                throw new Error("GitHub account not linked")
            }
            return await getRepoFileContents(account.accessToken, owner, repo);
            //  for above fuction we have to create a new file in module/github/lib/github.ts
        });
        await step.run("index-codebase", async()=>{
            // await indexcodebase(files, userId, `${owner}/${repo}`);
            await indexCodebase(`${owner}/${repo}`, files);
        }
        )
        return{ success:true  , indexedFiles: files.length  };
    }
)

