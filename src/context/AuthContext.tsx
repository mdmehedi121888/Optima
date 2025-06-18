// src/context/AuthContext.tsx
import React, { createContext, useState, useEffect, ReactNode } from 'react';

export interface UserType {
  id: number;
  userName: string;
  userImage: string;
  role: string;
  userId: string;
  defaultStation: string;
  stations: string;
}

interface AuthContextType {
  user: UserType | null;
  setUser: React.Dispatch<React.SetStateAction<UserType | null>>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<UserType | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const response = await fetch('http://localhost:5000/api/auth/check-session', {
          credentials: 'include',
        });
        const data = await response.json();
        if (data.isAuthenticated) {
          setUser(data.user as UserType);
        }
      } catch (error) {
        console.error('Error fetching user session:', error);
      }
    };

    fetchUser();
  }, []);

  return (
    <AuthContext.Provider value={{ user, setUser }}>
      {children}
    </AuthContext.Provider>
  );
};
