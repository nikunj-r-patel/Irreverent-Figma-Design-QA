import {
  Page,
} from '@playwright/test';

import {
  testConfig,
} from '../config/testConfig';

export interface NetworkError {
  url: string;

  status: number;

  method: string;
}

export interface NetworkIssueClassification {
  blockingIssues:
    NetworkIssue[];

  diagnosticIssues:
    NetworkIssue[];
}

export type NetworkIssueType =
  | 'HTTP_ERROR'
  | 'REQUEST_FAILED';

export interface NetworkIssue {
  type:
    NetworkIssueType;

  url:
    string;

  method:
    string;

  resourceType:
    string;

  status?:
    number;

  failureText?:
    string;
}

export class NetworkManager {
  /*
   * Preserve the original API used
   * by existing visual.spec.ts.
   *
   * This continues to capture only
   * HTTP responses >= 400.
   */
  static captureErrors(
    page: Page
  ): NetworkError[] {
    const errors:
      NetworkError[] = [];

    page.on(
      'response',
      response => {
        if (
          response.status() >= 400
        ) {
          errors.push({
            url:
              response.url(),

            status:
              response.status(),

            method:
              response
                .request()
                .method(),
          });
        }
      }
    );

    return errors;
  }

  static classifyIssues(
    issues:
      NetworkIssue[]
  ): NetworkIssueClassification {
    const blockingIssues:
      NetworkIssue[] = [];
  
    const diagnosticIssues:
      NetworkIssue[] = [];
  
    for (
      const issue of
      issues
    ) {
      const isKnownTelemetryAbort =
        issue.type ===
          'REQUEST_FAILED' &&
        issue.failureText ===
          'net::ERR_ABORTED' &&
        testConfig.network
          .diagnosticAbortUrlFragments
          .some(
            fragment =>
              issue.url.includes(
                fragment
              )
          );
  
      if (
        isKnownTelemetryAbort
      ) {
        diagnosticIssues.push(
          issue
        );
  
        continue;
      }
  
      /*
       * Everything not explicitly
       * classified as a known aborted
       * telemetry request remains a
       * blocking QA network issue.
       *
       * This includes:
       *
       * - HTTP 4xx / 5xx
       * - failed images
       * - failed fonts
       * - failed CSS / scripts
       * - failed APIs
       * - unexpected request failures
       */
      blockingIssues.push(
        issue
      );
    }
  
    return {
      blockingIssues,
      diagnosticIssues,
    };
  }

  /*
   * Rich network diagnostics for
   * the Initial Full Audit.
   *
   * Captures:
   *
   * - HTTP 4xx / 5xx responses
   * - browser-level request failures
   * - resource type
   * - failure reason where available
   */
  static captureIssues(
    page: Page
  ): NetworkIssue[] {
    const issues:
      NetworkIssue[] = [];

    const seen =
      new Set<string>();

    const addIssue = (
      issue:
        NetworkIssue
    ) => {
      const key = [
        issue.type,
        issue.method,
        issue.resourceType,
        issue.status ??
          '',
        issue.failureText ??
          '',
        issue.url,
      ].join('|');

      if (
        seen.has(
          key
        )
      ) {
        return;
      }

      seen.add(
        key
      );

      issues.push(
        issue
      );
    };

    page.on(
      'response',
      response => {
        const status =
          response.status();

        if (
          status < 400
        ) {
          return;
        }

        const request =
          response.request();

        addIssue({
          type:
            'HTTP_ERROR',

          url:
            response.url(),

          method:
            request.method(),

          resourceType:
            request.resourceType(),

          status,
        });
      }
    );

    page.on(
      'requestfailed',
      request => {
        const failure =
          request.failure();

        addIssue({
          type:
            'REQUEST_FAILED',

          url:
            request.url(),

          method:
            request.method(),

          resourceType:
            request.resourceType(),

          failureText:
            failure?.errorText ??
            'Unknown request failure',
        });
      }
    );

    return issues;
  }
}