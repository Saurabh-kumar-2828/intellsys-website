/**
 * TODO(developer): Uncomment this variable and replace with your
 *   Google Analytics 4 property ID before running the sample.
 */
// const propertyId = '';

import { LoaderFunction } from "@remix-run/node";
import { BetaAnalyticsDataClient } from '@google-analytics/data';

// Imports the Google Analytics Data API client library.


// Using a default constructor instructs the client to use the credentials
// specified in GOOGLE_APPLICATION_CREDENTIALS environment variable.

export const loader: LoaderFunction = async () => {
    const analyticsDataClient = new BetaAnalyticsDataClient();

    const [response] = await analyticsDataClient.runReport({
        property: `properties/250088453`,
        dateRanges: [
          {
            startDate: '2020-03-31',
            endDate: 'today',
          },
        ],
        dimensions: [
          {
            name: 'city',
          },
        ],
        metrics: [
          {
            name: 'activeUsers',
          },
        ],
      });

      console.log('Report result:');
      response.rows.forEach(row => {
        console.log(row.dimensionValues[0], row.metricValues[0]);
      });
      return null;
}

export default function(){
    return (<div> HELLO </div>)
}