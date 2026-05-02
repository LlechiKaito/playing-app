function requireEnv(key: string): string {
  const v = process.env[key];
  if (!v) throw new Error(`Missing required env: ${key}`);
  return v;
}

function optionalEnv(key: string, defaultValue: string): string {
  return process.env[key] ?? defaultValue;
}

export const env = {
  nodeEnv: optionalEnv("NODE_ENV", "development"),
  apiPort: Number(optionalEnv("API_PORT", "4000")),

  jwtSecret: requireEnv("JWT_SECRET"),
  jwtExpiresIn: optionalEnv("JWT_EXPIRES_IN", "7d"),

  awsRegion: requireEnv("AWS_REGION"),
  awsAccessKeyId: requireEnv("AWS_ACCESS_KEY_ID"),
  awsSecretAccessKey: requireEnv("AWS_SECRET_ACCESS_KEY"),

  dynamoEndpoint: process.env.DYNAMODB_ENDPOINT,
  tableName: requireEnv("DYNAMODB_TABLE_NAME"),

  s3Endpoint: process.env.S3_ENDPOINT,
  s3PublicEndpoint: optionalEnv("S3_PUBLIC_ENDPOINT", "http://localhost:9000"),
  s3Bucket: requireEnv("S3_BUCKET"),
  s3AccessKey: requireEnv("S3_ACCESS_KEY"),
  s3SecretKey: requireEnv("S3_SECRET_KEY"),

  useRealTextract: optionalEnv("USE_REAL_TEXTRACT", "false") === "true",
};
