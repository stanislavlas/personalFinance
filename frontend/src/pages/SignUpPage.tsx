import { useState } from 'react';
import { useNavigate } from 'react-router';
import { TextField, Button, Container, Typography, Box, Link } from '@mui/material';
import axios from 'axios';

function SignUpPage() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleSignUp = async () => {
        try {
            await axios.post('/createUser', { name, email, password });
            alert('Account created successfully!');
            navigate('/');
        } catch (error) {
            console.error('Sign-Up error:', error);
            alert('An error occurred during sign-up.');
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
                    Sign Up
                </Typography>
                <TextField
                    label="Name"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                />
                <TextField
                    label="Email"
                    variant="outlined"
                    fullWidth
                    margin="normal"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                />
                <TextField
                    label="Password"
                    variant="outlined"
                    type="password"
                    fullWidth
                    margin="normal"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleSignUp}
                    sx={{ marginTop: 2 }}
                >
                    Sign Up
                </Button>
                <Typography variant="body2" sx={{ marginTop: 2 }}>
                    Already have an account?{' '}
                    <Link href="/" underline="hover">
                        Login
                    </Link>
                </Typography>
            </Box>
        </Container>
    );
}

export default SignUpPage;
