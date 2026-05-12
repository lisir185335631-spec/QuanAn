// PRD-11 US-015 · DingtalkService — webhook notification stub
// SHIELD: isMock=true by default (D-077) · real send requires DINGTALK_ENABLE=true + webhookUrl
// AC-3: isMock = process.env.DINGTALK_ENABLE !== 'true'
// AC-4: isMock=true → log warning + return {ok:true,mock:true}
// AC-5: isMock=false + empty webhookUrl → ConfigurationError (fail-fast)
// AC-6: isMock=false + webhookUrl → fetch POST + DingTalk API spec

import { logger } from '@/lib/logger';

export class ConfigurationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'ConfigurationError';
  }
}

export interface DingtalkSendResult {
  ok: boolean;
  mock?: boolean;
  errcode?: number;
  errmsg?: string;
}

export class DingtalkService {
  private readonly isMock: boolean;
  private readonly webhookUrl: string;

  constructor(
    webhookUrl: string = process.env.DINGTALK_WEBHOOK_URL ?? '',
    isMock: boolean = process.env.DINGTALK_ENABLE !== 'true',
  ) {
    this.isMock = isMock;
    this.webhookUrl = webhookUrl;

    // AC-5: fail-fast when real mode is requested but no URL is configured
    if (!this.isMock && !this.webhookUrl) {
      throw new ConfigurationError('DINGTALK_WEBHOOK_URL is required when DINGTALK_ENABLE=true');
    }
  }

  async send(content: string): Promise<DingtalkSendResult> {
    if (this.isMock) {
      logger.warn({ content }, '[dingtalk-mock] webhook would send:');
      return { ok: true, mock: true };
    }

    // AC-6: real DingTalk API call
    const body = {
      msgtype: 'text',
      text: { content },
    };

    const resp = await fetch(this.webhookUrl, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const json = (await resp.json()) as { errcode: number; errmsg: string };
    return {
      ok: json.errcode === 0,
      errcode: json.errcode,
      errmsg: json.errmsg,
    };
  }
}
