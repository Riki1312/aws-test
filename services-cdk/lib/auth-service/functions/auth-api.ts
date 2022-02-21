import { APIGatewayProxyEventV2, Callback, Context } from "aws-lambda";
import { CognitoIdentityServiceProvider } from "aws-sdk";
import { randomBytes } from "crypto";
import { env } from "process";

const identityService = new CognitoIdentityServiceProvider();

export const handler = (event: APIGatewayProxyEventV2, context: Context, callback: Callback) => {
  console.log("Event:", JSON.stringify(event, null, 2));

  let email = "";

  if (event.body) {
    let body = JSON.parse(event.body);

    if (body.email) email = body.email;
    else callback("Email required");
  }

  identityService.listUsers(
    {
      UserPoolId: env.USER_POOL_ID!,
      Filter: `email="${email}"`,
      Limit: 1,
    },
    (error, data) => {
      if (error) {
        callback(error);
      } else {
        // User not exist: sing up.
        if (data.Users && data.Users.length == 0) {
          identityService.signUp(
            {
              ClientId: env.CLIENT_ID!,
              Username: email,
              Password: randomBytes(64).toString("hex"),
              UserAttributes: [
                {
                  Name: "email",
                  Value: email,
                },
              ],
            },
            (error, data) => {
              if (error) callback(error);
              else callback(null, data);
            }
          );
        } else {
          // User already exists: initiate auth.
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
        }
      }
    }
  );

  //
};
