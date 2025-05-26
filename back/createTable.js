// createTable.js (AWS SDK v3 style)
const { DynamoDBClient, CreateTableCommand, DescribeTableCommand, waitUntilTableExists } = require("@aws-sdk/client-dynamodb");

const client = new DynamoDBClient({
  region: "us-east-1",
  endpoint: "http://localhost:8000",
  credentials: {
    accessKeyId: "fakeMyKeyId",
    secretAccessKey: "fakeSecretAccessKey",
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
