import { useState } from "react";
import {
    Button,
    Card,
    CardContent,
    Dialog,
    DialogActions,
    DialogContent,
    DialogTitle,
    List,
    Typography
} from "@mui/material";
import TransactionCard from "./TransactionCard.tsx";
import {Transaction, TransactionsOverview} from "../Interfaces.ts";

interface TransactionsOverviewProps {
    title: string;
    transactionsOverview: TransactionsOverview;
}

const TransactionsOverviewCard = ({ title, transactionsOverview }: TransactionsOverviewProps ) => {
    const [open, setOpen] = useState(false);

    const handleOpen = () => setOpen(true);
    const handleClose = () => setOpen(false);

    console.log(transactionsOverview);

    return (
        <>
             {/*Clickable Category Card*/}
            { <Card onClick={handleOpen} sx={{ cursor: "pointer", textAlign: "center", padding: 2 }}>
              <CardContent>
                <Typography variant="h5">{title}</Typography>
                <Typography variant="h6">
                  ${transactionsOverview.amount.value} ${transactionsOverview.amount.currency}
                </Typography>
              </CardContent>
            </Card> }

            {/*Dialog for Transactions*/}
            <Dialog open={open} onClose={handleClose} fullWidth maxWidth="sm">
                <DialogTitle>{title} Transactions</DialogTitle>
                <DialogContent>
                    <List>
                        {transactionsOverview.transactions.length > 0 ? (
                            transactionsOverview.transactions.map((transaction: Transaction) => <TransactionCard key={transaction.id} transaction={transaction} />)
                        ) : (
                            <Typography>No transactions available.</Typography>
                        )}
                    </List>
                </DialogContent>
                <DialogActions>
                    <Button onClick={handleClose} color="primary">Close</Button>
                </DialogActions>
            </Dialog>
        </>
    );
};

export default TransactionsOverviewCard;