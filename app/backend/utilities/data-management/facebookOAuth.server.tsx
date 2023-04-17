import {Companies, Sources} from "do-not-commit";
import {DateTime} from "luxon";
import {execute} from "~/backend/utilities/databaseManager.server";
import {Uuid} from "~/utilities/typeDefinitions";
import {v4 as uuidv4} from 'uuid';

type FacebookAdsCredentials = {
  accessToken: string,
  expiresIn: string,
  tokenType: string
}

type JSONValue =
    | string
    | number
    | boolean

interface Credentials {
    [x: string]: JSONValue;
}

export async function storeCredentials(credentials: Credentials, companyId: Uuid, credentialType: Uuid) {
  /**
   * Store the credentials of a company's data source.
   * @param  {Credentials} credentials credentials of a company's data source.
   * @param  {Uuid} companyId Unique Id of the company
   * @param  {Uuid} credentialType Unique Id of the data source
   * @returns  This function does not return anything
 */

  try {

        const credentialId = uuidv4()

        // Write in credentials table
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
              credentials
            ]
        );

        // write credentials-id in credentials store
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
            credentialType,
            credentialId
          ]
      );

  } catch (e) {
      console.log(e);
      throw e;
  }
}


const facebookApiBaseUrl = "https://graph.facebook.com";
export async function facebookOAuthFlow(authorizationCode: string | null, companyId: string) {

  const redirectUri = `http://localhost:3000/${companyId}/capture-authorization-code`

  try {

    // Get Access token by giving authorization code.
    const url = `${facebookApiBaseUrl}/v16.0/oauth/access_token?client_id=${process.env.FACEBOOK_CLIENT_ID!}&client_secret=${process.env.CLIENT_SECRET}&redirect_uri=${redirectUri}&code=${authorizationCode}`;
    const response = await fetch(url, {
      method: "POST",
    });
    var token = await response.json();
    token = convertTokenToFacebookCredentialsType(token);

    if(companyId != 'undefined'){

      // Store credentials in database.
      storeCredentials(
        {
          // TODO: Hash the token
          access_token: token.accessToken,
          expiry_date: DateTime.now().plus({seconds: parseInt(token.expiresIn)}).toISODate()
        },
        companyId,
        Sources.FacebookAds
      );

      // Get data from the facebook ads source.
      const data = await getFacebookData(token.accessToken);
      console.log("data: ", data);

    }
  } catch(e) {
    console.log(e);
  }

}


function convertTokenToFacebookCredentialsType(token: any): FacebookAdsCredentials {

  let result: FacebookAdsCredentials = {
    accessToken: "",
    expiresIn: "",
    tokenType: ""
  };

  try {

    result = {
      accessToken: token.access_token,
      expiresIn: token.expires_in,
      tokenType: token.token_type
    }

  } catch(e) {
    console.log(e);
  }

  return result;
}


async function getFacebookData(accessToken: string) {

  try {
    const fields = "campaign_id,campaign_name";
    const level = "campaign";
    let url = `${facebookApiBaseUrl}/${process.env.FACEBOOK_API_VERSION!}/act_${process.env.FACEBOOK_ACCOUNT_ID!}/insights?fields=${fields}&level=${level}&access_token=${accessToken}`;
    const response = await fetch(url, {
        method: "GET",
    });

    const insightsFromFacebookApi = await response.json();
    return insightsFromFacebookApi;

  } catch (e){
    console.log(e);
  }

}
