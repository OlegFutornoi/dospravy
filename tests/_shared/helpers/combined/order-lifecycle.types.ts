import type { CreatedBusinessOrderSnapshot } from '../business-order-wizard.page';

export interface OrderApiState {
  id?: string;
  publicNumber?: string;
  status?: string;
  title?: string;
  createdAt?: string;
  arrayIndex?: number;
  sourceUrl: string;
  responseStatus: number;
  matchedNeedle: string;
  rawMatch: Record<string, unknown>;
}

export interface CapturedJsonApiResponse {
  url: string;
  method: string;
  status: number;
  bodyText: string;
  bodyJson: unknown;
}

export interface CreatedOrderLifecycleSeed extends CreatedBusinessOrderSnapshot {
  title: string;
}

export interface LocatedModerationOrder {
  queueIndex: number;
  crmOrderLabel: string;
  statusAfterCreate: string;
  statusBeforeModeration: string;
  apiState: OrderApiState;
}

export interface ModeratedOrderLifecycleResult {
  statusAfterModeration: string;
  moderationHttpStatus: number;
  statusSourceUrl: string;
}

export interface OrderStatusSnapshot {
  status: string;
  httpStatus: number;
  sourceUrl: string;
}

export interface CombinedOrderLifecycleResult {
  title: string;
  businessOrderNumber: string;
  businessDraftOrderId: string;
  crmOrderLabel: string;
  queueIndex: number;
  statusAfterCreate: string;
  statusBeforeModeration: string;
  statusAfterModeration: string;
  moderationHttpStatus: number;
  statusSourceUrl: string;
}
