import {
  App,
  aws_cognito as cognito,
  aws_lambda_nodejs as lambda,
  Stack,
  StackProps,
} from "aws-cdk-lib";

export class AuthServiceStack extends Stack {
  constructor(scope: App, id: string, props?: StackProps) {
    super(scope, id, props);

    const preSignUp = new lambda.NodejsFunction(this, "preSignUp", {
      entry: "/functions/pre-sign-up.ts",
    });
    const postAuthentication = new lambda.NodejsFunction(this, "postAuthentication", {
      entry: "/functions/post-authentication.ts",
    });
    const createAuthChallenge = new lambda.NodejsFunction(this, "createAuthChallenge", {
      entry: "/functions/create-auth-challenge.ts",
    });
    const verifyAuthChallenge = new lambda.NodejsFunction(this, "verifyAuthChallenge", {
      entry: "/functions/verify-auth-challenge.ts",
    });
    const defineAuthChallenge = new lambda.NodejsFunction(this, "defineAuthChallenge", {
      entry: "/functions/define-auth-challenge.ts",
    });

    new cognito.UserPool(this, "authUserPool", {
      selfSignUpEnabled: false,
      signInCaseSensitive: true,
      signInAliases: {
        email: true,
      },
      lambdaTriggers: {
        preSignUp: preSignUp,
        postAuthentication: postAuthentication,
        createAuthChallenge: createAuthChallenge,
        verifyAuthChallengeResponse: verifyAuthChallenge,
        defineAuthChallenge: defineAuthChallenge,
      },
    });
  }
}
