import React from 'react';
import HomePageController from "./controllers/HomePageController";
import ResultsPageController from "./controllers/Routes/SiteSearchController";
import QueryPageController from "./controllers/QueryPageController";
import VisualizationPageController from "./controllers/Routes/VisualizationPageController";
import ExternalContentController from 'ebrc-client/controllers/ExternalContentController';

export const wrapRoutes = (ebrcRoutes) => [
    { path: "/", component: HomePageController },
    { path: "/searchResults", component: ResultsPageController },
    //{ path: "/dictionary", component: OntologySearchPageController },
    { path: "/query", component: QueryPageController },
    { path: "/visualizations/:type", component: VisualizationPageController },
    {
        path: "/api",
        component: props =>
          <ExternalContentController
            url={`${window.location.protocol}//${window.location.host}/genomics/docs/genomics-service-api.html`}
          />
      },
    ...ebrcRoutes,
];
