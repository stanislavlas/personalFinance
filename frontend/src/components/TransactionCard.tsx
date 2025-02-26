import { ListItem, ListItemText } from "@mui/material";
import {Transaction} from "../Interfaces.ts";

interface TransactionProps {
    transaction: Transaction;
}

const TransactionCard = ({ transaction }: TransactionProps) => {
    return (
        <ListItem divider>
            <ListItemText primary={transaction.name} secondary={`$${transaction.amount.value} ${transaction.amount.currency}`} />
        </ListItem>
    );
};

export default TransactionCard;
