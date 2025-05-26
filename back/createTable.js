const AWS = require('aws-sdk');
AWS.config.update({
  region: 'us-east-1',
  endpoint: 'http://localhost:8000' // or your endpoint
});

const dynamodb = new AWS.DynamoDB();

const tableName = "Users";

dynamodb.describeTable({ TableName: tableName }, (err, data) => {
  if (err && err.code === 'ResourceNotFoundException') {
    // Table doesn't exist, create it
    const params = {
      TableName: tableName,
      KeySchema: [
        { AttributeName: "id", KeyType: "HASH" }
      ],
      AttributeDefinitions: [
        { AttributeName: "id", AttributeType: "S" }
      ],
      ProvisionedThroughput: {
        ReadCapacityUnits: 5,
        WriteCapacityUnits: 5
      }
    };

    dynamodb.createTable(params, (err, data) => {
      if (err) {
        console.error("Error creating table:", err);
      } else {
        console.log("Table created:", data);
      }
    });

  } else if (data) {
    console.log("Table already exists:", data.Table.TableName);
  } else {
    console.error("Error checking table existence:", err);
  }
});
