// createTable.js
import {
  DynamoDBClient,
  CreateTableCommand,
  DescribeTableCommand,
  waitUntilTableExists,
} from "@aws-sdk/client-dynamodb";

const TABLE_NAME = "Users";

const client = new DynamoDBClient({
  region: "local",
  endpoint: "http://localhost:8000",  // Make sure your local DynamoDB is here
  credentials: {
    accessKeyId: "fakeMyKeyId",      // Fake keys for local DynamoDB
    secretAccessKey: "fakeSecretAccessKey",
  },
});

async function createTable() {
  try {
    // Check if table already exists
    await client.send(new DescribeTableCommand({ TableName: Users }));
    console.log(`✅ Table "${TABLE_NAME}" already exists.`);
  } catch (error) {
    if (error.name === "ResourceNotFoundException") {
      console.log("🔍 Table not found. Creating...");
      const params = {
        TableName: TABLE_NAME,
        KeySchema: [{ AttributeName: "id", KeyType: "HASH" }],
        AttributeDefinitions: [{ AttributeName: "id", AttributeType: "S" }],
        ProvisionedThroughput: {
          ReadCapacityUnits: 5,
          WriteCapacityUnits: 5,
        },
      };
      await client.send(new CreateTableCommand(params));
      console.log("🛠️ Table creation started. Waiting for it to become ACTIVE...");
      await waitUntilTableExists({ client, maxWaitTime: 20 }, { TableName: TABLE_NAME });
      console.log("✅ Table is ACTIVE and ready to use!");
    } else {
      console.error("❌ Unexpected error:", error);
    }
  }
}

createTable();
