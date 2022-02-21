import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from "aws-lambda";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { env } from "process";

const identityService = new CognitoIdentityServiceProvider();

export const handler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  console.log("Event:", JSON.stringify(event, null, 2));

  let session = "";
  let userId = "";
  let secretCode = "";

  // Validate input data.
  if (event.body) {
    let body = JSON.parse(event.body);

    if (body.session) session = body.session;
    else {
      return {
        statusCode: 400,
        body: "session required",
      };
    }
    if (body.userId) userId = body.userId;
    else {
      return {
        statusCode: 400,
        body: "userId required",
      };
    }
    if (body.secretCode) secretCode = body.secretCode;
    else {
      return {
        statusCode: 400,
        body: "secretCode required",
      };
    }
  } else {
    return {
      statusCode: 400,
      body: "Request body empty",
    };
  }

  const authChallengeResponse = await identityService
    .adminRespondToAuthChallenge({
      UserPoolId: env.USER_POOL_ID!,
      ClientId: env.CLIENT_ID!,
      ChallengeName: "CUSTOM_CHALLENGE",
      Session: session,
      ChallengeResponses: {
        USERNAME: userId,
        ANSWER: secretCode,
      },
    })
    .promise();

  return {
    statusCode: 200,
    body: JSON.stringify(authChallengeResponse),
  };
};
