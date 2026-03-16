"use client"

import { createContext, useContext, useEffect, useState } from "react"
import { io, Socket } from "socket.io-client"

interface SocketContextType {
    socket: Socket | null
    isLive: boolean
    isWaking: boolean
}

const SocketContext = createContext<SocketContextType>({
    socket: null,
    isLive: false,
    isWaking: false,
})

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
    const [isLive, setIsLive] = useState(false)
    const [isWaking, setIsWaking] = useState(false)

    useEffect(() => {
        const socketUrl = process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:4000"
        let pingInterval: NodeJS.Timeout

        const checkBackend = async () => {
            try {
                // Lightweight health check
                const res = await fetch(`${socketUrl}/health`, { 
                    method: "GET",
                    signal: AbortSignal.timeout(5000) 
                })
                if (res.ok) {
                    setIsLive(true)
                    setIsWaking(false)
                    clearInterval(pingInterval)
                } else {
                    throw new Error("Backend not ok")
                }
            } catch (err) {
                // If failed, assume backend is waking up (cold start)
                setIsWaking(true)
                setIsLive(false)
            }
        }

        // Start checking immediately
        checkBackend()
        
        // Interval for retries if not live
        pingInterval = setInterval(() => {
            if (!isLive) checkBackend()
        }, 3000)

        const s = io(socketUrl, {
            transports: ["websocket", "polling"],
        })

        s.on("connect", () => {
            console.log("[Socket.IO] Connected:", s.id)
            setIsLive(true)
            setIsWaking(false)
            s.emit("join:user", { userId, userRole })
        })

        s.on("disconnect", () => {
            setIsLive(false)
        })

        setSocket(s)

        return () => {
            s.disconnect()
            clearInterval(pingInterval)
        }
    }, [userId, userRole, isLive])

    return (
        <SocketContext.Provider value={{ socket, isLive, isWaking }}>
            {children}
        </SocketContext.Provider>
    )
}
