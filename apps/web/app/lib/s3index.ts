import { GetObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { aws_access_key, aws_bucket, aws_region, aws_secret_key } from './aws_secrets';

export async function getObject(key: string): Promise<string> {
    const AWS_REGION = await aws_region();
    const AWS_ACCESS_KEY_ID = await aws_access_key();
    const AWS_SECRET_ACCESS_KEY = await aws_secret_key();
    const AWS_BUCKET = await aws_bucket();
    if (!AWS_BUCKET || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION) {
        throw new Error('Missing AWS configuration in environment variables');
    }
    const s3Client = new S3Client({
        region: AWS_REGION,
        credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
    });
    const command = new GetObjectCommand({
        Bucket: AWS_BUCKET,
        Key: `we-chat/${key}`,
    });
    const url = await getSignedUrl(s3Client, command);
    return url;
}

export async function putFileObject(key: string, type: string): Promise<string> {
    const AWS_REGION = await aws_region();
    const AWS_ACCESS_KEY_ID = await aws_access_key();
    const AWS_SECRET_ACCESS_KEY = await aws_secret_key();
    const AWS_BUCKET = await aws_bucket();
    if (!AWS_BUCKET || !AWS_ACCESS_KEY_ID || !AWS_SECRET_ACCESS_KEY || !AWS_REGION) {
        throw new Error('Missing AWS configuration in environment variables');
    }
    const s3Client = new S3Client({
        region: AWS_REGION,
        credentials: {
            accessKeyId: AWS_ACCESS_KEY_ID,
            secretAccessKey: AWS_SECRET_ACCESS_KEY,
        },
    });
    try {
        const command = new PutObjectCommand({
            Bucket: AWS_BUCKET,
            Key: `we-chat/${key}`,
            ContentType: type,
        });
        const uploadUrl = await getSignedUrl(s3Client, command,{expiresIn:3000});
        return uploadUrl;
    } catch (error) {
        console.error('Error uploading file:', error);
        throw error;
    }
}
