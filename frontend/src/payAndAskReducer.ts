export type Status = "idle" | "challenged" | "paying" | "verifying" | "served" | "error";

export interface PaymentTerms {
  amount: string;
  recipient: string;
  chain_id: number;
  resource: string;
  request_hash: string;
}

export interface PayAndAskState {
  status: Status;
  terms?: PaymentTerms;
  txHash?: string;
  response?: string;
  error?: string;
}

export type PayAndAskAction =
  | { type: "CHALLENGE_RECEIVED"; terms: PaymentTerms }
  | { type: "PAY_STARTED" }
  | { type: "PAY_SUBMITTED"; txHash: string }
  | { type: "VERIFIED"; response: string }
  | { type: "FAILED"; error: string }
  | { type: "RESET" };

export const initialPayAndAskState: PayAndAskState = { status: "idle" };

export function payAndAskReducer(state: PayAndAskState, action: PayAndAskAction): PayAndAskState {
  switch (action.type) {
    case "CHALLENGE_RECEIVED":
      return { status: "challenged", terms: action.terms };
    case "PAY_STARTED":
      if (state.status !== "challenged") return state;
      return { ...state, status: "paying" };
    case "PAY_SUBMITTED":
      if (state.status !== "paying") return state;
      return { ...state, status: "verifying", txHash: action.txHash };
    case "VERIFIED":
      if (state.status !== "verifying") return state;
      return { ...state, status: "served", response: action.response };
    case "FAILED":
      return { ...state, status: "error", error: action.error };
    case "RESET":
      return initialPayAndAskState;
    default:
      return state;
  }
}
