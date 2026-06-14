import { config } from "../src/config.js";
import { getTelegramLinks, isPublicAppUrl } from "../src/telegram/formatter.js";

const links = getTelegramLinks({ id: 1, commitTxHash: null, resolveTxHash: null });
const publicAppUrlConfigured = Boolean(config.publicAppUrl);
const publicAppUrlIsPublic = isPublicAppUrl(config.publicAppUrl);
const dashboardButtonsEnabled = Boolean(links.dashboardUrl && links.dashboardSignalUrl && links.reputationUrl);

if (publicAppUrlConfigured && !publicAppUrlIsPublic) {
  console.warn("PUBLIC_APP_URL is local or not public; Telegram dashboard buttons disabled.");
}

console.log(
  JSON.stringify(
    {
      ok: true,
      publicAppUrlConfigured,
      publicAppUrlIsPublic,
      dashboardButtonsEnabled,
      dashboardUrlEnabled: Boolean(links.dashboardUrl),
      signalUrlEnabled: Boolean(links.dashboardSignalUrl),
      reputationUrlEnabled: Boolean(links.reputationUrl)
    },
    null,
    2
  )
);
