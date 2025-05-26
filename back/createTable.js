// createTable.js (AWS SDK v3 style)
import{ DynamoDBClient, CreateTableCommand, DescribeTableCommand, waitUntilTableExists }from "@aws-sdk/client-dynamodb";

const client = new DynamoDBClient({
  region: process.env.AWS_REGION || "us-east-1",
  endpoint: process.env.DYNAMODB_ENDPOINT || "http://dynamodb:8000",
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY || "fakeMyKeyId",
    secretAccessKey: process.env.AWS_SECRET_KEY || "fakeSecretAccessKey",
  },
});

const tableName = "Users";


async function checkAndCreateTable() {
  try {
    await client.send(new DescribeTableCommand({ TableName: tableName }));
    console.log(`✅ Table "${tableName}" already exists.`);
  } catch (err) {
    if (err.name === "ResourceNotFoundException") {
      console.log("🔍 Table not found. Creating...");

      const params = {
        TableName: tableName,
        KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
        AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      };

      await client.send(new CreateTableCommand(params));
      console.log("🛠️ Table creation started. Waiting for it to become ACTIVE...");

      await waitUntilTableExists({ client, maxWaitTime: 30 }, { TableName: tableName });
      console.log("✅ Table is ACTIVE and ready to use!");
    } else {
      console.error("❌ Error checking table existence:", err);
    }
  }
}

checkAndCreateTable();

async function ensureTable() {
  try {
    await client.send(new DescribeTableCommand({ TableName: TABLE_NAME }));
    console.log(`✅ Table "${TABLE_NAME}" already exists.`);
  } catch (err) {
    if (err.name === "ResourceNotFoundException") {
      console.log(`🔍 Table "${TABLE_NAME}" not found. Creating...`);
      await client.send(new CreateTableCommand({
        TableName: TABLE_NAME,
        KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
        AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
        ProvisionedThroughput: { ReadCapacityUnits: 5, WriteCapacityUnits: 5 },
      }));
      console.log("🛠️ Waiting for table to become ACTIVE...");
      await waitUntilTableExists({ client, maxWaitTime: 30 }, { TableName: TABLE_NAME });
      console.log(`✅ Table "${TABLE_NAME}" is now ACTIVE.`);
    } else {
      console.error("❌ Unexpected error checking table:", err);
    }
  }
}

ensureTable().catch(console.error);
