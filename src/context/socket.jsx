import { createContext, useContext } from "react"
import { io } from "socket.io-client"
import { WEBSOCKET_PUBLIC_URL } from "../../config.mjs"

export const socket = io(WEBSOCKET_PUBLIC_URL, {
  transports: ["websocket", "polling"],
  path: "/socket.io/",
  reconnectionAttempts: 5,
  reconnectionDelay: 1000,
  timeout: 20000
})

export const SocketContext = createContext()

export const SocketContextProvider = ({ children }) => {
  return (
    <SocketContext.Provider value={socket}>{children}</SocketContext.Provider>
  )
}

export function useSocketContext() {
  const context = useContext(SocketContext)

  return { socket: context }
}
