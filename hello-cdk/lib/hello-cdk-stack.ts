import * as path from "path";
import * as cdk from "aws-cdk-lib";
import {
  aws_cognito as cognito,
  aws_lambda_nodejs as lambda,
} from "aws-cdk-lib";

export class HelloCdkStack extends cdk.Stack {
  constructor(scope: cdk.App, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const authChallengeFn = new lambda.NodejsFunction(this, "authChallengeFn", {
      ru
    });

    new cognito.UserPool(this, "authUserPool", {
      selfSignUpEnabled: false,
      signInCaseSensitive: true,
      signInAliases: {
        email: true,
      },
      lambdaTriggers: {
        defineAuthChallenge: authChallengeFn,
      },
    });
  }
}
