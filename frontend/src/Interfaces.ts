export interface User {
    currency: string;
    email: string;
    name: string;
    userId: string;
}

export interface TransactionsResponse {
    fromDate: Date;
    toDate: Date;
    incomes: TransactionsOverview;
    expenses: TransactionsOverview;
    investments: TransactionsOverview;
    savedAmount: Amount;
}

export interface Amount {
    currency: string;
    value: number;
}

export interface TransactionsOverview {
    amount: Amount;
    transactions: Transaction[];
}

export interface Transaction {
    id: string;
    amount: Amount;
    category: string;
    date: Date;
    name: string;
    note: string;
    type: string;
}
