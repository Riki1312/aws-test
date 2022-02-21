import { HttpApi, HttpMethod } from "@aws-cdk/aws-apigatewayv2-alpha";
import { HttpLambdaIntegration } from "@aws-cdk/aws-apigatewayv2-integrations-alpha";
import {
  App,
  aws_cognito as cognito,
  aws_iam as iam,
  aws_lambda_nodejs as lambda,
  CfnOutput,
  Stack,
  StackProps,
} from "aws-cdk-lib";
import * as path from "path";

export class AuthServiceStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    // UserPool setup.

    const preSignUp = new lambda.NodejsFunction(this, "preSignUp", {
      entry: path.join(__dirname, `/functions/pre-sign-up.ts`),
    });
    const postAuthentication = new lambda.NodejsFunction(this, "postAuthentication", {
      entry: path.join(__dirname, `/functions/post-authentication.ts`),
    });
    const createAuthChallenge = new lambda.NodejsFunction(this, "createAuthChallenge", {
      entry: path.join(__dirname, `/functions/create-auth-challenge.ts`),
    });
    const verifyAuthChallenge = new lambda.NodejsFunction(this, "verifyAuthChallenge", {
      entry: path.join(__dirname, `/functions/verify-auth-challenge.ts`),
    });
    const defineAuthChallenge = new lambda.NodejsFunction(this, "defineAuthChallenge", {
      entry: path.join(__dirname, `/functions/define-auth-challenge.ts`),
    });

    const authUserPool = new cognito.UserPool(this, "authUserPool", {
      selfSignUpEnabled: true,
      signInCaseSensitive: false,
      signInAliases: { email: true },
      standardAttributes: {
        email: {
          required: true,
          mutable: true,
        },
        givenName: {
          required: false,
          mutable: true,
        },
        familyName: {
          required: false,
          mutable: true,
        },
      },
      lambdaTriggers: {
        preSignUp: preSignUp,
        postAuthentication: postAuthentication,
        createAuthChallenge: createAuthChallenge,
        verifyAuthChallengeResponse: verifyAuthChallenge,
        defineAuthChallenge: defineAuthChallenge,
      },
    });

    const authUserPoolClient = authUserPool.addClient("userPoolClient", {
      authFlows: { custom: true },
    });

    new CfnOutput(this, "userPoolId", {
      value: authUserPool.userPoolId,
      description: "Auth Service userPoolId",
    });
    new CfnOutput(this, "userPoolClientId", {
      value: authUserPoolClient.userPoolClientId,
      description: "Auth Service userPoolClientId",
    });

    // HttpApi setup.

    const authApi = new lambda.NodejsFunction(this, "authApi", {
      entry: path.join(__dirname, `/functions/auth-api.ts`),
      environment: {
        USER_POOL_ID: authUserPool.userPoolId,
        CLIENT_ID: authUserPoolClient.userPoolClientId,
      },
    });

    authApi.role?.attachInlinePolicy(
      new iam.Policy(this, "userPoolPolicy", {
        statements: [
          new iam.PolicyStatement({
            actions: [
              "cognito-idp:ListUsers",
              "cognito-idp:SignUp",
              "cognito-idp:AdminInitiateAuth",
            ],
            resources: [authUserPool.userPoolArn],
          }),
        ],
      })
    );

    const authHttpApi = new HttpApi(this, "authHttpApi", {
      corsPreflight: {
        allowOrigins: ["*"],
      },
    });

    authHttpApi.addRoutes({
      path: "/auth",
      methods: [HttpMethod.POST],
      integration: new HttpLambdaIntegration("authApiIntegration", authApi),
    });

    new CfnOutput(this, "apiEndpoint", {
      value: authHttpApi.apiEndpoint,
      description: "Auth Service apiEndpoint",
    });
  }
}
