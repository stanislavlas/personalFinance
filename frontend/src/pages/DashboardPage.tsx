import {useEffect, useState} from 'react';
import {Box, Button, Container, Grid2, Typography} from '@mui/material';
import axios from '../configs/axiosConfig.ts';
import {useLocation, useNavigate} from 'react-router';
import Cookies from 'js-cookie';
import TransactionsOverviewCard from "../components/TransactionsOverviewCard.tsx";
import {TransactionsResponse, User} from "../Interfaces.ts"

function DashboardPage() {
    const [transactionsResponse, setTransactionsResponse] = useState<TransactionsResponse | null>(null);
    const navigate = useNavigate();

    const user: User = useLocation().state

    const jwt = Cookies.get('jwt'); // Get JWT from cookies
    useEffect(() => {
        const fetchTransactions = async () => {
            return await axios({
                method: 'POST',
                url: '/api/transaction/get',
                headers: {
                    Authorization: `Bearer ${jwt}`
                },
                data: {
                    fromDate: '2024-11-06',
                    toDate: '2024-11-13',
                },
            }).then(res => setTransactionsResponse(res.data));
        }

        fetchTransactions();
    }, [jwt]);

    console.log(transactionsResponse);

    return (
        <Container>
            <Box my={4}>
                <Typography variant="h2" component="h1" gutterBottom>
                    Dashboard
                </Typography>
                {user && (
                    <Box display="flex" justifyContent="space-between" alignItems="center" mb={4}>
                        <Typography variant="h5">Welcome, {user.name}</Typography>
                        <Button variant="contained" color="primary" onClick={() => navigate('/add-transaction')}>
                            Add Transaction
                        </Button>
                    </Box>
                )}
                {transactionsResponse != null &&
                    <Container>
                        <Typography variant="h4" gutterBottom>
                            Recent Transactions {transactionsResponse.fromDate.toLocaleString()} - {transactionsResponse.toDate.toLocaleString()}
                        </Typography>
                        <Grid2 container spacing={3}>
                            <TransactionsOverviewCard title="Income" transactionsOverview={transactionsResponse.incomes} />
                            <TransactionsOverviewCard title="Expence" transactionsOverview={transactionsResponse.expenses} />
                            <TransactionsOverviewCard title="Investment" transactionsOverview={transactionsResponse.investments} />
                        </Grid2>
                    </Container>
                }


            </Box>
        </Container>
    );
}

export default DashboardPage;
