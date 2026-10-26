import fs from 'fs';
import path from 'path';
import {
  ClickUpTaskPayload,
  ClickUpExportReport,
} from './ClickUpTicketExporter';
import { env } from '../config/env';

export interface ClickUpSyncOptions {
  apiToken?: string;
  listId?: string;
  reportPath?: string;
  dryRun?: boolean;
}

export interface ClickUpTaskSyncResult {
  externalId: string;
  taskName: string;
  status: 'CREATED' | 'SKIPPED_EXISTING' | 'DRY_RUN' | 'FAILED';
  clickUpTaskId?: string;
  error?: string;
}

export interface ClickUpSyncReport {
  syncedAt: string;
  listId: string;
  dryRun: boolean;
  totalTickets: number;
  createdCount: number;
  skippedCount: number;
  failedCount: number;
  results: ClickUpTaskSyncResult[];
}

export class ClickUpSyncClient {
  private readonly apiToken: string;
  private readonly listId: string;
  private readonly baseUrl = 'https://api.clickup.com/api/v2';

  constructor(options: { apiToken?: string; listId?: string } = {}) {
    this.apiToken = options.apiToken !== undefined ? options.apiToken : env.clickupApiToken;
    this.listId = options.listId !== undefined ? options.listId : env.clickupListId;
  }

  /**
   * Fetches existing tasks in the list to avoid duplicate creations.
   */
  async getExistingTasks(): Promise<Array<{ id: string; name: string; custom_id?: string }>> {
    if (!this.apiToken || !this.listId) {
      return [];
    }

    try {
      const response = await fetch(
        `${this.baseUrl}/list/${this.listId}/task?archived=false&subtasks=true`,
        {
          method: 'GET',
          headers: {
            Authorization: this.apiToken,
            'Content-Type': 'application/json',
          },
        }
      );

      if (!response.ok) {
        return [];
      }

      const data = (await response.json()) as { tasks?: Array<{ id: string; name: string; custom_id?: string }> };
      return data.tasks || [];
    } catch {
      return [];
    }
  }

  /**
   * Posts a single bug task to the ClickUp List.
   */
  async createTask(
    payload: ClickUpTaskPayload
  ): Promise<{ success: boolean; taskId?: string; error?: string }> {
    if (!this.apiToken || !this.listId) {
      return {
        success: false,
        error: 'CLICKUP_API_TOKEN and CLICKUP_LIST_ID are required.',
      };
    }

    try {
      const body: Record<string, unknown> = {
        name: payload.name,
        description: payload.description,
        markdown_description: payload.markdown_description || payload.description,
        priority: payload.priority,
      };

      if (payload.tags && payload.tags.length > 0) {
        body.tags = payload.tags;
      }

      const response = await fetch(`${this.baseUrl}/list/${this.listId}/task`, {
        method: 'POST',
        headers: {
          Authorization: this.apiToken,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const errorText = await response.text();
        return {
          success: false,
          error: `HTTP ${response.status}: ${errorText}`,
        };
      }

      const data = (await response.json()) as { id?: string };
      const taskId = data.id;

      if (taskId && payload.screenshotPath && fs.existsSync(payload.screenshotPath)) {
        await this.attachFileToTask(taskId, payload.screenshotPath);
      }

      return {
        success: true,
        taskId,
      };
    } catch (err: unknown) {
      return {
        success: false,
        error: err instanceof Error ? err.message : String(err),
      };
    }
  }

  /**
   * Uploads an attachment/screenshot to a ClickUp task
   */
  async attachFileToTask(taskId: string, filePath: string): Promise<boolean> {
    try {
      const fileBuffer = fs.readFileSync(filePath);
      const fileName = path.basename(filePath);
      const isJpeg = fileName.toLowerCase().endsWith('.jpg') || fileName.toLowerCase().endsWith('.jpeg');
      const blob = new Blob([fileBuffer], { type: isJpeg ? 'image/jpeg' : 'image/png' });
      const formData = new FormData();
      formData.append('attachment', blob, fileName);

      const res = await fetch(`${this.baseUrl}/task/${taskId}/attachment`, {
        method: 'POST',
        headers: {
          Authorization: this.apiToken,
        },
        body: formData,
      });

      if (!res.ok) {
        const text = await res.text();
        console.error(`Failed to attach screenshot to task ${taskId}: ${res.status} ${text}`);
        return false;
      }

      console.log(`Attached screenshot ${fileName} to task ${taskId}`);
      return true;
    } catch (err) {
      console.error(`Error attaching screenshot to task ${taskId}:`, err);
      return false;
    }
  }

  /**
   * Synchronizes an exported ticket report to ClickUp.
   */
  async syncReport(
    report: ClickUpExportReport,
    options: ClickUpSyncOptions = {}
  ): Promise<ClickUpSyncReport> {
    const isDryRun = options.dryRun ?? false;
    const targetListId = options.listId || this.listId;

    const results: ClickUpTaskSyncResult[] = [];
    let createdCount = 0;
    let skippedCount = 0;
    let failedCount = 0;

    // Fetch existing tasks to deduplicate by task name
    const existingTasks = isDryRun ? [] : await this.getExistingTasks();
    const existingNames = new Set(existingTasks.map(t => t.name.trim().toLowerCase()));

    for (const ticket of report.tickets) {
      const externalId = ticket.external_id || ticket.name;

      // 1. Deduplication check
      if (existingNames.has(ticket.name.trim().toLowerCase())) {
        results.push({
          externalId,
          taskName: ticket.name,
          status: 'SKIPPED_EXISTING',
        });
        skippedCount++;
        continue;
      }

      // 2. Dry run preview mode
      if (isDryRun) {
        results.push({
          externalId,
          taskName: ticket.name,
          status: 'DRY_RUN',
        });
        createdCount++;
        continue;
      }

      // 3. Live API creation
      const res = await this.createTask(ticket);
      if (res.success) {
        results.push({
          externalId,
          taskName: ticket.name,
          status: 'CREATED',
          clickUpTaskId: res.taskId,
        });
        createdCount++;
      } else {
        results.push({
          externalId,
          taskName: ticket.name,
          status: 'FAILED',
          error: res.error,
        });
        failedCount++;
      }
    }

    return {
      syncedAt: new Date().toISOString(),
      listId: targetListId,
      dryRun: isDryRun,
      totalTickets: report.ticketCount,
      createdCount,
      skippedCount,
      failedCount,
      results,
    };
  }

  /**
   * Reads a ticket JSON file from disk and synchronizes it.
   */
  async syncFromFile(
    filePath: string,
    options: ClickUpSyncOptions = {}
  ): Promise<ClickUpSyncReport> {
    if (!fs.existsSync(filePath)) {
      throw new Error(`ClickUp tickets file not found: ${filePath}`);
    }

    const raw = fs.readFileSync(filePath, 'utf8');
    const report = JSON.parse(raw) as ClickUpExportReport;
    return this.syncReport(report, options);
  }
}
