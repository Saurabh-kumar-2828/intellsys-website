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

// export const loader: LoaderFunction = async () => {
//     const analyticsDataClient = new BetaAnalyticsDataClient();

//     const [response] = await analyticsDataClient.runReport({
//         property: `properties/250088453`,
//         dateRanges: [
//           {
//             startDate: 'yesterday',
//             endDate: 'today',
//           },
//         ],
//         dimensions: [
//           {
//             "name": "country"
//           },
//           {
//             "name": "region"
//           },
//           {
//             "name": "city"
//           }
//         ],
//         metrics: [
//           {
//             name: 'activeUsers',
//           },
//         ],
//       });

//       console.log('Report result:');
//       response.rows.forEach(row => {
//         console.log(JSON.stringify(row.dimensionValues));
//         console.log(JSON.stringify(row.metricValues));
//       });
//       return null;
// }


export const loader: LoaderFunction = async () => {
    const analyticsDataClient = new BetaAnalyticsDataClient();

    const [response] = await analyticsDataClient.runRealtimeReport({
        property: `properties/250088453`,
        "minuteRanges": [
          {
            "name": "0-4 minutes ago",
            "startMinutesAgo": 4,
          },
          {
            "name": "25-29 minutes ago",
            "startMinutesAgo": 29,
            "endMinutesAgo": 25,
          }
        ],
        "dimensions": [
          {
            "name": "country"
          }
        ],
        "metrics": [
          {
            "name": 'activeUsers',
          },
        ],
      });

      console.log('Report result:');
      response.rows.forEach(row => {
        console.log(JSON.stringify(row.dimensionValues));
        console.log(JSON.stringify(row.metricValues));
      });
      return null;
}

export default function(){
    return (<div> HELLO </div>)
}