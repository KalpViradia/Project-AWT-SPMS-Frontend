"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"

const SocketContext = createContext<Socket | null>(null)

export function useSocket() {
    return useContext(SocketContext)
}

interface SocketProviderProps {
    userId: number
    userRole: string
    children: React.ReactNode
}

export function SocketProvider({ userId, userRole, children }: SocketProviderProps) {
    const [socket, setSocket] = useState<Socket | null>(null)

    useEffect(() => {
        const s = io({
            path: "/api/socketio",
            transports: ["websocket", "polling"],
        })

        s.on("connect", () => {
            console.log("[Socket.IO] Connected:", s.id)
            s.emit("join:user", { userId, userRole })
        })

        setSocket(s)

        return () => {
            s.disconnect()
        }
    }, [userId, userRole])

    return (
        <SocketContext.Provider value={socket}>
            {children}
        </SocketContext.Provider>
    )
}
