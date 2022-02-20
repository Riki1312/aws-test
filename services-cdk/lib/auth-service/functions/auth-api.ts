import { APIGatewayProxyEventV2, Callback, Context } from "aws-lambda";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { env } from "process";

export const handler = (event: APIGatewayProxyEventV2, context: Context, callback: Callback) => {
  console.log("Event:", JSON.stringify(event, null, 2));

  let email = "";

  if (event.body) {
    let body = JSON.parse(event.body);

    if (body.email) email = body.email;
    else callback("Email required");
  }

  const identityService = new CognitoIdentityServiceProvider();

  identityService.adminInitiateAuth(
    {
      UserPoolId: env.USER_POOL_ID!,
      ClientId: env.CLIENT_ID!,
      AuthFlow: "CUSTOM_AUTH",
      AuthParameters: {
        USERNAME: email,
      },
    },
    (error, data) => {
      if (error) callback(error);
      else callback(null, data);
    }
  );
};
