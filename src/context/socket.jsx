import { createContext, useContext } from "react"
import { io } from "socket.io-client"
import { WEBSOCKET_PUBLIC_URL } from "../../config.mjs"

export const socket = io(WEBSOCKET_PUBLIC_URL, {
  transports: ["polling", "websocket"],
  autoConnect: true,
  reconnection: true,
  reconnectionAttempts: 10,
  reconnectionDelay: 1000,
  forceNew: true,
  timeout: 10000,
})

socket.on("connect_error", (error) => {
  console.log("Connection error:", error);
  socket.io.opts.transports = ["polling", "websocket"];
});

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
