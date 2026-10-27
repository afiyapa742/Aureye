import React from 'react';
import { useAuth } from '../context/AuthContext';
import Navbar from './navbvar';
import MainNavbar from './MainNavbar';

const Header = () => {
  const { isLoggedIn } = useAuth();

  return isLoggedIn ? <MainNavbar /> : <Navbar />;
};

export default Header;