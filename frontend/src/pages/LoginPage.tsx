import { useState } from 'react';
import { useNavigate } from 'react-router';
import { TextField, Button, Container, Typography, Box, Link } from '@mui/material';
import axios from '../configs/axiosConfig.ts';
import Cookies from 'js-cookie';

function LoginPage() {
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const navigate = useNavigate();

    const handleLogin = async () => {
        try {
            const response = await axios({
                method: 'POST',
                url: '/api/auth/login',
                data: {
                    email: email,
                    password: password,
                },
            });

            if (response.data.success) {
                Cookies.set('jwt', response.data.jwt, {
                    expires: 0.5,
                    secure: false,
                    sameSite: 'strict'
                });
                navigate('/dashboard', { state: response.data.user} );
            } else {
                alert('Login failed. Please check your credentials.');
            }
        } catch (error) {
            console.error('Login error:', error);
            alert('An error occurred while logging in.');
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
                    Login
                </Typography>
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
                    onClick={handleLogin}
                    sx={{ marginTop: 2 }}
                >
                    Login
                </Button>
                <Typography variant="body2" sx={{ marginTop: 2 }}>
                    Don't have an account?{' '}
                    <Link href="/signup" underline="hover">
                        Sign Up
                    </Link>
                </Typography>
            </Box>
        </Container>
    );
}

export default LoginPage;