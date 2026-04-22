/**
 * Enum mappings between mobile app (UI-friendly) and backend (API format)
 * Backend uses uppercase enum values, mobile uses lowercase for internal state
 */

// Transaction Type mapping
export const TransactionType = {
  EXPENSE: "EXPENSE",
  INCOME: "INCOME",
  INVESTMENT: "INVESTMENT",
};

export function toApiTransactionType(uiType) {
  const map = {
    expense: TransactionType.EXPENSE,
    income: TransactionType.INCOME,
    investment: TransactionType.INVESTMENT,
  };
  return map[uiType] || TransactionType.EXPENSE;
}

export function fromApiTransactionType(apiType) {
  const map = {
    EXPENSE: "expense",
    INCOME: "income",
    INVESTMENT: "investment",
  };
  return map[apiType] || "expense";
}

// Necessity mapping
export const Necessity = {
  NEED: "NEED",
  WANT: "WANT",
};

export function toApiNecessity(uiNecessity) {
  const map = {
    necessary: Necessity.NEED,
    optional: Necessity.WANT,
  };
  return map[uiNecessity] || Necessity.NEED;
}

export function fromApiNecessity(apiNecessity) {
  const map = {
    NEED: "necessary",
    WANT: "optional",
  };
  return map[apiNecessity] || "necessary";
}

// Currency (already uppercase, no mapping needed)
export const Currency = {
  EUR: "EUR",
  USD: "USD",
  CZK: "CZK",
};

// Member Role
export const MemberRole = {
  OWNER: "OWNER",
  MEMBER: "MEMBER",
};
