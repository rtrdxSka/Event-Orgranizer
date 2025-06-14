import resend from "../config/resend"
import { EMAIL_SENDER, NODE_ENV } from "../constants/env";

type Params = {
  to : string,
  subject : string,
  text: string,
  html: string
};

const getFromEmail = () => 
  NODE_ENV == "development" ? "onboarding@resend.dev" : EMAIL_SENDER

const getToEmail = (to:string) => 
  NODE_ENV == "development" ? "delivered@resend.dev" : to;

// Rate limiting queue to handle Resend's 2 emails per second limit
class EmailRateLimiter {
  private queue: Array<{
    task: () => Promise<any>;
    resolve: (value: any) => void;
    reject: (error: any) => void;
  }> = [];
  private processing = false;
  private lastEmailTime = 0;
  private readonly MIN_INTERVAL = 500; // 500ms between emails (2 per second max)

  async addToQueue<T>(emailTask: () => Promise<T>): Promise<T> {
    return new Promise<T>((resolve, reject) => {
      this.queue.push({
        task: emailTask,
        resolve,
        reject
      });
      
      this.processQueue();
    });
  }

  private async processQueue() {
    if (this.processing) {
      return;
    }

    this.processing = true;

    while (this.queue.length > 0) {
      const now = Date.now();
      const timeSinceLastEmail = now - this.lastEmailTime;
      
      // Wait if needed to maintain rate limit
      if (timeSinceLastEmail < this.MIN_INTERVAL) {
        const waitTime = this.MIN_INTERVAL - timeSinceLastEmail;
        await new Promise(resolve => setTimeout(resolve, waitTime));
      }

      const item = this.queue.shift();
      if (item) {
        try {
          const result = await item.task();
          item.resolve(result);
        } catch (error) {
          item.reject(error);
        }
        this.lastEmailTime = Date.now();
      }
    }

    this.processing = false;
  }
}

const emailRateLimiter = new EmailRateLimiter();

export const sendMail = async ({
  to, subject, text, html
}: Params) => {
  return emailRateLimiter.addToQueue(async () => {
    return await resend.emails.send({
      from: getFromEmail(),
      to: getToEmail(to),
      subject,
      text,
      html
    });
  });
};