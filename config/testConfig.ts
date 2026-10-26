export const testConfig = {
  screenshot: {
    fullPage: true,
  },

  comparison: {
    spacingTolerance: 2,

    dimensionTolerance: 2,

    colorTolerance: 0,
  },

  browser: {
    failOnConsoleError: false,

    failOnNetworkError: false,
  },

  /*
   * Network issues are always captured.
   *
   * These URL fragments identify known
   * analytics / telemetry requests that
   * may be aborted by the browser during
   * automated navigation.
   *
   * They are NOT removed from evidence.
   * They will only be classified as
   * diagnostic/non-blocking when the
   * failure is specifically:
   *
   * REQUEST_FAILED
   * + net::ERR_ABORTED
   */
  network: {
    diagnosticAbortUrlFragments: [
      'irreverentink.com/api/collect',

      'irreverentink.com/.well-known/shopify/monorail/unstable/produce_batch',

      'error-analytics-sessions-production.shopifysvc.com/observeonly',

      'merchant-center-analytics.goog/mc/collect',

      'monorail-edge.shopifysvc.com/v1/produce',
    ],
  },
};