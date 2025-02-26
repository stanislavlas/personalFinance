// src/pages/AddTransactionPage.js
import { useState } from 'react';
import { TextField, Button, Container, Typography, Box, MenuItem } from '@mui/material';
import axios from 'axios';
import { useNavigate } from 'react-router';

function AddTransactionPage() {
    const [amount, setAmount] = useState('');
    const [description, setDescription] = useState('');
    const [category, setCategory] = useState('Income');
    const [date, setDate] = useState('');
    const navigate = useNavigate();

    const handleAddTransaction = async () => {
        try {
            await axios.post('/addTransactions', {
                amount: parseFloat(amount),
                description,
                category,
                date,
            });
            alert('Transaction added!');
            navigate('/dashboard');
        } catch (error) {
            console.error('Error adding transaction:', error);
            alert('An error occurred while adding the transaction.');
        }
    };

    return (
        <Container maxWidth="sm">
            <Box
                display="flex"
                flexDirection="column"
                justifyContent="center"
                alignItems="center"
                minHeight="100vh"
            >
                <Typography variant="h2" component="h1" gutterBottom>
                    Add New Transaction
                </Typography>
                <TextField
                    label="Amount"
                    variant="outlined"
                    type="number"
                    fullWidth
                    margin="normal"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                />
                <TextField
                    label="Description"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                />
                <TextField
                    select
                    label="Category"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                >
                    <MenuItem value="Income">Income</MenuItem>
                    <MenuItem value="Expense">Expense</MenuItem>
                </TextField>
                <TextField
                    label="Date"
                    variant="outlined"
                    type="date"
                    fullWidth
                    margin="normal"
                    InputLabelProps={{
                        shrink: true,
                    }}
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                />
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleAddTransaction}
                    sx={{ marginTop: 2 }}
                >
                    Add Transaction
                </Button>
            </Box>
        </Container>
    );
}

export default AddTransactionPage;
