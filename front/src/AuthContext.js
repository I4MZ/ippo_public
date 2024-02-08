import { createContext, useState, useContext } from 'react';
import axios from "axios";

const AuthContext = createContext();

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  // 로그인 상태 변경 함수
  const login = () => setIsLoggedIn(true);
  const logout = () => {
    const logoutRemoveFromRedis = async () => {
      const logoutRemoveToRedis = await axios.post(`/api/users/logout`);
      // const logoutRemoveToRedis = await axios.post(`http://ippo-backend-app:8080/api/users/logout`);
    }
    logoutRemoveFromRedis();
    setIsLoggedIn(false);
  }

  return (
    <AuthContext.Provider value={{ isLoggedIn, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
