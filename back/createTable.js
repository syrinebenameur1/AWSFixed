// File: backend/createTable.js

import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";

const TABLE_NAME = "Users";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: process.env.DYNAMODB_ENDPOINT || "http://localhost:8000",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY || "fakeMyKeyId",
    secretAccessKey: process.env.AWS_SECRET_KEY || "fakeSecretAccessKey",
  },
});

async function ensureTable() {
  try {
    // Correctly use the TABLE_NAME constant (string "Users")
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    console.log(`✅ Table "${TABLE_NAME}" already exists.`);
  } catch (err) {
    if (err.name === "ResourceNotFoundException") {
      console.log(`🔍 Table "${TABLE_NAME}" not found. Creating...`);
      await client.send(
        new CreateTableCommand({
          TableName: TABLE_NAME,
          KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
          AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
          ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
        })
      );
      console.log("🛠️ Waiting for table to become ACTIVE...");
      await waitUntilTableExists({ client, maxWaitTime: 30 }, { TableName: TABLE_NAME });
      console.log(`✅ Table "${TABLE_NAME}" is now ACTIVE.`);
    } else {
      console.error("❌ Unexpected error checking table:", err);
    }
  }
}

ensureTable().catch(console.error);
