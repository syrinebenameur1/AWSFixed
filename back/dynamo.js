// dynamo.js
require('dotenv').config();
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  ScanCommand,
  PutCommand
} = require('@aws-sdk/lib-dynamodb');

const isLocal = process.env.IS_LOCAL === 'true';

const client = new DynamoDBClient({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: isLocal ? 'fakeMyKeyId' : process.env.AWS_ACCESS_KEY,
    secretAccessKey: isLocal ? 'fakeSecretAccessKey' : process.env.AWS_SECRET_KEY,
  },
  ...(isLocal && {
    endpoint: process.env.DYNAMODB_ENDPOINT || 'http://localhost:8000',
  }),
});

const docClient = DynamoDBDocumentClient.from(client);

module.exports = {
  scan: (params) => docClient.send(new ScanCommand(params)),
  put: (params) => docClient.send(new PutCommand(params)),
};
