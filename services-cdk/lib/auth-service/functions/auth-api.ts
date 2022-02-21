import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { randomBytes } from "crypto";
import { env } from "process";

const identityService = new CognitoIdentityServiceProvider();

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  console.log("Event:", JSON.stringify(event, null, 2));

  let email = "";

  // Validate input data.
  if (event.body) {
    let body = JSON.parse(event.body);

    if (body.email) email = body.email;
    else {
      return {
        statusCode: 400,
        body: "Email required",
      };
    }
  } else {
    return {
      statusCode: 400,
      body: "Body required",
    };
  }

  // Check if the user exists.
  const listUsers = await identityService
    .listUsers({
      UserPoolId: env.USER_POOL_ID!,
      Filter: `email="${email}"`,
      Limit: 1,
    })
    .promise();

  if (listUsers.Users && listUsers.Users.length == 0) {
    // User not exist: sing up.
    await identityService
      .signUp({
        ClientId: env.CLIENT_ID!,
        Username: email,
        Password: randomBytes(64).toString("base64"),
        UserAttributes: [
          {
            Name: "email",
            Value: email,
          },
        ],
      })
      .promise();
  }

  // User already exists: initiate auth.
  const authResponse = await identityService
    .adminInitiateAuth({
      UserPoolId: env.USER_POOL_ID!,
      ClientId: env.CLIENT_ID!,
      AuthFlow: "CUSTOM_AUTH",
      AuthParameters: {
        USERNAME: email,
      },
    })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify(authResponse),
  };
};
