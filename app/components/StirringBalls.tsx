"use client"

import type React from "react"
import { useState, useEffect, useCallback } from "react"

interface Ball {
    id: number
    x: number
    y: number
    size: number
    emoji: string
    speed: number
    angle: number
    rotationSpeed: number
    rotation: number
}

const emojis = ["🍎", "🍋", "🍒", "🍇", "🍉", "🍊", "🍓", "🍑", "🥒", "🍆"]

const StirringBalls: React.FC = () => {
    const [balls, setBalls] = useState<Ball[]>([])

    const initializeBalls = useCallback(() => {
        const newBalls: Ball[] = Array.from({ length: 30 }, (_, i) => ({
            id: i,
            x: Math.random() * 100,
            y: Math.random() * 100,
            size: Math.random() * 30 + 50, // 50-80px
            emoji: emojis[Math.floor(Math.random() * emojis.length)],
            speed: Math.random() * 0.8 + 0.4, // 0.4-1.2
            angle: Math.random() * 2 * Math.PI,
            rotationSpeed: (Math.random() - 0.5) * 0.1,
            rotation: Math.random() * 360,
        }))
        setBalls(newBalls)
    }, [])

    useEffect(() => {
        initializeBalls()
    }, [initializeBalls])

    useEffect(() => {

        const interval = setInterval(() => {
            setBalls((prevBalls) =>
                prevBalls.map((ball) => {
                    let newX = ball.x + Math.cos(ball.angle) * ball.speed
                    let newY = ball.y + Math.sin(ball.angle) * ball.speed
                    const newRotation = (ball.rotation + ball.rotationSpeed) % 360

                    // Bounce off the walls
                    if (newX < 0 || newX > 100) {
                        ball.angle = Math.PI - ball.angle
                        newX = ball.x
                    }
                    if (newY < 0 || newY > 100) {
                        ball.angle = -ball.angle
                        newY = ball.y
                    }

                    return { ...ball, x: newX, y: newY, rotation: newRotation }
                }),
            )
        }, 16) // 60 FPS

        return () => clearInterval(interval)
    }, [])

    return (
        <>
            {balls.map((ball) => (
                <div
                    key={ball.id}
                    className="absolute"
                    style={{
                        left: `${ball.x}%`,
                        top: `${ball.y}%`,
                        width: `${ball.size}px`,
                        height: `${ball.size}px`,
                        fontSize: `${ball.size * 0.7}px`,
                        transition: "all 0.1s linear",
                        transform: `rotate(${ball.rotation}deg)`,
                    }}
                >
                    {ball.emoji}
                </div>
            ))}
        </>
    )
}

export default StirringBalls

