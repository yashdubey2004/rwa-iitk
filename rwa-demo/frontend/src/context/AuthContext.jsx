import { createContext, useContext } from 'react'

export const AuthContext = createContext(null)
AuthContext.use = () => useContext(AuthContext)
