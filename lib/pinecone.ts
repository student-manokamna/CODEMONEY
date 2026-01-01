
import {Pinecone} from "@pinecone-database/pinecone";

export const pinecone= new Pinecone({
    apiKey: process.env.PINECONE_DB_API_KEY!,
    //  as we need api key for to access pinecone service

})
export const pineconeIndex= pinecone.Index("pullrequest-final");
//  name is given while creating index in pinecone dashboard so see there what u created


