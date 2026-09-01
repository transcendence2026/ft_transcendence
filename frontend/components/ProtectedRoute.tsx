import React from 'react';
import {Navigate} from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

interface ProtectedRouteProps {
	children: React.JSX.Element;
}

const ProtectedRoute = ( { children } : ProtectedRouteProps) => {
	const { token } = useAuth();

	return token ? children : <Navigate to="/login" replace/>;
};

export default ProtectedRoute;