export type TelegramAlertKind = "create" | "resolve";

export type TelegramSendResult = {
  sent: boolean;
  reason?: string;
};

export type TelegramLinkSet = {
  proofTxUrl?: string;
  resolveTxUrl?: string;
  dashboardUrl?: string;
  dashboardSignalUrl?: string;
  reputationUrl?: string;
};
