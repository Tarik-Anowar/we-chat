'use server'
export const aws_access_key =async()=> {return process.env.AWS_ACCESS_KEY_ID};
export const aws_secret_key =async()=> {return process.env.AWS_SECRET_ACCESS_KEY};
export const aws_bucket =async()=> {return process.env.AWS_BUCKET};
export const aws_region =async()=> {return process.env.AWS_REGION};
