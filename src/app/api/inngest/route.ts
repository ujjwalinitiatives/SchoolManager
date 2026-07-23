import { serve } from "inngest/next";
import { inngest } from "@/inngest/client";
import { sendEmailJob } from "@/inngest/functions/send-email";
import { broadcastNoticeJob } from "@/inngest/functions/broadcast-notice";

// Create an API that serves zero-dependency functions
export const { GET, POST, PUT } = serve({
  client: inngest,
  functions: [
    sendEmailJob,
    broadcastNoticeJob,
  ],
});
