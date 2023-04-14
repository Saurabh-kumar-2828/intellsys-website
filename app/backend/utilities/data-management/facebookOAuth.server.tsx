import {Companies, Sources} from "do-not-commit";
import {DateTime} from "luxon";
import {execute} from "~/backend/utilities/databaseManager.server";
import {Uuid} from "~/utilities/typeDefinitions";
import {v4 as uuidv4} from 'uuid';

type AccessToken = {
  accessToken: string,
  expiresIn: string,
  tokenType: string
}


export async function storeCredentials(token: AccessToken, companyId: Uuid) {
  try {

        const credentialId = uuidv4()

        // Push in credentials table
        await execute(
            Companies.Intellsys,
            `
                INSERT INTO
                  credentials (
                    credential_id,
                    created_at,
                    updated_at,
                    credentials
                  )
                VALUES (
                    $1,
                    $2,
                    $3,
                    $4
                )
            `,
            [
              credentialId,
              DateTime.now().toISODate(),
              DateTime.now().toISODate(),
              {
                  access_token : token.accessToken,
                  expiry_date: DateTime.now().plus({seconds: parseInt(token.expiresIn)}).toISODate()
              }

            ]
        );

        // Store credentials id in credentials table
        await execute(
          Companies.Intellsys,
          `
              INSERT INTO
                credentials_store (
                  company_id,
                  credential_type,
                  credential_id
                )
              VALUES (
                  $1,
                  $2,
                  $3
              )
          `,
          [
            companyId,
            Sources.FacebookAds,
            credentialId,
          ]
      );

  } catch (e) {
      console.log(e);
      throw e;
  }
}


const facebookApiBaseUrl = "https://graph.facebook.com";
export async function getAccessToken(authorizationCode: string | null, companyId: string) {

  const redirectUri = `http://localhost:3000/${companyId}/capture-authorization-code`

  try {
    const url = `${facebookApiBaseUrl}/v16.0/oauth/access_token?client_id=${process.env.FACEBOOK_CLIENT_ID!}&client_secret=${process.env.CLIENT_SECRET}&redirect_uri=${redirectUri}&code=${authorizationCode}`;

    const response = await fetch(url, {
      method: "POST",
    });

    var token = await response.json();

    token = convertTokenToAccessTokenType(token);

    console.log(token);
    if(companyId != 'undefined'){
      storeCredentials(token, companyId);
      const data = await getFacebookData(token.accessToken)
      console.log("data: ", data)
    }
  } catch(e) {
    console.log(e)
  }
}


function convertTokenToAccessTokenType(token: any): AccessToken{

  const result: AccessToken = {
    accessToken : token.access_token,
    expiresIn : token.expires_in,
    tokenType : token.token_type
  }
  return result;
}


async function getFacebookData(accessToken: string) {
  console.log(accessToken);

  const fields =
      "campaign_id,campaign_name";
  const level = "campaign";
  let url = `${facebookApiBaseUrl}/${process.env.FACEBOOK_API_VERSION!}/act_${process.env.FACEBOOK_ACCOUNT_ID!}/insights?fields=${fields}&level=${level}&access_token=${accessToken}`;
  const response = await fetch(url, {
      method: "GET",
  });

  const insightsFromFacebookApi = await response.json();
  return insightsFromFacebookApi;
}
